// ai_integration/services/biometricService.js
import { enrollFace, verifyFace, deleteEnrollment } from "../clients/biometricClient.js";
import fs from "fs/promises";
import path from "path";

// ADAPTA este import a tu conexión real (Knex/Sequelize/MySQL pool).
// Si ya tenés un módulo de DB central, úsalo aquí:
import { query } from "../../../core/db.js";

/**
 * Guarda/actualiza el perfil biométrico:
 * - Si el microservicio devuelve embedding_b64 -> se guarda como LONGBLOB
 * - Si no, se guarda la imagen subida como referencia (LONGBLOB) para no violar NOT NULL
 */
export const biometricService = {
  async enrollAlumnoFace(userId, imageFile) {
    const result = await enrollFace(userId, imageFile);
    // Armar LONGBLOB fuente
    let blobBuffer = null;

    if (result && result.embedding_b64) {
      blobBuffer = Buffer.from(result.embedding_b64, "base64");
    } else {
      // fallback: guardar la imagen como referencia (temporal) para no violar NOT NULL
      blobBuffer = imageFile.buffer;
    }

    // UPSERT simple en MySQL (si tu motor no soporta JSON_SET, lo dejamos básico)
    await query(
      `
      INSERT INTO biometric_profile (user_id, face_vector, model_version)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        face_vector = VALUES(face_vector),
        model_version = VALUES(model_version),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, blobBuffer, result?.model_version || "mediapipe_v1"]
    );

    // Auditar ENROLL
    await query(
      `
      INSERT INTO biometric_audit_log (user_id, action, score, liveness_passed, metadata)
      VALUES (?, 'ENROLL', NULL, FALSE, JSON_OBJECT('message', ?, 'has_embedding', ?))
      `,
      [userId, result?.message || "enrolled", !!result?.embedding_b64]
    );

    // Guardar thumbnail accesible para UI
    try {
      const base = "/app/uploads";
      const dir = path.join(base, "alumnos", String(userId));
      await fs.mkdir(dir, { recursive: true });
      const thumbPath = path.join(dir, "biometric_enroll.jpg");
      const imgBuf = imageFile?.buffer || blobBuffer;
      if (imgBuf) await fs.writeFile(thumbPath, imgBuf);
    } catch {}

    return { success: true, user_id: userId, has_embedding: !!result?.embedding_b64 };
  },

  async verifyRevisor(userId, imageFile, challenge = "blink", evidence = {}) {
    const isNotEnrolledError = (e) => {
      const msg = e?.response?.data?.detail || e?.message || "";
      return e?.response?.status === 404 && /not enrolled/i.test(String(msg));
    };
    const tryReseedFromThumbnail = async () => {
      try {
        const base = "/app/uploads";
        const filePath = path.join(base, "usuarios", String(userId), "biometric_enroll.jpg");
        const buf = await fs.readFile(filePath);
        const fake = { buffer: buf, originalname: "biometric_enroll.jpg" };
        await enrollFace(userId, fake);
        return true;
      } catch {
        return false;
      }
    };
    const tryReseedFromCurrentFrame = async () => {
      try {
        // Sólo permitir si hay constancia en DB de enrolamiento previo
        const has = await biometricService.hasEnrollment(userId);
        if (!has) return false;
        await enrollFace(userId, imageFile);
        return true;
      } catch {
        return false;
      }
    };

    let result;
    try {
      result = await verifyFace(userId, imageFile, challenge, evidence);
    } catch (e) {
      if (isNotEnrolledError(e)) {
        const reseeded = await tryReseedFromThumbnail() || await tryReseedFromCurrentFrame();
        if (reseeded) {
          result = await verifyFace(userId, imageFile, challenge, evidence);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    const { allow, score = 0, reason = null } = result || {};
    await query(
      `
      INSERT INTO biometric_audit_log (user_id, action, score, liveness_passed, metadata)
      VALUES (?, ?, ?, ?, JSON_OBJECT('reason', ?, 'challenge', ?, 'evidence', CAST(? AS JSON)))
      `,
      [userId, allow ? "ACCESS_GRANTED" : "ACCESS_DENIED", score, allow ? 1 : 0, reason, challenge, JSON.stringify(evidence || {})]
    );
    return { allow: !!allow, score: Number(score || 0), reason };
  },
  async verifyAlumno(userId, imageFile, challenge = "blink", evidence = {}, resource = 'PERFORMANCE') {
    const isNotEnrolledError = (e) => {
      const msg = e?.response?.data?.detail || e?.message || "";
      return e?.response?.status === 404 && /not enrolled/i.test(String(msg));
    };
    const tryReseedFromThumbnail = async () => {
      try {
        const base = "/app/uploads";
        const filePath = path.join(base, "alumnos", String(userId), "biometric_enroll.jpg");
        const buf = await fs.readFile(filePath);
        const fake = { buffer: buf, originalname: "biometric_enroll.jpg" };
        await enrollFace(userId, fake);
        return true;
      } catch {
        return false;
      }
    };
    const tryReseedFromCurrentFrame = async () => {
      try {
        const has = await biometricService.hasAlumnoEnrollment(userId);
        if (!has) return false;
        await enrollFace(userId, imageFile);
        return true;
      } catch {
        return false;
      }
    };

    let result;
    try {
      result = await verifyFace(userId, imageFile, challenge, evidence);
    } catch (e) {
      if (isNotEnrolledError(e)) {
        const reseeded = await tryReseedFromThumbnail() || await tryReseedFromCurrentFrame();
        if (reseeded) {
          result = await verifyFace(userId, imageFile, challenge, evidence);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    const { allow, score = 0, reason = null } = result || {};
    await query(
      `
      INSERT INTO biometric_audit_log (user_id, action, score, liveness_passed, metadata)
      VALUES (?, ?, ?, ?, JSON_OBJECT('reason', ?, 'challenge', ?, 'resource', ?))
      `,
      [userId, allow ? "ACCESS_GRANTED" : "ACCESS_DENIED", score, allow ? 1 : 0, reason, challenge, resource]
    );
    return { allow: !!allow, score: Number(score || 0), reason };
  },
  async hasAlumnoEnrollment(personaId) {
    try {
      const rows = await query(
        `SELECT 1 FROM usuario u JOIN biometric_profile b ON b.user_id = u.id WHERE u.persona_id = ? LIMIT 1`,
        [personaId]
      );
      if (Array.isArray(rows) && rows.length > 0) return true;
    } catch {}
    try {
      const p = path.join('/app/uploads', 'alumnos', String(personaId), 'biometric_enroll.jpg');
      await fs.access(p);
      return true;
    } catch {}
    return false;
  },
  async enrollUserFace(userId, imageFile) {
    const result = await enrollFace(userId, imageFile);
    let blobBuffer = null;
    if (result && result.embedding_b64) {
      blobBuffer = Buffer.from(result.embedding_b64, "base64");
    } else {
      blobBuffer = imageFile.buffer;
    }

    await query(
      `
      INSERT INTO biometric_profile (user_id, face_vector, model_version)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        face_vector = VALUES(face_vector),
        model_version = VALUES(model_version),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, blobBuffer, result?.model_version || "mediapipe_v1"]
    );

    await query(
      `
      INSERT INTO biometric_audit_log (user_id, action, score, liveness_passed, metadata)
      VALUES (?, 'ENROLL', NULL, FALSE, JSON_OBJECT('message', ?, 'has_embedding', ?))
      `,
      [userId, result?.message || "enrolled", !!result?.embedding_b64]
    );

    try {
      const base = "/app/uploads";
      const dir = path.join(base, "usuarios", String(userId));
      await fs.mkdir(dir, { recursive: true });
      const thumbPath = path.join(dir, "biometric_enroll.jpg");
      const imgBuf = imageFile?.buffer || blobBuffer;
      if (imgBuf) await fs.writeFile(thumbPath, imgBuf);
    } catch {}

    return { success: true, user_id: userId, has_embedding: !!result?.embedding_b64 };
  },
  async hasEnrollment(userId) {
    const rows = await query(
      `SELECT 1 FROM biometric_profile WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return Array.isArray(rows) && rows.length > 0;
  },
  async deleteUserEnrollment(userId) {
    await query(`DELETE FROM biometric_profile WHERE user_id = ?`, [userId]);
    await query(
      `INSERT INTO biometric_audit_log (user_id, action, score, liveness_passed, metadata)
       VALUES (?, 'VERIFY', NULL, FALSE, JSON_OBJECT('event','DELETE_ENROLLMENT'))`,
      [userId]
    );
    try {
      const base = "/app/uploads";
      const p = path.join(base, "usuarios", String(userId), "biometric_enroll.jpg");
      await fs.unlink(p).catch(() => {});
    } catch {}
    try { await deleteEnrollment(userId); } catch {}
    return { ok: true };
  }
};
