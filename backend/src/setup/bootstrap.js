import bcrypt from 'bcryptjs';
import { query } from '../db/connection.js';

export async function ensureInitialAdmin() {
  const username = process.env.ADMIN_INITIAL_USER || 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
  const rol = 'ADMIN';

  try {
    // Ensure minimal table exists so login works even without running full migrations
    await query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(60) NOT NULL UNIQUE,
        password_hash VARCHAR(120) NOT NULL,
        rol_sistema ENUM('ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA','BOLETERIA') NOT NULL,
        persona_id BIGINT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Asegurar nuevos roles del sistema en instalaciones existentes
    try {
      await query(`
        ALTER TABLE usuario
        MODIFY COLUMN rol_sistema ENUM('ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA','BOLETERIA') NOT NULL
      `);
    } catch {}

    const rows = await query('SELECT id FROM usuario WHERE username=? LIMIT 1', [username]);
    const hash = await bcrypt.hash(password, 10);
    if (rows.length) {
      if (String(process.env.ADMIN_FORCE_RESET_PASSWORD || '') === '1'){
        await query('UPDATE usuario SET password_hash=? WHERE username=?', [hash, username]);
        console.log(`[BOOTSTRAP] Password de ${username} actualizado por ADMIN_FORCE_RESET_PASSWORD=1`);
      }
      return; // ya existe
    }
    await query('INSERT INTO usuario (username, password_hash, rol_sistema) VALUES (?,?,?)', [username, hash, rol]);
    console.log(`[BOOTSTRAP] Usuario admin creado: ${username}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[BOOTSTRAP] No se pudo crear admin inicial:', e?.message || e);
  }
}
