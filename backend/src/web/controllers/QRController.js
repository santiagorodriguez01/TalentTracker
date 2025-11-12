import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { query } from '../../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

export const issueForPersona = async (req, res, next) => {
  try {
    const personaId = Number(req.params.id);
    if (!personaId) return res.status(400).json({ message: 'personaId invalido' });

    const token = jwt.sign({ pid: personaId }, JWT_SECRET, { expiresIn: '180d' });
    const urlPng = `${PUBLIC_BASE}/qr/${token}.png`;
    const urlView = `${PUBLIC_BASE}/qr/${token}/view`;

    await query(
      `UPDATE persona
          SET qr_ver = qr_ver + 1,
              qr_url = ?
        WHERE id = ?`,
      [urlPng, personaId]
    );

    res.json({ token, url_png: urlPng, url_view: urlView });
  } catch (err) {
    next(err);
  }
};

export const consumeTokenJSON = async (req, res, next) => {
  try {
    const { token } = req.params;
    const payload = jwt.verify(token, JWT_SECRET);
    try {
      const rows = await query(
        `SELECT p.id AS persona_id, p.dni, p.nombre, p.apellido, s.nro_socio
           FROM persona p
           LEFT JOIN socio s ON s.persona_id = p.id
          WHERE p.id = ?`,
        [payload.pid]
      );
      const info = rows[0] || {};
      return res.json({
        ok: true,
        payload,
        pid: payload.pid,
        persona_id: payload.pid,
        dni: info.dni || null,
        nombre: info.nombre || null,
        apellido: info.apellido || null,
        nro_socio: info.nro_socio || null
      });
    } catch {
      // si la consulta falla, retornar minimo
      return res.json({ ok: true, payload, pid: payload.pid, persona_id: payload.pid });
    }
  } catch (err) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ ok: false, message: 'Token invalido' });
    }
    next(err);
  }
};

export const viewHTML = async (req, res, next) => {
  try {
    const { token } = req.params;
    const payload = jwt.verify(token, JWT_SECRET);
    res.type('html').send(`
      <!doctype html><meta charset="utf-8">
      <title>Credencial</title>
      <h1>Credencial valida</h1>
      <p>Persona ID: ${payload.pid}</p>
    `);
  } catch (err) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(401).type('html').send('<h1>QR invalido o vencido</h1>');
    }
    next(err);
  }
};

export const pngForToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const url = `${PUBLIC_BASE}/qr/${token}/view`;
    res.type('png');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    await QRCode.toFileStream(res, url, { margin: 1, width: 256 });
  } catch (err) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'QR invalido' });
    }
    next(err);
  }
};

