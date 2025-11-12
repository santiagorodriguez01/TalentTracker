import { body, query } from 'express-validator';

const PERSONA_ROLES = ['SOCIO','ALUMNO','JUGADOR','PERSONAL','PERSONAL_CAJA','REVISOR_CUENTA','COORDINADOR','DIRECTIVO'];
const PERSONA_GENEROS = ['MASCULINO','FEMENINO','NO_ESPECIFICADO'];

// Auth
export const vLogin = [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty()
];

// Personas
export const vPersonaCreate = [
  body('nombre').isString().notEmpty(),
  body('apellido').isString().notEmpty(),
  body('dni')
    .customSanitizer((v) => (v === null || v === undefined ? '' : String(v).trim()))
    .notEmpty(),
  body('genero').optional().isIn(PERSONA_GENEROS),
  body('rol').optional().isIn(PERSONA_ROLES),
  body('roles').optional().isArray(),
  body('roles.*').optional().isIn(PERSONA_ROLES)
];
export const vPersonaUpdate = [
  body('email').optional().isEmail(),
  body('genero').optional().isIn(PERSONA_GENEROS),
  body('rol').optional().isIn(PERSONA_ROLES),
  body('roles').optional().isArray(),
  body('roles.*').optional().isIn(PERSONA_ROLES)
];

// Cuotas
export const vCuotasEmitir = [
  body('periodo').matches(/^\d{4}-\d{2}$/), // YYYY-MM
  body('importe').isFloat({ gt: 0 }),
  body('vencimiento').isISO8601(),
  body('socio_ids').optional().isArray({ min: 1 })
];
export const vCuotaPagar = [
  body('monto').optional().isFloat({ gt: 0 }),
  body('medio_pago').optional().isString(),
  body('nro_tramite').optional().isString(),
  body('observacion').optional().isString()
];

// Caja
export const vCajaAlta = [
  body('concepto').isString().notEmpty(),
  body('tipo').isIn(['INGRESO','EGRESO']),
  body('monto').isFloat({ gt: 0 }),
  body('medio_pago').optional().isString(),
  body('nro_tramite').optional().isString(),
  body('validador_id').if(body('tipo').equals('EGRESO')).isInt({ gt:0 }),
  body('fecha_validacion').if(body('tipo').equals('EGRESO')).isISO8601(),
  body('fecha').optional().isISO8601()
];
export const vCajaReporte = [
  query('desde').isISO8601(),
  query('hasta').isISO8601()
];

export const vSocioCreate = [
  body('nro_socio').isString().notEmpty(),
  body('nombre').isString().notEmpty(),
  body('apellido').isString().notEmpty(),
  body('dni').isString().notEmpty(),
  body('email').optional().isEmail(),
  body('telefono').optional().isString(),
  body('domicilio').optional().isString(),
  body('plan_id').optional().isInt({ gt:0 }),
];

export const vSocioUpdate = [
  body('nro_socio').optional().isString(),
  body('email').optional().isEmail(),
];

export const vSocioAttach = [
  body('persona_id').isInt({ gt:0 }),
  body('nro_socio').isString().notEmpty(),
  body('plan_id').optional().isInt({ gt:0 }),
];

// ALUMNOS
export const vAlumnoCreate = [
  body('persona_id').isInt({ gt:0 }),
  body('deporte').isString().notEmpty(),
  body('categoria').isString().notEmpty(),
  body('coordinador_id').optional().isInt({ gt:0 }),
  body('apto_medico').optional().isISO8601(),
];
export const vAlumnoUpdate = [
  body('deporte').optional().isString(),
  body('categoria').optional().isString(),
  body('coordinador_id').optional().isInt({ gt:0 }),
  body('apto_medico').optional().isISO8601(),
];

// JUGADORES
export const vJugadorCreate = [
  body('persona_id').isInt({ gt:0 }),
  body('puesto').optional().isString(),
  body('dorsal').optional().isInt({ gt:0 }),
];
export const vJugadorUpdate = [
  body('puesto').optional().isString(),
  body('dorsal').optional().isInt({ gt:0 }),
];

export const vCajaReporteCSV = vCajaReporte;
