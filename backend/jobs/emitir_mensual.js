import '../src/setup/env.js';
import cron from 'node-cron';
import { query } from '../src/db/connection.js';

function yyyyMm(d=new Date()){
  return d.toISOString().slice(0,7); // YYYY-MM
}
function vencimiento(periodo, dia){
  // periodo: 'YYYY-MM', dia: '10' => 'YYYY-MM-10'
  const [y,m]=periodo.split('-').map(Number);
  const d = String(Math.max(1, Math.min(28, parseInt(dia||'10')))).padStart(2,'0');
  return `${y}-${String(m).padStart(2,'0')}-${d}`;
}

async function emitirPeriodo(periodo, total_importe, diaVenc){
  const venc = vencimiento(periodo, diaVenc);
  const sql = `
    INSERT INTO cuota (socio_id, periodo, importe, vencimiento, estado)
    SELECT s.id, ?, ?, ?, 'EMITIDA'
    FROM socio s
    JOIN persona p ON p.id = s.persona_id
    WHERE p.estado='ACTIVO'
      AND NOT EXISTS (
        SELECT 1 FROM cuota c
         WHERE c.socio_id=s.id AND c.periodo=?
      )`;
  const r = await query(sql, [periodo, total_importe, venc, periodo]);
  return r.affectedRows || 0;
}

async function runOnce(){
  const periodo = process.env.EMISION_PERIODO || yyyyMm(new Date()); 
  const total_importe = Number(process.env.EMISION_IMPORTE_DEFAULT || 5000);
  const diaVenc = process.env.EMISION_VENC_DIA || '10';
  const inserted = await emitirPeriodo(periodo, total_importe, diaVenc);
  console.log(`[EMISION] periodo=${periodo} importe=${total_importe} venc_dia=${diaVenc} insertados=${inserted}`);
}

async function main(){
  if (process.argv.includes('--run-once')) { await runOnce(); process.exit(0); }

  const spec = process.env.EMISION_CRON || '0 5 * * *'; // todos los días 05:00
  console.log(`[EMISION] scheduler activo: ${spec}`);
  cron.schedule(spec, async () => {
    const now = new Date();
    // sólo el día 1 de cada mes emite el período del mes en curso
    if (now.getDate() !== 1) return;
    try {
      await runOnce();
    } catch (e) {
      console.error('[EMISION err]', e);
    }
  }, { timezone: process.env.TZ || 'America/Argentina/Buenos_Aires' });
}
main();
