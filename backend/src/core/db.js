import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'club',
      password: process.env.DB_PASS || 'club',
      database: process.env.DB_NAME || 'club_lujan',
      connectionLimit: Number(process.env.DB_POOL || 10),
      timezone: 'Z',
      
      multipleStatements: true
    });
  }
  return pool;
}

export async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function getConnection() {
  return getPool().getConnection();
}
