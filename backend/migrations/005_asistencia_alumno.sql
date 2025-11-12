-- Migration: Crear tabla asistencia_alumno
-- Fecha: 2025-11-10
-- Descripcion: Tabla para registro de asistencias de alumnos por deporte y categoria

-- Crear tabla asistencia_alumno
CREATE TABLE IF NOT EXISTS `asistencia_alumno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `alumno_id` bigint unsigned NOT NULL,
  `fecha` date NOT NULL,
  `deporte_id` bigint unsigned NOT NULL,
  `categoria_id` bigint unsigned NOT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT 1,
  `observacion` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_asistencia` (`alumno_id`, `fecha`, `deporte_id`, `categoria_id`),
  KEY `idx_alumno` (`alumno_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_deporte` (`deporte_id`),
  KEY `idx_categoria` (`categoria_id`),
  CONSTRAINT `fk_asist_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asist_deporte` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_asist_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indices para mejorar consultas de reportes
CREATE INDEX idx_fecha_deporte ON asistencia_alumno(fecha, deporte_id);
CREATE INDEX idx_fecha_categoria ON asistencia_alumno(fecha, categoria_id);
CREATE INDEX idx_presente ON asistencia_alumno(presente);
