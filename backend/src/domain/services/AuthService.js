// src/domain/services/AuthService.js
import { query } from '../../db/connection.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { audit as writeAudit } from './AuditService.js'; 


export default class AuthService {
  async login(username, password, meta = {}) {
    const rows = await query('SELECT * FROM usuario WHERE username = ?', [username]);
    if (!rows.length) {
      const e = new Error('Usuario o contrasena invalidos');
      e.status = 401;
      throw e;
    }
    const u = rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      const e = new Error('Usuario o contrasena invalidos');
      e.status = 401;
      throw e;
    }

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign(
      { id: u.id, username: u.username, rol_sistema: u.rol_sistema },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // auditoria del login (ignora errores)
    try { await writeAudit(u.id, 'LOGIN', 'usuario', u.id, meta); } catch {}

    return { token, user: { id: u.id, username: u.username, rol_sistema: u.rol_sistema } };
  }
}




export async function listAudit({ accion, entidad, usuario_id, limit, offset }) {
  const where = [];
  const params = [];

  if (accion)     { where.push('accion = ?');     params.push(accion); }
  if (entidad)    { where.push('entidad = ?');    params.push(entidad); }
  if (usuario_id) { where.push('usuario_id = ?'); params.push(Number(usuario_id)); }

  // saneo fuerte y valores por defecto
  const lim = Math.max(1, parseInt(limit ?? 50, 10) || 50);
  const off = Math.max(0, parseInt(offset ?? 0, 10) || 0);

  const sql = `
    SELECT id, usuario_id, accion, entidad, entidad_id, detalle, created_at
    FROM audit_log
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id DESC
    LIMIT ${lim} OFFSET ${off}
  `;
  return query(sql, params);
}
