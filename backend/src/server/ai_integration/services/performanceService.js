// ai_integration/services/performanceService.js
import { analyzeSprint, analyzeRealtime } from "../clients/performanceClient.js";
import { query } from "../../../core/db.js";

// Mapeo simple de clave -> tipo métrica
const metricMap = [
  { key: "average_speed_m_s", type: "SPEED", unit: "m/s" },
  { key: "jump_height_cm",    type: "JUMP_HEIGHT", unit: "cm" },
  { key: "reaction_time_s",   type: "REACTION_TIME", unit: "s" },
  { key: "balance_score",     type: "BALANCE", unit: "score" },
  { key: "posture_score",     type: "POSTURE", unit: "score" },
];

export const performanceService = {
  async analyzeSprintSession(alumnoId, coordinadorId, videoFile) {
    const analysis = await analyzeSprint(videoFile);
    // Crear sesión
    const result = await query(
      `
      INSERT INTO physical_session (alumno_id, coordinador_id, video_path, analyzed, notes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [alumnoId, coordinadorId || null, null, 1, "Sprint analysis"]
    );
    const sessionId = result?.insertId;

    // Insertar métricas según las claves presentes
    for (const m of metricMap) {
      if (analysis[m.key] != null) {
        await query(
          `
          INSERT INTO physical_metric (session_id, metric_type, value, unit)
          VALUES (?, ?, ?, ?)
          `,
          [sessionId, m.type, Number(analysis[m.key]), m.unit]
        );
      }
    }

    return { session_id: sessionId, ...analysis };
  },
  async analyzeRealtimeFrame(alumnoId, frameFile) {
    // frameFile.buffer es un Buffer de imagen (jpeg/png)
    const metrics = await analyzeRealtime(alumnoId ?? 0, frameFile.buffer);
    return metrics;
  },
};
