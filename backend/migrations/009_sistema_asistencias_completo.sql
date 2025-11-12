-- Migration: Sistema completo de asistencias con turnos
-- Fecha: 2025-11-10
-- Descripcion: Actualizar deportes, crear turnos, modificar asistencias

-- ==========================================
-- 1. ACTUALIZAR DEPORTES DEL CLUB
-- ==========================================

-- Eliminar deportes antiguos que no se usan
DELETE FROM deporte WHERE nombre NOT IN ('Fútbol', 'Basquet', 'Voley', 'Natación');

-- Actualizar/Insertar deportes correctos
INSERT INTO deporte (nombre) VALUES
('Futbol'),
('Boxeo'),
('Futbol Femenino'),
('Voley'),
('Handball')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ==========================================
-- 2. CREAR TABLA DE TURNOS
-- ==========================================

CREATE TABLE IF NOT EXISTS `turno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_turno_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar turnos comunes
INSERT INTO turno (nombre, hora_inicio, hora_fin) VALUES
('Mañana', '08:00:00', '12:00:00'),
('Tarde', '14:00:00', '18:00:00'),
('Noche', '18:00:00', '22:00:00')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ==========================================
-- 3. MODIFICAR TABLA ASISTENCIA PARA INCLUIR TURNO
-- ==========================================

-- Agregar columna turno_id si no existe
SET @dbname = DATABASE();
SET @tablename = 'asistencia_alumno';
SET @columnname = 'turno_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' bigint unsigned DEFAULT NULL AFTER categoria_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar foreign key si no existe
SET @fk_exists = (SELECT COUNT(*)
                  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                  WHERE CONSTRAINT_NAME = 'fk_asist_turno'
                  AND TABLE_NAME = 'asistencia_alumno'
                  AND TABLE_SCHEMA = DATABASE());

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE asistencia_alumno ADD CONSTRAINT fk_asist_turno FOREIGN KEY (turno_id) REFERENCES turno(id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice para turno (solo si no existe)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE table_schema = DATABASE()
                     AND table_name = 'asistencia_alumno'
                     AND index_name = 'idx_turno');
SET @sql_index = IF(@index_exists = 0,
                    'CREATE INDEX idx_turno ON asistencia_alumno(turno_id)',
                    'SELECT 1');
PREPARE stmt2 FROM @sql_index;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Modificar unique key para incluir turno
SET @uk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                  WHERE table_schema = DATABASE()
                  AND table_name = 'asistencia_alumno'
                  AND index_name = 'uk_asistencia');
SET @sql_drop = IF(@uk_exists > 0,
                   'ALTER TABLE asistencia_alumno DROP INDEX uk_asistencia',
                   'SELECT 1');
PREPARE stmt3 FROM @sql_drop;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

ALTER TABLE asistencia_alumno ADD UNIQUE KEY `uk_asistencia_completa` (`alumno_id`, `fecha`, `deporte_id`, `categoria_id`, `turno_id`);

-- ==========================================
-- 4. ACTUALIZAR DATOS DE PRUEBA CON TURNOS
-- ==========================================

-- Obtener IDs de turnos
SET @turno_manana = (SELECT id FROM turno WHERE nombre = 'Mañana');
SET @turno_tarde = (SELECT id FROM turno WHERE nombre = 'Tarde');
SET @turno_noche = (SELECT id FROM turno WHERE nombre = 'Noche');

-- Actualizar asistencias existentes con turnos (si existen)
UPDATE asistencia_alumno SET turno_id = @turno_tarde WHERE turno_id IS NULL;

-- ==========================================
-- 5. ACTUALIZAR ASIGNACIONES DE DEPORTES
-- ==========================================

-- Obtener IDs de deportes nuevos
SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');
SET @boxeo_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');
SET @futbol_fem_id = (SELECT id FROM deporte WHERE nombre = 'Futbol Femenino');
SET @voley_id = (SELECT id FROM deporte WHERE nombre = 'Voley');
SET @handball_id = (SELECT id FROM deporte WHERE nombre = 'Handball');

-- Limpiar asignaciones antiguas
DELETE FROM alumno_deporte;

-- Reasignar alumnos a deportes nuevos (distribución ejemplo)
-- Alumno 1 (Juan Pérez) - Futbol
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (1, @futbol_id);

-- Alumno 2 (Cristian Benetti) - Boxeo
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (2, @boxeo_id);

-- Alumno 3 (Martina López) - Futbol Femenino
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (3, @futbol_fem_id);

-- Alumno 4 (Tomás Fernández) - Handball
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (4, @handball_id);

-- Alumno 5 (Sofía Martínez) - Voley
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (5, @voley_id);

-- Alumno 6 (Valentina Gómez) - Futbol Femenino
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (6, @futbol_fem_id);

-- ==========================================
-- RESUMEN
-- ==========================================

SELECT 'Sistema de asistencias actualizado!' as mensaje;
SELECT COUNT(*) as total_deportes FROM deporte;
SELECT COUNT(*) as total_turnos FROM turno;
SELECT COUNT(*) as total_alumnos FROM alumno;
SELECT COUNT(*) as alumnos_con_deporte FROM alumno_deporte;
