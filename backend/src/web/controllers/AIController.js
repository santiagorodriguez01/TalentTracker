// web/controllers/AIController.js
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { biometricService } from "../../server/ai_integration/services/biometricService.js";
import { performanceService } from "../../server/ai_integration/services/performanceService.js";

const uploadImage = multer({
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const uploadVideo = multer({
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed'));
    }
    cb(null, true);
  },
});


export const enrollFace = [
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      const alumnoOrUserId = req.params.id; // para revisor o alumno (depende el flujo)
      if (!req.file) return res.status(400).json({ error: "image file is required" });
      const out = await biometricService.enrollAlumnoFace(alumnoOrUserId, req.file);
      res.json(out);
    } catch (err) {
      // Si falla por FK (persona sin usuario vinculado), persistimos sólo el thumbnail y devolvemos OK
      if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
        try {
          const alumnoId = String(req.params.id);
          const base = "/app/uploads";
          const dir = path.join(base, "alumnos", alumnoId);
          await fs.mkdir(dir, { recursive: true });
          const thumbPath = path.join(dir, "biometric_enroll.jpg");
          if (req.file?.buffer) await fs.writeFile(thumbPath, req.file.buffer);
        } catch {}
        return res.status(200).json({ success: true, user_id: req.params.id, warning: 'Persistencia omitida (FK). Se guardó thumbnail.' });
      }
      next(err);
    }
  },
];

export const verifyRevisor = [
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      const revisorUserId = req.params.id;
      if (!req.file) return res.status(400).json({ error: "image file is required" });
      const out = await biometricService.verifyRevisor(revisorUserId, req.file, req.body.challenge || "blink", req.body.evidence ? JSON.parse(req.body.evidence) : {});
      res.json(out);
    } catch (err) {
      next(err);
    }
  },
];

export const analyzePerformance = [
  uploadVideo.single('video'),
  async (req, res, next) => {
    try {
      const alumnoId = req.params.id;
      const coordinadorId = req.user?.persona_id || req.user?.id || null; // adapta a tu JWT/estructura
      if (!req.file) return res.status(400).json({ error: "video file is required" });
      const out = await performanceService.analyzeSprintSession(alumnoId, coordinadorId, req.file);
      res.json(out);
    } catch (err) {
      next(err);
    }
  },
];

export const enrollUserFace = [
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      if (!req.file) return res.status(400).json({ error: "image file is required" });
      const out = await biometricService.enrollUserFace(userId, req.file);
      res.json(out);
    } catch (err) {
      next(err);
    }
  },
];

export const analyzeRealtimeFrame = [
  uploadImage.single('frame'),
  async (req, res, next) => {
    try {
      const alumnoId = req.body?.alumno_id || req.query?.alumno_id || req.params?.id || 0;
      if (!req.file) return res.status(400).json({ error: "frame file is required" });
      const out = await performanceService.analyzeRealtimeFrame(alumnoId, req.file);
      res.json(out);
    } catch (err) {
      next(err);
    }
  },
];

export async function biometricStatus(req, res, next) {
  try {
    const alumnoId = req.params.id;
    // Para alumnos: considerar DB por usuario vinculado o thumbnail en uploads
    const has = await (biometricService.hasAlumnoEnrollment
      ? biometricService.hasAlumnoEnrollment(alumnoId)
      : biometricService.hasEnrollment(alumnoId));
    // si existe thumbnail guardado, exponer URL absoluta para que el frontend (3001) no haga request relativa
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const path = `/files/alumnos/${alumnoId}/biometric_enroll.jpg`;
    const url = base ? `${base}${path}` : path;
    res.json({ enrolled: !!has, thumbnail_url: url });
  } catch (err) {
    next(err);
  }
}

export async function biometricUserStatus(req, res, next) {
  try {
    const userId = req.params.id;
    const has = await biometricService.hasEnrollment(userId);
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const path = `/files/usuarios/${userId}/biometric_enroll.jpg`;
    const url = base ? `${base}${path}` : path;
    res.json({ enrolled: !!has, thumbnail_url: url });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserEnrollment(req, res, next) {
  try {
    const userId = req.params.id;
    const out = await biometricService.deleteUserEnrollment(userId);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export const verifyAlumno = [
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      const alumnoId = req.params.id;
      if (!req.file) return res.status(400).json({ error: "image file is required" });
      const out = await biometricService.verifyAlumno(alumnoId, req.file, req.body.challenge || "blink", req.body.evidence ? JSON.parse(req.body.evidence) : {});
      res.json(out);
    } catch (err) {
      next(err);
    }
  },
];
