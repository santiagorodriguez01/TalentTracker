import asyncH from '../middleware/asyncHandler.js';
import { listJugadores, getJugador, createJugador, updateJugador, deleteJugador } from '../../domain/services/JugadoresService.js';
import { audit } from '../../domain/services/AuditService.js';
import path from 'path';
import fs from 'fs/promises';
import { ensureDir, rmIfExists } from '../../domain/utils/uploads.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';

const BASE = process.env.UPLOADS_DIR || '/app/uploads';


export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  const { rows, total } = await listJugadores({ ...req.query, page, size });
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

export const get = asyncH(async (req,res)=> {
  const row = await getJugador(Number(req.params.id));
  if (!row) return res.status(404).json({ error:{ message:'Jugador no encontrado' }});
  res.json(row);
});

export const createFromPersona = asyncH(async (req,res)=> {
  const result = await createJugador(req.body, req.user?.id);
  res.status(201).json({ message:'Jugador creado', ...result });
});

export const update = asyncH(async (req,res)=> {
  try {
    const ok = await updateJugador(Number(req.params.id), req.body, req.user?.id);
    if (!ok) return res.status(404).json({ error:{ message:'Jugador no encontrado o sin cambios' }});
    res.json({ message:'Jugador actualizado' });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error:{ message: e.message }});
    throw e;
  }
});

export const remove = asyncH(async (req,res)=> {
  const ok = await deleteJugador(Number(req.params.id), req.user?.id);
  if (!ok) return res.status(404).json({ error:{ message:'Jugador no encontrado' }});
  res.json({ message:'Jugador eliminado' });
});





export const uploadContrato = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: { message: 'Archivo PDF requerido (field: file)' } });

  const dir = path.join(BASE, 'jugadores', String(id));
  await ensureDir(dir);

  const finalPath = path.join(dir, 'contrato.pdf');
  const hadPrev = await fs.stat(finalPath).then(() => true).catch(() => false);

  // Versionado opcional
  if (hadPrev && String(req.query.keepOld) === '1') {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0,14); // YYYYMMDDHHMMSS
    const bak = path.join(dir, `contrato_${ts}.pdf`);
    await fs.rename(finalPath, bak);
  } else if (hadPrev) {
    // sin versionar: simplemente se pisa (multer escribio al _tmp; todavia no movimos)
    // no hay nada que hacer aca
  }

  // Mover del temporal al destino definitivo
  await fs.rename(req.file.path, finalPath);

  const rel = `/files/jugadores/${id}/contrato.pdf`;
  await updateJugador(id, { contrato_pdf: rel }, req.user?.id);
  await audit(req.user?.id, 'JUGADOR_CONTRATO_SUBIR', 'jugador', id, { keepOld: String(req.query.keepOld) === '1' });

  res.status(201).json({ ok: true, contrato_pdf: rel });
});

/** Descargar/Ver contrato con opcion de forzar descarga (?download=1 o ?disposition=attachment) */
export const downloadContrato = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const abs = path.join(BASE, 'jugadores', String(id), 'contrato.pdf');
  const exists = await fs.stat(abs).then(() => true).catch(() => false);
  if (!exists) return res.status(404).json({ error: { message: 'Contrato no encontrado' } });

  const disp = (req.query.disposition || (req.query.download ? 'attachment' : 'inline'));
  if (disp === 'attachment') {
    res.setHeader('Content-Disposition', `attachment; filename="contrato_${id}.pdf"`);
  } else {
    res.setHeader('Content-Disposition', 'inline');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(abs);
});

/** Eliminar contrato: borra archivo + limpia campo en DB */
export const deleteContrato = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const abs = path.join(BASE, 'jugadores', String(id), 'contrato.pdf');
  await rmIfExists(abs);
  const changed = await updateJugador(id, { contrato_pdf: null }, req.user?.id);
  if (!changed) return res.status(404).json({ error: { message: 'Jugador no encontrado' } });
  await audit(req.user?.id, 'JUGADOR_CONTRATO_BORRAR', 'jugador', id, null);
  res.json({ ok: true, message: 'Contrato eliminado' });
  });
