import asyncH from '../middleware/asyncHandler.js';
import path from 'path';
import fs from 'fs/promises';
import { uploadPdfFor } from '../../domain/utils/uploads.js';
import { listAlumnos, getAlumno, createAlumno, updateAlumno, deleteAlumno } from '../../domain/services/AlumnosService.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';
import { query } from '../../db/connection.js';

export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  const { rows, total } = await listAlumnos({ ...req.query, page, size });
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

export const get = asyncH(async (req,res)=> {
  const row = await getAlumno(Number(req.params.id));
  if (!row) return res.status(404).json({ error:{ message:'Alumno no encontrado' }});
  res.json(row);
});

// Lista de alumnos para el coordinador logueado (usando su persona_id)
export const listForCoordinador = asyncH(async (req, res) => {
  // Resolvemos persona_id del usuario
  const { query } = await import('../../db/connection.js');
  const [{ persona_id }] = await query('SELECT persona_id FROM usuario WHERE id=?', [req.user.id]);
  if (!persona_id) return res.json({ data: [], total: 0, page: 1, size: 0 });
  
  // Obtener el deporte asignado al coordinador (si tiene uno específico)
  const deportesCoord = await query(
    'SELECT deporte_id FROM coordinador_deporte WHERE coordinador_id = ? AND activo = 1 LIMIT 1',
    [persona_id]
  );
  const coordinador_deporte_id = deportesCoord[0]?.deporte_id || null;
  
  const { page, size } = parsePageSize(req.query);
  const { rows, total } = await listAlumnos({ 
    ...req.query, 
    coordinador_id: persona_id, 
    coordinador_deporte_id,
    page, 
    size 
  });
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

// Catálogos simples para filtros (deporte / categoria)
export const catalogDeportes = asyncH(async (req, res) => {
  const { query } = await import('../../db/connection.js');
  
  // Si es un coordinador, verificar si tiene un deporte específico asignado
  let deporteFilter = null;
  if (req.user && req.user.rol_sistema === 'COORDINADOR') {
    const [{ persona_id }] = await query('SELECT persona_id FROM usuario WHERE id=?', [req.user.id]);
    if (persona_id) {
      const deportesCoord = await query(
        'SELECT d.nombre FROM coordinador_deporte cd JOIN deporte d ON d.id = cd.deporte_id WHERE cd.coordinador_id = ? AND cd.activo = 1 LIMIT 1',
        [persona_id]
      );
      if (deportesCoord[0]) {
        deporteFilter = deportesCoord[0].nombre;
      }
    }
  }
  
  try {
    let rows;
    if (deporteFilter) {
      // Si el coordinador tiene un deporte específico, solo devolver ese
      rows = await query('SELECT nombre FROM deporte WHERE nombre = ? ORDER BY nombre', [deporteFilter]);
    } else {
      rows = await query('SELECT nombre FROM deporte ORDER BY nombre');
    }
    return res.json(rows.map((r)=> r.nombre));
  } catch {
    const rows = await query("SELECT DISTINCT deporte AS nombre FROM alumno WHERE deporte IS NOT NULL AND deporte<>'' ORDER BY deporte");
    return res.json(rows.map((r)=> r.nombre));
  }
});

export const catalogCategorias = asyncH(async (_req, res) => {
  const { query } = await import('../../db/connection.js');
  try {
    const rows = await query('SELECT nombre FROM categoria ORDER BY nombre');
    return res.json(rows.map((r)=> r.nombre));
  } catch {
    const rows = await query("SELECT DISTINCT categoria AS nombre FROM alumno WHERE categoria IS NOT NULL AND categoria<>'' ORDER BY categoria");
    return res.json(rows.map((r)=> r.nombre));
  }
});

export const create = asyncH(async (req,res)=> {
  const result = await createAlumno(req.body, req.user?.id);
  res.status(201).json({ message:'Alumno creado', ...result });
});

export const update = asyncH(async (req,res)=> {
  const ok = await updateAlumno(Number(req.params.id), req.body, req.user?.id);
  if (!ok) return res.status(404).json({ error:{ message:'Alumno no encontrado o sin cambios' }});
  res.json({ message:'Alumno actualizado' });
});

export const remove = asyncH(async (req,res)=> {
  const ok = await deleteAlumno(Number(req.params.id), req.user?.id);
  if (!ok) return res.status(404).json({ error:{ message:'Alumno no encontrado' }});
  res.json({ message:'Alumno eliminado' });
});




export const uploadAptoMw = uploadPdfFor('alumnos', 'apto.pdf').single('file');


export const uploadApto = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: { message: 'Archivo PDF requerido (field: file)' } });

  const rel = `/files/alumnos/${id}/apto.pdf`;
  
  await updateAlumno(id, { apto_pdf: rel, apto_medico: new Date() }, req.user?.id);
  res.status(201).json({ ok: true, apto_pdf: rel });
});


export const downloadApto = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const abs = path.join('/app/uploads', 'alumnos', String(id), 'apto.pdf');
  try { await fs.access(abs); } catch { return res.status(404).json({ error: { message: 'Archivo no encontrado' } }); }
  if (req.query.download) res.setHeader('Content-Disposition', 'attachment; filename="apto.pdf"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(abs);
});


export const deleteApto = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const abs = path.join('/app/uploads', 'alumnos', String(id), 'apto.pdf');
  try { await fs.unlink(abs); } catch {} 
  await updateAlumno(id, { apto_pdf: null }, req.user?.id);
  res.json({ ok: true, message: 'Apto medico eliminado' });
});

