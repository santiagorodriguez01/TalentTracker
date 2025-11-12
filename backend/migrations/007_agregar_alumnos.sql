-- Migration: Agregar más alumnos de prueba
-- Fecha: 2025-11-10
-- Descripcion: Crear 5 alumnos adicionales y asignarlos al coordinador

-- ==========================================
-- 1. CREAR PERSONAS ALUMNO (sin duplicados)
-- ==========================================

INSERT INTO `persona` (
  `nombre`,
  `apellido`,
  `genero`,
  `dni`,
  `fecha_nac`,
  `email`,
  `telefono`,
  `domicilio`,
  `estado`
) VALUES
(
  'Lucas',
  'González',
  'MASCULINO',
  '45123456',
  '2014-03-10',
  'lucas.gonzalez@gmail.com',
  '2323-111111',
  'Calle 1 123, Luján',
  'ACTIVO'
),
(
  'Martina',
  'López',
  'FEMENINO',
  '45234567',
  '2013-07-22',
  'martina.lopez@gmail.com',
  '2323-222222',
  'Calle 2 234, Luján',
  'ACTIVO'
),
(
  'Tomás',
  'Fernández',
  'MASCULINO',
  '45345678',
  '2015-01-15',
  'tomas.fernandez@gmail.com',
  '2323-333333',
  'Calle 3 345, Luján',
  'ACTIVO'
),
(
  'Sofía',
  'Martínez',
  'FEMENINO',
  '45456789',
  '2014-09-05',
  'sofia.martinez@gmail.com',
  '2323-444444',
  'Calle 4 456, Luján',
  'ACTIVO'
),
(
  'Valentina',
  'Gómez',
  'FEMENINO',
  '45678901',
  '2015-04-18',
  'valentina.gomez@gmail.com',
  '2323-666666',
  'Calle 6 678, Luján',
  'ACTIVO'
)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

-- Obtener IDs de las personas creadas
SET @alumno1_persona_id = (SELECT id FROM persona WHERE dni = '45123456');
SET @alumno2_persona_id = (SELECT id FROM persona WHERE dni = '45234567');
SET @alumno3_persona_id = (SELECT id FROM persona WHERE dni = '45345678');
SET @alumno4_persona_id = (SELECT id FROM persona WHERE dni = '45456789');
SET @alumno5_persona_id = (SELECT id FROM persona WHERE dni = '45678901');

-- Asignar rol ALUMNO a las personas (ignorar duplicados)
INSERT IGNORE INTO `persona_rol` (`persona_id`, `rol`) VALUES
(@alumno1_persona_id, 'ALUMNO'),
(@alumno2_persona_id, 'ALUMNO'),
(@alumno3_persona_id, 'ALUMNO'),
(@alumno4_persona_id, 'ALUMNO'),
(@alumno5_persona_id, 'ALUMNO');

-- ==========================================
-- 2. CREAR REGISTROS DE ALUMNOS
-- ==========================================

INSERT IGNORE INTO `alumno` (`persona_id`, `apto_medico`) VALUES
(@alumno1_persona_id, '2025-01-15'),
(@alumno2_persona_id, '2025-01-20'),
(@alumno3_persona_id, '2025-02-01'),
(@alumno4_persona_id, '2025-02-10'),
(@alumno5_persona_id, '2025-02-20');

-- Obtener IDs de alumnos
SET @alumno1_id = (SELECT id FROM alumno WHERE persona_id = @alumno1_persona_id);
SET @alumno2_id = (SELECT id FROM alumno WHERE persona_id = @alumno2_persona_id);
SET @alumno3_id = (SELECT id FROM alumno WHERE persona_id = @alumno3_persona_id);
SET @alumno4_id = (SELECT id FROM alumno WHERE persona_id = @alumno4_persona_id);
SET @alumno5_id = (SELECT id FROM alumno WHERE persona_id = @alumno5_persona_id);

-- Obtener IDs de deportes y categorías
SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Fútbol');
SET @basquet_id = (SELECT id FROM deporte WHERE nombre = 'Basquet');
SET @voley_id = (SELECT id FROM deporte WHERE nombre = 'Voley');
SET @natacion_id = (SELECT id FROM deporte WHERE nombre = 'Natación');

