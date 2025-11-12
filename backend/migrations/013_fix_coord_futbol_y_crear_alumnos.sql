-- Migration: Corregir coord_futbol y crear alumnos de prueba por deporte
-- Fecha: 2025-01-XX
-- Descripcion: Verificar/corregir coord_futbol y crear alumnos asignados a cada coordinador

-- ==========================================
-- 1. VERIFICAR Y CORREGIR COORD_FUTBOL
-- ==========================================

-- Obtener persona del coordinador existente (DNI 35789456)
SET @coord_futbol_persona_id = (SELECT id FROM persona WHERE dni = '35789456' LIMIT 1);

-- Crear usuario coord_futbol si no existe
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_futbol', '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C', 'COORDINADOR', @coord_futbol_persona_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'coord_futbol');

-- Actualizar password de coord_futbol (por si acaso)
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_futbol';

-- Obtener persona_id del usuario coord_futbol (por si se creó ahora)
SET @coord_futbol_persona_id = COALESCE(@coord_futbol_persona_id, (SELECT persona_id FROM usuario WHERE username = 'coord_futbol' LIMIT 1));

-- Asignar deporte Fútbol
SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_futbol_persona_id, @futbol_id, 1);

-- ==========================================
-- 2. OBTENER IDs DE DEPORTES Y COORDINADORES
-- ==========================================

SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');
SET @boxeo_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');
SET @futbol_fem_id = (SELECT id FROM deporte WHERE nombre = 'Futbol Femenino');
SET @handball_id = (SELECT id FROM deporte WHERE nombre = 'Handball');
SET @hockey_id = (SELECT id FROM deporte WHERE nombre = 'Hockey');

SET @coord_futbol_id = (SELECT persona_id FROM usuario WHERE username = 'coord_futbol' LIMIT 1);
SET @coord_boxeo_id = (SELECT persona_id FROM usuario WHERE username = 'coord_boxeo' LIMIT 1);
SET @coord_futbolfem_id = (SELECT persona_id FROM usuario WHERE username = 'coord_futbolfem' LIMIT 1);
SET @coord_handball_id = (SELECT persona_id FROM usuario WHERE username = 'coord_handball' LIMIT 1);
SET @coord_hockey_id = (SELECT persona_id FROM usuario WHERE username = 'coord_hockey' LIMIT 1);

-- Obtener IDs de categorías
SET @sub8_id = (SELECT id FROM categoria WHERE nombre = 'Sub-8' LIMIT 1);
SET @sub10_id = (SELECT id FROM categoria WHERE nombre = 'Sub-10' LIMIT 1);
SET @sub12_id = (SELECT id FROM categoria WHERE nombre = 'Sub-12' LIMIT 1);
SET @sub14_id = (SELECT id FROM categoria WHERE nombre = 'Sub-14' LIMIT 1);

-- Si no existen categorías, crear algunas básicas
INSERT INTO categoria (nombre, edad_min, edad_max) VALUES
('Sub-8', 6, 8),
('Sub-10', 9, 10),
('Sub-12', 11, 12),
('Sub-14', 13, 14),
('Sub-16', 15, 16),
('Mayores', 17, NULL)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

SET @sub8_id = (SELECT id FROM categoria WHERE nombre = 'Sub-8' LIMIT 1);
SET @sub10_id = (SELECT id FROM categoria WHERE nombre = 'Sub-10' LIMIT 1);
SET @sub12_id = (SELECT id FROM categoria WHERE nombre = 'Sub-12' LIMIT 1);
SET @sub14_id = (SELECT id FROM categoria WHERE nombre = 'Sub-14' LIMIT 1);

-- ==========================================
-- 3. CREAR ALUMNOS DE FÚTBOL
-- ==========================================

-- Alumno 1: Fútbol
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Lucas', 'García', 'MASCULINO', '51000001', '2012-05-10', 'lucas.garcia@email.com', '2323-1001', 'Calle 1, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '51000001');