// === Asistencia ===
async function resolveCoordinadorPersonaId(userId){
  const rows = await query('SELECT persona_id FROM usuario WHERE id=?', [userId]);
  return rows[0]?.persona_id || null;
}

async function alumnoPerteneceACoordinador(alumnoId, coordPersonaId){
  const ex = await query(
    'SELECT 1 FROM alumno_coordinador WHERE alumno_id=? AND coordinador_id=? AND (fecha_hasta IS NULL OR fecha_hasta > CURDATE()) LIMIT 1',
    [alumnoId, coordPersonaId]
  );
  return ex.length > 0;
}

async function nombreToId(table, nombre){
  if (!nombre) return null;
  const rows = await query(`SELECT id FROM ${table} WHERE nombre=? LIMIT 1`, [nombre]);
  return rows[0]?.id || null;
}

export const marcarAsistencia = asyncH(async (req, res) => {
  const alumnoId = Number(req.params.id);
  const coordPid = await resolveCoordinadorPersonaId(req.user.id);
  if (!coordPid) return res.status(403).json({ error:{ message:'Sin persona asociada' }});
  const tienePermiso = await alumnoPerteneceACoordinador(alumnoId, coordPid);
  if (!tienePermiso) return res.status(403).json({ error:{ message:'No autorizado para este alumno' }});

  const { fecha, presente, observacion, deporte, categoria, turno } = req.body || {};
  // Resolver deporte/categoria desde body o desde fila de alumno
  let dep = deporte, cat = categoria;
  if (!dep || !cat) {
    return res.status(400).json({ error:{ message:'Deporte y Categoria son requeridos' }});
  }
  const depId = await nombreToId('deporte', dep);
  const catId = await nombreToId('categoria', cat);
  const turnoId = turno ? await nombreToId('turno', turno) : null;
  if (!depId || !catId) return res.status(400).json({ error:{ message:'Deporte/Categoria sin mapa a catalogo' }});

  const f = fecha && /^\d{4}-\d{2}-\d{2}$/.test(String(fecha)) ? fecha : null;
  // Insert or update
  const sql = `INSERT INTO asistencia_alumno (alumno_id, fecha, deporte_id, categoria_id, turno_id, presente, observacion)
               VALUES (?, ${f ? '?' : 'CURDATE()'}, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE presente=VALUES(presente), observacion=VALUES(observacion) `;
  const params = f ? [alumnoId, f, depId, catId, turnoId, (presente===false?0:1), observacion || null]
                   : [alumnoId, depId, catId, turnoId, (presente===false?0:1), observacion || null];
  await query(sql, params);
  res.status(201).json({ ok:true });
});

export const listarAsistenciasCoordinador = asyncH(async (req, res) => {
  const isAdmin = req.user.rol_sistema === 'ADMIN';
  const coordPid = await resolveCoordinadorPersonaId(req.user.id);
  
  // Si es ADMIN sin persona_id, mostrar todas las asistencias
  // Si es COORDINADOR sin persona_id, retornar vacío
  if (!coordPid && !isAdmin) return res.json([]);
  
  const { fecha, fecha_desde, fecha_hasta, deporte, categoria } = req.query || {};
  const where = [];
  const params = [];
  
  // Si es coordinador (no admin), filtrar por sus alumnos
  if (!isAdmin && coordPid) {
    where.push('EXISTS (SELECT 1 FROM alumno_coordinador ac WHERE ac.alumno_id=a.id AND ac.coordinador_id=? AND (ac.fecha_hasta IS NULL OR ac.fecha_hasta>CURDATE()))');
    params.push(coordPid);
    
    // Obtener el deporte asignado al coordinador (si tiene uno específico)
    const deportesCoord = await query(
      'SELECT deporte_id FROM coordinador_deporte WHERE coordinador_id = ? AND activo = 1 LIMIT 1',
      [coordPid]
    );
    const coordinador_deporte_id = deportesCoord[0]?.deporte_id || null;
    
    // Si el coordinador tiene un deporte específico, filtrar por ese deporte
    if (coordinador_deporte_id) {
      where.push('d.id = ?');
      params.push(Number(coordinador_deporte_id));
    }
  }
  
  if (fecha) { 
    where.push('s.fecha = ?'); 
    params.push(fecha); 
  } else {
    if (fecha_desde) { 
      where.push('s.fecha >= ?'); 
      params.push(fecha_desde); 
    }
    if (fecha_hasta) { 
      where.push('s.fecha <= ?'); 
      params.push(fecha_hasta); 
    }
  }
  
  // Solo permitir filtrar por deporte si es ADMIN o si el coordinador no tiene deporte específico
  if (deporte && (isAdmin || !coordPid)) { 
    where.push('d.nombre = ?'); 
    params.push(deporte); 
  }
  if (categoria) { 
    where.push('c.nombre = ?'); 
    params.push(categoria); 
  }
  
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  
  const rows = await query(
    `SELECT s.id, s.alumno_id, s.fecha, s.presente, s.observacion,
            p.apellido AS alumno_apellido, p.nombre AS alumno_nombre, p.dni AS alumno_dni,
            d.nombre AS deporte, c.nombre AS categoria
       FROM asistencia_alumno s
       JOIN alumno a   ON a.id = s.alumno_id
       JOIN persona p  ON p.id = a.persona_id
       JOIN deporte d  ON d.id = s.deporte_id
       JOIN categoria c ON c.id = s.categoria_id
      ${whereClause}
      ORDER BY s.fecha DESC, p.apellido, p.nombre`,
    params
  );
  res.json(rows);
});