SET @sub10_id = (SELECT id FROM categoria WHERE nombre = 'Sub-10');
SET @sub12_id = (SELECT id FROM categoria WHERE nombre = 'Sub-12');

-- ==========================================
-- 3. ASIGNAR DEPORTES A ALUMNOS
-- ==========================================

INSERT IGNORE INTO `alumno_deporte` (`alumno_id`, `deporte_id`) VALUES
-- Lucas: Fútbol
(@alumno1_id, @futbol_id),
-- Martina: Fútbol y Voley
(@alumno2_id, @futbol_id),
(@alumno2_id, @voley_id),
-- Tomás: Basquet
(@alumno3_id, @basquet_id),
-- Sofía: Natación y Voley
(@alumno4_id, @natacion_id),
(@alumno4_id, @voley_id),
-- Valentina: Basquet
(@alumno5_id, @basquet_id);

-- ==========================================
-- 4. ASIGNAR CATEGORIAS A ALUMNOS
-- ==========================================

INSERT IGNORE INTO `alumno_categoria` (`alumno_id`, `categoria_id`) VALUES
-- Lucas: Sub-12
(@alumno1_id, @sub12_id),
-- Martina: Sub-12
(@alumno2_id, @sub12_id),
-- Tomás: Sub-10
(@alumno3_id, @sub10_id),
-- Sofía: Sub-12
(@alumno4_id, @sub12_id),
-- Valentina: Sub-10
(@alumno5_id, @sub10_id);

-- ==========================================
-- 5. ASIGNAR COORDINADOR A ALUMNOS
-- ==========================================

-- Obtener el ID del coordinador
SET @coordinador_persona_id = (SELECT persona_id FROM usuario WHERE username = 'coordinador');

-- Asignar el coordinador a todos los alumnos (vigencia actual)
INSERT IGNORE INTO `alumno_coordinador` (`alumno_id`, `coordinador_id`, `fecha_desde`, `fecha_hasta`) VALUES
(@alumno1_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno2_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno3_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno4_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno5_id, @coordinador_persona_id, '2025-01-01', NULL);

-- Asignar también el alumno existente al coordinador
SET @alumno_existente_id = (SELECT id FROM alumno WHERE persona_id = (SELECT id FROM persona WHERE dni = '40000001'));
INSERT IGNORE INTO `alumno_coordinador` (`alumno_id`, `coordinador_id`, `fecha_desde`, `fecha_hasta`) VALUES
(@alumno_existente_id, @coordinador_persona_id, '2025-01-01', NULL);

-- ==========================================
-- 6. CREAR ALGUNOS REGISTROS DE ASISTENCIA DE EJEMPLO
-- ==========================================

INSERT IGNORE INTO `asistencia_alumno` (
  `alumno_id`,
  `fecha`,
  `deporte_id`,
  `categoria_id`,
  `presente`,
  `observacion`
) VALUES
-- Asistencias de ayer
(@alumno1_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), @futbol_id, @sub12_id, 1, 'Buen desempeño'),
(@alumno2_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), @futbol_id, @sub12_id, 1, NULL),
(@alumno3_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), @basquet_id, @sub10_id, 0, 'Faltó por enfermedad'),

-- Asistencias de hace 2 días
(@alumno1_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @futbol_id, @sub12_id, 1, NULL),
(@alumno4_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @natacion_id, @sub12_id, 1, 'Excelente técnica'),
(@alumno5_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @basquet_id, @sub10_id, 1, NULL);

-- ==========================================
-- VERIFICAR RESULTADOS
-- ==========================================

SELECT 'Alumnos adicionales creados y asignados al coordinador!' as mensaje;

SELECT COUNT(*) as total_alumnos FROM alumno;
SELECT COUNT(*) as alumnos_del_coordinador
FROM alumno_coordinador
WHERE coordinador_id = @coordinador_persona_id AND fecha_hasta IS NULL;
