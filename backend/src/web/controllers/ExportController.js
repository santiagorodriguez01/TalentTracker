import { query } from '../../db/connection.js';

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

function renderCsv(res, rows, headers, filename, wantSep, forceDownload) {
  // headers de seguridad/UX
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.type('text/csv; charset=utf-8');

  const disp = forceDownload ? 'attachment' : 'inline';
  res.setHeader('Content-Disposition', `${disp}; filename="${filename}"`);

  const lines = [];
  if (wantSep) lines.push('sep=,');
  lines.push(headers.join(','));

  for (const r of rows) {
    lines.push(headers.map(k => csvEscape(r[k])).join(','));
  }

  // BOM + contenido
  res.send('\uFEFF' + lines.join('\n'));
}

/** GET /export/socios.csv?q=&estado=&plan=&sep=1&download=1 */
export async function sociosCsv(req, res, next) {
  try {
    const { q, estado, plan, sep, download } = req.query;
    const where = ['1=1'];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ? OR s.nro_socio LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (estado) {           // ACTIVO / INACTIVO (estado de persona)
      where.push('p.estado = ?');
      params.push(estado);
    }
    if (plan) {
      where.push('s.plan = ?');
      params.push(plan);
    }


  const rows = await query(
    `SELECT s.nro_socio, p.apellido, p.nombre, p.dni, p.email, p.telefono,
            pl.nombre AS plan, s.estado_cuenta
     FROM socio s
     JOIN persona p          ON p.id = s.persona_id
     LEFT JOIN socio_plan sp ON sp.socio_id = s.id AND sp.fecha_fin IS NULL
     LEFT JOIN plan pl       ON pl.id = sp.plan_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.apellido, p.nombre`,
    params
  );

    renderCsv(
      res,
      rows,
      ['nro_socio','apellido','nombre','dni','email','telefono','plan','estado_cuenta'],
      'socios.csv',
      sep != null,            // agrega "sep=," si viene cualquier valor de ?sep
      !!download
    );
  } catch (e) { next(e); }
}

/** GET /export/alumnos.csv?q=&deporte=&categoria=&estado=&sep=1&download=1 */
export async function alumnosCsv(req, res, next) {
  try {
    const { q, deporte, categoria, estado, sep, download } = req.query;
    const where = ['1=1'];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (deporte) { where.push('a.deporte = ?'); params.push(deporte); }
    if (categoria) { where.push('a.categoria = ?'); params.push(categoria); }
    if (estado) { where.push('p.estado = ?'); params.push(estado); }

    const rows = await query(
      `SELECT p.apellido, p.nombre, p.dni, a.deporte, a.categoria,
              CONCAT(COALESCE(pc.apellido,''), ', ', COALESCE(pc.nombre,'')) AS coordinador,
              a.apto_medico
       FROM alumno a
       JOIN persona p  ON p.id = a.persona_id
       LEFT JOIN persona pc ON pc.id = a.coordinador_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.apellido, p.nombre`,
      params
    );

    renderCsv(
      res,
      rows,
      ['apellido','nombre','dni','deporte','categoria','coordinador','apto_medico'],
      'alumnos.csv',
      sep != null,
      !!download
    );
  } catch (e) { next(e); }
}

/** GET /export/jugadores.csv?q=&puesto=&estado=&sep=1&download=1 */
export async function jugadoresCsv(req, res, next) {
  try {
    const { q, puesto, estado, sep, download } = req.query;
    const where = ['1=1'];
    const params = [];

    if (q) {
      where.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (puesto) { where.push('j.puesto = ?'); params.push(puesto); }
    if (estado) { where.push('p.estado = ?'); params.push(estado); }

    const rows = await query(
      `SELECT p.apellido, p.nombre, p.dni, j.puesto, j.dorsal
       FROM jugador j
       JOIN persona p ON p.id = j.persona_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.apellido, p.nombre`,
      params
    );

    renderCsv(
      res,
      rows,
      ['apellido','nombre','dni','puesto','dorsal'],
      'jugadores.csv',
      sep != null,
      !!download
    );
  } catch (e) { next(e); }
}
