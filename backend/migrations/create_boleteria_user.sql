-- ============================================================
-- Script: Crear o actualizar usuario de boletería
-- Fecha: 2025-11-11
-- Descripci\u00f3n: Script para asignar permisos de boletería a usuarios
-- ============================================================

-- IMPORTANTE: Ejecutar primero el script add_boleteria_role.sql

-- ============================================================
-- OPCIÓN 1: Crear un nuevo usuario de boletería
-- ============================================================
-- Descomenta las siguientes líneas si quieres crear un nuevo usuario

/*
INSERT INTO `usuario` (`username`, `password_hash`, `rol_sistema`, `persona_id`)
VALUES
('boleteria', '$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy', 'BOLETERIA', NULL);

-- Contraseña por defecto: admin123
-- IMPORTANTE: Cambiar la contraseña después del primer login
*/

-- ============================================================
-- OPCIÓN 2: Actualizar un usuario existente a BOLETERIA
-- ============================================================
-- Reemplaza 'nombre_usuario' con el username que quieres actualizar

/*
UPDATE `usuario`
SET `rol_sistema` = 'BOLETERIA'
WHERE `username` = 'nombre_usuario';
*/

-- ============================================================
-- OPCIÓN 3: Ver todos los usuarios actuales y sus roles
-- ============================================================
SELECT
  u.id,
  u.username,
  u.rol_sistema,
  CONCAT(p.apellido, ', ', p.nombre) AS persona_nombre,
  u.created_at,
  u.updated_at
FROM
  usuario u
  LEFT JOIN persona p ON u.persona_id = p.id
ORDER BY
  u.id;

-- ============================================================
-- OPCIÓN 4: Solución temporal - Usar rol PERSONAL_CAJA
-- ============================================================
-- Si no quieres modificar el ENUM, puedes usar el rol PERSONAL_CAJA
-- que ya existe y tiene los mismos permisos para venta de entradas

/*
UPDATE `usuario`
SET `rol_sistema` = 'PERSONAL_CAJA'
WHERE `username` = 'nombre_usuario';
*/
