/**
 * =========================================
 * MIDDLEWARE DE CONTEXTO DE AUDITORÍA
 * Establece el usuario_id actual en la sesión MySQL
 * para que los triggers puedan capturarlo
 * =========================================
 */

import { pool } from '../../domain/database/pool.js';

/**
 * Middleware que establece el contexto de auditoría en MySQL
 * Captura el usuario_id de la request y lo almacena en una variable de sesión
 * que puede ser utilizada por los triggers de auditoría
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export async function setAuditContext(req, res, next) {
  // Si no hay usuario autenticado, continuar sin establecer contexto
  if (!req.user || !req.user.id) {
    return next();
  }

  const userId = req.user.id;
  const username = req.user.username || 'unknown';
  const rol = req.user.rol_sistema || 'unknown';

  try {
    // Obtener una conexión del pool
    const connection = await pool.getConnection();

    try {
      // Establecer variables de sesión de MySQL que los triggers pueden leer
      await connection.execute(
        'SET @current_user_id = ?, @current_username = ?, @current_user_rol = ?',
        [userId, username, rol]
      );

      // Almacenar la conexión en la request para que otros middlewares la usen
      req.auditConnection = connection;

      // Guardar el ID original de la conexión
      req.auditConnectionId = connection.threadId;

      // Asegurar que la conexión se libere al finalizar la request
      const originalEnd = res.end;
      res.end = function(...args) {
        if (req.auditConnection) {
          req.auditConnection.release();
          req.auditConnection = null;
        }
        originalEnd.apply(this, args);
      };

      next();
    } catch (error) {
      // Si hay error, liberar la conexión
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al establecer contexto de auditoría:', error);
    // No bloqueamos la request si falla el contexto de auditoría
    next();
  }
}

/**
 * Middleware alternativo que registra la sesión de usuario en la BD de auditoría
 * Útil para tracking de sesiones activas y análisis de actividad
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export async function logUserSession(req, res, next) {
  if (!req.user || !req.user.id) {
    return next();
  }

  try {
    const userId = req.user.id;
    const username = req.user.username || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    // Registrar actividad de sesión en la BD de auditoría
    await pool.execute(
      `INSERT INTO club_lujan_audit.user_sessions
       (usuario_id, username, ip_address, user_agent, login_time, last_activity)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE last_activity = NOW()`,
      [userId, username, ipAddress, userAgent]
    );

    next();
  } catch (error) {
    console.error('Error al registrar sesión de usuario:', error);
    // No bloqueamos la request si falla el logging
    next();
  }
}

/**
 * Función helper para registrar eventos de auditoría personalizados
 * Puede ser llamada desde cualquier controlador o servicio
 *
 * @param {number} userId - ID del usuario que realiza la acción
 * @param {string} operation - Tipo de operación (INSERT, UPDATE, DELETE)
 * @param {string} tableName - Nombre de la tabla afectada
 * @param {number} recordId - ID del registro afectado
 * @param {object} oldValues - Valores anteriores (para UPDATE/DELETE)
 * @param {object} newValues - Valores nuevos (para INSERT/UPDATE)
 * @param {string} username - Username del usuario (opcional)
 * @param {string} userRole - Rol del usuario (opcional)
 */
export async function logAuditEvent(userId, operation, tableName, recordId, oldValues = null, newValues = null, username = null, userRole = null) {
  try {
    const changedFields = [];

    // Si es UPDATE, calcular campos cambiados
    if (operation === 'UPDATE' && oldValues && newValues) {
      for (const key in newValues) {
        if (oldValues[key] !== newValues[key]) {
          changedFields.push(key);
        }
      }
    }

    await pool.execute(
      `INSERT INTO club_lujan_audit.audit_master
       (operation_type, table_name, record_id, usuario_id, usuario_username, usuario_rol,
        old_values, new_values, changed_fields, connection_id, operation_timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6))`,
      [
        operation,
        tableName,
        recordId,
        userId,
        username,
        userRole,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        changedFields.length > 0 ? JSON.stringify(changedFields) : null,
        null // connection_id se captura automáticamente por el trigger
      ]
    );
  } catch (error) {
    console.error('Error al registrar evento de auditoría:', error);
    // No lanzamos error para no bloquear la operación principal
  }
}

/**
 * Función helper para obtener el historial de un registro específico
 *
 * @param {string} tableName - Nombre de la tabla
 * @param {number} recordId - ID del registro
 * @returns {Promise<Array>} - Array con el historial de cambios
 */
export async function getRecordHistory(tableName, recordId) {
  try {
    const [rows] = await pool.execute(
      `SELECT
        id, operation_type, usuario_username, usuario_rol,
        old_values, new_values, changed_fields, operation_timestamp
       FROM club_lujan_audit.audit_master
       WHERE table_name = ? AND record_id = ?
       ORDER BY operation_timestamp DESC`,
      [tableName, recordId]
    );

    return rows;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}

/**
 * Función helper para obtener actividad de un usuario
 *
 * @param {number} userId - ID del usuario
 * @param {number} daysBack - Días hacia atrás para buscar (default: 7)
 * @returns {Promise<Array>} - Array con la actividad del usuario
 */
export async function getUserActivity(userId, daysBack = 7) {
  try {
    const [rows] = await pool.execute(
      `SELECT
        table_name, operation_type, COUNT(*) as total_operations,
        MAX(operation_timestamp) as last_operation
       FROM club_lujan_audit.audit_master
       WHERE usuario_id = ?
         AND operation_timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY table_name, operation_type
       ORDER BY MAX(operation_timestamp) DESC`,
      [userId, daysBack]
    );

    return rows;
  } catch (error) {
    console.error('Error al obtener actividad de usuario:', error);
    return [];
  }
}

export default {
  setAuditContext,
  logUserSession,
  logAuditEvent,
  getRecordHistory,
  getUserActivity
};
