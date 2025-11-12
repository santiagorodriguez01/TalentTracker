-- Migration: Crear coordinadores específicos por deporte
-- Fecha: 2025-01-XX
-- Descripcion: Crear personas, usuarios y asignaciones de deporte para cada coordinador
-- NOTA: Ejecutar este script en Adminer después de aplicar la migración 010_coordinador_deporte.sql

-- ==========================================
-- 1. OBTENER IDs DE DEPORTES
-- ==========================================

SET @futbol_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');
SET @boxeo_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');
SET @futbol_fem_id = (SELECT id FROM deporte WHERE nombre = 'Futbol Femenino');
SET @handball_id = (SELECT id FROM deporte WHERE nombre = 'Handball');
SET @hockey_id = (SELECT id FROM deporte WHERE nombre = 'Hockey');

-- ==========================================
-- 2. COORDINADOR DE FÚTBOL
-- ==========================================

-- Usar el coordinador existente con DNI 35789456 (ya existe en la BD)
SET @coord_futbol_id = (SELECT id FROM persona WHERE dni = '35789456' LIMIT 1);

-- Asignar rol (ignorar si ya existe)
INSERT IGNORE INTO persona_rol (persona_id, rol) 
VALUES (@coord_futbol_id, 'COORDINADOR');

-- Crear usuario solo si no existe uno para esta persona
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_futbol', '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK', 'COORDINADOR', @coord_futbol_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE persona_id = @coord_futbol_id);

-- Asignar deporte (ignorar si ya existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_futbol_id, @futbol_id, 1);

-- ==========================================
-- 3. COORDINADOR DE BOXEO
-- ==========================================

-- Usar persona existente si ya existe, si no crear nueva
SET @coord_boxeo_id = (SELECT id FROM persona WHERE dni = '50000001' LIMIT 1);

INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Roberto', 'Martínez', 'MASCULINO', '50000001', '1985-08-20', 'roberto.boxeo@clublujan.com', '2323-111111', 'Calle 25 de Mayo 123, Luján', 'COORDINADOR', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '50000001');

-- Obtener el ID (usar el existente o el recién creado)
SET @coord_boxeo_id = COALESCE(@coord_boxeo_id, (SELECT id FROM persona WHERE dni = '50000001' LIMIT 1));

-- Asignar rol (ignorar si ya existe)
INSERT IGNORE INTO persona_rol (persona_id, rol) 
VALUES (@coord_boxeo_id, 'COORDINADOR');

-- Crear usuario solo si no existe
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_boxeo', '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK', 'COORDINADOR', @coord_boxeo_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'coord_boxeo');

-- Asignar deporte (ignorar si ya existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_boxeo_id, @boxeo_id, 1);

-- ==========================================
-- 4. COORDINADOR DE FÚTBOL FEMENINO
-- ==========================================

-- Usar persona existente si ya existe, si no crear nueva
SET @coord_futbolfem_id = (SELECT id FROM persona WHERE dni = '50000002' LIMIT 1);

INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'María', 'González', 'FEMENINO', '50000002', '1992-03-10', 'maria.futbolfem@clublujan.com', '2323-222222', 'Av. Constitución 789, Luján', 'COORDINADOR', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '50000002');

-- Obtener el ID (usar el existente o el recién creado)
SET @coord_futbolfem_id = COALESCE(@coord_futbolfem_id, (SELECT id FROM persona WHERE dni = '50000002' LIMIT 1));

-- Asignar rol (ignorar si ya existe)
INSERT IGNORE INTO persona_rol (persona_id, rol) 
VALUES (@coord_futbolfem_id, 'COORDINADOR');

-- Crear usuario solo si no existe
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_futbolfem', '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK', 'COORDINADOR', @coord_futbolfem_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'coord_futbolfem');

-- Asignar deporte (ignorar si ya existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_futbolfem_id, @futbol_fem_id, 1);

-- ==========================================
-- 5. COORDINADOR DE HANDBALL
-- ==========================================

-- Usar persona existente si ya existe, si no crear nueva
SET @coord_handball_id = (SELECT id FROM persona WHERE dni = '50000003' LIMIT 1);

INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Diego', 'Fernández', 'MASCULINO', '50000003', '1988-11-25', 'diego.handball@clublujan.com', '2323-333333', 'Calle Mitre 456, Luján', 'COORDINADOR', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '50000003');

-- Obtener el ID (usar el existente o el recién creado)
SET @coord_handball_id = COALESCE(@coord_handball_id, (SELECT id FROM persona WHERE dni = '50000003' LIMIT 1));

-- Asignar rol (ignorar si ya existe)
INSERT IGNORE INTO persona_rol (persona_id, rol) 
VALUES (@coord_handball_id, 'COORDINADOR');

-- Crear usuario solo si no existe
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_handball', '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK', 'COORDINADOR', @coord_handball_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'coord_handball');

-- Asignar deporte (ignorar si ya existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_handball_id, @handball_id, 1);

-- ==========================================
-- 6. COORDINADOR DE HOCKEY
-- ==========================================

-- Usar persona existente si ya existe, si no crear nueva
SET @coord_hockey_id = (SELECT id FROM persona WHERE dni = '50000004' LIMIT 1);

INSERT INTO persona (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, rol, estado) 
SELECT 'Ana', 'López', 'FEMENINO', '50000004', '1991-07-18', 'ana.hockey@clublujan.com', '2323-444444', 'Av. Libertador 321, Luján', 'COORDINADOR', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE dni = '50000004');

-- Obtener el ID (usar el existente o el recién creado)
SET @coord_hockey_id = COALESCE(@coord_hockey_id, (SELECT id FROM persona WHERE dni = '50000004' LIMIT 1));

-- Asignar rol (ignorar si ya existe)
INSERT IGNORE INTO persona_rol (persona_id, rol) 
VALUES (@coord_hockey_id, 'COORDINADOR');

-- Crear usuario solo si no existe
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
SELECT 'coord_hockey', '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK', 'COORDINADOR', @coord_hockey_id
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE username = 'coord_hockey');

-- Asignar deporte (ignorar si ya existe)
INSERT IGNORE INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_hockey_id, @hockey_id, 1);

-- ==========================================
-- 7. VERIFICACIÓN
-- ==========================================

SELECT 'Coordinadores creados exitosamente!' as mensaje;

SELECT 
  p.nombre,
  p.apellido,
  u.username,
  d.nombre AS deporte,
  cd.activo
FROM coordinador_deporte cd
JOIN persona p ON p.id = cd.coordinador_id
JOIN usuario u ON u.persona_id = p.id
JOIN deporte d ON d.id = cd.deporte_id
WHERE cd.activo = 1
ORDER BY d.nombre, p.apellido;

