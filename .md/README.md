# TalentTracker - Sistema de Gestión Deportiva Club Luján

Sistema integral de gestión para clubes deportivos que incluye administración de socios, alumnos, pagos, asistencias, reconocimiento facial biométrico y análisis de rendimiento deportivo con IA.

## Características Principales

### Módulos Principales

1. **Gestión de Socios y Alumnos**
   - Registro y administración de socios
   - Gestión de alumnos por deporte
   - Generación de carnets y gafetes con QR
   - Exportación de datos

2. **Sistema de Pagos y Cuotas**
   - Registro de pagos
   - Control de cuotas
   - Generación de recibos PDF
   - Reportes de caja

3. **Control de Asistencias**
   - Registro por QR
   - Reconocimiento facial biométrico
   - Historial de asistencias
   - Reportes por alumno y deporte

4. **Análisis de Rendimiento Deportivo (IA)**
   - Detección de poses con YOLO v8
   - Análisis de movimientos en tiempo real
   - Métricas de rendimiento
   - WebSocket para análisis en vivo

5. **Roles y Permisos**
   - Administrador: Acceso completo
   - Personal de Caja: Pagos y asistencias
   - Coordinador: Gestión por deporte asignado

## Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- Next.js 15 (React 19)
- Material-UI v6
- React Query (TanStack Query)
- Zustand (State Management)
- React Hook Form + Zod
- TypeScript

**Backend:**
- Node.js 22
- Express.js
- MySQL 8
- JWT Authentication
- WebSocket (ws)
- Multer (File uploads)

**Servicios AI:**
- Python 3.11
- FastAPI
- Mediapipe (Reconocimiento facial)
- Ultralytics YOLO v8 (Detección de poses)
- OpenCV
- NumPy

**Infraestructura:**
- Docker + Docker Compose
- Adminer (MySQL GUI)
- Multi-stage builds
- Health checks

### Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────┐
│             Cliente (Browser)                    │
│          http://localhost:3001                   │
└────────────────────┬────────────────────────────┘
                     │
                     │ HTTP/WebSocket
                     ▼
          ┌──────────────────────┐
          │  Frontend (Next.js)  │
          │    Port: 3001        │
          │   - React 19         │
          │   - Material-UI      │
          │   - TanStack Query   │
          └──────────┬───────────┘
                     │
                     │ REST API / WebSocket
                     ▼
          ┌──────────────────────┐
          │  Backend API         │
          │    Port: 3000        │
          │   - Express.js       │
          │   - JWT Auth         │
          │   - Multer           │
          └───┬──────────┬───────┘
              │          │
      ┌───────┘          └───────────────────────┐
      │                                           │
      ▼                                           ▼
┌─────────────┐                    ┌──────────────────────────┐
│   MySQL     │                    │    Servicios AI          │
│  Port: 3306 │                    │                          │
│             │                    │  ┌────────────────────┐  │
│  - Socios   │                    │  │  Biometric Access  │  │
│  - Alumnos  │                    │  │    Port: 8010      │  │
│  - Pagos    │                    │  │   - Mediapipe      │  │
│  - Asist.   │                    │  │   - Face Recog.    │  │
│             │                    │  └────────────────────┘  │
└─────────────┘                    │                          │
                                   │  ┌────────────────────┐  │
┌─────────────┐                    │  │ Performance Track. │  │
│  Adminer    │                    │  │    Port: 8020      │  │
│  Port: 8080 │                    │  │   - YOLO v8        │  │
└─────────────┘                    │  │   - Pose Detect.   │  │
                                   │  └────────────────────┘  │
                                   └──────────────────────────┘
