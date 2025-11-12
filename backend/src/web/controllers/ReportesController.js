import asyncH from '../middleware/asyncHandler.js';
import { resumenCuotasPorPeriodo, morosidadPorPeriodo } from '../../domain/services/ReportesService.js';

export const cuotasResumen = asyncH(async (req,res) => {
  const { periodo } = req.query;
  if (!/^\d{4}-\d{2}$/.test(periodo||'')) return res.status(400).json({ error:{ message:'periodo (YYYY-MM) requerido' }});
  res.json(await resumenCuotasPorPeriodo(periodo));
});

export const cuotasMorosidad = asyncH(async (req,res) => {
  const { periodo } = req.query;
  if (!/^\d{4}-\d{2}$/.test(periodo||'')) return res.status(400).json({ error:{ message:'periodo (YYYY-MM) requerido' }});
  res.json({ data: await morosidadPorPeriodo(periodo) });
});
