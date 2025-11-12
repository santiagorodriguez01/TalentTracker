-- ============================================
-- MIGRATION: 004_personal_caja_vistas.sql
-- Descripción: Crea vistas optimizadas para rol PERSONAL_CAJA
-- Autor: Sistema TalentTracker
-- Fecha: 2025-11-10
-- ============================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================
-- VISTAS PARA MÓDULO DE CAJA
-- ============================================

-- Vista detallada de movimientos de caja
DROP VIEW IF EXISTS v_caja_detallada;
CREATE VIEW v_caja_detallada AS
SELECT
    c.id,
    c.fecha,
    c.concepto,
    c.tipo,
    c.monto,
    c.medio_pago,
    c.nro_tramite,
    c.estado,
    c.responsable_id,
    CONCAT(COALESCE(p_resp.apellido, ''), ' ', COALESCE(p_resp.nombre, '')) as responsable_nombre,
    c.validador_id,
    CONCAT(COALESCE(p_valid.apellido, ''), ' ', COALESCE(p_valid.nombre, '')) as validador_nombre,
    c.fecha_validacion,
    c.created_at,
    c.updated_at
FROM caja c
LEFT JOIN persona p_resp ON c.responsable_id = p_resp.id
LEFT JOIN persona p_valid ON c.validador_id = p_valid.id
ORDER BY c.fecha DESC, c.id DESC;

-- ============================================
-- VISTAS PARA MÓDULO DE CUOTAS
-- ============================================

-- Vista detallada de cuotas de socios
DROP VIEW IF EXISTS v_cuotas_detallada;
CREATE VIEW v_cuotas_detallada AS
SELECT
    c.id as cuota_id,
    c.socio_id,
    s.nro_socio,
    p.id as persona_id,
    CONCAT(p.apellido, ' ', p.nombre) as socio_nombre,
    p.dni,
    p.telefono,
    p.email,
    c.periodo,
    c.total_importe,
    c.importe_pagado,
    c.saldo,
    c.importe,
    c.vencimiento,
    c.estado as estado_cuota,
    s.estado_cuenta,
    c.comprobante_pdf,
    c.created_at,
    c.updated_at
FROM cuota c
INNER JOIN socio s ON c.socio_id = s.id
INNER JOIN persona p ON s.persona_id = p.id
ORDER BY c.vencimiento DESC, c.id DESC;

-- ============================================
-- VISTAS DE RESUMEN Y ESTADÍSTICAS
-- ============================================

-- Resumen de caja del día actual
DROP VIEW IF EXISTS v_resumen_caja_hoy;
CREATE VIEW v_resumen_caja_hoy AS
SELECT
    DATE(fecha) as fecha,
    tipo,
    estado,
    COUNT(*) as cantidad_movimientos,
    SUM(monto) as total_monto,
    AVG(monto) as promedio_monto,
    MIN(monto) as monto_minimo,
    MAX(monto) as monto_maximo
FROM caja
WHERE DATE(fecha) = CURDATE()
GROUP BY DATE(fecha), tipo, estado;

-- Resumen de caja del mes actual
DROP VIEW IF EXISTS v_resumen_caja_mes;
CREATE VIEW v_resumen_caja_mes AS
SELECT
    DATE_FORMAT(fecha, '%Y-%m') as periodo,
    tipo,
    estado,
    COUNT(*) as cantidad_movimientos,
    SUM(monto) as total_monto,
    AVG(monto) as promedio_monto
FROM caja
WHERE
    YEAR(fecha) = YEAR(CURDATE())
    AND MONTH(fecha) = MONTH(CURDATE())
GROUP BY DATE_FORMAT(fecha, '%Y-%m'), tipo, estado;

-- Saldo actual de caja (función helper)
DROP FUNCTION IF EXISTS fn_saldo_caja_actual;
DELIMITER ;;
CREATE FUNCTION fn_saldo_caja_actual()
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_ingresos DECIMAL(12,2) DEFAULT 0;
    DECLARE total_egresos DECIMAL(12,2) DEFAULT 0;

    SELECT COALESCE(SUM(monto), 0) INTO total_ingresos
    FROM caja
    WHERE tipo = 'INGRESO';

    SELECT COALESCE(SUM(monto), 0) INTO total_egresos
    FROM caja
    WHERE tipo = 'EGRESO' AND estado = 'APROBADO';

    RETURN total_ingresos - total_egresos;
END;;
DELIMITER ;

-- Cuotas pendientes por vencer (próximos 7 días)
DROP VIEW IF EXISTS v_cuotas_proximas_vencer;
CREATE VIEW v_cuotas_proximas_vencer AS
SELECT
    c.id as cuota_id,
    s.nro_socio,
    CONCAT(p.apellido, ' ', p.nombre) as socio_nombre,
    p.telefono,
    p.email,
    c.periodo,
    c.saldo,
    c.vencimiento,
    DATEDIFF(c.vencimiento, CURDATE()) as dias_para_vencer,
    CASE
        WHEN DATEDIFF(c.vencimiento, CURDATE()) < 0 THEN 'VENCIDA'
        WHEN DATEDIFF(c.vencimiento, CURDATE()) <= 3 THEN 'URGENTE'
        ELSE 'PRÓXIMA'
    END as prioridad