```

## Estructura del Proyecto

```
TalentTracker/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── server/            # Servidor Express
│   │   │   ├── index.js       # Entry point
│   │   │   ├── routes/        # Rutas de API
│   │   │   ├── controllers/   # Lógica de negocio
│   │   │   ├── middleware/    # Middleware (auth, etc)
│   │   │   ├── ai_integration/ # Integración con servicios AI
│   │   │   └── utils/         # Utilidades
│   │   ├── db/                # Configuración de base de datos
│   │   └── core/              # Lógica core del negocio
│   ├── migrations/            # Scripts SQL de migración
│   ├── uploads/               # Archivos subidos
│   ├── tests/                 # Tests unitarios
│   ├── docker-compose.yml     # Orquestación de servicios
│   ├── Dockerfile             # Imagen Docker backend
│   ├── .env                   # Variables de entorno
│   └── package.json           # Dependencias Node.js
│
├── frontend/                  # Aplicación Next.js
│   ├── src/
│   │   ├── app/               # App Router de Next.js 15
│   │   ├── components/        # Componentes React reutilizables
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Servicios API (React Query)
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── theme/             # Configuración de MUI
│   │   └── utils/             # Utilidades
│   ├── public/                # Archivos estáticos
│   ├── .env.local             # Variables de entorno
│   └── package.json           # Dependencias React
│
├── biometric_access/          # Servicio reconocimiento facial
│   ├── routers/               # Endpoints FastAPI
│   ├── utils/                 # Utilidades de procesamiento
│   ├── models/                # Modelos de datos
│   ├── main.py                # Entry point FastAPI
│   ├── requirements.txt       # Dependencias Python
│   └── Dockerfile             # Imagen Docker
│
├── performance_tracker/       # Servicio análisis rendimiento
│   ├── routers/               # Endpoints FastAPI
│   ├── services/              # Servicios de análisis
│   ├── utils/                 # Utilidades YOLO
│   ├── models/                # Modelos de datos
│   ├── main.py                # Entry point FastAPI
│   ├── requirements.txt       # Dependencias Python
│   └── Dockerfile             # Imagen Docker
│
├── yolov8n-pose.pt            # Modelo YOLO pre-entrenado (6.8 MB)
├── club_lujan.sql             # Backup de base de datos
│
├── INSTALACION_NOTEBOOK.md   # 📘 Guía de instalación en notebook
├── PREPARAR_TRANSFERENCIA.md # 📦 Guía para preparar transferencia
├── README.md                  # Este archivo
└── .gitignore                 # Archivos a ignorar en git
```

## Inicio Rápido

### Requisitos Previos

- Docker Desktop (v20.10+)
- Node.js (v20+)
- npm (v9+)

### Instalación Local (Desarrollo)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd TalentTracker
```

2. **Configurar variables de entorno**
```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus configuraciones

# Frontend
cd ../frontend
cp .env.local.example .env.local
# Editar .env.local con tus configuraciones
```

3. **Iniciar servicios Docker**
```bash
cd backend
docker-compose up -d
```

4. **Importar base de datos** (primera vez)
```bash
# Esperar 30 segundos a que MySQL inicie
cat ../club_lujan.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan
```

