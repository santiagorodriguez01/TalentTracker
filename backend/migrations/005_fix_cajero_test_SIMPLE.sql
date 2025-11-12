-- ============================================
-- MIGRATION SIMPLIFICADA: 005_fix_cajero_test.sql
-- Descripción: Soluciona el problema del usuario cajero_test sin persona_id
-- Ejecutar en Adminer línea por línea o todo junto
-- ============================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================
-- PASO 1: Crear persona para cajero_test
-- ============================================

INSERT INTO persona (nombre, apellido, dni, rol, estado, genero)
VALUES ('Cajero', 'Test', '99999999', 'PERSONAL', 'ACTIVO', 'NO ESPECIFICADO')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ============================================
-- PASO 2: Agregar rol PERSONAL_CAJA
-- ============================================

INSERT INTO persona_rol (persona_id, rol)
SELECT id, 'PERSONAL_CAJA'
FROM persona
WHERE dni = '99999999'
AND NOT EXISTS (
    SELECT 1 FROM persona_rol
    WHERE persona_id = persona.id AND rol = 'PERSONAL_CAJA'
);

-- ============================================
-- PASO 3: Actualizar usuario cajero_test
-- ============================================

UPDATE usuario
SET persona_id = (SELECT id FROM persona WHERE dni = '99999999')
WHERE username = 'cajero_test';

-- ============================================
-- PASO 4 (OPCIONAL): Actualizar movimientos antiguos
-- Descomentar SOLO si quieres asignar movimientos NULL a cajero_test
-- ============================================

/*
UPDATE caja
SET responsable_id = (SELECT id FROM persona WHERE dni = '99999999')
WHERE responsable_id IS NULL
  AND fecha >= '2025-11-10 00:00:00'
  AND id > 55;  -- Ajustar según tus movimientos
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver el usuario actualizado
SELECT
    u.id as usuario_id,
    u.username,
    u.rol_sistema,
    u.persona_id,
    p.nombre,
    p.apellido,
    p.dni
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.username = 'cajero_test';

-- Ver roles asignados
SELECT
    pr.id,
    pr.persona_id,
    pr.rol,
    p.nombre,
    p.apellido
FROM persona_rol pr
INNER JOIN persona p ON pr.persona_id = p.id
WHERE p.dni = '99999999';

-- ============================================
-- REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO schema_migrations (name)
VALUES ('005_fix_cajero_test.sql')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP;

-- ============================================
-- FIN
-- ============================================
