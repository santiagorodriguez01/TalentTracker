-- =========================================
-- SISTEMA DE AUDITORÍA COMPLETO - TALENTTRACKER
-- Base de datos de auditoría independiente
-- Fecha: 2025-11-11
-- =========================================

-- Crear base de datos de auditoría
CREATE DATABASE IF NOT EXISTS club_lujan_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE club_lujan_audit;

-- =========================================
-- TABLA MAESTRA DE AUDITORÍA
-- Registra TODOS los cambios en TODAS las tablas
-- =========================================
CREATE TABLE IF NOT EXISTS audit_master (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Información de la operación
  operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,

  -- Usuario que realizó la operación
  usuario_id BIGINT UNSIGNED,
  usuario_username VARCHAR(60),
  usuario_rol VARCHAR(60),

  -- Metadata de conexión
  connection_id BIGINT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Datos de auditoría
  old_values JSON,
  new_values JSON,
  changed_fields JSON,  -- Lista de campos modificados

  -- Timestamps
  operation_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices para búsquedas rápidas
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_operation_timestamp (operation_timestamp),
  INDEX idx_table_timestamp (table_name, operation_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- TABLA DE SESIONES DE USUARIO
-- Tracking de sesiones activas
-- =========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(60) NOT NULL,
  connection_id BIGINT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL,
  session_duration_minutes INT UNSIGNED,

  INDEX idx_usuario_id (usuario_id),
  INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- TABLA DE ESTADÍSTICAS DE AUDITORÍA
-- Resumen diario de operaciones
-- =========================================
CREATE TABLE IF NOT EXISTS audit_statistics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  total_operations INT UNSIGNED NOT NULL DEFAULT 0,
  unique_users INT UNSIGNED NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_stat (fecha, table_name, operation_type),
  INDEX idx_fecha (fecha),
  INDEX idx_table_name (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- TABLA DE BACKUP LOGS
-- Registro de backups realizados
-- =========================================
CREATE TABLE IF NOT EXISTS backup_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  backup_type ENUM('FULL', 'INCREMENTAL', 'DIFFERENTIAL') NOT NULL,
  backup_file VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT UNSIGNED,
  database_name VARCHAR(100) NOT NULL,

  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  duration_seconds INT UNSIGNED,

  status ENUM('INICIADO', 'COMPLETADO', 'FALLIDO') NOT NULL DEFAULT 'INICIADO',
  error_message TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_backup_type (backup_type),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- TABLA DE DATABASE LOGS
-- Logs generales de la base de datos
-- =========================================
CREATE TABLE IF NOT EXISTS database_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  log_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  log_level ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
  log_category VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  details JSON,

  INDEX idx_log_timestamp (log_timestamp),
  INDEX idx_log_level (log_level),
  INDEX idx_log_category (log_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- TABLA DE MÉTRICAS DE PERFORMANCE
-- Monitoreo de performance de la DB
-- =========================================
CREATE TABLE IF NOT EXISTS performance_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  metric_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Métricas de queries
  total_queries BIGINT UNSIGNED,
  slow_queries BIGINT UNSIGNED,
  queries_per_second DECIMAL(10,2),

  -- Métricas de conexiones
  active_connections INT UNSIGNED,
  max_connections INT UNSIGNED,

  -- Métricas de almacenamiento
  database_size_mb DECIMAL(12,2),
  table_count INT UNSIGNED,

  -- Métricas de memoria
  buffer_pool_size_mb DECIMAL(12,2),
  buffer_pool_usage_percent DECIMAL(5,2),

  -- Métricas de transacciones
  active_transactions INT UNSIGNED,
  lock_wait_time_ms BIGINT UNSIGNED,

  INDEX idx_metric_timestamp (metric_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================================
-- VISTAS DE AUDITORÍA
-- =========================================

-- Vista de actividad reciente por usuario
CREATE OR REPLACE VIEW v_audit_user_activity AS
SELECT
  usuario_id,
  usuario_username,
  usuario_rol,
  table_name,
  operation_type,
  COUNT(*) AS total_operations,
  MAX(operation_timestamp) AS last_operation,
  MIN(operation_timestamp) AS first_operation
FROM audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY usuario_id, usuario_username, usuario_rol, table_name, operation_type;

-- Vista de cambios recientes por tabla
CREATE OR REPLACE VIEW v_audit_recent_changes AS
SELECT
  table_name,
  operation_type,
  COUNT(*) AS total_changes,
  COUNT(DISTINCT usuario_id) AS unique_users,
  MAX(operation_timestamp) AS last_change,
  DATE(operation_timestamp) AS change_date
FROM audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY table_name, operation_type, DATE(operation_timestamp);

-- Vista de sesiones activas
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT
  us.id,
  us.usuario_id,
  us.username,
  us.ip_address,
  us.login_time,
  us.last_activity,
  TIMESTAMPDIFF(MINUTE, us.login_time, us.last_activity) AS session_duration_minutes,
  COUNT(DISTINCT am.table_name) AS tables_accessed,
  COUNT(am.id) AS total_operations
FROM user_sessions us
LEFT JOIN audit_master am ON am.usuario_id = us.usuario_id
  AND am.operation_timestamp >= us.login_time
  AND (us.logout_time IS NULL OR am.operation_timestamp <= us.logout_time)
WHERE us.logout_time IS NULL
GROUP BY us.id, us.usuario_id, us.username, us.ip_address, us.login_time, us.last_activity;

-- Vista de estadísticas de backups
CREATE OR REPLACE VIEW v_backup_statistics AS
SELECT
  backup_type,
  COUNT(*) AS total_backups,
  SUM(CASE WHEN status = 'COMPLETADO' THEN 1 ELSE 0 END) AS successful_backups,
  SUM(CASE WHEN status = 'FALLIDO' THEN 1 ELSE 0 END) AS failed_backups,
  AVG(duration_seconds) AS avg_duration_seconds,
  AVG(file_size_bytes / 1024 / 1024) AS avg_size_mb,
  MAX(start_time) AS last_backup_time
FROM backup_logs
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY backup_type;

-- =========================================
-- STORED PROCEDURES
-- =========================================

DELIMITER $$

-- Procedimiento para obtener historial de cambios de un registro específico
DROP PROCEDURE IF EXISTS sp_get_record_history$$
CREATE PROCEDURE sp_get_record_history(
  IN p_table_name VARCHAR(100),
  IN p_record_id BIGINT UNSIGNED
)
BEGIN
  SELECT
    id,
    operation_type,
    usuario_username,
    usuario_rol,
    old_values,
    new_values,
    changed_fields,
    operation_timestamp
  FROM audit_master
  WHERE table_name = p_table_name AND record_id = p_record_id
  ORDER BY operation_timestamp DESC;
END$$

-- Procedimiento para obtener actividad de un usuario
DROP PROCEDURE IF EXISTS sp_get_user_activity$$
CREATE PROCEDURE sp_get_user_activity(
  IN p_usuario_id BIGINT UNSIGNED,
  IN p_days_back INT
)
BEGIN
  SELECT
    table_name,
    operation_type,
    COUNT(*) AS total_operations,
    MAX(operation_timestamp) AS last_operation
  FROM audit_master
  WHERE usuario_id = p_usuario_id
    AND operation_timestamp >= DATE_SUB(NOW(), INTERVAL p_days_back DAY)
  GROUP BY table_name, operation_type
  ORDER BY MAX(operation_timestamp) DESC;
END$$

-- Procedimiento para limpiar auditorías antiguas (mantener últimos N días)
DROP PROCEDURE IF EXISTS sp_cleanup_old_audits$$
CREATE PROCEDURE sp_cleanup_old_audits(
  IN p_days_to_keep INT
)
BEGIN
  DECLARE deleted_rows BIGINT UNSIGNED;

  DELETE FROM audit_master
  WHERE operation_timestamp < DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);

  SET deleted_rows = ROW_COUNT();

  INSERT INTO database_logs (log_level, log_category, message, details)
  VALUES ('INFO', 'CLEANUP', 'Auditorías antiguas eliminadas',
          JSON_OBJECT('deleted_rows', deleted_rows, 'days_kept', p_days_to_keep));

  SELECT deleted_rows AS rows_deleted;
END$$

-- Procedimiento para generar reporte de auditoría
DROP PROCEDURE IF EXISTS sp_audit_report$$
CREATE PROCEDURE sp_audit_report(
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT
    DATE(operation_timestamp) AS fecha,
    table_name,
    operation_type,
    COUNT(*) AS total_operations,
    COUNT(DISTINCT usuario_id) AS unique_users
  FROM audit_master
  WHERE DATE(operation_timestamp) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(operation_timestamp), table_name, operation_type
  ORDER BY fecha DESC, table_name, operation_type;
END$$

DELIMITER ;

-- =========================================
-- INSERTS INICIALES
-- =========================================

-- Log inicial del sistema
INSERT INTO database_logs (log_level, log_category, message, details)
VALUES ('INFO', 'SYSTEM', 'Sistema de auditoría inicializado',
        JSON_OBJECT('version', '1.0', 'created_at', NOW()));

-- =========================================
-- PERMISOS
-- =========================================

-- Otorgar permisos al usuario de la aplicación
GRANT SELECT, INSERT ON club_lujan_audit.* TO 'club'@'%';
FLUSH PRIVILEGES;

-- =========================================
-- FIN DEL SCRIPT
-- =========================================

SELECT 'Sistema de auditoría creado exitosamente' AS status;
