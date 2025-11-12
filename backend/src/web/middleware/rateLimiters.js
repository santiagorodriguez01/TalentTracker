import rateLimit from 'express-rate-limit';

// Rate limiter más permisivo para desarrollo
// En producción, usar valores más restrictivos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Máximo 50 intentos por ventana (aumentado para desarrollo)
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de login. Por favor intenta de nuevo en unos minutos.',
  skip: (req) => {
    // En desarrollo, puedes saltar el rate limit para IPs específicas
    // return req.ip === '127.0.0.1';
    return false;
  }
});