SET @alumno_futbol1_id = (SELECT id FROM persona WHERE dni = '51000001' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_futbol1_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_futbol1_id, 'ALUMNO');
SET @alumno_futbol1_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_futbol1_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_futbol1_alumno_id, @futbol_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_futbol1_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_futbol1_alumno_id, @coord_futbol_id, CURDATE());

-- Alumno 2: Fútbol
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Mateo', 'Rodríguez', 'MASCULINO', '51000002', '2011-08-15', 'mateo.rodriguez@email.com', '2323-1002', 'Calle 2, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '51000002');

SET @alumno_futbol2_id = (SELECT id FROM persona WHERE dni = '51000002' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_futbol2_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_futbol2_id, 'ALUMNO');
SET @alumno_futbol2_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_futbol2_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_futbol2_alumno_id, @futbol_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_futbol2_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_futbol2_alumno_id, @coord_futbol_id, CURDATE());

-- Alumno 3: Fútbol
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Santiago', 'López', 'MASCULINO', '51000003', '2010-03-20', 'santiago.lopez@email.com', '2323-1003', 'Calle 3, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '51000003');

SET @alumno_futbol3_id = (SELECT id FROM persona WHERE dni = '51000003' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_futbol3_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_futbol3_id, 'ALUMNO');
SET @alumno_futbol3_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_futbol3_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_futbol3_alumno_id, @futbol_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_futbol3_alumno_id, @sub14_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_futbol3_alumno_id, @coord_futbol_id, CURDATE());

-- ==========================================
-- 4. CREAR ALUMNOS DE BOXEO
-- ==========================================

-- Alumno 1: Boxeo
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Diego', 'Martínez', 'MASCULINO', '52000001', '2013-07-12', 'diego.martinez@email.com', '2323-2001', 'Calle 4, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '52000001');

SET @alumno_boxeo1_id = (SELECT id FROM persona WHERE dni = '52000001' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_boxeo1_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_boxeo1_id, 'ALUMNO');
SET @alumno_boxeo1_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_boxeo1_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_boxeo1_alumno_id, @boxeo_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_boxeo1_alumno_id, @sub10_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_boxeo1_alumno_id, @coord_boxeo_id, CURDATE());

-- Alumno 2: Boxeo
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Nicolás', 'Fernández', 'MASCULINO', '52000002', '2012-11-25', 'nicolas.fernandez@email.com', '2323-2002', 'Calle 5, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '52000002');

SET @alumno_boxeo2_id = (SELECT id FROM persona WHERE dni = '52000002' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_boxeo2_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_boxeo2_id, 'ALUMNO');
SET @alumno_boxeo2_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_boxeo2_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_boxeo2_alumno_id, @boxeo_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_boxeo2_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_boxeo2_alumno_id, @coord_boxeo_id, CURDATE());

-- ==========================================
-- 5. CREAR ALUMNOS DE FÚTBOL FEMENINO
-- ==========================================

-- Alumno 1: Fútbol Femenino
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Valentina', 'González', 'FEMENINO', '53000001', '2011-04-18', 'valentina.gonzalez@email.com', '2323-3001', 'Calle 6, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '53000001');

SET @alumno_futbolfem1_id = (SELECT id FROM persona WHERE dni = '53000001' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_futbolfem1_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_futbolfem1_id, 'ALUMNO');
SET @alumno_futbolfem1_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_futbolfem1_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_futbolfem1_alumno_id, @futbol_fem_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_futbolfem1_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_futbolfem1_alumno_id, @coord_futbolfem_id, CURDATE());

-- Alumno 2: Fútbol Femenino
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Sofía', 'Pérez', 'FEMENINO', '53000002', '2010-09-30', 'sofia.perez@email.com', '2323-3002', 'Calle 7, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '53000002');

SET @alumno_futbolfem2_id = (SELECT id FROM persona WHERE dni = '53000002' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_futbolfem2_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_futbolfem2_id, 'ALUMNO');
SET @alumno_futbolfem2_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_futbolfem2_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_futbolfem2_alumno_id, @futbol_fem_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_futbolfem2_alumno_id, @sub14_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_futbolfem2_alumno_id, @coord_futbolfem_id, CURDATE());

