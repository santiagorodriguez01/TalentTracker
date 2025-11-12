import asyncH from '../middleware/asyncHandler.js';
import PDFDocument from 'pdfkit';
import { query, getConnection } from '../../db/connection.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';
import { getFonts, BRAND, mm } from '../../domain/utils/pdf.js';
import { loadImageBuffer } from '../../domain/services/ImageService.js';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';

export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  const lim = Math.max(1, parseInt(size) || 20);
  const off = Math.max(0, ((parseInt(page) || 1) - 1) * lim);

  const where = ['1=1'];
  const params = [];
  const { q, estado, incluir_pagadas } = req.query;
  if (q) {
    where.push('(p.apellido LIKE ? OR p.nombre LIKE ? OR p.dni LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (estado) { 
    where.push('c.estado = ?'); 
    params.push(estado); 
  } else if (!incluir_pagadas) {
    // Por defecto, mostrar solo deudores
    where.push('c.estado != ?');
    params.push('PAGADA');
    where.push('c.saldo > 0');
  }

  const baseFrom = `
    FROM v_cuota_alumno_con_mora c
    JOIN persona p ON p.id = c.persona_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
  `;

  const rows = await query(`
    SELECT c.*, p.apellido, p.nombre, p.dni
    ${baseFrom}
    ORDER BY c.vencimiento DESC, c.id DESC
    LIMIT ${lim} OFFSET ${off}
  `, params);
  const [{ total }] = await query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

export const emitir = asyncH(async (req, res) => {
  const { periodo, vencimiento, persona_ids } = req.body || {};
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
    return res.status(400).json({ error: { message: 'Periodo requerido (YYYY-MM)' } });
  }
  const vto = vencimiento || `${periodo}-10`;

  // Personas candidatas
  let personas = [];
  if (Array.isArray(persona_ids) && persona_ids.length) {
    const ph = persona_ids.map(()=> '?').join(',');
    personas = await query(`SELECT DISTINCT persona_id FROM alumno WHERE persona_id IN (${ph})`, persona_ids);
  } else {
    personas = await query(`SELECT DISTINCT persona_id FROM alumno`);
  }
  if (!personas.length) return res.json({ solicitados: 0, insertados: 0 });

  const conn = await getConnection();
  let inserted = 0;
  try {
    await conn.beginTransaction();
    for (const row of personas) {
      const pid = row.persona_id;
      const [sumRows] = await conn.execute(
        `SELECT COALESCE(SUM(ta.importe),0) AS total
           FROM alumno a
           JOIN alumno_deporte ad ON ad.alumno_id = a.id
           JOIN deporte d ON d.id = ad.deporte_id
           JOIN alumno_categoria ag ON ag.alumno_id = a.id
           JOIN categoria c ON c.id = ag.categoria_id
           JOIN tarifa_actividad ta
             ON ta.deporte_id = d.id AND ta.categoria_id = c.id
            AND (ta.vigente_hasta IS NULL OR ta.vigente_hasta >= ?)
          WHERE a.persona_id = ?`,
        [vto, pid]
      );
      const total = Number(sumRows[0]?.total || 0);
      const [ins] = await conn.execute(
        `INSERT INTO cuota_alumno (persona_id, periodo, total_importe, vencimiento, estado)
         VALUES (?,?,?,?, 'EMITIDA')
         ON DUPLICATE KEY UPDATE total_importe=VALUES(total_importe), vencimiento=VALUES(vencimiento), estado='EMITIDA'`,
        [pid, periodo, total, vto]
      );
      inserted += ins?.affectedRows ? 1 : 0;
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

  res.status(201).json({ message: 'Cuotas de alumnos emitidas', solicitados: personas.length, insertados: inserted });
});

export const pagar = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const { monto, medio_pago, nro_tramite, observacion } = req.body || {};
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [[cuota]] = await conn.query('SELECT id, persona_id, periodo, total_importe, importe_pagado FROM cuota_alumno WHERE id=? FOR UPDATE', [id]);
    if (!cuota) { const e = new Error('Cuota no encontrada'); e.status = 404; throw e; }

    const [[u]] = await conn.query('SELECT persona_id FROM usuario WHERE id=?', [req.user.id]);
    const responsableId = u?.persona_id || null;

    const [pIns] = await conn.execute(
      'INSERT INTO pago_cuota_alumno (cuota_id, monto, medio_pago, nro_tramite, observacion) VALUES (?,?,?,?,?)',
      [id, monto || 0, medio_pago || null, nro_tramite || null, observacion || null]
    );
    const pagoId = pIns.insertId;

    const nuevoPagado = Number(cuota.importe_pagado || 0) + Number(monto || 0);
    await conn.execute(
      `UPDATE cuota_alumno SET importe_pagado=?, estado = CASE WHEN (total_importe - ?) <= 0 THEN 'PAGADA' ELSE 'PENDIENTE' END WHERE id=?`,
      [nuevoPagado, nuevoPagado, id]
    );

    const concepto = `Pago cuota alumno ${cuota.periodo} persona_id ${cuota.persona_id} (pago_id ${pagoId})`;
    await conn.execute(
      'INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id, nro_tramite) VALUES (NOW(), ?, "INGRESO", ?, ?, ?, ?)',
      [concepto, monto || 0, medio_pago || null, responsableId, nro_tramite || null]
    );

    const [[updated]] = await conn.query('SELECT * FROM cuota_alumno WHERE id=?', [id]);
    await conn.commit();
    res.status(201).json({ message: 'Pago registrado', pago_id: pagoId, cuota: updated });
  } catch (err) { await conn.rollback(); if (err.status) throw err; throw err; } finally { conn.release(); }
});

