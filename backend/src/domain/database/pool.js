import mysql from 'mysql2/promise';

// Creamos el pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'mysql',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'club',
  password: process.env.DB_PASS ?? 'club',
  database:
    process.env.DB_AUDIT_DB ??
    process.env.DB_NAME ??
    'club_lujan',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL ?? 10),
  queueLimit: 0,
});

// Para código que usa getPool()
export function getPool() {
  return pool;
}

// Para código que hace `import { pool } ...`
export { pool };

// Si alguien usa import default
export default pool;
