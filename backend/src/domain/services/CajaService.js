import { query, getConnection } from '../../db/connection.js';

export async function altaMovimiento({ fecha, concepto, tipo, monto, medio_pago, usuarioId, validadorId, fechaValidacion, nroTramite }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const conn = await getConnection();
  try {
    const cols = ['fecha','concepto','tipo','monto','medio_pago','responsable_id'];
    const vals = [fecha || new Date(), concepto, tipo, monto, medio_pago || null, responsableId];
    if (nroTramite)      { cols.push('nro_tramite');      vals.push(nroTramite); }
    if (validadorId)     { cols.push('validador_id');     vals.push(validadorId); }
    if (fechaValidacion) { cols.push('fecha_validacion'); vals.push(new Date(fechaValidacion)); }
    const placeholders = cols.map(()=> '?').join(',');
    const sql = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [ins] = await conn.execute(sql, vals);
    return { id: ins.insertId };
  } catch (err) {
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
};


export async function obtenerMovimientos({ usuarioId, rolSistema } = {}) {
  // Filtrado por rol: PERSONAL_CAJA ve solo sus movimientos (por persona)
  const seeAllRoles = ['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA'];
  const seeAll = !!rolSistema && seeAllRoles.includes(String(rolSistema).toUpperCase());

  let personaId = null;
  if (!seeAll && usuarioId != null) {
    const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
    personaId = u[0]?.persona_id ?? null;
  }

  const where = [];
  const params = [];
  if (!seeAll) {
    if (personaId == null) {
      where.push('responsable_id IS NULL');
    } else {
      where.push('responsable_id = ?');
      params.push(personaId);
    }
  }

  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  // Movimientos con información del cajero responsable
  const movimientos = await query(
    `SELECT c.id, c.fecha, c.concepto, c.tipo, c.monto, c.medio_pago, c.nro_tramite, c.responsable_id, c.estado,
            p.nombre as responsable_nombre, p.apellido as responsable_apellido
       FROM caja c
       LEFT JOIN persona p ON p.id = c.responsable_id
       ${whereSql}
       ORDER BY c.fecha DESC, c.id DESC`,
    params
  );

  // Totales (ingresos - egresos aprobados)
  const totalResult = await query(
    `SELECT 
      SUM(CASE WHEN tipo='INGRESO' THEN monto ELSE 0 END) as total_ingresos,
      SUM(CASE WHEN tipo='EGRESO' AND estado='APROBADO' THEN monto ELSE 0 END) as total_egresos
     FROM caja
     ${whereSql}`,
    params
  );

  const totalIngresos = parseFloat(totalResult[0]?.total_ingresos || 0);
  const totalEgresos = parseFloat(totalResult[0]?.total_egresos || 0);
  const totalCaja = totalIngresos - totalEgresos;

  // Movimientos del día (egresos solo APROBADOS)
  const hoyWhere = ['DATE(fecha) = CURDATE()'];
  const hoyParams = [];
  if (!seeAll) {
    if (personaId == null) {
      hoyWhere.push('responsable_id IS NULL');
    } else {
      hoyWhere.push('responsable_id = ?');
      hoyParams.push(personaId);
    }
  }
  const hoySql = hoyWhere.length ? 'WHERE ' + hoyWhere.join(' AND ') : '';
  const hoyResult = await query(
    `SELECT 
      SUM(CASE WHEN tipo='INGRESO' THEN monto ELSE 0 END) as ingresos_hoy,
      SUM(CASE WHEN tipo='EGRESO' AND estado='APROBADO' THEN monto ELSE 0 END) as egresos_hoy
     FROM caja 
     ${hoySql}`,
    hoyParams
  );

  const ingresosHoy = parseFloat(hoyResult[0]?.ingresos_hoy || 0);
  const egresosHoy = parseFloat(hoyResult[0]?.egresos_hoy || 0);

  return {
    movimientos,
    totales: {
      total_caja: totalCaja,
      ingresos_hoy: ingresosHoy,
      egresos_hoy: egresosHoy
    }
  };
}

export async function reporteCaja({ desde, hasta, cajero_id }) {
  const where = ['fecha BETWEEN ? AND ?'];
  const params = [desde, hasta];
  
  if (cajero_id) {
    where.push('responsable_id = ?');
    params.push(cajero_id);
  }

  const whereSql = where.join(' AND ');

  const totales = await query(
    `SELECT 
      tipo, 
      SUM(monto) AS total 
    FROM caja 
    WHERE ${whereSql}
    AND (tipo = 'INGRESO' OR (tipo = 'EGRESO' AND estado = 'APROBADO'))
    GROUP BY tipo`,
    params
  );
  
  const movimientos = await query(
    `SELECT c.id, c.fecha, c.concepto, c.tipo, c.monto, c.medio_pago, c.responsable_id, c.estado,
            p.nombre as responsable_nombre, p.apellido as responsable_apellido
     FROM caja c
     LEFT JOIN persona p ON p.id = c.responsable_id
     WHERE ${whereSql}
     ORDER BY c.fecha DESC, c.id DESC`,
    params
  );
  
  return { totales, movimientos };
}

// Obtener lista de cajeros activos
export async function obtenerCajeros() {
  const cajeros = await query(`
    SELECT DISTINCT p.id, p.nombre, p.apellido, p.dni
    FROM caja c
    JOIN persona p ON p.id = c.responsable_id
    ORDER BY p.apellido, p.nombre
  `);
  return cajeros;
}

export function renderCSV(movs) {
  const header = ['id','fecha','concepto','tipo','monto','medio_pago','responsable_id'];
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const m of movs) {
    const fechaISO = m.fecha instanceof Date ? m.fecha.toISOString() : new Date(m.fecha).toISOString();
    lines.push([m.id, fechaISO, m.concepto, m.tipo, m.monto, m.medio_pago ?? '', m.responsable_id ?? ''].map(escape).join(','));
  }
  return lines.join('\n');
}

