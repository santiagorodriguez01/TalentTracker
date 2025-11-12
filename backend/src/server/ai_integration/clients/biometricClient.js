// ai_integration/clients/biometricClient.js
import axios from "axios";

const {
  AI_BIOMETRIC_URL = "http://127.0.0.1:8010/biometric",
  AI_TIMEOUT_MS = "10000",
} = process.env;

export const biometricClient = axios.create({
  baseURL: AI_BIOMETRIC_URL.replace(/\/$/, ""),
  timeout: parseInt(AI_TIMEOUT_MS, 10),
});

// Enroll: esperamos que el microservicio devuelva { embedding_b64?: string, message?: string }
export async function enrollFace(userId, imageFile) {
  const FormData = (await import("form-data")).default;
  const fd = new FormData();
  fd.append("user_id", String(userId));
  fd.append("image", imageFile.buffer, imageFile.originalname);

  const res = await biometricClient.post(`/enroll`, fd, { headers: fd.getHeaders() });
  return res.data; // { embedding_b64?: string, message?: string }
}

// Verify: esperamos { allow: boolean, score: number, reason?: string }
export async function verifyFace(userId, imageFile, challenge = "blink", evidence = {}) {
  const FormData = (await import("form-data")).default;
  const fd = new FormData();
  fd.append("user_id", String(userId));
  fd.append("image", imageFile.buffer, imageFile.originalname);
  fd.append("challenge", challenge);
  fd.append("evidence", JSON.stringify(evidence));

  const res = await biometricClient.post(`/verify`, fd, { headers: fd.getHeaders() });
  return res.data; // { allow, score, reason }
}

// Borrar enrolamiento en memoria del microservicio
export async function deleteEnrollment(userId) {
  try {
    const res = await biometricClient.delete(`/enrollments/${encodeURIComponent(String(userId))}`);
    return res.data;
  } catch (e) {
    // no bloquear si el microservicio no soporta el endpoint
    return { deleted: false };
  }
}
