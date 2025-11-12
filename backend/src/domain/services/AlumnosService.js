import { query, getConnection } from '../../db/connection.js';
import { audit } from './AuditService.js';

async function ensureCatalogId(conn, table, nombre) {
  if (!nombre) return null;
  const rows = await conn.query(`SELECT id FROM ${table} WHERE nombre=? LIMIT 1`, [nombre]);
  if (rows[0]?.length && rows[0][0]?.id) return rows[0][0].id;
  const result = await conn.execute(`INSERT INTO ${table} (nombre) VALUES (?)`, [nombre]);
  return result[0].insertId;
}

export async function listAlumnos({ q, deporte, categoria, coordinador_id, coordinadorId, coordinador_deporte_id, page = 1, size = 20 }) {
  const lim = Math.max(1, parseInt(size) || 20);
  const off = Math.max(0, ((parseInt(page) || 1) - 1) * lim);
  
  const where = ['1=1'];
  const params = [];
  
  if (q) {
    where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (deporte) { where.push('d.nombre = ?'); params.push(deporte); }
  if (categoria) { where.push('c.nombre = ?'); params.push(categoria); }
  
  const coord = coordinador_id || coordinadorId;
  if (coord) {
    where.push('EXISTS (SELECT 1 FROM alumno_coordinador ac WHERE ac.alumno_id = a.id AND ac.coordinador_id = ? AND (ac.fecha_hasta IS NULL OR ac.fecha_hasta > CURDATE()))');
    params.push(Number(coord));
    
    // Si el coordinador tiene un deporte específico asignado, filtrar por ese deporte
    if (coordinador_deporte_id) {
      where.push('d.id = ?');
      params.push(Number(coordinador_deporte_id));
    }
  }
  
  const baseFrom = `
    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN alumno_deporte ad ON ad.alumno_id = a.id
    LEFT JOIN deporte d ON d.id = ad.deporte_id
    LEFT JOIN alumno_categoria ag ON ag.alumno_id = a.id
    LEFT JOIN categoria c ON c.id = ag.categoria_id
    WHERE ${where.join(' AND ')}
  `;
  
  const rows = await query(`
    SELECT a.id, a.persona_id, a.apto_medico,
           p.nombre, p.apellido, p.dni, p.estado,
           d.nombre AS deporte, c.nombre AS categoria
    ${baseFrom}
    ORDER BY p.apellido, p.nombre
    LIMIT ${lim} OFFSET ${off}`,
    params
  );
  
  const totalRows = await query(`SELECT COUNT(DISTINCT a.id) AS total ${baseFrom}`, params);
  const total = totalRows[0]?.total || 0;
  
  return { rows, total };
}

export async function getAlumno(id) {
  const rows = await query(`
    SELECT a.id, a.persona_id, a.apto_medico,
           p.nombre, p.apellido, p.dni, p.estado, p.foto,
           GROUP_CONCAT(DISTINCT d.nombre) AS deportes,
           GROUP_CONCAT(DISTINCT c.nombre) AS categorias
    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN alumno_deporte ad ON ad.alumno_id=a.id
    LEFT JOIN deporte d ON d.id=ad.deporte_id
    LEFT JOIN alumno_categoria ag ON ag.alumno_id=a.id
    LEFT JOIN categoria c ON c.id=ag.categoria_id
    WHERE a.id = ?
    GROUP BY a.id
  `, [id]);
  return rows[0] || null;
}

export async function createAlumno({ persona_id, deporte, categoria, coordinador_id = null, apto_medico = null }, userId) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    
    const [p] = await conn.query('SELECT id, rol FROM persona WHERE id=?', [persona_id]);
    if (!p.length) {
      await conn.rollback();
      const e = new Error('Persona no existe');
      e.status = 404;
      throw e;
    }
    
    const [al] = await conn.query('SELECT id FROM alumno WHERE persona_id=? LIMIT 1', [persona_id]);
    let alumnoId = al[0]?.id;
    
    if (!alumnoId) {
      const [insA] = await conn.execute('INSERT INTO alumno (persona_id, apto_medico) VALUES (?, ?)', [persona_id, apto_medico || null]);
      alumnoId = insA.insertId;
    } else if (apto_medico) {
      await conn.execute('UPDATE alumno SET apto_medico=? WHERE id=?', [apto_medico, alumnoId]);
    }
    
    if (deporte) {
      const depId = await ensureCatalogId(conn, 'deporte', deporte);
      await conn.execute('INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (?, ?)', [alumnoId, depId]);
    }
    
    if (categoria) {
      const catId = await ensureCatalogId(conn, 'categoria', categoria);
      await conn.execute('INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (?, ?)', [alumnoId, catId]);
    }
    
    if (coordinador_id) {
      const [ex] = await conn.query(
        'SELECT 1 FROM alumno_coordinador WHERE alumno_id=? AND coordinador_id=? AND (fecha_hasta IS NULL OR fecha_hasta > CURDATE()) LIMIT 1',
        [alumnoId, coordinador_id]
      );
      if (!ex.length) {
        await conn.execute('INSERT INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (?,?, CURDATE())', [alumnoId, coordinador_id]);
      }
    }
    
    const [roleCheck] = await conn.query('SELECT 1 FROM persona_rol WHERE persona_id=? AND rol=? LIMIT 1', [persona_id, 'ALUMNO']);
    if (!roleCheck.length) {
      await conn.execute('INSERT INTO persona_rol (persona_id, rol) VALUES (?, ?)', [persona_id, 'ALUMNO']);
    }
    
    await conn.commit();
    await audit(userId, 'ALUMNO_CREAR', 'alumno', alumnoId, { persona_id, deporte, categoria });
    return { id: alumnoId };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function updateAlumno(id, body, userId) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [al] = await conn.query('SELECT id FROM alumno WHERE id=?', [id]);
    if (!al.length) {
      await conn.rollback();
      return false;
    }
    
    let changed = false;
    
    if ('apto_medico' in body) {
      await conn.execute('UPDATE alumno SET apto_medico=? WHERE id=?', [body.apto_medico || null, id]);
      changed = true;
    }
    
    if (body.deporte) {
      const depId = await ensureCatalogId(conn, 'deporte', body.deporte);
      await conn.execute('INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (?, ?)', [id, depId]);
      changed = true;
    }
    
    if (body.categoria) {
      const catId = await ensureCatalogId(conn, 'categoria', body.categoria);
      await conn.execute('INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (?, ?)', [id, catId]);
      changed = true;
    }
    
    if (body.coordinador_id) {
      const [ex] = await conn.query(
        'SELECT 1 FROM alumno_coordinador WHERE alumno_id=? AND coordinador_id=? AND (fecha_hasta IS NULL OR fecha_hasta > CURDATE()) LIMIT 1',
        [id, body.coordinador_id]
      );
      if (!ex.length) {
        await conn.execute('INSERT INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (?,?, CURDATE())', [id, body.coordinador_id]);
        changed = true;
      }
    }
    
    await conn.commit();
    if (changed) await audit(userId, 'ALUMNO_ACTUALIZAR', 'alumno', id, { cambiado: Object.keys(body) });
    return changed;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function deleteAlumno(id, userId) {
  const r = await query('DELETE FROM alumno WHERE id=?', [id]);
  if (r.affectedRows) await audit(userId, 'ALUMNO_BORRAR', 'alumno', id, null);
  return r.affectedRows > 0;
}
