// index.js
import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { ensureInitialAdmin } from '../setup/bootstrap.js';
import { ensurePersonaSchema } from '../setup/ensurePersonaSchema.js';
import { ensureAlumnoCuotasSchema } from '../setup/ensureAlumnoCuotasSchema.js';
import { initPerformanceSocket } from './ai_integration/websocket/performanceSocket.js';

const PORT = process.env.PORT || 3000;

// 🧱 Bootstrap de esquemas
await ensurePersonaSchema().catch((e) => {
  console.warn('[BOOTSTRAP] No se pudo asegurar schema de persona:', e?.message || e);
});
await ensureAlumnoCuotasSchema().catch((e) => {
  console.warn('[BOOTSTRAP] No se pudo asegurar schema de alumnos/cuotas:', e?.message || e);
});
await ensureInitialAdmin().catch(() => {});

// 🚀 Crear servidor HTTP sobre Express
const server = http.createServer(app);

// 🔌 Inicializar WebSocket para análisis físico en tiempo real
initPerformanceSocket(server);

// ▶️ Iniciar API + WebSocket en el mismo puerto
server.listen(PORT, () => {
  console.log(`[INFO] API y WebSocket escuchando en :${PORT}`);
});
