import asyncH from '../middleware/asyncHandler.js';
import path from 'path';
import { ensureDir } from '../../domain/utils/uploads.js';
import { saveWithSharp } from '../../domain/services/ImageService.js';
import { query } from '../../db/connection.js';
import { audit } from '../../domain/utils/audit.js';
import fs from 'fs/promises';

const BASE = process.env.UPLOADS_DIR || '/app/uploads';

export const uploadMultipart = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const dir = path.join(BASE, 'personas', String(id));
  await saveWithSharp(req.file.path, dir);
  const publicPath = `/files/personas/${id}/foto_600.jpg`;
  await query('UPDATE persona SET foto=? WHERE id=?', [publicPath, id]);
  await audit(req.user?.id, 'FOTO_SUBIR', 'persona', id, { via: 'multipart' });
  res.status(201).json({ ok: true, url: publicPath });
});

export const uploadDataUrl = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const { dataUrl } = req.body || {};
  if (!dataUrl || !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
    return res.status(400).json({ error: { message: 'dataUrl invalido' } });
  }
  const b64 = dataUrl.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const dir = path.join(BASE, 'personas', String(id));
  await ensureDir(dir);
  const tmp = path.join(dir, 'from_dataurl.bin');
  await fs.writeFile(tmp, buf);
  await saveWithSharp(tmp, dir);
  const publicPath = `/files/personas/${id}/foto_600.jpg`;
  await query('UPDATE persona SET foto=? WHERE id=?', [publicPath, id]);
  await audit(req.user?.id, 'FOTO_SUBIR', 'persona', id, { via: 'dataurl', bytes: buf.length });
  res.status(201).json({ ok: true, url: publicPath });
});

export const remove = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  await query('UPDATE persona SET foto=NULL WHERE id=?', [id]);
  await audit(req.user?.id, 'FOTO_BORRAR', 'persona', id, null);
  res.json({ ok: true });
});

