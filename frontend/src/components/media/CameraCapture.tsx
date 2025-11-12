'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void; // devuelve JPG listo para subir
  facingMode?: 'user' | 'environment';
};

export default function CameraCapture({ open, onClose, onCapture, facingMode = 'user' }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (!active) return;
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        console.error('getUserMedia error', e);
        setReady(false);
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [open, facingMode]);

  function takePhoto() {
    const video = videoRef.current!;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }, 'image/jpeg', 0.9);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Tomar foto</DialogTitle>
      <DialogContent>
        <Stack gap={1} sx={{ alignItems: 'center' }}>
          <video ref={videoRef} playsInline style={{ width: '100%', borderRadius: 8, background: '#0C0C0C' }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button disabled={!ready} variant="contained" onClick={takePhoto}>Capturar</Button>
      </DialogActions>
    </Dialog>
  );
}
