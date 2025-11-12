"use client";
import * as React from "react";
import { Box, Typography, Button, Card, CardContent, CircularProgress, Alert, Stack, Chip, Divider } from "@mui/material";
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import { http } from "@/lib/http";
import { useIAStore } from "@/store/ia";
import { useRouter } from "next/navigation";
import { usePerformanceWS } from "@/hooks/usePerformanceWS";

export default function LivePerformancePage() {
  const selected = useIAStore((s) => s.selectedAlumno);
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [capturing, setCapturing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [overlay, setOverlay] = React.useState<string | null>(null);
  const [jump, setJump] = React.useState<number | null>(null);
  const [previews, setPreviews] = React.useState<Array<{ src: string; ts: number }>>([]);
  const COMPACT_MAX_W = 360; // ancho mximo para vista compacta en captura
  const { connected, lastMetrics, error: wsError, sendFrameB64 } = usePerformanceWS();
  const loopRef = React.useRef<null | number>(null);
  const runningRef = React.useRef(false);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream as any;
      setStreaming(true);
    } catch {
      alert("Error al acceder a la camara.");
    }
  }

  async function waitVideoReady(): Promise<void> {
    const v = videoRef.current;
    if (!v) return;
    if (v.videoWidth > 0 && v.videoHeight > 0) return;
    await new Promise<void>((resolve) => {
      const onMeta = () => { v.removeEventListener('loadedmetadata', onMeta); resolve(); };
      v.addEventListener('loadedmetadata', onMeta, { once: true });
    });
  }

  async function captureFrameBlob(): Promise<Blob | null> {
    const v = videoRef.current;
    if (!v) return null;
    await waitVideoReady();
    const w = Math.max(640, v.videoWidth || 640);
    const h = Math.max(480, v.videoHeight || 480);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  }

  async function captureFrameB64(): Promise<string | null> {
    const v = videoRef.current;
    if (!v) return null;
    await waitVideoReady();
    const w = Math.max(640, v.videoWidth || 640);
    const h = Math.max(480, v.videoHeight || 480);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const m = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
    return m ? m[1] : null;
  }

  async function verifyAlumnoNow(): Promise<{ ok: boolean; score?: number; reason?: string }> {
    if (!selected?.id) return { ok: false };
    // Intentar varios frames por robustez (detección de rostro puede fallar)
    const tries = 4;
    let lastReason: string | undefined;
    for (let i = 0; i < tries; i++) {
      try {
        const blob = await captureFrameBlob();
        if (!blob) continue;
        const fd = new FormData();
        fd.append("image", blob);
        fd.append("challenge", "blink");
        fd.append("evidence", JSON.stringify({ blink: true }));
        const res = await http.post(`/ai/alumnos/${selected.id}/verify-face`, fd);
        const ok = !!res.data?.allow;
        if (ok) return { ok: true, score: res.data?.score, reason: res.data?.reason };
        lastReason = res.data?.reason;
      } catch (e: any) {
        lastReason = e?.response?.data?.error?.message || e?.response?.data?.detail || e?.message;
      }
      // breve pausa entre intentos
      await new Promise(r => setTimeout(r, 120));
    }
    return { ok: false, reason: lastReason };
  }

  async function startCountdownAndCapture() {
    if (!streaming) return alert("Activa la camara primero");
    if (!selected?.id) return alert("Seleccione un alumno primero");
    // Saltamos validación biométrica: análisis directo
    setVerifyError(null);
    setResult(null);
    setCountdown(3);
    for (let t = 3; t > 0; t--) { setCountdown(t); await new Promise(r=>setTimeout(r,1000)); }
    setCountdown(null);

    // Toggle continuo via WebSocket
    if (!runningRef.current) {
      runningRef.current = true;
      setCapturing(true);
      const tick = async () => {
        if (!runningRef.current) return;
        try {
          const b64 = await captureFrameB64();
          if (b64 && connected) sendFrameB64({ alumno_id: Number(selected.id), frame_b64: b64 });
        } catch {}
        loopRef.current = window.setTimeout(tick, 100); // ~10 fps
      };
      tick();
    } else {
      runningRef.current = false;
      if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
      setCapturing(false);
    }
  }

  React.useEffect(() => {
    if (lastMetrics) {
      setResult(lastMetrics);
      if (lastMetrics?.overlay_b64) setOverlay(`data:image/jpeg;base64,${lastMetrics.overlay_b64}`);
      if (typeof lastMetrics?.jump_height_px === 'number') setJump(lastMetrics.jump_height_px);
    }
  }, [lastMetrics]);

  // Mantener un preview (historial corto) de los últimos overlays
  React.useEffect(() => {
    if (!overlay) return;
    setPreviews((prev) => {
      const next = [...prev, { src: overlay, ts: Date.now() }];
      // Limitar a las últimas 12 imágenes para evitar crecimiento de memoria
      return next.length > 12 ? next.slice(next.length - 12) : next;
    });
  }, [overlay]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Monitoreo en Vivo</Typography>
      <Card variant="outlined" sx={{ maxWidth: 700, mx: "auto" }}>
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', maxWidth: capturing ? COMPACT_MAX_W : 640, borderRadius: 8 }}
            />
          </Box>
          <Stack direction="row" gap={1} alignItems="center">
            <Button startIcon={<VideocamRounded />} onClick={startCamera} variant="contained" color="primary" disabled={streaming}>
              {streaming ? "Camara activa" : "Iniciar camara"}
            </Button>
            <Button onClick={startCountdownAndCapture} variant={capturing ? "contained" : "outlined"} color={capturing ? "error" : "success"} disabled={!streaming || !connected}>
              {capturing ? "Detener" : "Iniciar"}
            </Button>
            <Chip size="small" color={connected ? "success" : "default"} label={connected ? "WS conectado" : "WS desconectado"} />
          </Stack>
          {verifyError && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={startCountdownAndCapture} disabled={analyzing}>
                  Reintentar
                </Button>
              }
            >
              <div>{verifyError}</div>
              <ul style={{ margin: "4px 0 0 18px" }}>
                <li>Acercá el rostro y mirá a la cámara.</li>
                <li>Buena luz frontal (evitá contraluz).</li>
                <li>Sin gorras/anteojos y cara centrada.</li>
                <li>Mantené el teléfono estable.</li>
              </ul>
            </Alert>
          )}
          {countdown !== null && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="h2" fontWeight={900}>{countdown}</Typography>
            </Box>
          )}
          {overlay && (
            <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img
                src={overlay}
                alt="overlay"
                style={{ display: 'block', width: '100%', maxWidth: capturing ? COMPACT_MAX_W : 640, borderRadius: 8 }}
              />
            </Box>
          )}
          {!overlay && connected && capturing && (
            <Alert severity="info">Procesando… acercá el cuerpo a la cámara para ver el esqueleto.</Alert>
          )}
          {typeof jump === 'number' && (
            <Typography variant="h6" fontWeight={800} color="primary" sx={{ mt: 1 }}>
              Salto (px): {jump.toFixed(1)}
            </Typography>
          )}
          {previews.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 1 }}>Últimos frames</Divider>
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                {previews.map((p, i) => (
                  <img key={p.ts + '-' + i} src={p.src} alt={`prev-${i}`} style={{ height: 64, borderRadius: 8 }} />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

