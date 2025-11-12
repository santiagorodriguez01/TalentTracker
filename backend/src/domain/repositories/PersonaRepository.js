import { query } from '../../db/connection.js';

function buildWhere({ rol, estado, q }) {
  const w = [];
  const p = [];
  if (rol) {
    w.push('(p.rol = ? OR EXISTS (SELECT 1 FROM persona_rol pr WHERE pr.persona_id = p.id AND pr.rol = ?))');
    p.push(rol, rol);
  }
  if (estado) { w.push('p.estado = ?'); p.push(estado); }
  if (q && String(q).trim() !== '') {
    w.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)');
    const like = `%${q}%`;
    p.push(like, like, like);
  }
  const whereSQL = w.length ? `WHERE ${w.join(' AND ')}` : '';
  return { whereSQL, params: p };
}

export default class PersonaRepository {
  async list({ rol, estado, q, page = 1, size = 20 } = {}) {
    const limit  = Math.max(1, Number.parseInt(size, 10) || 20);
    const pageN  = Math.max(1, Number.parseInt(page, 10) || 1);
    const offset = (pageN - 1) * limit;

    const { whereSQL, params } = buildWhere({ rol, estado, q });

    const rows = await query(`
      SELECT p.*
      FROM persona p
      ${whereSQL}
      ORDER BY p.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    const [{ total }] = await query(`
      SELECT COUNT(*) AS total
      FROM persona p
      ${whereSQL}
    `, params);

    if (!rows.length) {
      return { rows, total };
    }

    const ids = rows.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const roleRows = await query(
      `SELECT persona_id, rol
         FROM persona_rol
        WHERE persona_id IN (${placeholders})
        ORDER BY id`,
      ids
    );
    const roleMap = new Map();
    for (const rr of roleRows) {
      if (!rr.rol) continue;
      const bucket = roleMap.get(rr.persona_id) || [];
      bucket.push(rr.rol);
      roleMap.set(rr.persona_id, bucket);
    }
    for (const row of rows) {
      const roles = roleMap.get(row.id) || (row.rol ? [row.rol] : []);
      row.roles = roles;
    }

    return { rows, total };
  }

  async getById(id) {
    const rows = await query('SELECT * FROM persona WHERE id = ?', [id]);
    if (!rows.length) return null;
    const persona = rows[0];
    const roles = await query(
      'SELECT rol FROM persona_rol WHERE persona_id = ? ORDER BY id',
      [id]
    );
    persona.roles = roles.map(r => r.rol).filter(Boolean);
    if (!persona.roles.length && persona.rol) persona.roles = [persona.rol];
    return persona;
  }

  async insert(d) {
    const keys = ['nombre','apellido','genero','dni','fecha_nac','email','telefono','domicilio','foto','rol'];
    const vals = keys.map(k => (k in d ? d[k] : null));
    const sql = `INSERT INTO persona (${keys.join(',')}) VALUES (?,?,?,?,?,?,?,?,?,?)`;
    return query(sql, vals);
  }

  async update(id, d) {
    const fields = ['nombre','apellido','dni','fecha_nac','email','telefono','domicilio','foto','rol','estado','genero'];
    const sets = []; const params = [];
    for (const f of fields) if (Object.prototype.hasOwnProperty.call(d, f)) { sets.push(`${f}=?`); params.push(d[f]); }
    if (!sets.length) return 0;
    params.push(id);
    await query(`UPDATE persona SET ${sets.join(', ')} WHERE id = ?`, params);
    return 1;
  }

  async softDelete(id) {
    await query('UPDATE persona SET estado="INACTIVO" WHERE id=?', [id]);
  }
}
