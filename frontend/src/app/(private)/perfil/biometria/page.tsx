'use client';
import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import CameraCapture from '@/components/media/CameraCapture';
import { http } from '@/lib/http';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/utils/errors';

export default function PerfilBiometriaPage() {
  const authUser = useAuthStore((s: any) => s.user as any);
  const userId: number | null = (authUser?.user?.id ?? authUser?.id ?? null) as number | null;

  const [openCam, setOpenCam] = React.useState(false);
  const [enrolled, setEnrolled] = React.useState<boolean | null>(null);
  const [thumb, setThumb] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    if (!userId) return;
    try {
      const r = await http.get(`/ai/usuarios/${userId}/biometric`);
      setEnrolled(!!r.data?.enrolled);
      setThumb(r.data?.thumbnail_url || null);
    } catch (e: any) {
      setEnrolled(null);
      setThumb(null);
    }
  }, [userId]);

  React.useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleCapture(file: File) {
    if (!userId) return;
    setError(null);
    setOkMsg(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await http.post(`/ai/usuarios/${userId}/enroll-face`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOkMsg('Enrolamiento realizado correctamente.');
      await loadStatus();
    } catch (e: any) {
      setError(getErrorMessage(e, 'No se pudo enrolar'));
    }
  }

  async function handleDelete() {
    if (!userId) return;
    setError(null); setOkMsg(null);
    const sure = window.confirm('¿Eliminar tu enrolamiento biométrico?');
    if (!sure) return;
    try {
      await http.delete(`/ai/usuarios/${userId}/biometric`);
      setOkMsg('Enrolamiento eliminado.');
      await loadStatus();
    } catch (e: any) {
      setError(getErrorMessage(e, 'No se pudo eliminar'));
    }
  }

  if (!userId) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">No se pudo determinar el usuario actual.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Biometría del revisor</Typography>
      <Card variant="outlined" sx={{ maxWidth: 720 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>Estado:</Typography>
              <Chip size="small" color={enrolled ? 'success' : 'warning'} label={enrolled ? 'Enrolado' : 'Sin enrolar'} />
              {thumb && (<img src={thumb} alt="thumb" width={56} height={56} style={{ borderRadius: 8, objectFit: 'cover' }} />)}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Capturá tu rostro con la cámara frontal para registrar tu biometría. Esta verificación será necesaria
              al aprobar o rechazar egresos de caja.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => setOpenCam(true)}>Capturar rostro</Button>
              <Button variant="outlined" onClick={loadStatus}>Actualizar estado</Button>
              {enrolled && (
                <Button variant="outlined" color="error" onClick={handleDelete}>Eliminar</Button>
              )}
            </Stack>

            {okMsg && <Alert severity="success">{okMsg}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      <CameraCapture
        open={openCam}
        onClose={() => setOpenCam(false)}
        onCapture={handleCapture}
        facingMode="user"
      />
    </Box>
  );
}
