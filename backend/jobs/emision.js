import dotenv from 'dotenv'; dotenv.config();
import cron from 'node-cron';
import { query } from '../src/db/connection.js';

async function emitir(periodo, importe, vencimientoISO) {
  const socios = await query(`
    SELECT s.id
    FROM socio s
    JOIN persona p ON p.id = s.persona_id
    WHERE p.estado = 'ACTIVO'
  `);
  if (!socios.length) { console.log('[scheduler] no hay socios'); return; }

  const conn = await getConnection();
  let inserted = 0;
  try {
    await conn.beginTransaction();
    for (const row of socios) {
      const [resIns] = await conn.execute(
        'INSERT IGNORE INTO cuota (socio_id, periodo, importe, vencimiento, estado) VALUES (?,?,?,?, "EMITIDA")',
        [row.id, periodo, importe, vencimientoISO]
      );
      inserted += resIns.affectedRows || 0;
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error('[scheduler] error emitiendo:', e);
    return;
  } finally {
    conn.release();
  }
  console.log(`[scheduler] periodo=${periodo} solicitados=${socios.length} insertados=${inserted}`);
}

function currentPeriodo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}

async function runOnce() {
  const periodo = currentPeriodo();
  const importe = Number(process.env.IMPORTE_SOCIO || 8000);
  const venceDia = Number(process.env.VENCE_DIA || 28);
  const d = new Date();
  const venc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), venceDia, 3, 0, 0)); // 00:00-03:00UTC ~ AR 00:00
  const vencISO = venc.toISOString().slice(0,10);
  await emitir(periodo, importe, vencISO);
}

if (process.env.RUN_NOW === '1') {
  runOnce().then(()=>process.exit(0));
} else {
  console.log('[scheduler] arrancando cron 02:00 día 1 (TZ contenedor)');
  cron.schedule('0 2 1 * *', runOnce);
}
