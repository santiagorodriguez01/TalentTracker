import asyncH from '../middleware/asyncHandler.js';
import RepositoryFactory from '../../domain/repositories/RepositoryFactory.js';
import {getConnection,query} from '../../db/connection.js';
import {audit} from '../../domain/utils/audit.js';
import { setPaginationHeaders, parsePageSize } from '../../domain/utils/pagination.js';
import { sincronizarRolesConTablas } from '../../domain/services/RolesService.js';
import path from 'path';
import { promises as fs } from 'fs';
import QRCode from 'qrcode';

const personas = RepositoryFactory.persona();
const ALLOWED_ROLES = [
  'SOCIO',
  'ALUMNO',
  'JUGADOR',
  'PERSONAL',
  'PERSONAL_CAJA',
  'REVISOR_CUENTA',
  'COORDINADOR',
  'DIRECTIVO',
  'BOLETERIA'
];
const DEFAULT_ROLE = 'SOCIO';

function normalizeRoles(rawRoles) {
  const seen = new Set();
  const result = [];
  if (Array.isArray(rawRoles)) {
    for (const raw of rawRoles) {
      if (typeof raw !== 'string') continue;
      const role = raw.trim().toUpperCase();
      if (!ALLOWED_ROLES.includes(role)) continue;
      if (seen.has(role)) continue;
      seen.add(role);
      result.push(role);
    }
  }
  if (!result.length) result.push(DEFAULT_ROLE);
  return result;
}

async function replacePersonaRoles(personaId, roles, conn) {
  const safeRoles = normalizeRoles(roles);
  const primary = safeRoles[0] || DEFAULT_ROLE;
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  try {
    await connection.execute('DELETE FROM persona_rol WHERE persona_id=?', [personaId]);
    for (const role of safeRoles) {
      await connection.execute(
        'INSERT INTO persona_rol (persona_id, rol) VALUES (?, ?)',
        [personaId, role]
      );
    }
    await connection.execute('UPDATE persona SET rol=? WHERE id=?', [primary, personaId]);
    
    // Sincronizar con tablas especificas (socio, alumno, jugador)
    await sincronizarRolesConTablas(personaId, safeRoles, connection);
  } finally {
    if (shouldRelease) connection.release();
  }
  return { primary, roles: safeRoles };
}

async function loadPersonaRoles(personaId, fallbackRol) {
  const rows = await query(
    'SELECT rol FROM persona_rol WHERE persona_id=? ORDER BY id',
    [personaId]
  );
  const roles = rows.map(r => r.rol).filter(Boolean);
  if (roles.length) return roles;
  return fallbackRol ? [fallbackRol] : [];
}


export const getById = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query('SELECT id, nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, foto, qr_url, qr_ver, rol, estado FROM persona WHERE id=?', [id]);
  if (!rows.length) return res.status(404).json({ message: 'No existe persona' });
  const persona = rows[0];
  persona.roles = await loadPersonaRoles(id, persona.rol);
  persona.rol = persona.roles[0] || persona.rol || DEFAULT_ROLE;
  res.json(persona);
});

export const list = asyncH(async (req, res) => {
  const { page, size } = parsePageSize(req.query);
  const { rows, total } = await personas.list({ ...req.query, page, size });
  setPaginationHeaders(res, total, { page, size }, req);
  res.json({ data: rows, total, page, size });
});