-- ==========================================
-- 6. CREAR ALUMNOS DE HANDBALL
-- ==========================================

-- Alumno 1: Handball
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Tomás', 'Sánchez', 'MASCULINO', '54000001', '2012-06-22', 'tomas.sanchez@email.com', '2323-4001', 'Calle 8, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '54000001');

SET @alumno_handball1_id = (SELECT id FROM persona WHERE dni = '54000001' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_handball1_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_handball1_id, 'ALUMNO');
SET @alumno_handball1_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_handball1_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_handball1_alumno_id, @handball_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_handball1_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_handball1_alumno_id, @coord_handball_id, CURDATE());

-- Alumno 2: Handball
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Benjamín', 'Torres', 'MASCULINO', '54000002', '2011-12-05', 'benjamin.torres@email.com', '2323-4002', 'Calle 9, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '54000002');

SET @alumno_handball2_id = (SELECT id FROM persona WHERE dni = '54000002' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_handball2_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_handball2_id, 'ALUMNO');
SET @alumno_handball2_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_handball2_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_handball2_alumno_id, @handball_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_handball2_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_handball2_alumno_id, @coord_handball_id, CURDATE());

-- ==========================================
-- 7. CREAR ALUMNOS DE HOCKEY
-- ==========================================

-- Alumno 1: Hockey
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Martina', 'Díaz', 'FEMENINO', '55000001', '2011-02-14', 'martina.diaz@email.com', '2323-5001', 'Calle 10, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '55000001');

SET @alumno_hockey1_id = (SELECT id FROM persona WHERE dni = '55000001' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_hockey1_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_hockey1_id, 'ALUMNO');
SET @alumno_hockey1_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_hockey1_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_hockey1_alumno_id, @hockey_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_hockey1_alumno_id, @sub12_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_hockey1_alumno_id, @coord_hockey_id, CURDATE());

-- Alumno 2: Hockey
INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Emma', 'Ramírez', 'FEMENINO', '55000002', '2010-10-08', 'emma.ramirez@email.com', '2323-5002', 'Calle 11, Luján', 'ALUMNO', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '55000002');

SET @alumno_hockey2_id = (SELECT id FROM persona WHERE dni = '55000002' LIMIT 1);
INSERT IGNORE INTO alumno (persona_id, apto_medico) VALUES (@alumno_hockey2_id, '2025-12-31');
INSERT IGNORE INTO persona_rol (persona_id, rol) VALUES (@alumno_hockey2_id, 'ALUMNO');
SET @alumno_hockey2_alumno_id = (SELECT id FROM alumno WHERE persona_id = @alumno_hockey2_id LIMIT 1);
INSERT IGNORE INTO alumno_deporte (alumno_id, deporte_id) VALUES (@alumno_hockey2_alumno_id, @hockey_id);
INSERT IGNORE INTO alumno_categoria (alumno_id, categoria_id) VALUES (@alumno_hockey2_alumno_id, @sub14_id);
INSERT IGNORE INTO alumno_coordinador (alumno_id, coordinador_id, fecha_desde) VALUES (@alumno_hockey2_alumno_id, @coord_hockey_id, CURDATE());

-- ==========================================
-- 8. VERIFICACIÓN
-- ==========================================

SELECT 'Alumnos creados exitosamente!' as mensaje;

-- Verificar alumnos por coordinador
SELECT 
  p.nombre,
  p.apellido,
  d.nombre AS deporte,
  c.nombre AS categoria,
  coord.username AS coordinador
FROM alumno a
JOIN persona p ON p.id = a.persona_id
JOIN alumno_deporte ad ON ad.alumno_id = a.id
JOIN deporte d ON d.id = ad.deporte_id
LEFT JOIN alumno_categoria ac ON ac.alumno_id = a.id
LEFT JOIN categoria c ON c.id = ac.categoria_id
JOIN alumno_coordinador alc ON alc.alumno_id = a.id
JOIN usuario coord ON coord.persona_id = alc.coordinador_id
WHERE alc.fecha_hasta IS NULL OR alc.fecha_hasta > CURDATE()
ORDER BY d.nombre, p.apellido;