// Obtener cuotas deudoras de un alumno (persona)
export const getCuotasDeudoras = asyncH(async (req, res) => {
  const personaId = Number(req.params.persona_id);
  if (!personaId) {
    return res.status(400).json({ error: { message: 'persona_id requerido' } });
  }
  
  const rows = await query(`
    SELECT c.id, c.persona_id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.estado, c.vencimiento,
           c.saldo_con_mora, c.dias_atraso
    FROM v_cuota_alumno_con_mora c
    WHERE c.persona_id = ? AND c.estado != 'PAGADA' AND c.saldo > 0
    ORDER BY c.vencimiento ASC, c.id ASC
  `, [personaId]);
  
  res.json({ data: rows, total: rows.length });
});

// Pagar múltiples cuotas de un alumno
export const pagarMultiple = asyncH(async (req, res) => {
  const personaId = Number(req.params.persona_id);
  if (!personaId) {
    return res.status(400).json({ error: { message: 'persona_id requerido' } });
  }
  
  const { monto_total, medio_pago, nro_tramite, observacion } = req.body;
  if (!monto_total || Number(monto_total) <= 0) {
    return res.status(400).json({ error: { message: 'monto_total debe ser mayor a 0' } });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Obtener todas las cuotas pendientes del alumno ordenadas por antigüedad
    const [cuotas] = await conn.query(`
      SELECT c.id, c.persona_id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.vencimiento,
             COALESCE(v.saldo_con_mora, c.saldo) as saldo_con_mora
      FROM cuota_alumno c
      LEFT JOIN v_cuota_alumno_con_mora v ON v.id = c.id
      WHERE c.persona_id = ? AND c.estado != 'PAGADA' AND c.saldo > 0
      ORDER BY c.vencimiento ASC, c.id ASC
      FOR UPDATE
    `, [personaId]);

    if (!cuotas.length) {
      await conn.rollback();
      return res.status(404).json({ error: { message: 'No hay cuotas pendientes para este alumno' } });
    }

    const [[u]] = await conn.query('SELECT persona_id FROM usuario WHERE id=?', [req.user.id]);
    const responsableId = u?.persona_id || null;

    let montoRestante = Number(monto_total);
    const cuotasPagadas = [];
    const pagosRealizados = [];

    // Procesar cada cuota de la más antigua a la más reciente
    for (const cuota of cuotas) {
      if (montoRestante <= 0) break;

      const saldoPendiente = Number(cuota.saldo_con_mora);
      const montoPagar = Math.min(montoRestante, saldoPendiente);

      // Registrar pago
      const [pIns] = await conn.execute(
        'INSERT INTO pago_cuota_alumno (cuota_id, monto, medio_pago, nro_tramite, observacion) VALUES (?,?,?,?,?)',
        [cuota.id, montoPagar, medio_pago || null, nro_tramite || null, observacion || null]
      );
      const pagoId = pIns.insertId;

      // Actualizar cuota
      const nuevoImportePagado = Number(cuota.importe_pagado || 0) + montoPagar;
      await conn.execute(
        'UPDATE cuota_alumno SET importe_pagado = ?, estado = CASE WHEN (total_importe - ?) <= 0 THEN "PAGADA" ELSE "PENDIENTE" END WHERE id = ?',
        [nuevoImportePagado, nuevoImportePagado, cuota.id]
      );

      // Registrar en caja
      const concepto = `Pago cuota alumno ${cuota.periodo} persona_id ${cuota.persona_id} (pago_id ${pagoId})`;
      await conn.execute(
        'INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id, nro_tramite) VALUES (NOW(), ?, "INGRESO", ?, ?, ?, ?)',
        [concepto, montoPagar, medio_pago || null, responsableId, nro_tramite || null]
      );

      cuotasPagadas.push({
        id: cuota.id,
        periodo: cuota.periodo,
        monto_pagado: montoPagar,
        saldo_anterior: saldoPendiente
      });

      pagosRealizados.push(pagoId);
      montoRestante -= montoPagar;
    }

    await conn.commit();

    res.status(201).json({
      message: 'Pagos registrados exitosamente',
      cuotas_procesadas: cuotasPagadas.length,
      monto_aplicado: Number(monto_total) - montoRestante,
      monto_sobrante: montoRestante,
      cuotas: cuotasPagadas,
      pagos: pagosRealizados
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Comprobante PDF estilo Mercado Pago
export const comprobantePdf = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query(`
    SELECT c.id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.estado, c.vencimiento, c.created_at,
           p.id AS persona_id, p.nombre, p.apellido, p.dni
    FROM cuota_alumno c
    JOIN persona p ON p.id = c.persona_id
    WHERE c.id = ?`, [id]);
  if (!rows.length) return res.status(404).json({ error:{ message:'Cuota no encontrada' }});
  const c = rows[0];

  // Obtener pagos de esta cuota
  const pagos = await query(`
    SELECT monto, medio_pago, nro_tramite, created_at as fecha_pago, observacion
    FROM pago_cuota_alumno
    WHERE cuota_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [id]);
  const ultimoPago = pagos[0] || {};

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="comprobante_cuota_alumno_${c.id}.pdf"`);

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
     .text('Comprobante de Pago - Alumno', 100, y + 32);

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
     .text('Motivo: Pago de Cuota Alumno', margin, y);

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
     .text(`DNI: ${c.dni || 'N/A'}`, margin, y);
  
  y += 15;

  doc.fillColor('#666666')
     .font(fonts.regular)
     .fontSize(10)
     .text(`Alumno ID: ${c.persona_id}`, margin, y);

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
     .text(`AL${String(c.id).padStart(10, '0')}`, W - margin - 150, y, { width: 150, align: 'right' });

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
  const codigoQR = `AL${String(c.id).padStart(10, '0')}-${c.persona_id}`;
  
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
