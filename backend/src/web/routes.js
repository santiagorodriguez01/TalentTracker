import { Router } from 'express';
import { loginLimiter } from './middleware/rateLimiters.js';
import authRequired from './middleware/authRequired.js';
import authOrQrToken from './middleware/authOrQrToken.js';
import authOrQueryBearer from './middleware/authOrQueryBearer.js';
import validate from './middleware/validate.js';
import { setAuditContext } from './middleware/auditContext.js';
import { uploadImage } from '../domain/utils/uploads.js';
import * as Export from './controllers/ExportController.js';
import * as Audit from './controllers/AuditController.js';
import * as Health from './controllers/HealthController.js';
import * as Auth from './controllers/AuthController.js';
import * as Personas from './controllers/PersonasController.js';
import * as Fotos from './controllers/FotosController.js';
import * as QR from './controllers/QRController.js';
import * as Carnet from './controllers/CarnetController.js';
import * as Gafete from './controllers/GafeteController.js';
import * as Cuotas from './controllers/CuotasController.js';
import * as CuotasAlumno from './controllers/CuotasAlumnoController.js';
import * as Caja from './controllers/CajaController.js';
import * as Socios from './controllers/SociosController.js';
import * as Reportes from './controllers/ReportesController.js';
import * as Alumnos from './controllers/AlumnosController.js';
import * as Jugadores from './controllers/JugadoresController.js';
import { vLogin, vPersonaCreate, vPersonaUpdate, vCuotasEmitir, vCuotaPagar, vCajaAlta, vCajaReporte, vCajaReporteCSV, vSocioCreate, vSocioUpdate, vSocioAttach,  vAlumnoCreate, vAlumnoUpdate, vJugadorCreate, vJugadorUpdate  } from './middleware/validators.js';
import { uploadPdfTmp } from '../domain/utils/uploads.js';
import aiRoutes from "../server/ai_integration/routes/aiRoutes.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'personas', String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, 'foto' + path.extname(file.originalname || '.jpg')); // foto.jpg
  }
});

const r = Router();
r.get('/health',
    Health.health);
r.post('/auth/login',
    loginLimiter,
    vLogin,
    validate,
    Auth.login);

// Middleware de auditoría - aplica a todas las rutas protegidas después de este punto
r.use(setAuditContext);

r.get('/audit',
  authRequired(['ADMIN','DIRECTIVO']),
  Audit.list
);
r.get('/auth/me', 
    authRequired(), 
    Auth.me);


r.get('/personas', 
    authRequired(['ADMIN','TESORERIA','DIRECTIVO','STAFF']),
     Personas.list
    );

r.get('/personas/:id', authRequired(['ADMIN','TESORERIA','STAFF','DIRECTIVO']), 
    Personas.getById
  ); 
r.post('/personas', 
    authRequired(['ADMIN','TESORERIA']), 
    vPersonaCreate, 
    validate, 
    Personas.create
);
r.put('/personas/:id', 
    authRequired(['ADMIN','TESORERIA']), 
    vPersonaUpdate, 
    validate, 
    Personas.update
);
r.delete('/personas/:id/roles',
    authRequired(['ADMIN','TESORERIA']),
    Personas.clearRoles
);
r.post('/personas/:id/roles',
    authRequired(['ADMIN','TESORERIA']),
    Personas.setRoles
);
r.delete('/personas/:id', 
    authRequired(['ADMIN']), 
    Personas.softDelete
);

r.post('/personas/:id/foto', 
    authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF']), 
    uploadImage.single('file'), 
    Fotos.uploadMultipart
);
r.post('/personas/:id/foto-dataurl', 
    authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), 
    Fotos.uploadDataUrl
);
r.delete('/personas/:id/foto', 
    authRequired(['ADMIN','TESORERIA']), 
    Fotos.remove
);

r.get('/personas/:id/qr', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), QR.issueForPersona);
r.get('/qr/:token.png', QR.pngForToken);   // primero PNG
r.get('/qr/:token/view', QR.viewHTML);
r.get('/qr/:token', QR.consumeTokenJSON);
r.get('/personas/:id/carnet.pdf', authOrQrToken(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), Carnet.byPersona);
r.get('/carnet/:token.pdf', Carnet.byToken);





