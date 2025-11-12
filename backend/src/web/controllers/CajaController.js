import asyncH from '../middleware/asyncHandler.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
// bwipjs se importa dinámicamente dentro de comprobantePdf para evitar problemas de carga del módulo
import { altaMovimiento, reporteCaja, renderCSV, ventaEntradaLocal, ventaEntradaVisitante as ventaEntradaVisitanteService, pagoCuotaMensual, obtenerMovimientos, crearEgresoPendiente, aprobarEgresoPendiente, rechazarEgresoPendiente, transferirATesoreria, obtenerCajeros } from '../../domain/services/CajaService.js';
import { query } from '../../db/connection.js';
import { getFonts, BRAND, mm } from '../../domain/utils/pdf.js';
import { loadImageBuffer } from '../../domain/services/ImageService.js';

export const alta = asyncH(async (req, res) => {
  const { fecha, concepto, tipo, monto, medio_pago, validador_id, fecha_validacion, nro_tramite } = req.body;
  const { id } = await altaMovimiento({ fecha, concepto, tipo, monto, medio_pago, usuarioId: req.user.id, validadorId: validador_id, fechaValidacion: fecha_validacion, nroTramite: nro_tramite });
  res.status(201).json({ message: 'Movimiento registrado', id });
});

export const ventaEntrada = asyncH(async (req, res) => {
  const { es_socio, nro_socio, dni, medio_pago, nro_tramite, estado_socio, monto } = req.body;
  const { id } = await ventaEntradaLocal({ 
    es_socio,
    nro_socio,
    dni, 
    medioPago: medio_pago, 
    nroTramite: nro_tramite,
    estadoSocio: estado_socio,
    monto,
    usuarioId: req.user.id 
  });
  res.status(201).json({ message: 'Venta de entrada registrada', id });
});

export const ventaEntradaVisitante = asyncH(async (req, res) => {
  const { medio_pago, nro_tramite, monto, concepto } = req.body;
  const { id } = await ventaEntradaVisitanteService({ 
    medioPago: medio_pago, 
    nroTramite: nro_tramite, 
    monto,
    concepto,
    usuarioId: req.user.id 
  });
  res.status(201).json({ message: 'Venta entrada visitante registrada', id });
});

export const pagoCuota = asyncH(async (req, res) => {
  const { socio_id, periodo, total_importe, importe_a_pagar, medio_pago, nro_tramite } = req.body;
  const resultado = await pagoCuotaMensual({ 
    socioId: socio_id,
    periodo,
    totalImporte: total_importe,
    importeAPagar: importe_a_pagar,
    medioPago: medio_pago,
    nroTramite: nro_tramite,
    usuarioId: req.user.id 
  });
  res.status(201).json({ message: 'Pago de cuota registrado', ...resultado });
});

export const egreso = asyncH(async (req, res) => {
  const { concepto, monto, medio_pago, nro_tramite } = req.body;
  const { id } = await crearEgresoPendiente({ 
    concepto,
    monto,
    medioPago: medio_pago,
    nroTramite: nro_tramite,
    usuarioId: req.user.id 
  });
  res.status(201).json({ message: 'Egreso creado (PENDIENTE de aprobacion)', id });
});

export const transferirTesoreria = asyncH(async (req, res) => {
  const { monto, medio_pago, nro_tramite } = req.body;
  const { id } = await transferirATesoreria({
    monto,
    medioPago: medio_pago,
    nroTramite: nro_tramite,
    usuarioId: req.user.id
  });
  res.status(201).json({ message: 'Transferencia a Tesoreria registrada', id });
});

export const aprobarEgreso = asyncH(async (req, res) => {
  const cajaId = Number(req.params.id);
  const validadorId = req.user.id;
  await aprobarEgresoPendiente(cajaId, validadorId);
  res.json({ message: 'Egreso aprobado' });
});

export const rechazarEgreso = asyncH(async (req, res) => {
  const cajaId = Number(req.params.id);
  await rechazarEgresoPendiente(cajaId);
  res.json({ message: 'Egreso rechazado' });
});

