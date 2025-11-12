// ai_integration/websocket/frameProcessor.js
import axios from "axios";

const AI_PERFORMANCE_URL = process.env.AI_PERFORMANCE_URL || "http://127.0.0.1:8020/performance";

// Envía un solo frame (convertido desde base64) al microservicio Python
export async function performanceRealtime(frame_b64, alumno_id = "0") {
  try {
    const payload = { alumno_id: String(alumno_id ?? "0"), frame_b64 };
    const response = await axios.post(`${AI_PERFORMANCE_URL}/realtime`, payload, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data; // { overlay_b64, jump_height_px, ... }
  } catch (err) {
    console.error("Error enviando frame al microservicio:", err.message);
    return { error: err.message };
  }
}
