import { query, getConnection } from '../../db/connection.js';

export async function listSocios({ q, estado, persona_id, page = 1, size = 20 }) {
  const lim = Math.max(1, parseInt(size) || 20);
  const off = Math.max(0, ((parseInt(page) || 1) - 1) * lim);

  const where = ['1=1'];
  const params = [];
  if (q) {
    where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ? OR s.nro_socio LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (estado) { where.push('p.estado = ?'); params.push(estado); }

  if (persona_id) { where.push('s.persona_id = ?'); params.push(Number(persona_id)); }
  const baseWhere = where.join(' AND ');
  const rows = await query(`
    SELECT
      s.id AS socio_id,
      s.nro_socio,
      s.fecha_alta,
      s.estado_cuenta,
      COALESCE(pl.nombre, 'Sin plan') AS plan,
      GROUP_CONCAT(DISTINCT b.nombre ORDER BY b.nombre SEPARATOR ', ') AS beneficios,
      p.id AS persona_id, p.nombre, p.apellido, p.dni, p.estado
    FROM socio s
    JOIN persona p              ON p.id = s.persona_id
    LEFT JOIN socio_plan sp     ON sp.socio_id = s.id AND sp.fecha_fin IS NULL
    LEFT JOIN plan pl           ON pl.id = sp.plan_id
    LEFT JOIN plan_beneficio pb ON pb.plan_id = pl.id
    LEFT JOIN beneficio b       ON b.id = pb.beneficio_id
    WHERE ${baseWhere}
    GROUP BY
      s.id, s.nro_socio, s.fecha_alta, s.estado_cuenta,
      p.id, p.nombre, p.apellido, p.dni, p.estado,
      pl.nombre
    ORDER BY p.apellido, p.nombre
    LIMIT ${lim} OFFSET ${off}
  `, params);

  const totalRows = await query(`
    SELECT COUNT(DISTINCT s.id) AS total
    FROM socio s
    JOIN persona p            ON p.id = s.persona_id
    LEFT JOIN socio_plan sp   ON sp.socio_id = s.id AND sp.fecha_fin IS NULL
    LEFT JOIN plan pl         ON pl.id = sp.plan_id
    WHERE ${baseWhere}
  `, params);

  const total = totalRows[0]?.total ?? 0;
  return { rows, total };
}

export async function getSocio(id) {
  const rows = await query(`
    SELECT
      s.id AS socio_id,
      s.nro_socio,
      s.fecha_alta,
      s.estado_cuenta,
      pl.nombre AS plan,
      GROUP_CONCAT(DISTINCT b.nombre ORDER BY b.nombre SEPARATOR ', ') AS beneficios,
      p.id AS persona_id, p.nombre, p.apellido, p.dni, p.estado, p.email, p.telefono, p.domicilio, p.foto
    FROM socio s
    JOIN persona p            ON p.id = s.persona_id
    LEFT JOIN socio_plan sp   ON sp.socio_id = s.id AND sp.fecha_fin IS NULL
    LEFT JOIN plan pl         ON pl.id = sp.plan_id
    LEFT JOIN plan_beneficio pb ON pb.plan_id = pl.id
    LEFT JOIN beneficio b     ON b.id = pb.beneficio_id
    WHERE s.id = ?
    GROUP BY s.id, s.nro_socio, s.fecha_alta, s.estado_cuenta,
             p.id, p.nombre, p.apellido, p.dni, p.estado, p.email, p.telefono, p.domicilio, p.foto,
             pl.nombre
  `, [id]);
  return rows[0] || null;
}

/** Alta idempotente:
 * - Si dni existe: usa esa persona (actualiza datos basicos si vinieron) y crea socio si aun no lo era
 * - Valida que nro_socio no este usado
 */
export async function createSocio({ nro_socio, nombre, apellido, dni, email, telefono, domicilio, plan, beneficios }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // 1) nro_socio unico
    const [ns] = await conn.execute('SELECT id FROM socio WHERE nro_socio=?', [nro_socio]);
    if (ns.length) {
      await conn.rollback();
      const err = new Error('Nro de socio ya registrado'); err.status = 409; throw err;
    }

    // 2) persona por DNI
    const [per] = await conn.execute('SELECT id FROM persona WHERE dni=?', [dni]);
    let personaId;
    if (per.length) {
      personaId = per[0].id;

      // ya es socio?
      const [si] = await conn.execute('SELECT id FROM socio WHERE persona_id=?', [personaId]);
      if (si.length) {
        await conn.rollback();
        const err = new Error('La persona ya es socio'); err.status = 409; throw err;
      }

      // actualizar datos basicos si vinieron
      const sets = []; const vals = [];
      const patch = { nombre, apellido, email, telefono, domicilio };
      for (const k of Object.keys(patch)) if (patch[k] != null) { sets.push(`${k}=?`); vals.push(patch[k]); }
      if (sets.length) await conn.execute(`UPDATE persona SET ${sets.join(', ')} WHERE id=?`, [...vals, personaId]);
    } else {
      // crear persona nueva con rol SOCIO
      const [insP] = await conn.execute(
        `INSERT INTO persona (nombre, apellido, dni, email, telefono, domicilio, rol, estado)
         VALUES (?,?,?,?,?,?, 'SOCIO','ACTIVO')`,
        [nombre, apellido, dni, email || null, telefono || null, domicilio || null]
      );
      personaId = insP.insertId;
    }

    const [roleCheck] = await conn.execute(
      'SELECT 1 FROM persona_rol WHERE persona_id=? AND rol=? LIMIT 1',
      [personaId, 'SOCIO']
    );
    if (!roleCheck.length) {
      await conn.execute(
        'INSERT INTO persona_rol (persona_id, rol) VALUES (?, ?)',
        [personaId, 'SOCIO']
      );
    }

    // 3) insertar socio
   const [insS] = await conn.execute(
      `INSERT INTO socio (persona_id, nro_socio, fecha_alta, estado_cuenta)
       VALUES (?,?, CURDATE(), 'AL_DIA')`,
      [personaId, nro_socio]
    );

    await conn.commit();
    return { id: insS.insertId, persona_id: personaId };
  } catch (e) {
    await conn.rollback(); throw e;
  } finally {
    conn.release();
  }
}