export const movimientos = asyncH(async (req, res) => {
  const data = await obtenerMovimientos({ usuarioId: req.user.id, rolSistema: req.user.rol_sistema });
  res.json(data);
});

export const reporte = asyncH(async (req, res) => {
  const { desde, hasta, cajero_id } = req.query;
  const data = await reporteCaja({ desde, hasta, cajero_id });
  res.json(data);
});

export const reporteCSV = asyncH(async (req, res) => {
  const { desde, hasta, cajero_id } = req.query;
  const { movimientos } = await reporteCaja({ desde, hasta, cajero_id });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reporte_caja_${desde}_a_${hasta}.csv"`);
  res.send(renderCSV(movimientos));
});

// Obtener lista de cajeros
export const listCajeros = asyncH(async (req, res) => {
  const cajeros = await obtenerCajeros();
  res.json({ data: cajeros, total: cajeros.length });
});

export const comprobantePdf = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query(`
    SELECT c.id, c.fecha, c.concepto, c.tipo, c.monto, c.medio_pago, c.nro_tramite,
           c.estado, c.validador_id, c.fecha_validacion,
           pr.apellido AS resp_apellido, pr.nombre AS resp_nombre,
           pv.apellido AS val_apellido, pv.nombre AS val_nombre
    FROM caja c
    LEFT JOIN persona pr ON pr.id = c.responsable_id
    LEFT JOIN persona pv ON pv.id = c.validador_id
    WHERE c.id = ?
  `, [id]);
  if (!rows.length) return res.status(404).json({ error: { message: 'Movimiento no encontrado' } });
  const m = rows[0];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="comprobante_caja_${m.id}.pdf"`);

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
     .text(`$ ${Number(m.monto).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`, margin, y);
  
  y += 45;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text(`Motivo: ${m.concepto}`, margin, y);

  y += 25;

  // ==================== FECHA Y HORA ====================
  const fecha = new Date(m.fecha);
  const formatoFecha = fecha.toLocaleDateString('es-AR', { 
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

  // Usar responsable si existe, sino usar el concepto
  const nombreDe = (m.resp_apellido && m.resp_nombre) 
    ? `${m.resp_apellido} ${m.resp_nombre}`
    : m.concepto || 'Movimiento de Caja';
  
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(12)
     .text(nombreDe, margin, y);
  
  y += 18;

  if (m.resp_apellido && m.resp_nombre) {
    // Si hay responsable, mostrar información adicional si está disponible
    doc.fillColor('#666666')
       .font(fonts.regular)
       .fontSize(10)
       .text(`Responsable`, margin, y);
  }

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
     .text(`CA${String(m.id).padStart(10, '0')}`, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Código de transferencia', margin, y);
  
  const codigoTransferencia = m.nro_tramite || `${String(m.id).padStart(14, '0')}`;
  doc.fillColor('#000000')
     .font(fonts.bold)
     .fontSize(10)
     .text(codigoTransferencia, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Tipo', margin, y);
  
  doc.fillColor('#000000')
     .font(fonts.regular)
     .fontSize(10)
     .text(m.tipo, W - margin - 150, y, { width: 150, align: 'right' });

  y += 20;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text('Medio de pago', margin, y);
  
  doc.fillColor('#000000')
     .font(fonts.regular)
     .fontSize(10)
     .text(m.medio_pago || 'EFECTIVO', W - margin - 150, y, { width: 150, align: 'right' });

  y += 35;

  // ==================== CÓDIGOS (QR Y BARRAS) ====================
  const codigoQR = `CA${String(m.id).padStart(10, '0')}-${m.tipo}`;
  
  try {
    // Generar código de barras - importar dinámicamente para evitar problemas de carga
    const bwipjsModule = await import('bwip-js');
    const bwipjsLib = bwipjsModule.default;
    const barcodeBuffer = await bwipjsLib.toBuffer({
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
