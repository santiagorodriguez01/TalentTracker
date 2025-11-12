// ===============================================
// 📁 ai_integration/routes/aiRoutes.js
// ===============================================
import express from "express";
import authRequired from "../../../web/middleware/authRequired.js";
import * as AIController from "../../../web/controllers/AIController.js";

const router = express.Router();

/**
 * @route POST /ai/alumnos/:id/enroll-face
 * @desc Enrolar rostro de un alumno en el sistema biométrico
 * @access ADMIN, COORDINADOR
 * @body image: archivo de imagen del rostro
 */
router.post(
  "/ai/alumnos/:id/enroll-face",
  // Permitir que el propio revisor se enrolle además de ADMIN/COORDINADOR
  authRequired(["ADMIN", "COORDINADOR", "REVISOR_CUENTA"]),
  ...AIController.enrollFace
);

// Enrolamiento para usuarios del sistema (ADMIN / REVISOR_CUENTA / DIRECTIVO)
router.post(
  "/ai/usuarios/:id/enroll-face",
  authRequired(["ADMIN", "REVISOR_CUENTA", "DIRECTIVO"]),
  ...AIController.enrollUserFace
);

/**
 * @route POST /ai/revisor/:id/verify-face
 * @desc Verificar rostro para acceso biométrico (ej. revisor o staff)
 * @access ADMIN, COORDINADOR, STAFF
 * @body image: archivo de imagen del rostro
 */
router.post(
  "/ai/revisor/:id/verify-face",
  // Solo quienes pueden aprobar/rechazar en caja
  authRequired(["ADMIN", "REVISOR_CUENTA", "DIRECTIVO"]),
  ...AIController.verifyRevisor
);

// Verificación facial del alumno antes de acceso a Performance
router.post(
  "/ai/alumnos/:id/verify-face",
  authRequired(["ADMIN", "COORDINADOR", "STAFF"]),
  ...AIController.verifyAlumno
);

/**
 * @route POST /ai/alumnos/:id/analyze-performance
 * @desc Analizar rendimiento físico del alumno mediante video
 * @access ADMIN, COORDINADOR
 * @body video: archivo de video de entrenamiento
 */
router.post(
  "/ai/alumnos/:id/analyze-performance",
  authRequired(["ADMIN", "COORDINADOR"]),
  ...AIController.analyzePerformance
);

/**
 * @route POST /ai/performance/live
 * @desc Analizar un frame (imagen) en tiempo real y devolver métricas
 * @access ADMIN, COORDINADOR, STAFF
 * @body frame: archivo de imagen (jpeg/png)
 * @body alumno_id?: id de alumno (opcional)
 */
router.post(
  "/ai/performance/live",
  authRequired(["ADMIN", "COORDINADOR", "STAFF"]),
  ...AIController.analyzeRealtimeFrame
);

/**
 * @route GET /ai/alumnos/:id/biometric
 * @desc Verificar si el alumno tiene registro biométrico
 * @access ADMIN, COORDINADOR, STAFF
 */
router.get(
  "/ai/alumnos/:id/biometric",
  // Permitir al revisor consultar su propio estado biométrico
  authRequired(["ADMIN", "COORDINADOR", "STAFF", "REVISOR_CUENTA", "DIRECTIVO"]),
  AIController.biometricStatus
);

router.get(
  "/ai/usuarios/:id/biometric",
  authRequired(["ADMIN", "REVISOR_CUENTA", "DIRECTIVO"]),
  AIController.biometricUserStatus
);

router.delete(
  "/ai/usuarios/:id/biometric",
  authRequired(["ADMIN", "REVISOR_CUENTA", "DIRECTIVO"]),
  AIController.deleteUserEnrollment
);

export default router;
