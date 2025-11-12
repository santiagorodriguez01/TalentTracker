import asyncH from '../middleware/asyncHandler.js';
import { listAudit } from '../../domain/services/AuthService.js';

export const list = asyncH(async (req, res) => {
  const rows = await listAudit(req.query || {});
  res.json({ data: rows });
});

export const me = asyncH(async (req, res) => {
  res.json({ user: req.user });
});
