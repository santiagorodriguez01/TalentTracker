"use client";
import { useEffect, useRef, useState } from "react";

type MetricsMsg = {
  type: "metrics_update" | "error";
  alumno_id?: number;
  metrics?: any;
  message?: string;
  timestamp?: string;
};

export function usePerformanceWS() {
  const baseUrl = process.env.NEXT_PUBLIC_WS_PERFORMANCE!;
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Adjunta bearer en query para autenticación del WS
    let token: string | null = null;
    try {
      // Zustand -> localStorage como fallback
      const store = (window as any).useAuthStore?.getState?.();
      token = store?.token || localStorage.getItem('token') || null;
    } catch {}
    const fullUrl = token
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}bearer=${encodeURIComponent(token)}`
      : baseUrl;

    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = (e: any) => setError(e?.message || "ws error");
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as MetricsMsg;
        if (msg.type === "metrics_update") setLastMetrics(msg.metrics || {});
        if (msg.type === "error") setError(msg.message || "processing error");
      } catch (e: any) {
        setError(e.message);
      }
    };
    return () => ws.close();
  }, [baseUrl]);

  const sendFrameB64 = (payload: { alumno_id: number; coordinador_id?: number | null; frame_b64: string }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(payload));
  };

  return { connected, lastMetrics, error, sendFrameB64 };
}