r.use(aiRoutes);

// ALUMNOS
r.get('/alumnos', authRequired(['ADMIN','COORDINADOR','STAFF','DIRECTIVO']), Alumnos.list);
r.get('/alumnos/:id', authRequired(['ADMIN','COORDINADOR','STAFF','DIRECTIVO']), Alumnos.get);
r.post('/alumnos', authRequired(['ADMIN','COORDINADOR']), vAlumnoCreate, validate, Alumnos.create);
r.put('/alumnos/:id', authRequired(['ADMIN','COORDINADOR']), vAlumnoUpdate, validate, Alumnos.update);
r.delete('/alumnos/:id', authRequired(['ADMIN']), Alumnos.remove);
r.post('/alumnos/:id/apto',
  authRequired(['ADMIN','COORDINADOR']),
  Alumnos.uploadAptoMw,
  Alumnos.uploadApto
);

r.get('/alumnos/:id/apto.pdf',
  authOrQueryBearer(['ADMIN','COORDINADOR','STAFF','DIRECTIVO']),
  Alumnos.downloadApto
);

r.delete('/alumnos/:id/apto',
  authRequired(['ADMIN','COORDINADOR']),
  Alumnos.deleteApto
);

// Vista del coordinador
r.get('/coordinador/alumnos', authRequired(['COORDINADOR']), Alumnos.listForCoordinador);
// Tomar asistencia
r.post('/alumnos/:id/asistencias', authRequired(['COORDINADOR','ADMIN']), Alumnos.marcarAsistencia);
r.get('/coordinador/asistencias', authRequired(['COORDINADOR','ADMIN']), Alumnos.listarAsistenciasCoordinador);

// Catálogos
r.get('/catalogo/deportes', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), Alumnos.catalogDeportes);
r.get('/catalogo/categorias', authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']), Alumnos.catalogCategorias);

// JUGADORES
r.get('/jugadores', authRequired(['ADMIN','STAFF','DIRECTIVO']), Jugadores.list);
r.get('/jugadores/:id', authRequired(['ADMIN','STAFF','DIRECTIVO']), Jugadores.get);
r.post('/jugadores/from-persona', authRequired(['ADMIN','COORDINADOR']), vJugadorCreate, validate, Jugadores.createFromPersona);
r.put('/jugadores/:id', authRequired(['ADMIN','COORDINADOR']), vJugadorUpdate, validate, Jugadores.update);
r.delete('/jugadores/:id', authRequired(['ADMIN']), Jugadores.remove);
r.get('/jugadores/:id/contrato.pdf',
  authOrQueryBearer(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']),
  Jugadores.downloadContrato
);

// contrato PDF
r.post('/jugadores/:id/contrato',
  authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']),
  uploadPdfTmp.single('file'),
  Jugadores.uploadContrato
);

// Descarga/Visualizacion con opcion de forzar descarga

// Borrar contrato
r.delete('/jugadores/:id/contrato',
  authRequired(['ADMIN']),
  Jugadores.deleteContrato
);

// contrato PDF (subida)
r.post('/jugadores/:id/contrato',
  authRequired(['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO']),
  uploadPdfTmp.single('file'),
  Jugadores.uploadContrato
);

// SOCIOS
r.get('/socios/validar-dni/:dni', authRequired(['ADMIN','TESORERIA','PERSONAL_CAJA','BOLETERIA']), Socios.validarDni);
r.get('/socios/validar-nro-socio/:nro_socio', authRequired(['ADMIN','TESORERIA','PERSONAL_CAJA','BOLETERIA']), Socios.validarNroSocio);
r.post('/socios/from-persona', authRequired(['ADMIN','TESORERIA']), vSocioAttach, validate, Socios.createFromPersona);
// Nuevas rutas para gestión de cuotas deudoras de socios (ANTES de las rutas genéricas con :id)
r.get('/socios/:socio_id/cuotas-deudoras', authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), Cuotas.getCuotasDeudoras);
r.post('/socios/:socio_id/pagar-cuotas', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), Cuotas.pagarMultiple);
r.get('/socios',  authRequired(['ADMIN','TESORERIA','DIRECTIVO','STAFF','PERSONAL_CAJA']), Socios.list);
r.get('/socios/:id', authRequired(['ADMIN','TESORERIA','DIRECTIVO','STAFF','PERSONAL_CAJA']), Socios.get);
r.post('/socios', authRequired(['ADMIN','TESORERIA']), vSocioCreate, validate, Socios.create);
r.put('/socios/:id', authRequired(['ADMIN','TESORERIA']), vSocioUpdate, validate, Socios.update);
r.delete('/socios/:id', authRequired(['ADMIN']), Socios.remove);

