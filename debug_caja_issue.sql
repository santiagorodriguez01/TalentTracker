-- ============================================
-- SCRIPT DE DIAGNÓSTICO: Problema con movimientos de caja
-- ============================================

-- 1. Verificar usuario cajero_test
SELECT
    u.id as usuario_id,
    u.username,
    u.rol_sistema,
    u.persona_id,
    CONCAT(p.nombre, ' ', p.apellido) as nombre_completo
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.username = 'cajero_test';

-- 2. Verificar últimos movimientos de caja (todos)
SELECT
    c.id,
    c.fecha,
    c.concepto,
    c.tipo,
    c.monto,
    c.responsable_id,
    CONCAT(p.nombre, ' ', p.apellido) as responsable_nombre
FROM caja c
LEFT JOIN persona p ON p.id = c.responsable_id
ORDER BY c.id DESC
LIMIT 20;

-- 3. Verificar movimientos sin responsable (responsable_id = NULL)
SELECT
    COUNT(*) as movimientos_sin_responsable,
    MIN(fecha) as primer_movimiento,
    MAX(fecha) as ultimo_movimiento
FROM caja
WHERE responsable_id IS NULL;

-- 4. Verificar movimientos con responsable_id = 16 (Martin Kordi)
SELECT
    c.id,
    c.fecha,
    c.concepto,
    c.tipo,
    c.monto,
    c.responsable_id
FROM caja c
WHERE c.responsable_id = 16
ORDER BY c.id DESC;

-- 5. Ver todos los cajeros únicos en la tabla caja
SELECT DISTINCT
    p.id,
    CONCAT(p.nombre, ' ', p.apellido) as cajero,
    COUNT(c.id) as cantidad_movimientos
FROM caja c
INNER JOIN persona p ON p.id = c.responsable_id
GROUP BY p.id, CONCAT(p.nombre, ' ', p.apellido)
ORDER BY p.id;

-- 6. Verificar si el problema es con NULL
SELECT
    'Con responsable' as tipo,
    COUNT(*) as cantidad
FROM caja
WHERE responsable_id IS NOT NULL
UNION ALL
SELECT
    'Sin responsable (NULL)' as tipo,
    COUNT(*) as cantidad
FROM caja
WHERE responsable_id IS NULL;

-- ============================================
-- SOLUCIÓN: Si cajero_test no tiene persona_id
-- ============================================

-- Ver el estado actual del usuario cajero_test
SELECT * FROM usuario WHERE username = 'cajero_test';

-- Si persona_id es NULL, actualizarlo:
-- UPDATE usuario
-- SET persona_id = 16  -- ID de Martin Kordi, o crear nueva persona
-- WHERE username = 'cajero_test';

-- ============================================
-- CREAR PERSONA PARA CAJERO_TEST (si no existe)
-- ============================================

/*
-- Descomenta si necesitas crear una persona nueva para cajero_test

INSERT INTO persona (nombre, apellido, dni, rol, estado)
VALUES ('Cajero', 'Test', '99999999', 'PERSONAL', 'ACTIVO');

-- Obtener el ID de la persona recién creada
SET @persona_id = LAST_INSERT_ID();

-- Asignar rol PERSONAL_CAJA en persona_rol
INSERT INTO persona_rol (persona_id, rol)
VALUES (@persona_id, 'PERSONAL_CAJA');

-- Actualizar el usuario cajero_test con la persona_id
UPDATE usuario
SET persona_id = @persona_id
WHERE username = 'cajero_test';

-- Verificar
SELECT
    u.id,
    u.username,
    u.persona_id,
    CONCAT(p.nombre, ' ', p.apellido) as nombre
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.username = 'cajero_test';
*/
