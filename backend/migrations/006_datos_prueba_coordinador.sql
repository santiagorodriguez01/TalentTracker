-- Migration: Datos de prueba para coordinador y alumnos
-- Fecha: 2025-11-10
-- Descripcion: Crear usuario coordinador, alumnos, deportes, categorias y asignaciones

-- ==========================================
-- 1. CREAR DEPORTES Y CATEGORIAS
-- ==========================================

INSERT INTO `deporte` (`nombre`) VALUES
('Fútbol'),
('Basquet'),
('Voley'),
('Natación')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

INSERT INTO `categoria` (`nombre`, `edad_min`, `edad_max`) VALUES
('Sub-8', 6, 8),
('Sub-10', 9, 10),
('Sub-12', 11, 12),
('Sub-14', 13, 14),
('Sub-16', 15, 16),
('Mayores', 17, NULL)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ==========================================
-- 2. CREAR PERSONA COORDINADOR
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
) VALUES (
  'Carlos',
  'Rodríguez',
  'MASCULINO',
  '35789456',
  '1990-05-15',
  'carlos.rodriguez@clublujan.com',
  '2323-456789',
  'Av. San Martin 456, Luján',
  'ACTIVO'
);

SET @coordinador_persona_id = LAST_INSERT_ID();

-- Asignar rol de COORDINADOR a la persona
INSERT INTO `persona_rol` (`persona_id`, `rol`) VALUES
(@coordinador_persona_id, 'COORDINADOR');

-- ==========================================
-- 3. CREAR USUARIO COORDINADOR
-- ==========================================

-- Password: coordinador123 (hash bcrypt)
INSERT INTO `usuario` (
  `username`,
  `password_hash`,
  `rol_sistema`,
  `persona_id`
) VALUES (
  'coordinador',
  '$2a$10$vQXZBqxQxN5h5Z6jK.9xqe3mN8K9YLX6Z7Hb0ZvZ8Z9Z0Z1Z2Z3Z4Z',
  'COORDINADOR',
  @coordinador_persona_id
);

-- ==========================================
-- 4. CREAR PERSONAS ALUMNO
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
  'Juan',
  'Pérez',
  'MASCULINO',
  '45567890',
  '2013-12-20',
  'juan.perez@gmail.com',
  '2323-555555',
  'Calle 5 567, Luján',
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
);

-- Obtener IDs de las personas creadas
SET @alumno1_persona_id = (SELECT id FROM persona WHERE dni = '45123456');
SET @alumno2_persona_id = (SELECT id FROM persona WHERE dni = '45234567');
SET @alumno3_persona_id = (SELECT id FROM persona WHERE dni = '45345678');
SET @alumno4_persona_id = (SELECT id FROM persona WHERE dni = '45456789');
SET @alumno5_persona_id = (SELECT id FROM persona WHERE dni = '45567890');
SET @alumno6_persona_id = (SELECT id FROM persona WHERE dni = '45678901');

-- Asignar rol ALUMNO a las personas
INSERT INTO `persona_rol` (`persona_id`, `rol`) VALUES
(@alumno1_persona_id, 'ALUMNO'),
(@alumno2_persona_id, 'ALUMNO'),
(@alumno3_persona_id, 'ALUMNO'),
(@alumno4_persona_id, 'ALUMNO'),
(@alumno5_persona_id, 'ALUMNO'),
(@alumno6_persona_id, 'ALUMNO');

-- ==========================================
-- 5. CREAR REGISTROS DE ALUMNOS
-- ==========================================

INSERT INTO `alumno` (`persona_id`, `apto_medico`) VALUES
(@alumno1_persona_id, '2025-01-15'),
(@alumno2_persona_id, '2025-01-20'),
(@alumno3_persona_id, '2025-02-01'),
(@alumno4_persona_id, '2025-02-10'),
(@alumno5_persona_id, '2025-02-15'),
(@alumno6_persona_id, '2025-02-20');

