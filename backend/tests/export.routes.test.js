import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest, describe, test, expect } from '@jest/globals';




/** Artefactos que queremos subir en CI */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ART_DIR    = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART_DIR)) fs.mkdirSync(ART_DIR, { recursive: true });

/** Mock de DB: respondemos distinto segun el SQL */
const mockQuery = jest.fn(async (sql, params) => {
  // devolve data sintetica segun el SQL (socio/alumno/jugador)
  if (/FROM\s+socio\s/i.test(sql)) {
    return [{
      nro_socio: '40000001',
      apellido: 'Perez',
      nombre: 'Juan',
      dni: '40000001',
      plan: 'Standard',
      estado_cuenta: 'MOROSO'
    }];
  }
  if (/FROM\s+alumno\s/i.test(sql)) {
    return [{
      apellido: 'Perez',
      nombre: 'Juan',
      dni: '40000001',
      deporte: 'HANDBALL',
      categoria: 'Mayor',
      coordinador: 'Admin Root'
    }];
  }
  if (/FROM\s+jugador\s/i.test(sql)) {
    return [{
      apellido: 'Perez',
      nombre: 'Juan',
      dni: '40000001',
      puesto: 'Lateral',
      dorsal: 10
    }];
  }
  return [];
});


/** Mockear el modulo ESM de conexion antes de importar app */
const connModuleUrl = path.resolve(__dirname, '../src/db/connection.js');

await jest.unstable_mockModule(connModuleUrl, () => ({
  query: mockQuery,
  getConnection: async () => ({
    execute: mockQuery,
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  }),
}));

/** Importar app y rutas ya con el mock aplicado */
const { default: app } = await import('../src/server/app.js');

/** Helper: JWT valido con el mismo secreto que usa la app */
function mkToken() {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id: 1, username: 'admin', rol_sistema: 'ADMIN' }, secret, { expiresIn: '10m' });
}

/** Helper: pide CSV via Supertest sin levantar servidor HTTP real */
import request from 'supertest';

describe('Exports CSV', () => {
  test('socios.csv  basico', async () => {
    const token = mkToken();
    const res = await request(app)
      .get('/export/socios.csv')
      .query({ bearer: token });   // authOrQueryBearer habilita GET con bearer en query

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.startsWith('\uFEFF')).toBe(true);     // BOM
    expect(res.text).toMatch(/nro_socio,apellido,nombre,dni,email,telefono,plan,estado_cuenta/);
    expect(res.text).toMatch(/40000001/);

    fs.writeFileSync(path.join(ART_DIR, 'socios.csv'), res.text, 'utf8');
  });

  test('socios.csv  sep y download', async () => {
    const token = mkToken();
    const res = await request(app)
      .get('/export/socios.csv')
      .query({ bearer: token, sep: 1, download: 1 });

    expect(res.status).toBe(200);
    expect(res.text.includes('sep=,')).toBe(true);
    expect(res.headers['content-disposition']).toMatch(/^attachment/);
  });

  test('alumnos.csv  con filtros', async () => {
    const token = mkToken();
    const res = await request(app)
      .get('/export/alumnos.csv')
      .query({ bearer: token, q: 'ju', deporte: 'HANDBALL', categoria: 'Mayor', estado: 'ACTIVO' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/deporte,categoria,coordinador,apto_medico/);

    fs.writeFileSync(path.join(ART_DIR, 'alumnos.csv'), res.text, 'utf8');
  });

  test('jugadores.csv  OK', async () => {
    const token = mkToken();
    const res = await request(app)
      .get('/export/jugadores.csv')
      .query({ bearer: token, q: 'juan', puesto: 'Lateral', estado: 'ACTIVO' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/puesto,dorsal/);

    fs.writeFileSync(path.join(ART_DIR, 'jugadores.csv'), res.text, 'utf8');
  });
});
