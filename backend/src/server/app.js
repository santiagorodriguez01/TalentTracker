import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { mountDocs } from './docs.js';
import routes from '../web/routes.js';
import errorHandler from '../web/middleware/error.js';
import fs from 'fs/promises';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";


// Usa siempre la ruta absoluta que mapea tu volumen del compose
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
console.log('[FILES] UPLOADS_DIR =', UPLOADS_DIR);

// ==== CORS allowlist (ajusta si cambias puertos o dominios)
const allowlist = (
  (process.env.CORS_ORIGIN || 'http://localhost:3001')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

const corsOptions = {
  origin(origin, cb) {
    if ((process.env.CORS_ORIGIN || '').trim() === '*') return cb(null, true);
    if (!origin) return cb(null, true); // permite Postman
    const ok = allowlist.includes(origin);
    cb(ok ? null : new Error('CORS blocked'), ok);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
const app = express();

// Documentación específica de AI (YAML)
try {
  const aiDocs = YAML.load("./docs/ai_integration.yaml");
  app.use("/docs/ai", swaggerUi.serve, swaggerUi.setup(aiDocs));
} catch (e) {
  console.warn("[DOCS] No se pudo cargar docs AI:", e?.message || e);
}

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Preflight + vary para caches
app.options('*', cors(corsOptions));
app.use((req, res, next) => { res.header('Vary', 'Origin'); next(); });
app.use(cors(corsOptions));            // <<-- solo este middleware (quitamos el app.use(cors()) abierto)

const staticOpts = {
  fallthrough: true,
  etag: true,
  maxAge: '7d',
  // No hay req aqui. Usamos '*' que es suficiente para imagenes cross-origin.
  setHeaders(res, filePath /*, stat */) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.png'))  res.setHeader('Content-Type', 'image/png');
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
};
app.use('/uploads', express.static(UPLOADS_DIR, staticOpts));
app.use('/files',   express.static(UPLOADS_DIR, staticOpts));

app.get('/_diag/uploads-path', (req, res) => {
  res.json({ uploadsDir: UPLOADS_DIR });
});

// Diagnostico: verifica si existe el archivo exacto
app.get('/_diag/exists/persona/:id', async (req, res) => {
  const p = path.join(UPLOADS_DIR, 'personas', String(req.params.id), 'foto_600.jpg');
  try {
    await fs.access(p);
    res.json({ ok: true, path: p });
  } catch {
    res.status(404).json({ ok: false, path: p });
  }
});

// Diagnostico: intenta enviarlo con sendFile (sin static)
app.get('/_diag/sendfile/persona/:id', (req, res, next) => {
  const p = path.join(UPLOADS_DIR, 'personas', String(req.params.id), 'foto_600.jpg');
  res.type('jpg');
  res.sendFile(p, (err) => err ? next(err) : undefined);
});

// Rutas de la API
app.use(['/', '/api'], routes);
mountDocs(app);

// Handler de errores al final
app.use(errorHandler);

export default app;
