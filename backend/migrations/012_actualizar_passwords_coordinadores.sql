-- Migration: Actualizar passwords de coordinadores por deporte
-- Fecha: 2025-01-XX
-- Descripcion: Actualizar las contraseñas de todos los coordinadores con el hash correcto
-- Password: coordinador123
-- Hash bcrypt generado con bcryptjs: $2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C

-- ==========================================
-- ACTUALIZAR PASSWORDS DE TODOS LOS COORDINADORES
-- ==========================================

-- Coordinador de Fútbol
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_futbol';

-- Coordinador de Boxeo
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_boxeo';

-- Coordinador de Fútbol Femenino
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_futbolfem';

-- Coordinador de Handball
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_handball';

-- Coordinador de Hockey
UPDATE usuario
SET password_hash = '$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C'
WHERE username = 'coord_hockey';

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

SELECT 
  username,
  'Password actualizada' as estado
FROM usuario
WHERE username IN ('coord_futbol', 'coord_boxeo', 'coord_futbolfem', 'coord_handball', 'coord_hockey')
ORDER BY username;

SELECT 'Passwords actualizadas exitosamente!' as mensaje;

