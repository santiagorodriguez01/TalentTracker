// ai_integration/clients/performanceClient.js
import axios from "axios";

const {
  AI_PERFORMANCE_URL = "http://127.0.0.1:8020/performance",
  AI_TIMEOUT_MS = "10000",
} = process.env;

export const performanceClient = axios.create({
  baseURL: AI_PERFORMANCE_URL.replace(/\/$/, ""),
  timeout: parseInt(AI_TIMEOUT_MS, 10),
});

// Esperamos algo como { average_speed_m_s: number, ... }
export async function analyzeSprint(videoFile) {
  const FormData = (await import("form-data")).default;
  const fd = new FormData();
  fd.append("video", videoFile.buffer, videoFile.originalname);

  const res = await performanceClient.post(`/analyze/sprint`, fd, { headers: fd.getHeaders() });
  return res.data;
}

// Realtime: espera JSON { alumno_id: string, frame_b64: string }
export async function analyzeRealtime(alumnoId, frameBuffer) {
  const frame_b64 = Buffer.from(frameBuffer).toString("base64");
  const payload = { alumno_id: String(alumnoId ?? "0"), frame_b64 };
  const res = await performanceClient.post(`/realtime`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}
