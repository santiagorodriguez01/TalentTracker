import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "mysql",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "club",
  password: process.env.DB_PASS ?? "club",
  // Para la demo, usamos la misma DB que la principal
  database: process.env.DB_AUDIT_DB ?? process.env.DB_NAME ?? "club_lujan",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL ?? 10),
  queueLimit: 0,
});

export function getPool() {
  return pool;
}