function getFechaArgentina() {
  const ahora = new Date();
  const offsetArgentina = -3; // UTC-3
  const fechaArgentina = new Date(ahora.getTime() + (offsetArgentina * 60 * 60 * 1000));
  
  const year = fechaArgentina.getUTCFullYear();
  const month = String(fechaArgentina.getUTCMonth() + 1).padStart(2, '0');
  const day = String(fechaArgentina.getUTCDate()).padStart(2, '0');
  const hours = String(fechaArgentina.getUTCHours()).padStart(2, '0');
  const minutes = String(fechaArgentina.getUTCMinutes()).padStart(2, '0');
  const seconds = String(fechaArgentina.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function ventaEntradaLocal({ es_socio, nro_socio, dni, medioPago, nroTramite, estadoSocio, monto, usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const fecha = getFechaArgentina();
  const concepto = 'Venta Entrada Local';

  const conn = await getConnection();
  try {
    const cols = ['fecha', 'concepto', 'tipo', 'monto', 'medio_pago', 'responsable_id'];
    const vals = [fecha, concepto, 'INGRESO', monto, medioPago, responsableId];
    
    if (medioPago === 'MERCADO_PAGO' && nroTramite) {
      cols.push('nro_tramite');
      vals.push(nroTramite);
    }
    
    const placeholders = cols.map(()=> '?').join(',');
    const sql = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [ins] = await conn.execute(sql, vals);
    return { id: ins.insertId };
  } catch (err) {
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function pagoCuotaMensual({ socioId, periodo, totalImporte, importeAPagar, medioPago, nroTramite, usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const fecha = getFechaArgentina();
  
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // 1. Buscar o crear la cuota
    const [cuotaExistente] = await conn.execute(
      'SELECT id, importe_pagado, total_importe FROM cuota WHERE socio_id = ? AND periodo = ?',
      [socioId, periodo]
    );

    let cuotaId;
    if (cuotaExistente.length > 0) {
      // Cuota existe, actualizar importe_pagado
      cuotaId = cuotaExistente[0].id;
      const nuevoImportePagado = parseFloat(cuotaExistente[0].importe_pagado) + parseFloat(importeAPagar);
      
      await conn.execute(
        'UPDATE cuota SET importe_pagado = ? WHERE id = ?',
        [nuevoImportePagado, cuotaId]
      );
    } else {
      // Crear nueva cuota
      // Calcular fecha de vencimiento (dia 10 del mes siguiente)
      const [year, month] = periodo.split('-');
      const siguienteMes = new Date(parseInt(year), parseInt(month), 10);
      const vencimiento = `${siguienteMes.getFullYear()}-${String(siguienteMes.getMonth() + 1).padStart(2, '0')}-10`;

      const [insCuota] = await conn.execute(
        `INSERT INTO cuota (socio_id, periodo, total_importe, importe_pagado, importe, vencimiento, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
        [socioId, periodo, totalImporte, importeAPagar, totalImporte, vencimiento]
      );
      cuotaId = insCuota.insertId;
    }

    // 2. Crear registro en caja
    const concepto = `Pago cuota ${periodo} - Socio ID ${socioId}`;
    const cols = ['fecha', 'concepto', 'tipo', 'monto', 'medio_pago', 'responsable_id'];
    const vals = [fecha, concepto, 'INGRESO', importeAPagar, medioPago, responsableId];
    
    if (medioPago === 'MERCADO_PAGO' && nroTramite) {
      cols.push('nro_tramite');
      vals.push(nroTramite);
    }
    
    const placeholders = cols.map(()=> '?').join(',');
    const sqlCaja = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [insCaja] = await conn.execute(sqlCaja, vals);

    await conn.commit();
    return { cuota_id: cuotaId, caja_id: insCaja.insertId };
  } catch (err) {
    await conn.rollback();
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function crearEgresoPendiente({ concepto, monto, medioPago, nroTramite, usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const fecha = getFechaArgentina();
  
  const conn = await getConnection();
  try {
    const cols = ['fecha', 'concepto', 'tipo', 'monto', 'medio_pago', 'responsable_id', 'estado'];
    const vals = [fecha, concepto, 'EGRESO', monto, medioPago, responsableId, 'PENDIENTE'];
    
    if (medioPago === 'TRANSFERENCIA' && nroTramite) {
      cols.push('nro_tramite');
      vals.push(nroTramite);
    }
    
    const placeholders = cols.map(()=> '?').join(',');
    const sql = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [ins] = await conn.execute(sql, vals);
    
    return { id: ins.insertId };
  } catch (err) {
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function aprobarEgresoPendiente(cajaId, validadorUsuarioId) {
  // Obtener persona_id del validador
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [validadorUsuarioId]);
  const validadorId = u[0]?.persona_id || null;

  const fechaValidacion = getFechaArgentina();

  const conn = await getConnection();
  try {
    // Verificar que el egreso existe y esta pendiente
    const [egreso] = await conn.execute(
      'SELECT id, tipo, estado FROM caja WHERE id = ?',
      [cajaId]
    );

    if (!egreso.length) {
      const err = new Error('Movimiento de caja no encontrado');
      err.status = 404;
      throw err;
    }

    if (egreso[0].tipo !== 'EGRESO') {
      const err = new Error('Solo se pueden aprobar egresos');
      err.status = 400;
      throw err;
    }

    if (egreso[0].estado !== 'PENDIENTE') {
      const err = new Error('El egreso ya fue procesado');
      err.status = 400;
      throw err;
    }

    // Actualizar egreso a APROBADO
    await conn.execute(
      'UPDATE caja SET estado = ?, validador_id = ?, fecha_validacion = ? WHERE id = ?',
      ['APROBADO', validadorId, fechaValidacion, cajaId]
    );

    return { success: true };
  } catch (err) {
    if (err.status) throw err;
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

export async function rechazarEgresoPendiente(cajaId) {
  const conn = await getConnection();
  try {
    // Verificar que el egreso existe y esta pendiente
    const [egreso] = await conn.execute(
      'SELECT id, tipo, estado FROM caja WHERE id = ?',
      [cajaId]
    );

    if (!egreso.length) {
      const err = new Error('Movimiento de caja no encontrado');
      err.status = 404;
      throw err;
    }

    if (egreso[0].tipo !== 'EGRESO') {
      const err = new Error('Solo se pueden rechazar egresos');
      err.status = 400;
      throw err;
    }

    if (egreso[0].estado !== 'PENDIENTE') {
      const err = new Error('El egreso ya fue procesado');
      err.status = 400;
      throw err;
    }

    // Actualizar egreso a RECHAZADO
    await conn.execute(
      'UPDATE caja SET estado = ? WHERE id = ?',
      ['RECHAZADO', cajaId]
    );

    return { success: true };
  } catch (err) {
    if (err.status) throw err;
    throw err;
  } finally {
    conn.release();
  }
}

export async function ventaEntradaVisitante({ medioPago, nroTramite, monto, concepto, usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const fecha = getFechaArgentina();

  const conn = await getConnection();
  try {
    const cols = ['fecha', 'concepto', 'tipo', 'monto', 'medio_pago', 'responsable_id'];
    const vals = [fecha, concepto, 'INGRESO', monto, medioPago, responsableId];
    
    if (medioPago === 'MERCADO_PAGO' && nroTramite) {
      cols.push('nro_tramite');
      vals.push(nroTramite);
    }
    
    const placeholders = cols.map(()=> '?').join(',');
    const sql = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [ins] = await conn.execute(sql, vals);
    return { id: ins.insertId };
  } catch (err) {
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function transferirATesoreria({ monto, medioPago, nroTramite, usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;

  const fecha = getFechaArgentina();
  const concepto = 'Transferencia a Tesoreria';

  const conn = await getConnection();
  try {
    const cols = ['fecha', 'concepto', 'tipo', 'monto', 'medio_pago', 'responsable_id', 'estado'];
    const vals = [fecha, concepto, 'EGRESO', monto, medioPago || null, responsableId, 'APROBADO'];
    if ((medioPago || '').toUpperCase() === 'TRANSFERENCIA' && nroTramite) {
      cols.push('nro_tramite');
      vals.push(nroTramite);
    }
    const placeholders = cols.map(()=> '?').join(',');
    const sql = `INSERT INTO caja (${cols.join(',')}) VALUES (${placeholders})`;
    const [ins] = await conn.execute(sql, vals);
    return { id: ins.insertId };
  } catch (err) {
    if (err?.sqlState === '45000' || err?.errno === 1644) {
      const e = new Error(err.sqlMessage || 'Validacion de negocio');
      e.status = 400; throw e;
    }
    throw err;
  } finally {
    conn.release();
  }
}
