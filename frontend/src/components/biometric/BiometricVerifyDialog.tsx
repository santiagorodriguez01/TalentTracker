'use client';
import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { http } from '@/lib/http';
import { getErrorMessage } from '@/utils/errors';

type Props = {
  open: boolean;
  onClose: () => void;
  userId: number;
  onVerified: () => Promise<void> | void; // se llama cuando allow === true
};

export default function BiometricVerifyDialog({ open, onClose, userId, onVerified }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [ready, setReady] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<string | null>(null);
  const [score, setScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        setError(null);
        setScore(null);
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (!active) return;
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e: any) {
        setError(e?.message || 'No se pudo acceder a la cámara');
        setReady(false);
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [open]);

  async function captureBlob(): Promise<Blob | null> {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  }

  async function verifyOnce(blob: Blob) {
    const file = new File([blob], `verificacion_${Date.now()}.jpg`, { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('image', file);
    fd.append('challenge', 'blink');
    fd.append('evidence', JSON.stringify({ blink: true }));
    const { data } = await http.post(`/ai/revisor/${userId}/verify-face`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { allow: boolean; score?: number; reason?: string };
  }

  async function verifyNow() {
    try {
      setSubmitting(true);
      setError(null);
      setScore(null);
      // Capturar 3 frames con pequeña espera y exigir al menos 2 OK
      const results: Array<{ allow: boolean; score?: number; reason?: string }> = [];
      for (let i = 0; i < 3; i++) {
        const blob = await captureBlob();
        if (!blob) continue;
        try { results.push(await verifyOnce(blob)); } catch (e) { /* ignore frame */ }
        await new Promise((r) => setTimeout(r, 200));
      }
      const oks = results.filter(r => !!r.allow);
      const last = results[results.length - 1];
      let sc: number | null = null;
      if (results.length) {
        const vals = results
          .map(r => Number(r.score ?? NaN))
          .filter(n => Number.isFinite(n));
        if (vals.length) sc = Math.min(...vals);
      }
      setScore(sc);
      if (oks.length < 2) {
        setDetail(last?.reason || null);
        setError('Verificación fallida. Intenta nuevamente.');
        return;
      }
      await Promise.resolve(onVerified());
      onClose();
    } catch (e: any) {
      setError(getErrorMessage(e, 'Error en verificación'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Verificación biométrica</DialogTitle>
      <DialogContent>
        <Stack gap={1} sx={{ alignItems: 'center', py: 1 }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', borderRadius: 8, background: '#0C0C0C' }}
          />
          <Typography variant="body2" color="text.secondary">
            Mirá a la cámara y parpadeá para verificar tu identidad.
          </Typography>
          {typeof score === 'number' && (
            <Typography variant="caption" color="text.secondary">
              score: {score.toFixed(3)}
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ alignSelf: 'stretch' }}>
              {error}
              {detail ? ` (${detail})` : ''}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button onClick={verifyNow} variant="contained" disabled={!ready || submitting}>
          {submitting ? <CircularProgress size={18} /> : 'Verificar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
