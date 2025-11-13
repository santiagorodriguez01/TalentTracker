import mysql from 'mysql2/promise';
import 'dotenv/config';

class DB {
  static #i; #p;
  constructor() {
    const password = process.env.DB_PASS || process.env.DB_PASSWORD || 'club';
    this.#p = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'club',
      password,
      database: process.env.DB_NAME || 'club_lujan',
      connectionLimit: Number(process.env.DB_POOL || 10),
      timezone: 'Z',
      waitForConnections: true,
      charset: 'utf8mb4',
      multipleStatements: true,
    });
  }

  static getInstance() {
    if (!DB.#i) DB.#i = new DB();
    return DB.#i;
  }
  get pool() { return this.#p; }
  async query(sql, params = []) {
    const [rows] = await this.#p.execute(sql, params);
    return rows;
  }
  async getConnection() { return this.#p.getConnection(); }
}

const db = DB.getInstance();

export const query = (s, p) => db.query(s, p);
export const getConnection = () => db.getConnection();
export default db;
