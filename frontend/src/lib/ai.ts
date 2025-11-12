import { http } from "./http";

export async function enrollFace(alumnoId: number, file: File) {
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await http.post(`/ai/alumnos/${alumnoId}/enroll-face`, fd);
  return data as { success: boolean; user_id: string | number; has_embedding: boolean };
}

export async function verifyRevisor(userId: number, file: File, challenge: "blink" | "turn_left" | "turn_right" = "blink", evidence: any = {}) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("challenge", challenge);
  fd.append("evidence", JSON.stringify(evidence));
  const { data } = await http.post(`/ai/revisor/${userId}/verify-face`, fd);
  return data as { allow: boolean; score: number; reason?: string };
}

export async function analyzePerformanceVideo(alumnoId: number, file: File) {
  const fd = new FormData();
  fd.append("video", file);
  const { data } = await http.post(`/ai/alumnos/${alumnoId}/analyze-performance`, fd);
  return data as {
    session_id: number;
    metrics: Record<string, any>;
  };
}
