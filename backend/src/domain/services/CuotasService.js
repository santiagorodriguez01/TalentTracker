import { query, getConnection } from '../../db/connection.js';


export async function listCuotas({ page = 1, size = 20, q, estado, solo_deudores }) {
  const lim = Math.max(1, parseInt(size) || 20);
  const off = Math.max(0, ((parseInt(page) || 1) - 1) * lim);

  const where = ['1=1']; const params = [];
  if (q) {
    where.push('(p.apellido LIKE ? OR p.nombre LIKE ? OR s.nro_socio LIKE ?)');
    params.push(`%${q}%`,`%${q}%`,`%${q}%`);
  }
  if (estado) { 
    where.push('c.estado = ?'); 
    params.push(estado); 
  } else if (solo_deudores) {
    // Mostrar solo cuotas no pagadas y con saldo pendiente
    where.push('c.estado != ?');
    params.push('PAGADA');
    where.push('c.saldo > 0');
  }

  const baseFrom = `
    FROM cuota c
    JOIN socio s   ON s.id = c.socio_id
    JOIN persona p ON p.id = s.persona_id
    LEFT JOIN v_cuota_con_mora v ON v.id = c.id
    WHERE ${where.join(' AND ')}
  `;

  const rows = await query(`
    SELECT c.*, s.nro_socio, p.nombre, p.apellido,
           v.dias_atraso, v.saldo_con_mora
    ${baseFrom}
    ORDER BY c.vencimiento DESC, c.id DESC
    LIMIT ${lim} OFFSET ${off}
  `, params);

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total ${baseFrom}`, params
  );

  return { rows, total };
}



export async function emitirCuotas({ periodo, importe, vencimiento, socio_ids }) {
  // Si no llegan ids, emito a todos los ACTIVO
  let socios = [];
  if (Array.isArray(socio_ids) && socio_ids.length) {
    const ph = socio_ids.map(() => '?').join(',');
    socios = await query(`SELECT id FROM socio WHERE id IN (${ph})`, socio_ids);
  } else {
    socios = await query(`
      SELECT s.id
      FROM socio s
      JOIN persona p ON p.id = s.persona_id
      WHERE p.estado = 'ACTIVO'
    `);
  }
  if (!socios.length) return { solicitados: 0, insertados: 0 };

  const conn = await getConnection();
  let inserted = 0;
  try {
    await conn.beginTransaction();
    for (const row of socios) {
      const [resIns] = await conn.execute(
        `INSERT IGNORE INTO cuota (socio_id, periodo, total_importe, vencimiento, estado)
         VALUES (?,?,?,?, 'EMITIDA')`,
        [row.id, periodo, importe, vencimiento]
      );
      inserted += resIns.affectedRows || 0;
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }

  return { solicitados: socios.length, insertados: inserted };
}

export async function pagarCuota({ id, monto, medio_pago, nro_tramite, observacion, responsableUsuarioId }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [[cuota]] = await conn.query('SELECT id, socio_id, periodo, total_importe, importe_pagado FROM cuota WHERE id=? FOR UPDATE', [id]);
    if (!cuota) { const e = new Error('Cuota no encontrada'); e.status = 404; throw e; }

    const [[u]] = await conn.query('SELECT persona_id FROM usuario WHERE id=?', [responsableUsuarioId]);
    const responsableId = u?.persona_id || null;

    // 1) Registrar pago
    const [pIns] = await conn.execute(
      'INSERT INTO pago_cuota (cuota_id, monto, medio_pago, nro_tramite, observacion) VALUES (?,?,?,?,?)',
      [cuota.id, monto || null, medio_pago || null, nro_tramite || null, observacion || null]
    );
    const pagoId = pIns.insertId;

    // 2) Actualizar acumulado de la cuota y estado
    const nuevoImportePagado = Number(cuota.importe_pagado || 0) + Number(monto || 0);
    await conn.execute(
      'UPDATE cuota SET importe_pagado = ?, estado = CASE WHEN (total_importe - ?) <= 0 THEN "PAGADA" ELSE "PENDIENTE" END WHERE id = ?',
      [nuevoImportePagado, nuevoImportePagado, cuota.id]
    );

    // 3) Movimiento de caja por el monto efectivamente pagado
    const concepto = `Pago cuota ${cuota.periodo} socio_id ${cuota.socio_id} (pago_id ${pagoId})`;
    await conn.execute(
      'INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id, nro_tramite) VALUES (NOW(), ?, "INGRESO", ?, ?, ?, ?)',
      [concepto, monto || 0, medio_pago || null, responsableId, nro_tramite || null]
    );

    // 4) Estado actualizado de la cuota
    const [[updated]] = await conn.query(
      'SELECT id, periodo, total_importe, importe_pagado, saldo, estado, vencimiento FROM cuota WHERE id=?',
      [cuota.id]
    );

    await conn.commit();
    return { pago_id: pagoId, cuota: updated };
  } catch (err) {
    await conn.rollback();
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio'); e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}

// Obtener cuotas deudoras de un socio ordenadas por antigüedad (más antigua primero)
export async function getCuotasDeudorasPorSocio(socioId) {
  const rows = await query(`
    SELECT c.id, c.socio_id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.estado, c.vencimiento,
           COALESCE(v.saldo_con_mora, c.saldo) as saldo_con_mora,
           COALESCE(v.dias_atraso, 0) as dias_atraso
    FROM cuota c
    LEFT JOIN v_cuota_con_mora v ON v.id = c.id
    WHERE c.socio_id = ? AND c.estado != 'PAGADA' AND c.saldo > 0
    ORDER BY c.vencimiento ASC, c.id ASC
  `, [socioId]);
  return rows;
}

// Pagar múltiples cuotas de un socio (siempre de la más antigua a la más reciente)
export async function pagarCuotasMultiples({ socio_id, monto_total, medio_pago, nro_tramite, observacion, responsableUsuarioId }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Obtener todas las cuotas pendientes del socio ordenadas por antigüedad
    const [cuotas] = await conn.query(`
      SELECT c.id, c.socio_id, c.periodo, c.total_importe, c.importe_pagado, c.saldo, c.vencimiento,
             COALESCE(v.saldo_con_mora, c.saldo) as saldo_con_mora
      FROM cuota c
      LEFT JOIN v_cuota_con_mora v ON v.id = c.id
      WHERE c.socio_id = ? AND c.estado != 'PAGADA' AND c.saldo > 0
      ORDER BY c.vencimiento ASC, c.id ASC
      FOR UPDATE
    `, [socio_id]);

    if (!cuotas.length) {
      const e = new Error('No hay cuotas pendientes para este socio');
      e.status = 404;
      throw e;
    }

    const [[u]] = await conn.query('SELECT persona_id FROM usuario WHERE id=?', [responsableUsuarioId]);
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
        'INSERT INTO pago_cuota (cuota_id, monto, medio_pago, nro_tramite, observacion) VALUES (?,?,?,?,?)',
        [cuota.id, montoPagar, medio_pago || null, nro_tramite || null, observacion || null]
      );
      const pagoId = pIns.insertId;

      // Actualizar cuota
      const nuevoImportePagado = Number(cuota.importe_pagado || 0) + montoPagar;
      await conn.execute(
        'UPDATE cuota SET importe_pagado = ?, estado = CASE WHEN (total_importe - ?) <= 0 THEN "PAGADA" ELSE "PENDIENTE" END WHERE id = ?',
        [nuevoImportePagado, nuevoImportePagado, cuota.id]
      );

      // Registrar en caja
      const concepto = `Pago cuota ${cuota.periodo} socio_id ${cuota.socio_id} (pago_id ${pagoId})`;
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

    return {
      message: 'Pagos registrados exitosamente',
      cuotas_procesadas: cuotasPagadas.length,
      monto_aplicado: Number(monto_total) - montoRestante,
      monto_sobrante: montoRestante,
      cuotas: cuotasPagadas,
      pagos: pagosRealizados
    };
  } catch (err) {
    await conn.rollback();
    if (err?.status) throw err;
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400;
      throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}