FROM cuota c
INNER JOIN socio s ON c.socio_id = s.id
INNER JOIN persona p ON s.persona_id = p.id
WHERE
    c.estado IN ('EMITIDA', 'PENDIENTE', 'VENCIDA')
    AND c.saldo > 0
    AND c.vencimiento <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY c.vencimiento ASC, c.saldo DESC;

-- Cuotas vencidas
DROP VIEW IF EXISTS v_cuotas_vencidas;
CREATE VIEW v_cuotas_vencidas AS
SELECT
    c.id as cuota_id,
    s.nro_socio,
    CONCAT(p.apellido, ' ', p.nombre) as socio_nombre,
    p.telefono,
    p.email,
    c.periodo,
    c.total_importe,
    c.importe_pagado,
    c.saldo,
    c.vencimiento,
    ABS(DATEDIFF(CURDATE(), c.vencimiento)) as dias_vencidos,
    c.estado
FROM cuota c
INNER JOIN socio s ON c.socio_id = s.id
INNER JOIN persona p ON s.persona_id = p.id
WHERE
    c.vencimiento < CURDATE()
    AND c.saldo > 0
    AND c.estado IN ('PENDIENTE', 'VENCIDA')
ORDER BY c.vencimiento ASC, c.saldo DESC;

-- Histórico de pagos de cuotas
DROP VIEW IF EXISTS v_historico_pagos;
CREATE VIEW v_historico_pagos AS
SELECT
    pc.id as pago_id,
    pc.cuota_id,
    c.socio_id,
    s.nro_socio,
    CONCAT(p.apellido, ' ', p.nombre) as socio_nombre,
    c.periodo,
    pc.fecha as fecha_pago,
    pc.monto as monto_pagado,
    pc.medio_pago,
    pc.nro_tramite,
    pc.observacion,
    c.total_importe as importe_total_cuota,
    c.saldo as saldo_restante,
    pc.created_at
FROM pago_cuota pc
INNER JOIN cuota c ON pc.cuota_id = c.id
INNER JOIN socio s ON c.socio_id = s.id
INNER JOIN persona p ON s.persona_id = p.id
ORDER BY pc.fecha DESC, pc.id DESC;

-- ============================================
-- ESTADÍSTICAS DE CAJEROS
-- ============================================

-- Vista de movimientos por cajero
DROP VIEW IF EXISTS v_estadisticas_cajero;
CREATE VIEW v_estadisticas_cajero AS
SELECT
    p.id as cajero_id,
    CONCAT(p.apellido, ' ', p.nombre) as cajero_nombre,
    DATE(c.fecha) as fecha,
    c.tipo,
    COUNT(*) as cantidad_movimientos,
    SUM(c.monto) as total_monto
FROM caja c
INNER JOIN persona p ON c.responsable_id = p.id
GROUP BY p.id, CONCAT(p.apellido, ' ', p.nombre), DATE(c.fecha), c.tipo
ORDER BY DATE(c.fecha) DESC, p.id;

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índice para búsquedas por fecha en caja
CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja(fecha);

-- Índice para búsquedas por tipo y estado
CREATE INDEX IF NOT EXISTS idx_caja_tipo_estado ON caja(tipo, estado);

-- Índice para búsquedas por vencimiento en cuotas
CREATE INDEX IF NOT EXISTS idx_cuota_vencimiento ON cuota(vencimiento);

-- Índice para búsquedas por estado en cuotas
CREATE INDEX IF NOT EXISTS idx_cuota_estado ON cuota(estado);

-- Índice para búsquedas por periodo en cuotas
CREATE INDEX IF NOT EXISTS idx_cuota_periodo ON cuota(periodo);

-- ============================================
-- REGISTRAR MIGRACIÓN
-- ============================================

INSERT INTO schema_migrations (name)
VALUES ('004_personal_caja_vistas.sql')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP;

-- ============================================
-- VERIFICACIONES FINALES
-- ============================================

-- Mostrar todas las vistas creadas
SELECT
    TABLE_NAME as vista,
    TABLE_COMMENT as descripcion
FROM INFORMATION_SCHEMA.TABLES
WHERE
    TABLE_SCHEMA = DATABASE()
    AND TABLE_TYPE = 'VIEW'
    AND TABLE_NAME LIKE 'v_%'
ORDER BY TABLE_NAME;

-- Verificar función de saldo
SELECT fn_saldo_caja_actual() as saldo_caja_actual;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
