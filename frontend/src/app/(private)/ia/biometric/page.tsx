'use client';
import * as React from 'react';
import { Box, Typography, Button, Card, CardContent, CircularProgress, Chip, Stack } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { http } from '@/lib/http';
import { useIAStore } from '@/store/ia';
import CameraCapture from '@/components/media/CameraCapture';
import Link from 'next/link';

export default function BiometricEnrollPage() {
  const selected = useIAStore(s => s.selectedAlumno);
  const alumnoId = selected?.id || null;
  const [openCam, setOpenCam] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<any>(null);
  const [enrolled, setEnrolled] = React.useState<boolean | null>(null);
  const [thumb, setThumb] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    if (!alumnoId) return;
    try {
      const r = await http.get(`/ai/alumnos/${alumnoId}/biometric`);
      setEnrolled(!!r.data?.enrolled);
      setThumb(r.data?.thumbnail_url || null);
    } catch {
      setEnrolled(null);
      setThumb(null);
    }
  }, [alumnoId]);

  React.useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSubmit = async () => {
    if (!alumnoId || !file) return alert('Falta capturar imagen del alumno.');
    const formData = new FormData();
    formData.append('image', file);
    try {
      setLoading(true);
      const res = await http.post(`/ai/alumnos/${alumnoId}/enroll-face`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(res.data);
      await loadStatus();
    } catch (err: any) {
      alert('Error al enviar la imagen: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!alumnoId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Seleccioná un alumno para enrolar rostro</Typography>
        <Button component={Link as any} href={'/ia/select' as any} variant="outlined">Elegir alumno</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Enrolamiento biométrico</Typography>
      <Card variant="outlined" sx={{ maxWidth: 640, mx: 'auto' }}>
        <CardContent sx={{ display: 'grid', gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {thumb && <img src={thumb} alt="thumb" width={48} height={48} style={{ borderRadius: 8, objectFit: 'cover' }} />}
            <Typography variant="subtitle1" fontWeight={700}>
              {selected?.nombre ? `${selected?.nombre} (#${alumnoId})` : `Alumno #${alumnoId}`}
            </Typography>
            <Chip size="small" color={enrolled ? 'success' : 'warning'} label={enrolled ? 'Enrolado' : 'Sin enrolar'} />
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setOpenCam(true)}>Capturar imagen</Button>
            <Button variant="outlined" onClick={handleSubmit} disabled={!file || loading}>
              {loading ? <CircularProgress size={22} /> : 'Enviar a IA'}
            </Button>
            <Button variant="text" onClick={loadStatus}>Actualizar estado</Button>
          </Stack>

          {response && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <CheckCircleRounded color="success" sx={{ fontSize: 40 }} />
              <Typography variant="body1" mt={1}>
                {response.message || 'Rostro registrado correctamente.'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <CameraCapture
        open={openCam}
        onClose={() => setOpenCam(false)}
        onCapture={(f) => setFile(f)}
        facingMode="user"
      />
    </Box>
  );
}

