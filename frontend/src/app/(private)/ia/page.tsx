'use client';
import React from 'react';
import { Card, CardContent, Grid, Typography, Box, Button, Avatar, Stack } from '@mui/material';
import Face6Rounded from '@mui/icons-material/Face6Rounded';
import VideocamRounded from '@mui/icons-material/VideocamRounded';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import Link from 'next/link';
import { useIAStore } from '@/store/ia';
import { http } from '@/lib/http';
 

export default function AIDashboard() {
  const selected = useIAStore(s => s.selectedAlumno);
  const clear = useIAStore(s => s.clear);
  const [enrolled, setEnrolled] = React.useState<boolean | null>(null);
  const [thumb, setThumb] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Array<{ kind: 'ALUMNO'|'JUGADOR'; id: number; persona_id?: number; name: string; thumb?: string | null; href: string }>>([]);
  const [loadingList, setLoadingList] = React.useState(false);

  // Imagen con fallback de múltiples fuentes (thumb_200 -> foto_600 -> biometric_enroll)
  function SmartThumb({ sources, alt }: { sources: string[]; alt: string }){
    const [i, setI] = React.useState(0);
    const src = sources[i] || '';
    if (!src) return <Avatar sx={{ width: 44, height: 44 }}>{alt?.charAt(0) || '?'}</Avatar>;
    return (
      <img
        src={src}
        alt={alt}
        width={44}
        height={44}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setI((v) => v + 1)}
      />
    );
  }

  React.useEffect(() => {
    (async () => {
      try {
        if (!selected?.id) { setEnrolled(null); return; }
        const r = await http.get(`/ai/alumnos/${selected.id}/biometric`);
        setEnrolled(!!r.data?.enrolled);
        setThumb(r.data?.thumbnail_url || null);
      } catch { setEnrolled(null); }
    })();
  }, [selected?.id]);

  // Cargar todos los alumnos y jugadores para listar accesos directos
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        const [al, ju] = await Promise.allSettled([
          http.get('/alumnos', { params: { page: 1, size: 100 } }),
          http.get('/jugadores', { params: { page: 1, size: 100 } }),
        ]);
        const list: Array<{ kind: 'ALUMNO'|'JUGADOR'; id: number; persona_id?: number; name: string; thumb?: string | null; href: string }> = [];

        const toArray = (v: any): any[] => {
          if (Array.isArray(v)) return v;
          if (Array.isArray(v?.data)) return v.data;
          if (Array.isArray(v?.rows)) return v.rows;
          if (Array.isArray(v?.items)) return v.items;
          return [];
        };

        if (al.status === 'fulfilled') {
          const arr = toArray(al.value?.data);
          for (const r of arr) {
            const pid = r.persona_id ?? r.id; // fallback si API devuelve persona_id distinto
            const name = `${r.apellido || ''} ${r.nombre || ''}`.trim() || `Alumno #${r.id}`;
            const thumbUrl = pid ? `/api/proxy/files/personas/${pid}/thumb_200.jpg` : null;
            list.push({ kind: 'ALUMNO', id: Number(r.id), persona_id: pid, name, thumb: thumbUrl, href: `/alumnos/${r.id}` });
          }
        }
        if (ju.status === 'fulfilled') {
          const arr = toArray(ju.value?.data);
          for (const r of arr) {
            const pid = r.persona_id ?? r.id;
            const name = `${r.apellido || ''} ${r.nombre || ''}`.trim() || `Jugador #${r.id}`;
            const thumbUrl = pid ? `/api/proxy/files/personas/${pid}/thumb_200.jpg` : null;
            list.push({ kind: 'JUGADOR', id: Number(r.id), persona_id: pid, name, thumb: thumbUrl, href: `/jugadores/${r.id}` });
          }
        }
        // Ordenar por nombre
        list.sort((a,b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        setItems(list);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);
  // Fuentes candidatas de imagen por item
  const sourcesFor = (it: { kind: 'ALUMNO'|'JUGADOR'; id: number; persona_id?: number; thumb?: string | null; name: string }): string[] => {
    const arr: string[] = [];
    // Priorizar la carpeta de alumnos si existe (biométrico) para evitar desfasajes de persona_id
    if (it.kind === 'ALUMNO') {
      arr.push(`/api/proxy/files/alumnos/${it.id}/biometric_enroll.jpg`);
      arr.push(`/api/proxy/files/alumnos/${it.id}/foto_600.jpg`);
    }
    // Luego, foto de la persona vinculada
    if (it.persona_id) {
      arr.push(`/api/proxy/files/personas/${it.persona_id}/thumb_200.jpg`);
      arr.push(`/api/proxy/files/personas/${it.persona_id}/foto_600.jpg`);
    }
    // Finalmente cualquier URL ya calculada previamente
    if (it.thumb) arr.push(it.thumb);
    return arr;
  };
  const modules = [
    {
      title: 'Enrolamiento Biométrico',
      desc: 'Registra el rostro de los alumnos para el reconocimiento facial.',
      icon: <Face6Rounded sx={{ fontSize: 46, color: 'primary.main' }} />,
      href: '/ia/biometric',
    },
    {
      title: 'Monitoreo en Vivo',
      desc: 'Analiza el rendimiento físico en tiempo real a través de la cámara.',
      icon: <VideocamRounded sx={{ fontSize: 46, color: 'secondary.main' }} />,
      href: '/ia/performance/live',
    },
    {
      title: 'Análisis de Video',
      desc: 'Sube un video para generar métricas automáticas del rendimiento.',
      icon: <UploadFileRounded sx={{ fontSize: 46, color: 'success.main' }} />,
      href: '/ia/performance/upload',
    },
  ];

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          px: { xs: 1, sm: 2 },
        }}
      >
        <AutoAwesomeRounded color="primary" sx={{ fontSize: 34 }} />
        <Typography variant="h5" fontWeight={700}>
          Panel de Análisis
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ px: { xs: 1, sm: 2 } }}>
        {items.map((it) => (
          <Grid key={`${it.kind}-${it.id}`} item xs={12} sm={6} md={4} lg={3}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" gap={1.5} alignItems="center">
                <SmartThumb sources={sourcesFor(it)} alt={it.name} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap title={it.name}>{it.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{it.kind === 'ALUMNO' ? 'Alumno' : 'Jugador'}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={1} sx={{ mt: 1.25 }}>
                <Button component={Link as any} href={it.href as any} variant="contained" size="small">
                  Ir al perfil del alumno
                </Button>
              </Stack>
            </Card>
          </Grid>
        ))}
        {!loadingList && items.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">No hay alumnos o jugadores para mostrar.</Typography>
          </Grid>
        )}
      </Grid>

    </Box>
  );
}


