import asyncH from '../middleware/asyncHandler.js';
import PDFDocument from 'pdfkit';
import { listCuotas, emitirCuotas, pagarCuota, getCuotasDeudorasPorSocio, pagarCuotasMultiples } from '../../domain/services/CuotasService.js';
import { query } from '../../db/connection.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';
import { getFonts, BRAND, mm } from '../../domain/utils/pdf.js';
import { loadImageBuffer } from '../../domain/services/ImageService.js';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

const BRAND_NAME = process.env.BRAND_NAME || 'CLUB DEPORTIVO LUJAN';
const C1 = process.env.BRAND_PRIMARY || '#0057B7';
const C2 = process.env.BRAND_SECONDARY || '#FFD000';

export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  // Si no se especifica un estado, mostrar solo deudores (PENDIENTE, EMITIDA, etc. pero no PAGADA)
  const filtros = { ...req.query, page, size };
  if (!filtros.estado && !filtros.incluir_pagadas) {
    filtros.solo_deudores = true;
  }
  const { rows, total } = await listCuotas(filtros);
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

export const emitir = asyncH(async (req, res) => {
  const { periodo, importe, vencimiento, socio_ids } = req.body;
  const result = await emitirCuotas({ periodo, importe, vencimiento, socio_ids });
  res.status(201).json({ message: 'Cuotas emitidas', ...result });
});

export const pagar = asyncH(async (req, res) => {
  const payload = await pagarCuota({
    id: Number(req.params.id),
    monto: req.body.monto,
    medio_pago: req.body.medio_pago,
    nro_tramite: req.body.nro_tramite,
    observacion: req.body.observacion,
    responsableUsuarioId: req.user.id,
  });
  res.status(201).json({ message: 'Pago registrado', ...payload });
});

// Obtener cuotas deudoras de un socio
export const getCuotasDeudoras = asyncH(async (req, res) => {
  const socioId = Number(req.params.socio_id);
  if (!socioId) {
    return res.status(400).json({ error: { message: 'socio_id requerido' } });
  }
  const cuotas = await getCuotasDeudorasPorSocio(socioId);
  res.json({ data: cuotas, total: cuotas.length });
});

// Pagar múltiples cuotas de un socio (siempre de la más antigua a la más reciente)
export const pagarMultiple = asyncH(async (req, res) => {
  const socioId = Number(req.params.socio_id);
  if (!socioId) {
    return res.status(400).json({ error: { message: 'socio_id requerido' } });
  }
  
  const { monto_total, medio_pago, nro_tramite, observacion } = req.body;
  if (!monto_total || Number(monto_total) <= 0) {
    return res.status(400).json({ error: { message: 'monto_total debe ser mayor a 0' } });
  }

  const resultado = await pagarCuotasMultiples({
    socio_id: socioId,
    monto_total: Number(monto_total),
    medio_pago,
    nro_tramite,
    observacion,
    responsableUsuarioId: req.user.id,
  });

  res.status(201).json(resultado);
});

