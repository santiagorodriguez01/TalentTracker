'use client';
import * as React from 'react';
import { Box, Paper, Stack, Typography, Avatar, Divider } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const toFiles = (url?: string | null) => {
  if (!url) return null;
  let uStr = url as string;
  if (/^https?:\/\//i.test(uStr)) {
    try { uStr = new URL(uStr).pathname; } catch {}
  }
  let u = uStr.replace(/\\/g, '/');
  u = u.replace(/^\/??uploads\//, '/files/');
  if (u.startsWith('files/')) u = '/' + u;
  if (!u.startsWith('/files/')) u = '/files' + (u.startsWith('/') ? '' : '/') + u.replace(/^\/?/, '');
  return u;
};
const toAbs = (raw?: string | null) => {
  if (!raw) return null;
  return `${API_BASE}${raw}`;
};

type CuotaEstado = 'PAGA' | 'PENDIENTE' | 'VENCIDA';

function statusInfo(estado: CuotaEstado){
  switch(estado){
    case 'PAGA':
      return {
        label: 'Cuota paga',
        detail: 'Acceso completo a las instalaciones',
        color: 'success.main' as const,
        Icon: CheckCircleRounded
      };
    case 'PENDIENTE':
      return {
        label: 'Cuota pendiente',
        detail: 'Recordatorio del pago proximo a vencer',
        color: 'warning.main' as const,
        Icon: ScheduleRounded
      };
    case 'VENCIDA':
    default:
      return {
        label: 'Cuota vencida',
        detail: 'Acceso restringido hasta regularizacion de la cuota',
        color: 'error.main' as const,
        Icon: ErrorOutlineRounded
      };
  }
}

export default function QrPublicView(){
  const { id } = useParams<{ id: string }>();
  const personaId = Number(id);

  const { data: persona } = useQuery({
    queryKey: ['qr-persona', personaId],
    queryFn: async ()=> (await api.get(`/personas/${personaId}`)).data,
    enabled: Number.isFinite(personaId),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 45000,
  });

  const { data: socioResp } = useQuery({
    queryKey: ['qr-socio', personaId],
    queryFn: async ()=> (await api.get('/socios', { params: { persona_id: personaId, page:1, size:1 } })).data,
    enabled: Number.isFinite(personaId),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 45000,
  });
  const socio: any = (socioResp?.data?.[0]) || (socioResp?.rows?.[0]) || null;

  // Mapeo flexible de estado de cuota (cuando este disponible)
  const rawEstado: string | undefined = socio?.estado_cuota || socio?.estado_cuenta || undefined;
  let estado: CuotaEstado = 'PAGA'; // por ahora mostrar PAGA
  if (typeof rawEstado === 'string'){
    const s = rawEstado.trim().toUpperCase();
    if (['PENDIENTE','PENDIENTE_DE_PAGO','PENDIENTE PAGO'].includes(s)) estado = 'PENDIENTE';
    else if (['VENCIDA','VENCIDO','MOROSO'].includes(s)) estado = 'VENCIDA';
    else if (['PAGA','AL_DIA','AL DIA'].includes(s)) estado = 'PAGA';
  }
  const S = statusInfo(estado);

  function StatusBlock({ variant }: { variant: CuotaEstado }){
    const I = statusInfo(variant);
    return (
      <Stack spacing={0.5} alignItems="center">
        <Stack direction="row" alignItems="center" spacing={1}>
          <I.Icon sx={{ color: I.color }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: I.color }}>
            {I.label}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {I.detail}
        </Typography>
      </Stack>
    );
  }

  const nombre = persona?.nombre || '';
  const apellido = persona?.apellido || '';
  const rol = (()=>{
    const arr = Array.isArray(persona?.roles) ? persona.roles : [];
    const labels = arr.map((r:any)=> r?.rol || r).filter(Boolean);
    if (labels.length) return labels.join(', ');
    return persona?.rol || (socio ? 'SOCIO' : '');
  })();
  const fotoAbs = toAbs(toFiles(persona?.foto ?? null));
  const [imgBust] = React.useState(() => Date.now());
  const foto = React.useMemo(()=>{
    const f = fotoAbs || '/avatar-placeholder.svg';
    if (!fotoAbs) return f;
    return `${f}${f.includes('?') ? '&' : '?'}_=${imgBust}`;
  },[fotoAbs, imgBust]);

  return (
    <Box sx={{ minHeight: '100dvh', display:'grid', placeItems:'center', p:2 }}>
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 520, p: 3, borderRadius: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Avatar
            src={foto}
            imgProps={{ crossOrigin:'anonymous', onError:(e:any)=>{ e.currentTarget.src='/avatar-placeholder.svg'; } }}
            sx={{ width: 120, height: 120, borderRadius: 3 }}
          />

          <Typography variant="h5" fontWeight={800}>
            {apellido} {nombre}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {rol} #{personaId}
          </Typography>

          <StatusBlock variant={estado} />
        </Stack>
      </Paper>

      {/* Vista previa de estados (en columna) */}
      <Box sx={{ mt: 3, width: '100%', maxWidth: 520 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Vista de estados de cuota
            </Typography>
            <StatusBlock variant="PAGA" />
            <Divider flexItem sx={{ my: 0.5 }} />
            <StatusBlock variant="PENDIENTE" />
            <Divider flexItem sx={{ my: 0.5 }} />
            <StatusBlock variant="VENCIDA" />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
