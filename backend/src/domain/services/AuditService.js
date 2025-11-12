// src/domain/services/AuditService.js
import { query } from '../../db/connection.js';

export async function audit(usuarioId, accion, entidad, entidadId = null, detalle = null) {
  try {
    await query(
      `INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, detalle)
       VALUES (?,?,?,?, ?)`,
      [usuarioId || null, accion, entidad, entidadId ?? null, detalle ? JSON.stringify(detalle) : null]
    );
  } catch (e) {
    console.warn('[AUDIT warn]', e.code || e.message);
  }
}

export async function listAudit({ accion, entidad, usuario_id, limit, offset }) {
  const where = [];
  const params = [];
  if (accion)     { where.push('accion = ?');     params.push(accion); }
  if (entidad)    { where.push('entidad = ?');    params.push(entidad); }
  if (usuario_id) { where.push('usuario_id = ?'); params.push(Number(usuario_id)); }

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