/** Adjuntar socio a persona existente */
export async function createSocioFromPersona({ persona_id, nro_socio, plan, beneficios }) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [p] = await conn.execute('SELECT id FROM persona WHERE id=?', [persona_id]);
    if (!p.length) { await conn.rollback(); const err = new Error('Persona no existe'); err.status = 404; throw err; }

    const [ns] = await conn.execute('SELECT id FROM socio WHERE nro_socio=?', [nro_socio]);
    if (ns.length) { await conn.rollback(); const err = new Error('Nro de socio ya registrado'); err.status = 409; throw err; }

    const [si] = await conn.execute('SELECT id FROM socio WHERE persona_id=?', [persona_id]);
    if (si.length) { await conn.rollback(); const err = new Error('La persona ya es socio'); err.status = 409; throw err; }

    const [ins] = await conn.execute(
      `INSERT INTO socio (persona_id, nro_socio, fecha_alta, estado_cuenta)
       VALUES (?,?, CURDATE(), 'AL_DIA')`,
      [persona_id, nro_socio]
    );
    const [roleCheck] = await conn.execute(
      'SELECT 1 FROM persona_rol WHERE persona_id=? AND rol=? LIMIT 1',
      [persona_id, 'SOCIO']
    );
    if (!roleCheck.length) {
      await conn.execute(
        'INSERT INTO persona_rol (persona_id, rol) VALUES (?, ?)',
        [persona_id, 'SOCIO']
      );
    }
    await conn.commit();
    return { id: ins.insertId };
  } catch (e) {
    await conn.rollback(); throw e;
  } finally { conn.release(); }
}

export async function updateSocio(id, body) {
  const allowedP = ['nombre','apellido','dni','email','telefono','domicilio','estado','foto'];
  const allowedS = ['nro_socio'];
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute('SELECT persona_id FROM socio WHERE id=?',[id]);
    if (!r.length) { await conn.rollback(); return false; }
    const pid = r[0].persona_id;

    const setP = []; const valP = [];
    for (const k of allowedP) if (k in body) { setP.push(`${k}=?`); valP.push(body[k]); }
    if (setP.length) await conn.execute(`UPDATE persona SET ${setP.join(', ')} WHERE id=?`, [...valP, pid]);

    // nro_socio: validar si lo cambian
    if (body.nro_socio) {
      const [ns] = await conn.execute('SELECT id FROM socio WHERE nro_socio=? AND id<>?', [body.nro_socio, id]);
      if (ns.length) { await conn.rollback(); const err = new Error('Nro de socio ya registrado'); err.status = 409; throw err; }
    }
    const setS = []; const valS = [];
    for (const k of allowedS) if (k in body) { setS.push(`${k}=?`); valS.push(body[k]); }
    if (setS.length) await conn.execute(`UPDATE socio SET ${setS.join(', ')} WHERE id=?`, [...valS, id]);

    await conn.commit();
    return true;
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}

export async function deleteSocio(id) {
  const rows = await query('SELECT persona_id FROM socio WHERE id=?',[id]);
  if (!rows.length) return false;
  await query(`UPDATE persona SET estado='INACTIVO' WHERE id=?`, [rows[0].persona_id]);
  return true;
}

export async function validarSocioPorDni(dni) {
  // Buscar persona por DNI
  const persona = await query('SELECT id, nombre, apellido FROM persona WHERE dni = ?', [dni]);
  
  if (!persona.length) {
    return {
      existe: false,
      estado: 'NO_SOCIO'
    };
  }

  const personaId = persona[0].id;
  
  // Buscar si es socio
  const socio = await query(
    'SELECT id, nro_socio, estado_cuenta FROM socio WHERE persona_id = ?',
    [personaId]
  );

  if (!socio.length) {
    return {
      existe: false,
      estado: 'NO_SOCIO',
      nombre: persona[0].nombre,
      apellido: persona[0].apellido
    };
  }

  return {
    existe: true,
    estado: socio[0].estado_cuenta,
    nombre: persona[0].nombre,
    apellido: persona[0].apellido,
    nro_socio: socio[0].nro_socio
  };
}

export async function validarSocioPorNroSocio(nroSocio) {
  // Buscar socio por numero de socio
  const socio = await query(
    'SELECT s.id, s.nro_socio, s.estado_cuenta, s.persona_id, p.nombre, p.apellido, p.dni FROM socio s INNER JOIN persona p ON p.id = s.persona_id WHERE s.nro_socio = ?',
    [nroSocio]
  );
  
  if (!socio.length) {
    return {
      existe: false,
      estado: 'NO_SOCIO'
    };
  }

  // Calcular saldo total de cuotas pendientes
  const saldoResult = await query(
    'SELECT COALESCE(SUM(saldo), 0) as saldo_total FROM cuota WHERE socio_id = ?',
    [socio[0].id]
  );
  
  const saldoTotal = parseFloat(saldoResult[0]?.saldo_total || 0);

  return {
    existe: true,
    socio_id: socio[0].id,
    estado: socio[0].estado_cuenta,
    nombre: socio[0].nombre,
    apellido: socio[0].apellido,
    dni: socio[0].dni,
    saldo_total: saldoTotal
  };
}