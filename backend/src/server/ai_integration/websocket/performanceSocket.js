// ai_integration/websocket/performanceSocket.js
import WebSocket, { WebSocketServer } from "ws";
import { performanceRealtime } from "./frameProcessor.js";
import jwt from "jsonwebtoken";
import url from "url";

export function initPerformanceSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws/performance" });

  const ALLOWED_ROLES = new Set(["ADMIN", "COORDINADOR", "STAFF"]);
  const MAX_FRAME_B64 = Number(process.env.WS_MAX_FRAME_B64 || 2_000_000); // ~2MB base64

  wss.on("connection", (ws, req) => {
    try {
      const parsed = url.parse(req.url || "", true);
      const bearer = (parsed.query?.bearer || parsed.query?.token || "").toString();
      if (!bearer) {
        ws.close(1008, "Unauthorized");
        return;
      }
      const payload = jwt.verify(bearer, process.env.JWT_SECRET || "devsecret");
      if (payload?.rol_sistema && !ALLOWED_ROLES.has(payload.rol_sistema)) {
        ws.close(1008, "Forbidden");
        return;
      }
      ws.user = { id: payload?.id, rol: payload?.rol_sistema };
      console.log("📡 WS conectado:", ws.user);
    } catch {
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data);
        // Estructura esperada: { alumno_id, coordinador_id, frame_b64 }
        if (!msg?.frame_b64 || typeof msg.frame_b64 !== "string") return;
        if (msg.frame_b64.length > MAX_FRAME_B64) {
          ws.send(JSON.stringify({ type: "error", message: "frame too large" }));
          return;
        }

        const metrics = await performanceRealtime(msg.frame_b64, msg.alumno_id);
        ws.send(
          JSON.stringify({
            type: "metrics_update",
            alumno_id: msg.alumno_id,
            metrics,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error("❌ Error procesando frame:", err.message);
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    });

    ws.on("close", () => console.log("🔌 Cliente desconectado"));
  });

  console.log("✅ WebSocket /ws/performance iniciado");
  return wss;
}
