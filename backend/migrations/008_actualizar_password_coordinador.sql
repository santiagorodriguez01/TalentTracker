-- Migration: Actualizar password del coordinador
-- Fecha: 2025-11-10
-- Descripcion: Establecer password conocida para el usuario coordinador

-- Password: coordinador123
-- Hash bcrypt generado con bcryptjs

UPDATE `usuario`
SET `password_hash` = '$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK'
WHERE `username` = 'coordinador';

-- Nota: Esta es una contraseña de desarrollo. NO usar en producción.
-- Para generar el hash correcto, usar:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('coordinador123', 10);

SELECT 'Password actualizada para usuario coordinador' as mensaje;
