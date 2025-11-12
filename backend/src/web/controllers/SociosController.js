import asyncH from '../middleware/asyncHandler.js';
import { listSocios, getSocio, createSocio, createSocioFromPersona, updateSocio, deleteSocio, validarSocioPorDni, validarSocioPorNroSocio } from '../../domain/services/SociosService.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';

export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  const { rows, total } = await listSocios({ ...req.query, page, size }); 
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});
export const get = asyncH(async (req,res) => {
  const row = await getSocio(Number(req.params.id));
  if (!row) return res.status(404).json({ error:{ message:'Socio no encontrado' }});
  res.json(row);
});

export const validarDni = asyncH(async (req, res) => {
  const dni = req.params.dni;
  const resultado = await validarSocioPorDni(dni);
  res.json(resultado);
});

export const validarNroSocio = asyncH(async (req, res) => {
  const nroSocio = req.params.nro_socio;
  const resultado = await validarSocioPorNroSocio(nroSocio);
  res.json(resultado);
});

export const create = asyncH(async (req,res) => {
  try {
    const result = await createSocio(req.body);
    res.status(201).json({ message:'Socio creado', ...result });
  } catch (e) {
    if (e.status === 409) return res.status(409).json({ error:{ message: e.message }});
    throw e;
  }
});

export const createFromPersona = asyncH(async (req,res) => {
  try {
    const result = await createSocioFromPersona(req.body);
    res.status(201).json({ message:'Socio creado', ...result });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error:{ message: e.message }});
    throw e;
  }
});

export const update = asyncH(async (req,res) => {
  try {
    const ok = await updateSocio(Number(req.params.id), req.body);
    if (!ok) return res.status(404).json({ error:{ message:'Socio no encontrado' }});
    res.json({ message:'Socio actualizado' });
  } catch (e) {
    if (e.status === 409) return res.status(409).json({ error:{ message: e.message }});
    throw e;
  }
});

export const remove = asyncH(async (req,res) => {
  const ok = await deleteSocio(Number(req.params.id));
  if (!ok) return res.status(404).json({ error:{ message:'Socio no encontrado' }});
  res.json({ message:'Socio dado de baja' });
});
