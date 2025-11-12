import { query } from '../../db/connection.js';

export async function resumenCuotasPorPeriodo(periodo) {
  const rows = await query(
    `SELECT estado, COUNT(*) as cantidad, SUM(total_importe) as total
     FROM cuota WHERE periodo=? GROUP BY estado`, [periodo]
  );
  const tot = await query(
    `SELECT COUNT(*) as cantidad, SUM(total_importe) as total
     FROM cuota WHERE periodo=?`, [periodo]
  );
  return { resumen: rows, total: tot[0] || { cantidad:0, total:0 } };
}

export async function morosidadPorPeriodo(periodo) {
  const rows = await query(`
    SELECT s.id as socio_id, s.nro_socio, p.apellido, p.nombre,
           c.id as cuota_id, c.estado
    FROM socio s
    JOIN persona p ON p.id = s.persona_id
    LEFT JOIN cuota c ON c.socio_id = s.id AND c.periodo = ?
    WHERE p.estado = 'ACTIVO'
    ORDER BY p.apellido, p.nombre
  `, [periodo]);

  return rows.map(r => ({
    socio_id: r.socio_id,
    nro_socio: r.nro_socio,
    apellido: r.apellido,
    nombre: r.nombre,
    estado: r.cuota_id ? (r.estado === 'PAGADA' ? 'AL_DIA' : 'MOROSO') : 'MOROSO'
  }));
}