r.get('/cuotas/resumen',    authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA']), Reportes.cuotasResumen);
r.get('/cuotas/morosidad',  authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA']), Reportes.cuotasMorosidad);
r.post('/cuotas/emitir', authRequired(['TESORERIA','ADMIN']), vCuotasEmitir, validate, Cuotas.emitir);
r.get('/cuotas/:id/comprobante.pdf', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), Cuotas.comprobantePdf);
r.put('/cuotas/:id/pagar', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), vCuotaPagar, validate, Cuotas.pagar);
r.get('/cuotas', authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), Cuotas.list);

// Cuotas de alumnos
r.post('/cuotas-alumno/emitir', authRequired(['TESORERIA','ADMIN']), CuotasAlumno.emitir);
r.get('/cuotas-alumno/:id/comprobante.pdf', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), CuotasAlumno.comprobantePdf);
r.put('/cuotas-alumno/:id/pagar', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), CuotasAlumno.pagar);
r.get('/cuotas-alumno', authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), CuotasAlumno.list);
// Nuevas rutas para gestión de cuotas deudoras de alumnos (con rutas específicas de personas)
r.get('/personas/:persona_id/cuotas-alumno-deudoras', authRequired(['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), CuotasAlumno.getCuotasDeudoras);
r.post('/personas/:persona_id/pagar-cuotas-alumno', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), CuotasAlumno.pagarMultiple);

r.get('/caja/cajeros', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA']), Caja.listCajeros);
r.get('/caja/reporte', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA']), vCajaReporte, validate, Caja.reporte);
r.get('/caja/reporte.csv',
  authOrQueryBearer(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA']),
  vCajaReporteCSV, validate, Caja.reporteCSV
);
r.get('/caja/movimientos', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), Caja.movimientos);
r.get('/caja/:id/comprobante.pdf', authRequired(['TESORERIA','ADMIN','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA']), Caja.comprobantePdf);
r.post('/caja', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), vCajaAlta, validate, Caja.alta);
r.post('/caja/venta-entrada', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA','BOLETERIA']), Caja.ventaEntrada);
r.post('/caja/venta-entrada-visitante', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA','BOLETERIA']), Caja.ventaEntradaVisitante);
r.post('/caja/pago-cuota', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), Caja.pagoCuota);
r.post('/caja/egreso', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), Caja.egreso);
r.post('/caja/transferir', authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']), Caja.transferirTesoreria);
r.put('/caja/:id/aprobar', authRequired(['ADMIN','DIRECTIVO','REVISOR_CUENTA']), Caja.aprobarEgreso);
r.put('/caja/:id/rechazar', authRequired(['ADMIN','DIRECTIVO','REVISOR_CUENTA']), Caja.rechazarEgreso);



r.get('/export/socios.csv',
  authOrQueryBearer(['ADMIN','TESORERIA','DIRECTIVO','COORDINADOR','STAFF']),
  Export.sociosCsv
);
r.get('/export/alumnos.csv',
  authOrQueryBearer(['ADMIN','TESORERIA','DIRECTIVO','COORDINADOR','STAFF']),
  Export.alumnosCsv
);
r.get('/export/jugadores.csv',
  authOrQueryBearer(['ADMIN','TESORERIA','DIRECTIVO','COORDINADOR','STAFF']),
  Export.jugadoresCsv
);


export default r;