// Comprobante PDF estilo Mercado Pago
export const comprobantePdf = asyncH(async (req, res) => {
  const { id } = req.params;
  const rows = await query(`
      SELECT c.id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.estado, c.vencimiento,
             s.nro_socio, p.nombre, p.apellido, p.dni, c.created_at
      FROM cuota c
      JOIN socio s ON s.id=c.socio_id
      JOIN persona p ON p.id=s.persona_id
      WHERE c.id = ?`, [id]);
  if (!rows.length) {
    res.status(404).json({ error:{ message:'Cuota no encontrada' }});
    return;
  }
  const c = rows[0];

  // Obtener pagos de esta cuota
  const pagos = await query(`
    SELECT monto, medio_pago, nro_tramite, created_at as fecha_pago, observacion
    FROM pago_cuota
    WHERE cuota_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [id]);
  const ultimoPago = pagos[0] || {};

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="comprobante_${c.id}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const fonts = getFonts(doc);
  doc.pipe(res);

  const W = doc.page.width;
  const margin = 40;
  const contentWidth = W - (margin * 2);

  // ==================== HEADER CON LOGO ====================
  let y = 30;
  
  // Logo del club
  try {
    const logoPath = BRAND.logoPath || '/app/uploads/logo-club.png';
    const buf = await loadImageBuffer(logoPath);
    if (buf) {
      doc.image(buf, margin, y, { width: 50, height: 50, fit:[50,50] });
    } else {
      console.log('No se pudo cargar el logo desde:', logoPath);
    }
  } catch (err) {
    console.error('Error cargando logo:', err);
  }

  // Nombre del club y título
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(20)
     .text(BRAND.name || 'Club Deportivo', 100, y + 8);
  
  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(11)
     .text('Comprobante de Pago', 100, y + 32);

  y += 70;

  // Línea separadora
  doc.moveTo(margin, y).lineTo(W - margin, y).stroke('#E0E0E0');
  y += 25;

  // ==================== MONTO PRINCIPAL ====================
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(32)
     .text(`$ ${Number(c.importe_pagado || c.total_importe).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`, margin, y);
  
  y += 45;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Motivo: Pago de Cuota', margin, y);

  y += 25;

  // ==================== FECHA Y HORA ====================
  const fechaPago = ultimoPago.fecha_pago || c.created_at || new Date();
  const formatoFecha = new Date(fechaPago).toLocaleDateString('es-AR', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(11)
     .text(formatoFecha, margin, y);

  y += 30;

  // ==================== LÍNEA SEPARADORA ====================
  doc.moveTo(margin, y).lineTo(W - margin, y).stroke('#E0E0E0');
  y += 25;

  // ==================== SECCIÓN "DE" ====================
  doc.fillColor('#666666')
     .font(fonts.bold)
     .fontSize(10)
     .text('De', margin, y);
  
  y += 18;

  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(12)
     .text(`${c.apellido} ${c.nombre}`, margin, y);
  
  y += 18;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text(`CUIL/CUIT: ${c.dni || 'N/A'}`, margin, y);
  
  y += 15;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text(`Socio Nº ${c.nro_socio}`, margin, y);

  y += 30;

  // ==================== SECCIÓN "PARA" ====================
  doc.fillColor('#666666')
     .font(fonts.bold)
     .fontSize(10)
     .text('Para', margin, y);
  
  y += 18;

  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(12)
     .text(BRAND.name || 'Club Deportivo', margin, y);
  
  y += 18;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Cuenta Corriente', margin, y);

  y += 30;

  // ==================== LÍNEA SEPARADORA ====================
  doc.moveTo(margin, y).lineTo(W - margin, y).stroke('#E0E0E0');
  y += 25;

  // ==================== DETALLES DEL PAGO ====================
  doc.fillColor('#666666')
     .font(fonts.bold)
     .fontSize(10)
     .text('COELSA ID', margin, y);
  
  doc.fillColor('#000000')
     .font(fonts.regular)
     .fontSize(10)
     .text(`CU${String(c.id).padStart(10, '0')}`, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Código de transferencia', margin, y);
  
  const codigoTransferencia = ultimoPago.nro_tramite || `${String(c.id).padStart(14, '0')}`;
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(10)
     .text(codigoTransferencia, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Periodo', margin, y);
  
  doc.fillColor('#000000')
     .font(fonts.regular)
     .fontSize(10)
     .text(c.periodo, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Medio de pago', margin, y);
  
  doc.fillColor('#000000')
     .font(fonts.regular)
     .fontSize(10)
     .text(ultimoPago.medio_pago || 'EFECTIVO', W - margin - 150, y, { width: 150, align: 'right' });

  y += 35;

  // ==================== CÓDIGOS (QR Y BARRAS) ====================
  const codigoQR = `CU${String(c.id).padStart(10, '0')}-${c.nro_socio}`;
  
  try {
    // Generar código de barras
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: codigoTransferencia,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    
    // Centrar código de barras
    const barcodeWidth = 200;
    const barcodeX = (W - barcodeWidth) / 2;
    doc.image(barcodeBuffer, barcodeX, y, { width: barcodeWidth, height: 60 });
    y += 75;

  } catch (err) {
    console.error('Error generando código de barras:', err);
    y += 10;
  }

  try {
    // Generar código QR
    const qrBuffer = await QRCode.toBuffer(codigoQR, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 120,
      margin: 1,
    });
    
    // Centrar QR
    const qrSize = 100;
    const qrX = (W - qrSize) / 2;
    doc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });
    
    y += qrSize + 10;

    // Texto debajo del QR
    doc.fillColor('#666666')
       .font(fonts.regular)
       .fontSize(8)
       .text('Escaneá el código para ver el comprobante', margin, y, {
         width: contentWidth,
         align: 'center'
       });

  } catch (err) {
    console.error('Error generando QR:', err);
  }

  doc.end();
});

