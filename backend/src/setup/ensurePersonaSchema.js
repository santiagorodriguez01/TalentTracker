import { query } from '../db/connection.js';

async function columnExists(table, column) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [table, column],
  );
  return rows.length > 0;
}

export async function ensurePersonaSchema() {
  const enumPersonaRol = `'SOCIO','ALUMNO','JUGADOR','PERSONAL','PERSONAL_CAJA','REVISOR_CUENTA','COORDINADOR','DIRECTIVO','BOLETERIA'`;

  // Crea la tabla mínima si no existe (estructura básica para no cortar el alta).
  await query(`
    CREATE TABLE IF NOT EXISTS persona (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      nombre       VARCHAR(80)  NOT NULL,
      apellido     VARCHAR(80)  NOT NULL,
      genero       ENUM('MASCULINO','FEMENINO','NO ESPECIFICADO') NOT NULL DEFAULT 'NO ESPECIFICADO',
      dni          VARCHAR(12)  NOT NULL UNIQUE,
      fecha_nac    DATE         NULL,
      email        VARCHAR(120) NULL,
      telefono     VARCHAR(40)  NULL,
      domicilio    VARCHAR(200) NULL,
      foto         VARCHAR(255) NULL,
      qr_ver       INT UNSIGNED NOT NULL DEFAULT 1,
      qr_url       VARCHAR(255) NULL,
      rol          ENUM(${enumPersonaRol}) NOT NULL DEFAULT 'SOCIO',
      estado       ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ----- genero -----
  const hasGenero = await columnExists('persona', 'genero');
  if (!hasGenero) {
    // Si no existe, la creamos directamente con la definición final
    await query(`
      ALTER TABLE persona
        ADD COLUMN genero ENUM('MASCULINO','FEMENINO','NO ESPECIFICADO')
        NOT NULL DEFAULT 'NO ESPECIFICADO'
        AFTER apellido
    `);
  } else {
    // Por seguridad, limpiamos posibles NULL o vacíos antes de volverla NOT NULL
    await query(`
      UPDATE persona
      SET genero = 'NO ESPECIFICADO'
      WHERE genero IS NULL OR genero = ''
    `);
    await query(`
      ALTER TABLE persona
        MODIFY COLUMN genero ENUM('MASCULINO','FEMENINO','NO ESPECIFICADO')
        NOT NULL DEFAULT 'NO ESPECIFICADO'
        AFTER apellido
    `);
  }

  // ----- qr_ver -----
  const hasQrVer = await columnExists('persona', 'qr_ver');
  if (!hasQrVer) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN qr_ver INT UNSIGNED NOT NULL DEFAULT 1
        AFTER foto
    `);
  } else {
    await query(`
      UPDATE persona
      SET qr_ver = 1
      WHERE qr_ver IS NULL OR qr_ver < 1
    `);
    await query(`
      ALTER TABLE persona
        MODIFY COLUMN qr_ver INT UNSIGNED NOT NULL DEFAULT 1
        AFTER foto
    `);
  }

  // ----- qr_url -----
  const hasQrUrl = await columnExists('persona', 'qr_url');
  if (!hasQrUrl) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN qr_url VARCHAR(255) NULL
        AFTER qr_ver
    `);
  } else {
    await query(`
      ALTER TABLE persona
        MODIFY COLUMN qr_url VARCHAR(255) NULL
        AFTER qr_ver
    `);
  }

  // ----- rol principal en persona -----
  const hasRol = await columnExists('persona', 'rol');
  if (!hasRol) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN rol ENUM(${enumPersonaRol}) NOT NULL DEFAULT 'SOCIO'
        AFTER qr_url
    `);
  } else {
    await query(`
      UPDATE persona
      SET rol = 'SOCIO'
      WHERE rol IS NULL OR rol = ''
    `);
    await query(`
      ALTER TABLE persona
        MODIFY COLUMN rol ENUM(${enumPersonaRol}) NOT NULL DEFAULT 'SOCIO'
        AFTER qr_url
    `);
  }

  // ----- estado -----
  const hasEstado = await columnExists('persona', 'estado');
  if (!hasEstado) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'
        AFTER rol
    `);
  } else {
    await query(`
      UPDATE persona
      SET estado = 'ACTIVO'
      WHERE estado IS NULL OR estado = ''
    `);
    await query(`
      ALTER TABLE persona
        MODIFY COLUMN estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO'
        AFTER rol
    `);
  }

  // ----- created_at / updated_at -----
  const hasCreatedAt = await columnExists('persona', 'created_at');
  if (!hasCreatedAt) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        AFTER estado
    `);
  }

  const hasUpdatedAt = await columnExists('persona', 'updated_at');
  if (!hasUpdatedAt) {
    await query(`
      ALTER TABLE persona
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        AFTER created_at
    `);
  }

  // ----- tabla persona_rol (roles adicionales) -----
  await query(`
    CREATE TABLE IF NOT EXISTS persona_rol (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      persona_id BIGINT UNSIGNED NOT NULL,
      rol ENUM(${enumPersonaRol}) NULL,
      CONSTRAINT fk_persona_rol_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Nos aseguramos de que el ENUM de persona_rol quede sincronizado
  await query(`
    ALTER TABLE persona_rol
      MODIFY COLUMN rol ENUM(${enumPersonaRol}) NULL
  `);
}
