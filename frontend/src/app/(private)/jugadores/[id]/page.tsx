'use client';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Button, Stack, Chip, CircularProgress, Snackbar, Alert } from '@mui/material';
import CameraCapture from '@/components/media/CameraCapture';
import { http } from '@/lib/http';
import { useIAStore } from '@/store/ia';

export default function JugadorDetail(){
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const jugadorId = Number(id);
  const [personaId, setPersonaId] = React.useState<number | null>(null);
  const [enrolled, setEnrolled] = React.useState<boolean | null>(null);
  const [thumb, setThumb] = React.useState<string | null>(null);
  const [openCam, setOpenCam] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ open:boolean; message:string }>({ open:false, message:'' });

  React.useEffect(()=>{
    (async()=>{
      try {
        const r = await http.get(`/jugadores/${jugadorId}`);
        const pid = r.data?.persona_id ?? null;
        setPersonaId(pid);
      } catch { setPersonaId(null); }
    })();
  },[jugadorId]);

  const loadStatus = React.useCallback(async () => {
    if (!personaId) return;
    try {
      const r = await http.get(`/ai/alumnos/${personaId}/biometric`);
      setEnrolled(!!r.data?.enrolled);
      setThumb(r.data?.thumbnail_url || null);
    } catch { setEnrolled(null); setThumb(null); }
  }, [personaId]);

  React.useEffect(()=>{ loadStatus(); },[loadStatus]);
  // Seleccionar alumno/persona para IA
  const setSelectedAlumno = useIAStore(s => s.setSelectedAlumno);
  React.useEffect(()=>{ if (personaId) setSelectedAlumno({ id: personaId }); },[personaId, setSelectedAlumno]);

  const enrollWith = async (blobFile: File) => {
    if (!personaId) return;
    const fd = new FormData(); fd.append('image', blobFile);
    try {
      setLoading(true);
      await http.post(`/ai/alumnos/${personaId}/enroll-face`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      await loadStatus();
      setToast({ open:true, message:'Enrolamiento completado. Listo para analizar.' });
    } finally { setLoading(false); }
  };
  const enroll = async () => {
    if (!personaId || !file) { setOpenCam(true); return; }
    await enrollWith(file);
  };

  return (
    <Box sx={{ p:2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Jugador #{jugadorId}</Typography>
      <Card variant="outlined" sx={{ maxWidth: 720 }}>
        <CardContent sx={{ display:'grid', gap:2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {thumb && <img src={thumb} alt="thumb" width={56} height={56} style={{ borderRadius: 8, objectFit: 'cover' }} />}
            <Typography variant="subtitle1" fontWeight={700}>Biometría</Typography>
            <Chip size="small" color={enrolled ? 'success' : 'warning'} label={enrolled ? 'Enrolado' : 'Sin enrolar'} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={()=> setOpenCam(true)}>Capturar imagen</Button>
            <Button variant="outlined" onClick={enroll} disabled={!file || loading || !personaId}>
              {loading ? <CircularProgress size={22}/> : 'Enviar a IA'}
            </Button>
            <Button variant="text" onClick={loadStatus}>Actualizar estado</Button>
          </Stack>
        </CardContent>
      </Card>

      <CameraCapture open={openCam} onClose={()=> setOpenCam(false)} onCapture={(f)=> { setFile(f); setTimeout(()=> enrollWith(f), 0); }} facingMode="user" />

      {enrolled && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 1 }}>Listo para analizar</Alert>
          <Card variant="outlined" sx={{ maxWidth: 720 }}>
            <CardContent>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => router.push('/ia/performance/live' as any)}>Monitoreo en Vivo</Button>
                <Button variant="outlined" onClick={() => router.push('/ia/performance/upload' as any)}>Análisis de Video</Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={()=> setToast({ open:false, message:'' })} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert onClose={()=> setToast({ open:false, message:'' })} severity="success" variant="filled">{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