export const create = asyncH(async (req, res) => {
  const {
    nombre,
    apellido,
    dni,
    fecha_nac,
    email,
    telefono,
    domicilio,
    foto,
    genero
  } = req.body;
  const initialRoles = Array.isArray(req.body?.roles) ? req.body.roles : (req.body?.rol ? [req.body.rol] : []);
  const roles = normalizeRoles(initialRoles);
  const primary = roles[0] || DEFAULT_ROLE;
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.execute(
      `INSERT INTO persona
        (nombre, apellido, genero, dni, fecha_nac, email, telefono, domicilio, foto, rol)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        nombre,
        apellido,
        genero || null,
        dni,
        fecha_nac || null,
        email || null,
        telefono || null,
        domicilio || null,
        foto || null,
        primary
      ]
    );
    const personaId = ins.insertId;
    await replacePersonaRoles(personaId, roles, conn);
    await conn.commit();
    await audit(req.user?.id, 'CREAR', 'persona', personaId, { nombre, apellido, dni, roles });
    res.status(201).json({ message: 'Persona creada', id: personaId, roles });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: { message: 'DNI ya registrado' } });
    }
    throw e;
  } finally {
    conn.release();
  }
});
export const update = asyncH(async (req, res) => {
  const personaId = Number(req.params.id);
  const body = req.body || {};
  const hasRolesField = Object.prototype.hasOwnProperty.call(body, 'roles') || Object.prototype.hasOwnProperty.call(body, 'rol');
  const rolesPayload = hasRolesField
    ? (Object.prototype.hasOwnProperty.call(body, 'roles') ? body.roles : [body.rol])
    : null;
  const normalizedRoles = rolesPayload != null ? normalizeRoles(rolesPayload) : null;

  const allowed = ['nombre','apellido','dni','fecha_nac','email','telefono','domicilio','foto','estado','genero'];
  const sets = [];
  const params = [];
  const changed = [];
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      sets.push(`${field}=?`);
      params.push(body[field] ?? null);
      changed.push(field);
    }
  }

  if (!sets.length && normalizedRoles === null) {
    return res.status(400).json({ error: { message: 'Nada para actualizar' } });
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    if (sets.length) {
      params.push(personaId);
      await conn.execute(`UPDATE persona SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    let appliedRoles = null;
    if (normalizedRoles !== null) {
      const { roles } = await replacePersonaRoles(personaId, normalizedRoles, conn);
      appliedRoles = roles;
      changed.push('roles');
    }
    await conn.commit();
    await audit(req.user?.id, 'ACTUALIZAR', 'persona', personaId, { cambiado: changed });
    res.json({ message: 'Persona actualizada', roles: appliedRoles });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
export const softDelete=asyncH(async(req,res)=>{
  
  await personas.softDelete(req.params.id);
  await audit(req.user?.id,'BAJA_LOGICA','persona',+req.params.id,null);
  res.json({message:'Persona dada de baja'})
  ;
});

export const clearRoles = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const { roles } = await replacePersonaRoles(id, [], null);
  await audit(req.user?.id, 'ACTUALIZAR_ROL', 'persona', id, { roles });
  res.status(204).end();
});

export const setRoles = asyncH(async (req, res) => {
  const id = Number(req.params.id);
  const { roles } = await replacePersonaRoles(id, req.body?.roles, null);
  await audit(req.user?.id, 'ACTUALIZAR_ROL', 'persona', id, { roles });
  res.json({ message: 'Roles actualizados', rol: roles[0], roles });
});

export async function uploadFoto(req, res) {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ message: 'Archivo requerido (file)' });

  // Guardamos en /uploads/personas/:id/
  const fotoUrl = `/uploads/personas/${id}/${req.file.filename}`;
  await query('UPDATE persona SET foto=? WHERE id=?', [fotoUrl, id]);
  await audit(req.user?.id, 'SUBIR_FOTO', 'persona', id, { foto: fotoUrl });
  res.status(201).json({ foto_url: fotoUrl });
}

export async function getPersonaById(req, res) {
  const [rows] = await pool.query('SELECT * FROM persona WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'No existe persona' });
  res.json(rows[0]);
}

export async function uploadFotoPersona(req, res) {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ message: 'Archivo requerido (file)' });


  const fotoUrl = `/uploads/personas/${id}/${req.file.filename}`;

  await pool.query('UPDATE persona SET foto=? WHERE id=?', [fotoUrl, id]);
  res.json({ foto_url: fotoUrl });
}

export async function generarQrPersona(req, res) {
  const id = Number(req.params.id);


  const publicUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:3000'}/p/${id}`;


  const dir = path.join(process.cwd(), 'uploads', 'qr');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `persona_${id}.png`);
  await QRCode.toFile(filePath, publicUrl, { margin: 1, width: 256 });

  const qrUrl = `/uploads/qr/persona_${id}.png`;
  await pool.query('UPDATE persona SET qr_url=? WHERE id=?', [qrUrl, id]);
  res.json({ qr_url: qrUrl });
}

export async function getQrPersona(req, res) {
  const [rows] = await pool.query('SELECT qr_url FROM persona WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'No existe persona' });
  res.json({ qr_url: rows[0].qr_url || null });
}


export async function getPublicPersona(req, res) {
  const id = Number(req.params.id);
  const rows = await query(
    'SELECT id, nombre, apellido, rol FROM persona WHERE id=?',
    [id]
  );
  if (!rows.length) return res.status(404).json({ message: 'No existe persona' });
  const persona = rows[0];
  const roles = await loadPersonaRoles(id, persona.rol);
  const primaryRole = roles[0] || persona.rol || DEFAULT_ROLE;

  let socio = null;
  const socioEligible = roles.some((role) =>
    ['SOCIO','ALUMNO','JUGADOR','PERSONAL','PERSONAL_CAJA','COORDINADOR','DIRECTIVO'].includes(role)
  );
  if (socioEligible) {
    const socioRows = await query(
      'SELECT estado_cuenta, nro_socio FROM socio WHERE persona_id=? LIMIT 1',
      [id]
    );
    socio = socioRows[0] || null;
  }

  res.json({
    id: persona.id,
    nombre: persona.nombre,
    apellido: persona.apellido,
    rol: primaryRole,
    roles,
    socio: socio ? { estado_cuenta: socio.estado_cuenta, nro_socio: socio.nro_socio } : null
  });
}
