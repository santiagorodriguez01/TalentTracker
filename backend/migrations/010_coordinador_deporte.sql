-- Migration: Coordinadores por deporte específico
-- Fecha: 2025-01-XX
-- Descripcion: Crear tabla para relacionar coordinadores con deportes específicos

-- ==========================================
-- 1. CREAR TABLA coordinador_deporte
-- ==========================================

CREATE TABLE IF NOT EXISTS `coordinador_deporte` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coordinador_id` bigint unsigned NOT NULL COMMENT 'ID de la persona que es coordinador',
  `deporte_id` bigint unsigned NOT NULL COMMENT 'ID del deporte asignado',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coord_deporte` (`coordinador_id`, `deporte_id`),
  KEY `fk_cd_coord` (`coordinador_id`),
  KEY `fk_cd_deporte` (`deporte_id`),
  CONSTRAINT `fk_cd_coord` FOREIGN KEY (`coordinador_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cd_deporte` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. AGREGAR HOCKEY SI NO EXISTE
-- ==========================================

INSERT INTO deporte (nombre) VALUES
('Hockey')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ==========================================
-- 3. CREAR COORDINADORES DE PRUEBA POR DEPORTE
-- ==========================================

-- Obtener IDs de deportes
SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');
SET @boxeo_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');
SET @futbol_fem_id = (SELECT id FROM deporte WHERE nombre = 'Futbol Femenino');
SET @handball_id = (SELECT id FROM deporte WHERE nombre = 'Handball');
SET @hockey_id = (SELECT id FROM deporte WHERE nombre = 'Hockey');

-- Obtener coordinador existente (el coordinador actual)
SET @coord_persona_id = (SELECT persona_id FROM usuario WHERE username = 'coordinador' LIMIT 1);

-- Asignar coordinador actual a Fútbol por defecto (si existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
SELECT @coord_persona_id, @futbol_id, 1
WHERE @coord_persona_id IS NOT NULL;

-- Crear coordinadores de ejemplo para cada deporte (opcional, para pruebas)
-- Estos se pueden crear manualmente después si se necesitan

-- NOTA: Para crear coordinadores específicos por deporte, usar el siguiente patrón:
/*
-- Ejemplo: Coordinador de Boxeo
INSERT INTO persona (nombre, apellido, dni, rol, estado) 
VALUES ('Roberto', 'Boxeador', '50000001', 'COORDINADOR', 'ACTIVO');
SET @coord_boxeo_id = LAST_INSERT_ID();
INSERT INTO persona_rol (persona_id, rol) VALUES (@coord_boxeo_id, 'COORDINADOR');
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
VALUES ('coord_boxeo', '$2b$10$...', 'COORDINADOR', @coord_boxeo_id);
INSERT INTO coordinador_deporte (coordinador_id, deporte_id) VALUES (@coord_boxeo_id, @boxeo_id);
*/

-- ==========================================
-- 4. COMENTARIOS Y NOTAS
-- ==========================================

-- NOTA: Para crear coordinadores específicos por deporte:
-- 1. Crear una persona con rol COORDINADOR
-- 2. Crear un usuario asociado a esa persona
-- 3. Insertar en coordinador_deporte la relación persona-deporte
--
-- Ejemplo:
-- INSERT INTO persona (nombre, apellido, dni, rol, estado) 
-- VALUES ('Juan', 'Coordinador Boxeo', '50000001', 'COORDINADOR', 'ACTIVO');
-- SET @nuevo_coord_id = LAST_INSERT_ID();
-- INSERT INTO persona_rol (persona_id, rol) VALUES (@nuevo_coord_id, 'COORDINADOR');
-- INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
-- VALUES ('coord_boxeo', '$2b$10$...', 'COORDINADOR', @nuevo_coord_id);
-- INSERT INTO coordinador_deporte (coordinador_id, deporte_id) VALUES (@nuevo_coord_id, @boxeo_id);

SELECT 'Tabla coordinador_deporte creada exitosamente!' as mensaje;
SELECT COUNT(*) as total_coordinadores_deporte FROM coordinador_deporte;

