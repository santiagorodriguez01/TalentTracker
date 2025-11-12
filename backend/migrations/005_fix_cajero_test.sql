-- ============================================
-- MIGRATION: 005_fix_cajero_test.sql
-- Descripción: Soluciona el problema del usuario cajero_test sin persona_id
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ============================================
-- VERIFICAR PROBLEMA
-- ============================================

-- Ver el usuario cajero_test actual
SELECT
    u.id as usuario_id,
    u.username,
    u.rol_sistema,
    u.persona_id,
    CASE
        WHEN u.persona_id IS NULL THEN 'PROBLEMA: No tiene persona_id'
        ELSE CONCAT('OK: Tiene persona_id = ', u.persona_id)
    END as estado
FROM usuario u
WHERE u.username = 'cajero_test';

-- Ver movimientos con responsable_id NULL
SELECT COUNT(*) as movimientos_sin_responsable
FROM caja
WHERE responsable_id IS NULL;

-- ============================================
-- SOLUCIÓN 1: Crear persona para cajero_test
-- ============================================

-- Insertar nueva persona para cajero_test
INSERT INTO persona (nombre, apellido, dni, rol, estado, genero)
VALUES ('Cajero', 'Test', '99999999', 'PERSONAL', 'ACTIVO', 'NO ESPECIFICADO')
ON DUPLICATE KEY UPDATE nombre = nombre; -- No duplicar si ya existe el DNI

-- Obtener el ID de la persona
SET @persona_cajero_test = (SELECT id FROM persona WHERE dni = '99999999');

-- Agregar rol PERSONAL_CAJA en persona_rol
INSERT INTO persona_rol (persona_id, rol)
SELECT @persona_cajero_test, 'PERSONAL_CAJA'
WHERE NOT EXISTS (
    SELECT 1 FROM persona_rol
    WHERE persona_id = @persona_cajero_test AND rol = 'PERSONAL_CAJA'
);

-- ============================================
-- SOLUCIÓN 2: Actualizar usuario cajero_test
-- ============================================

-- Actualizar el usuario con la persona_id correcta
UPDATE usuario
SET persona_id = @persona_cajero_test
WHERE username = 'cajero_test';

-- ============================================
-- SOLUCIÓN 3: Actualizar movimientos antiguos (OPCIONAL)
-- ============================================

-- Si quieres asignar los movimientos NULL al cajero_test
-- DESCOMENTA las siguientes líneas si necesitas esto:

/*
UPDATE caja
SET responsable_id = @persona_cajero_test
WHERE responsable_id IS NULL
  AND fecha >= '2025-11-10 00:00:00'  -- Solo los de hoy, ajustar fecha
  AND concepto LIKE '%Test%';  -- O algún filtro que identifique tus movimientos
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que cajero_test ahora tiene persona_id
SELECT
    u.id as usuario_id,
    u.username,
    u.rol_sistema,
    u.persona_id,
    CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
    p.dni
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.username = 'cajero_test';

-- Verificar roles de la persona
SELECT
    pr.persona_id,
    pr.rol,
    CONCAT(p.nombre, ' ', p.apellido) as nombre
FROM persona_rol pr
INNER JOIN persona p ON pr.persona_id = p.id
WHERE p.dni = '99999999';

-- Ver cajeros en la lista (ahora debería aparecer)
SELECT
    p.id,
    p.apellido,
    p.nombre,
    CONCAT(p.apellido, ' ', p.nombre) as cajero,
    p.dni,
    COUNT(c.id) as cantidad_movimientos
FROM caja c
INNER JOIN persona p ON p.id = c.responsable_id
GROUP BY p.id, p.apellido, p.nombre, p.dni
ORDER BY p.apellido, p.nombre;

-- ============================================
-- REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO schema_migrations (name)
VALUES ('005_fix_cajero_test.sql')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