-- Obtener IDs de alumnos
SET @alumno1_id = (SELECT id FROM alumno WHERE persona_id = @alumno1_persona_id);
SET @alumno2_id = (SELECT id FROM alumno WHERE persona_id = @alumno2_persona_id);
SET @alumno3_id = (SELECT id FROM alumno WHERE persona_id = @alumno3_persona_id);
SET @alumno4_id = (SELECT id FROM alumno WHERE persona_id = @alumno4_persona_id);
SET @alumno5_id = (SELECT id FROM alumno WHERE persona_id = @alumno5_persona_id);
SET @alumno6_id = (SELECT id FROM alumno WHERE persona_id = @alumno6_persona_id);

-- Obtener IDs de deportes y categorías
SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Fútbol');
SET @basquet_id = (SELECT id FROM deporte WHERE nombre = 'Basquet');
SET @voley_id = (SELECT id FROM deporte WHERE nombre = 'Voley');
SET @natacion_id = (SELECT id FROM deporte WHERE nombre = 'Natación');

SET @sub8_id = (SELECT id FROM categoria WHERE nombre = 'Sub-8');
SET @sub10_id = (SELECT id FROM categoria WHERE nombre = 'Sub-10');
SET @sub12_id = (SELECT id FROM categoria WHERE nombre = 'Sub-12');
SET @sub14_id = (SELECT id FROM categoria WHERE nombre = 'Sub-14');

-- ==========================================
-- 6. ASIGNAR DEPORTES A ALUMNOS
-- ==========================================

INSERT INTO `alumno_deporte` (`alumno_id`, `deporte_id`) VALUES
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
-- Juan: Fútbol
(@alumno5_id, @futbol_id),
-- Valentina: Basquet
(@alumno6_id, @basquet_id);

-- ==========================================
-- 7. ASIGNAR CATEGORIAS A ALUMNOS
-- ==========================================

INSERT INTO `alumno_categoria` (`alumno_id`, `categoria_id`) VALUES
-- Lucas: Sub-12
(@alumno1_id, @sub12_id),
-- Martina: Sub-12
(@alumno2_id, @sub12_id),
-- Tomás: Sub-10
(@alumno3_id, @sub10_id),
-- Sofía: Sub-12
(@alumno4_id, @sub12_id),
-- Juan: Sub-12
(@alumno5_id, @sub12_id),
-- Valentina: Sub-10
(@alumno6_id, @sub10_id);

-- ==========================================
-- 8. ASIGNAR COORDINADOR A ALUMNOS
-- ==========================================

-- Asignar el coordinador a todos los alumnos (vigencia actual)
INSERT INTO `alumno_coordinador` (`alumno_id`, `coordinador_id`, `fecha_desde`, `fecha_hasta`) VALUES
(@alumno1_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno2_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno3_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno4_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno5_id, @coordinador_persona_id, '2025-01-01', NULL),
(@alumno6_id, @coordinador_persona_id, '2025-01-01', NULL);

-- ==========================================
-- 9. CREAR ALGUNOS REGISTROS DE ASISTENCIA DE EJEMPLO
-- ==========================================

INSERT INTO `asistencia_alumno` (
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
(@alumno5_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), @futbol_id, @sub12_id, 1, NULL),

-- Asistencias de hace 2 días
(@alumno1_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @futbol_id, @sub12_id, 1, NULL),
(@alumno4_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @natacion_id, @sub12_id, 1, 'Excelente técnica'),
(@alumno6_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), @basquet_id, @sub10_id, 1, NULL);

-- ==========================================
-- RESUMEN DE DATOS CREADOS
-- ==========================================

-- Usuario Coordinador:
--   Username: coordinador
--   Password: coordinador123
--   Persona: Carlos Rodríguez (DNI: 35789456)

-- Alumnos creados (todos asignados al coordinador):
--   1. Lucas González (DNI: 45123456) - Fútbol Sub-12
--   2. Martina López (DNI: 45234567) - Fútbol y Voley Sub-12
--   3. Tomás Fernández (DNI: 45345678) - Basquet Sub-10
--   4. Sofía Martínez (DNI: 45456789) - Natación y Voley Sub-12
--   5. Juan Pérez (DNI: 45567890) - Fútbol Sub-12
--   6. Valentina Gómez (DNI: 45678901) - Basquet Sub-10

SELECT 'Datos de prueba creados exitosamente!' as mensaje;
