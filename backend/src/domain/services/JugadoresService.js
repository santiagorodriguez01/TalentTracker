import { query, getConnection } from '../../db/connection.js';
import { audit } from './AuditService.js';

export async function listJugadores({ q, puesto, page = 1, size = 20 }) {
  const lim = Math.max(1, parseInt(size) || 20);
  const off = Math.max(0, ((parseInt(page) || 1) - 1) * lim);
  const where = ['1=1']; const params = [];
  if (q) {
    where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)');
    params.push(`%${q}%`,`%${q}%`,`%${q}%`);
  }
  if (puesto) { where.push('j.puesto = ?'); params.push(puesto); }

  const sql = `
    SELECT j.id, j.persona_id, j.puesto, j.dorsal, j.contrato_pdf,
           p.nombre, p.apellido, p.dni, p.estado
    FROM jugador j
    JOIN persona p ON p.id = j.persona_id
    WHERE ${where.join(' AND ')}
    ORDER BY p.apellido, p.nombre
    LIMIT ${lim} OFFSET ${off}`;
  return query(sql, params);
}

export async function getJugador(id) {
  const rows = await query(`
    SELECT j.id, j.persona_id, j.puesto, j.dorsal, j.contrato_pdf,
           p.nombre, p.apellido, p.dni, p.foto, p.estado
    FROM jugador j
    JOIN persona p ON p.id = j.persona_id
    WHERE j.id = ?`, [id]);
  return rows[0] || null;
}

/** Crea jugador desde persona; valida dorsal unico (si viene) */
export async function createJugador({ persona_id, puesto = null, dorsal = null }, userId) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [p] = await conn.execute('SELECT id FROM persona WHERE id=?', [persona_id]);
    if (!p.length) { await conn.rollback(); const e = new Error('Persona no existe'); e.status = 404; throw e; }

    if (dorsal != null) {
      const [du] = await conn.execute('SELECT id FROM jugador WHERE dorsal=?', [dorsal]);
      if (du.length) { await conn.rollback(); const e = new Error('Dorsal ya tomado'); e.status = 409; throw e; }
    }

    const [ins] = await conn.execute(
      'INSERT INTO jugador (persona_id, puesto, dorsal) VALUES (?,?,?)',
      [persona_id, puesto || null, dorsal || null]
    );

    await conn.commit();
    await audit(userId, 'JUGADOR_CREAR', 'jugador', ins.insertId, { persona_id, puesto, dorsal });
    return { id: ins.insertId };
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}

export async function updateJugador(id, body, userId) {
  if (body.dorsal != null) {
    const rows = await query('SELECT id FROM jugador WHERE dorsal=? AND id<>?', [body.dorsal, id]);
    if (rows.length) { const e = new Error('Dorsal ya tomado'); e.status = 409; throw e; }
  }
  const allowed = ['puesto','dorsal','contrato_pdf'];
  const sets = []; const vals = [];
  for (const k of allowed) if (k in body) { sets.push(`${k}=?`); vals.push(body[k]); }
  if (!sets.length) return false;

  const r = await query(`UPDATE jugador SET ${sets.join(', ')} WHERE id=?`, [...vals, id]);
  const changed = r.affectedRows > 0;
  if (changed) await audit(userId, 'JUGADOR_ACTUALIZAR', 'jugador', id, { cambiado: Object.keys(body) });
  return changed;
}

export async function deleteJugador(id, userId) {
  const r = await query('DELETE FROM jugador WHERE id=?', [id]);
  if (r.affectedRows) await audit(userId, 'JUGADOR_BORRAR', 'jugador', id, null);
  return r.affectedRows > 0;
}