5. **Instalar y ejecutar frontend**
```bash
cd ../frontend
npm install
npm run dev
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- Adminer: http://localhost:8080

### Credenciales por Defecto

**Sistema:**
- Usuario: `admin`
- Contraseña: `admin123`

**Base de Datos (Adminer):**
- Usuario: `root` / `club`
- Contraseña: `root` / `club`
- Database: `club_lujan`

## Transferencia a Otro Equipo

Si necesitas instalar este proyecto en otro equipo (ej: laptop, notebook):

1. **En el equipo actual:** Sigue la guía [PREPARAR_TRANSFERENCIA.md](PREPARAR_TRANSFERENCIA.md)
2. **En el equipo nuevo:** Sigue la guía [INSTALACION_NOTEBOOK.md](INSTALACION_NOTEBOOK.md)

## Documentación Adicional

- [GUIA_COMPLETA_SISTEMA_ASISTENCIAS.md](GUIA_COMPLETA_SISTEMA_ASISTENCIAS.md) - Sistema de asistencias
- [GUIA_COORDINADORES_POR_DEPORTE.md](GUIA_COORDINADORES_POR_DEPORTE.md) - Gestión de coordinadores
- [GUIA_IMPLEMENTACION_PERSONAL_CAJA.md](GUIA_IMPLEMENTACION_PERSONAL_CAJA.md) - Personal de caja
- [INSTRUCCIONES_COORDINADOR.md](INSTRUCCIONES_COORDINADOR.md) - Manual para coordinadores
- [CAMBIOS_PAGO_CUOTAS.md](CAMBIOS_PAGO_CUOTAS.md) - Sistema de pagos

## API Endpoints

### Autenticación
```
POST   /api/auth/login           - Iniciar sesión
POST   /api/auth/refresh         - Refrescar token
GET    /api/auth/me              - Obtener usuario actual
```

### Socios
```
GET    /api/socios               - Listar socios
POST   /api/socios               - Crear socio
GET    /api/socios/:id           - Obtener socio
PUT    /api/socios/:id           - Actualizar socio
DELETE /api/socios/:id           - Eliminar socio
GET    /api/socios/:id/carnet    - Generar carnet PDF
```

### Alumnos
```
GET    /api/alumnos              - Listar alumnos
POST   /api/alumnos              - Crear alumno
GET    /api/alumnos/:id          - Obtener alumno
PUT    /api/alumnos/:id          - Actualizar alumno
DELETE /api/alumnos/:id          - Eliminar alumno
POST   /api/alumnos/:id/foto     - Subir foto
```

### Asistencias
```
GET    /api/asistencias          - Listar asistencias
POST   /api/asistencias/registrar - Registrar asistencia (QR/Biométrica)
GET    /api/asistencias/alumno/:id - Historial de alumno
```

### Pagos
```
GET    /api/pagos                - Listar pagos
POST   /api/pagos                - Registrar pago
GET    /api/pagos/:id/recibo     - Generar recibo PDF
```

### AI - Biométrico
```
POST   /biometric/verify         - Verificar identidad facial
POST   /biometric/enroll         - Registrar nuevo rostro
```

### AI - Rendimiento
```
POST   /performance/analyze      - Analizar pose/movimiento
WS     /ws/performance           - Stream análisis en vivo
```

Ver documentación completa en: http://localhost:3000/api-docs

## Scripts Disponibles

### Backend
```bash
npm start              # Iniciar servidor
npm run migrate        # Ejecutar migraciones
npm test               # Ejecutar tests
```

### Frontend
```bash
npm run dev            # Modo desarrollo (Turbopack)
npm run build          # Build de producción
npm run start          # Servidor de producción
npm run lint           # Linter
```

### Docker
```bash
docker-compose up -d              # Iniciar servicios
docker-compose down               # Detener servicios
docker-compose logs -f            # Ver logs
docker-compose restart api        # Reiniciar un servicio
docker-compose ps                 # Ver estado de servicios
```

## Base de Datos

### Tablas Principales

- `usuarios` - Usuarios del sistema (admin, caja, coordinadores)
- `personal_caja` - Personal de caja autorizado
- `coordinadores_deporte` - Coordinadores por deporte
- `socios` - Socios del club
- `alumnos` - Alumnos inscritos en deportes
- `deportes` - Catálogo de deportes
- `pagos` - Registro de pagos
- `cuotas_alumno` - Cuotas pendientes/pagadas
- `asistencia_alumno` - Registro de asistencias
- `biometric_data` - Datos biométricos para reconocimiento facial

### Migraciones

Las migraciones SQL están en `backend/migrations/`:
```
004_personal_caja_vistas.sql
005_asistencia_alumno.sql
006_datos_prueba_coordinador.sql
007_agregar_alumnos.sql
008_actualizar_password_coordinador.sql
009_sistema_asistencias_completo.sql
010_coordinador_deporte.sql
011_crear_coordinadores_deportes.sql
012_actualizar_passwords_coordinadores.sql
013_fix_coord_futbol_y_crear_alumnos.sql
```

## Seguridad

- Autenticación JWT con refresh tokens
- Bcrypt para hash de contraseñas
- Rate limiting en endpoints críticos
- Validación de entrada con express-validator
- Protección CORS configurable
- Sanitización de uploads
- Docker con usuarios no-root

## Performance

- Conexión pool de MySQL (10 conexiones)
- Cache de imágenes procesadas
- Lazy loading en frontend
- Server-side rendering con Next.js
- Optimización de imágenes con Sharp
- Docker multi-stage builds

## Testing

```bash
# Backend
cd backend
npm test

# Ver coverage
npm test -- --coverage
```

## Troubleshooting

### Docker no inicia
```bash
# Verificar que Docker Desktop esté corriendo
docker --version

# Verificar puertos disponibles
netstat -ano | findstr :3000
netstat -ano | findstr :3306

# Reiniciar Docker
docker-compose down
docker-compose up -d
```

### Frontend no conecta con Backend
```bash
# Verificar variables de entorno
cat frontend/.env.local

# Verificar que el backend esté corriendo
curl http://localhost:3000/api/health

# Reiniciar frontend
cd frontend
npm run dev
```

### Base de datos vacía
```bash
# Importar datos
cat club_lujan.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan
```

Ver más en [INSTALACION_NOTEBOOK.md](INSTALACION_NOTEBOOK.md) sección Troubleshooting.

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Proyecto privado - Club Deportivo Luján

## Soporte

Para problemas o preguntas:
1. Revisa la documentación en la carpeta `/docs`
2. Consulta las guías de instalación y troubleshooting
3. Contacta al equipo de desarrollo

---

**Desarrollado para Club Deportivo Luján**

**Última actualización:** 2025-11-10
