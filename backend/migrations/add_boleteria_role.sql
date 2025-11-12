-- ============================================================
-- Migraci\u00f3n: Agregar rol BOLETERIA al sistema
-- Fecha: 2025-11-11
-- Descripci\u00f3n: Agrega el rol 'BOLETERIA' al ENUM de rol_sistema
--               en la tabla usuario para permitir ventas de entradas
-- ============================================================

-- Modificar el ENUM de la columna rol_sistema para incluir BOLETERIA
ALTER TABLE `usuario`
MODIFY COLUMN `rol_sistema` ENUM(
  'ADMIN',
  'TESORERIA',
  'COORDINADOR',
  'STAFF',
  'DIRECTIVO',
  'REVISOR_CUENTA',
  'PERSONAL_CAJA',
  'BOLETERIA'
) NOT NULL;

-- Verificar que el cambio se aplicó correctamente
SELECT
  COLUMN_NAME,
  COLUMN_TYPE
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'usuario'
  AND COLUMN_NAME = 'rol_sistema';

-- Ejemplo: Crear un usuario de boletería (opcional, descomentar si necesitas)
-- INSERT INTO `usuario` (`username`, `password_hash`, `rol_sistema`, `persona_id`)
-- VALUES
-- ('boleteria', '$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy', 'BOLETERIA', NULL);
-- Nota: La contraseña es 'admin123' (mismo hash que otros usuarios de prueba)

-- Ejemplo: Actualizar un usuario existente a BOLETERIA
-- UPDATE `usuario` SET `rol_sistema` = 'BOLETERIA' WHERE `username` = 'tu_usuario';
