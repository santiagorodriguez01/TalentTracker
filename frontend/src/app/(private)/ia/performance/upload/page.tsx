'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import UploadFileRounded from '@mui/icons-material/UploadFileRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { http } from '@/lib/http';
import { useIAStore } from '@/store/ia';
import { useRouter } from 'next/navigation';

export default function UploadPerformancePage() {
  const selected = useIAStore(s => s.selectedAlumno);
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return alert('Por favor selecciona un archivo de video.');
    const formData = new FormData();
    formData.append('video', file);

    try {
      setLoading(true);
      if (!selected?.id) return alert('Seleccione un alumno primero');
      // Verificar enrolamiento biométrico antes de analizar
      const bio = await http.get(`/ai/alumnos/${selected.id}/biometric`);
      if (!bio.data?.enrolled) return router.replace('/ia/biometric');
      // Verificación facial rápida (captura 1 frame)
      try {
        const media = stream || await navigator.mediaDevices.getUserMedia({ video: true });
        if (!stream) setStream(media);
        if (videoRef.current) { videoRef.current.srcObject = media; await videoRef.current.play(); }
        await new Promise(r => setTimeout(r, 250));
        const canvas = document.createElement('canvas');
        const v = videoRef.current!;
        canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        canvas.getContext('2d')?.drawImage(v, 0, 0);
        const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg'));
        if (!blob) throw new Error('No se pudo capturar la cámara');
        const fd = new FormData();
        fd.append('image', blob);
        fd.append('challenge', 'blink');
        fd.append('evidence', JSON.stringify({ blink: true }));
        const ver = await http.post(`/ai/alumnos/${selected.id}/verify-face`, fd);
        if (!ver.data?.allow) {
          const reason = String(ver.data?.reason || '');
          const m = reason.match(/dist=([0-9.]+)/i);
          const dist = m ? Number(m[1]).toFixed(3) : undefined;
          const score = typeof ver.data?.score === 'number' ? ver.data.score.toFixed(3) : '-';
          throw new Error(`Verificación facial fallida (score ${score}${dist ? ", dist "+dist : ''})${reason ? ": "+reason : ''}`);
        }
      } catch (e: any) {
        alert((e?.message || 'No se pudo verificar el rostro del alumno.') + '\n\nConsejos:\n- Acerc\u00e1 el rostro y mir\u00e1 a la c\u00e1mara.\n- Us\u00e1 buena luz frontal (evit\u00e1 contraluces).\n- Quit\u00e1 gorras/anteojos y centr\u00e1 la cara.\n- Manten\u00e9 el tel\u00e9fono estable.');
        return;
      }
      const res = await http.post(`/ai/alumnos/${selected.id}/analyze-performance`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err: any) {
      alert('Error al enviar el video: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Análisis por Video
      </Typography>
      <Card variant="outlined" sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ display: 'grid', gap: 2 }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileRounded />}
          >
            Seleccionar video
            <input type="file" hidden accept="video/mp4,video/*" onChange={handleFileChange} />
          </Button>

          {file && (
            <Typography variant="body2" color="text.secondary">
              Video seleccionado: {file.name}
            </Typography>
          )}

          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!file || loading}
          >
            {loading ? <CircularProgress size={22} /> : 'Enviar a IA'}
          </Button>

          {result && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <CheckCircleRounded color="success" sx={{ fontSize: 40 }} />
              <Typography variant="body1" mt={1}>
                {result.message || 'Análisis completado con éxito.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {JSON.stringify(result, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
