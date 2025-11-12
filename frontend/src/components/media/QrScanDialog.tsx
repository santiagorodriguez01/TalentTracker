'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Alert } from '@mui/material';
import { getErrorMessage } from '@/utils/errors';

type Props = {
  open: boolean;
  onClose: ()=>void;
  onDetected: (value: string)=>void;
};

export default function QrScanDialog({ open, onClose, onDetected }: Props){
  const videoRef = React.useRef<HTMLVideoElement|null>(null);
  const streamRef = React.useRef<MediaStream|null>(null);
  const zxingControlsRef = React.useRef<any>(null);
  const zxingReaderRef = React.useRef<any>(null);
  const [supported, setSupported] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(()=>{
    let active = true;
    async function start(){
      setError('');
      try {
        // @ts-ignore
        const Detector = (window as any).BarcodeDetector;
        if (Detector) {
          setSupported(true);
          streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
          if (!active) return;
          const video = videoRef.current!;
          video.srcObject = streamRef.current;
          await video.play();
          const detector = new Detector({ formats: ['qr_code'] });
          const tick = async () => {
            if (!active) return;
            try {
              // @ts-ignore accept HTMLVideoElement as source
              const codes = await detector.detect(video);
              if (codes && codes.length){
                const raw = codes[0].rawValue || '';
                onDetected(raw);
                onClose();
                return;
              }
            } catch {}
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          return;
        }

        // Fallback con ZXing para navegadores que no soportan BarcodeDetector
        try {
          const zxing = await import('@zxing/browser');
          const { BrowserQRCodeReader } = zxing as any;
          if (!BrowserQRCodeReader) throw new Error('ZXing no disponible');
          setSupported(true);
          const reader = new BrowserQRCodeReader();
          zxingReaderRef.current = reader;
          const video = videoRef.current!;
          const controls = await reader.decodeFromVideoDevice(
            undefined,
            video,
            (result: any) => {
              if (!active) return;
              if (result) {
                try { onDetected(result.getText ? result.getText() : String(result?.text || result)); }
                catch { onDetected(String(result)); }
                onClose();
              }
            },
            { facingMode: 'environment' } as any
          );
          zxingControlsRef.current = controls;
        } catch (err:any) {
          setSupported(false);
          setError(getErrorMessage(err, 'El lector de QR no es compatible'));
        }
      } catch (e:any) {
        setError(getErrorMessage(e, 'No se pudo iniciar la cámara'));
      }
    }
    if (open){ start(); }
    return ()=>{
      active = false;
      try { videoRef.current?.pause(); } catch {}
      try { zxingControlsRef.current?.stop?.(); } catch {}
      try { zxingReaderRef.current?.reset?.(); } catch {}
      streamRef.current?.getTracks().forEach(t=> t.stop());
      streamRef.current = null;
    };
  }, [open, onClose, onDetected]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Escanear QR</DialogTitle>
      <DialogContent>
        {!supported && (
          <Alert severity="info" sx={{ mb: 1 }}>
            El lector de QR no es compatible en este navegador. Ingrese el nǧmero manualmente en el campo correspondiente.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Stack gap={1} alignItems="center">
          <video ref={videoRef} playsInline style={{ width:'100%', borderRadius: 8, background:'#000' }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

