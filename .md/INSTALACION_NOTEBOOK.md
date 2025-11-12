# Guía de Instalación TalentTracker en Notebook

Esta guía te ayudará a instalar y ejecutar el proyecto TalentTracker en tu notebook después de transferirlo desde tu PC principal.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu notebook:

- **Docker Desktop** (versión 20.10 o superior)
- **Node.js** (versión 20 o superior)
- **npm** (versión 9 o superior)
- **Git** (opcional, para control de versiones)

### Verificar instalaciones

```bash
docker --version
node --version
npm --version
```

## Estructura del Proyecto

```
TalentTracker/
├── backend/              # API Node.js + Express
│   ├── src/             # Código fuente
│   ├── migrations/      # Scripts SQL de migración
│   ├── uploads/         # Archivos subidos (generado)
│   ├── mysql-data/      # Datos de MySQL (generado por Docker)
│   ├── node_modules/    # Dependencias Node (se reinstalarán)
│   ├── .env             # Variables de entorno (IMPORTANTE)
│   ├── .env.example     # Plantilla de variables
│   ├── Dockerfile       # Configuración Docker backend
│   ├── docker-compose.yml  # Orquestación de servicios
│   └── package.json     # Dependencias backend
│
├── frontend/            # Aplicación Next.js
│   ├── src/            # Código fuente React
│   ├── node_modules/   # Dependencias Node (se reinstalarán)
│   ├── .next/          # Build de Next.js (generado)
│   ├── .env.local      # Variables de entorno frontend (IMPORTANTE)
│   ├── .env.local.example  # Plantilla de variables
│   └── package.json    # Dependencias frontend
│
├── biometric_access/   # Servicio Python reconocimiento facial
│   ├── Dockerfile      # Configuración Docker biométrico
│   ├── requirements.txt
│   └── main.py
│
├── performance_tracker/ # Servicio Python análisis rendimiento
│   ├── Dockerfile      # Configuración Docker performance
│   ├── requirements.txt
│   └── main.py
│
├── yolov8n-pose.pt     # Modelo YOLO (6.8 MB - NECESARIO)
└── club_lujan.sql      # Backup completo de base de datos
```

## Paso 1: Preparar el Proyecto para Transferencia

### En tu PC principal (donde está funcionando)

1. **Limpiar archivos temporales y datos locales:**

```bash
cd C:\Users\osuna\Desktop\TalentTracker

# IMPORTANTE: Hacer backup de .env antes de limpiar
# No borres estos archivos:
# - backend/.env
# - frontend/.env.local
# - club_lujan.sql
# - yolov8n-pose.pt

# Eliminar node_modules (se reinstalarán en el notebook)
# rm -rf backend/node_modules
# rm -rf frontend/node_modules

# Eliminar builds y cache
rm -rf frontend/.next
rm -rf backend/mysql-data/*

# Eliminar uploads si no son necesarios
# rm -rf backend/uploads/*
```

2. **Verificar archivos importantes:**

```bash
# Estos archivos DEBEN estar presentes:
ls backend/.env
ls frontend/.env.local
ls yolov8n-pose.pt
ls club_lujan.sql
```

3. **Comprimir el proyecto:**

```bash
# Opción 1: Usando 7-Zip (Windows)
# Click derecho en TalentTracker > 7-Zip > Comprimir a "TalentTracker.rar"

# Opción 2: Usando tar (Git Bash)
tar -czf TalentTracker.tar.gz TalentTracker/
```

## Paso 2: Transferir a tu Notebook

1. Copia el archivo `TalentTracker.rar` o `TalentTracker.tar.gz` a tu notebook
2. Colócalo en una ubicación conveniente (ej: `C:\Users\TuUsuario\Desktop\`)

## Paso 3: Descomprimir en el Notebook

```bash
# Si es .rar
# Click derecho > Extraer aquí

# Si es .tar.gz
tar -xzf TalentTracker.tar.gz
```

## Paso 4: Configurar Variables de Entorno

### Backend

```bash
cd TalentTracker/backend

# Verifica que existe el archivo .env
# Si no existe, copia desde .env.example
cp .env.example .env
```

Contenido del `backend/.env`:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=club
DB_PASSWORD=club
DB_NAME=club_lujan
DB_POOL=10

# Auth
JWT_SECRET=cambiar_super_secreto
JWT_EXPIRES_IN=15m

# Bootstrap admin
ADMIN_INITIAL_USER=admin
ADMIN_INITIAL_PASSWORD=admin123

# CORS
CORS_ORIGIN=*
PUBLIC_BASE_URL=http://localhost:3000

# Branding
BRAND_NAME=CLUB DEPORTIVO LUJÁN
BRAND_PRIMARY=#0057B7
BRAND_SECONDARY=#FFD000
BRAND_TEXT=#111111
BRANDING_LOGO_PATH=/app/assets/escudo.png
FONT_REGULAR_PATH=/app/assets/Inter-Regular.ttf
FONT_BOLD_PATH=/app/assets/Inter-Bold.ttf
```

### Frontend

```bash
cd ../frontend

# Verifica que existe el archivo .env.local
# Si no existe, copia desde .env.local.example
cp .env.local.example .env.local
```

Contenido del `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_WS_PERFORMANCE=ws://localhost:3000/ws/performance
```

## Paso 5: Iniciar Servicios Docker

Desde la carpeta `backend/`, ejecuta:

```bash
cd C:\Users\TuUsuario\Desktop\TalentTracker\backend

# Iniciar todos los servicios
docker-compose up -d
```

Esto iniciará 5 servicios:
1. **mysql** - Base de datos MySQL 8 (puerto 3306)
2. **api** - Backend Node.js (puerto 3000)
3. **adminer** - Interface web para MySQL (puerto 8080)
4. **biometric** - Servicio reconocimiento facial (puerto 8010)
5. **performance** - Servicio análisis rendimiento (puerto 8020)

### Verificar que los servicios estén corriendo

```bash
docker-compose ps
```

Deberías ver algo como:
```
NAME                       STATUS
talenttracker_mysql        Up (healthy)
talenttracker_api          Up
talenttracker_adminer      Up
talenttracker_biometric    Up
talenttracker_performance  Up
```

### Ver logs si hay problemas

```bash
# Logs de todos los servicios
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f mysql
```

## Paso 6: Restaurar Base de Datos (Primera Instalación)

Si es la primera vez que instalas en el notebook, necesitas importar la base de datos:

```bash
# Espera a que MySQL esté completamente iniciado (30 segundos aprox)
# Puedes verificar con: docker-compose logs mysql

# Importar el SQL
docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan < C:\Users\TuUsuario\Desktop\TalentTracker\club_lujan.sql

# O desde Git Bash
cat ../club_lujan.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan
```

### Verificar la base de datos

Puedes usar Adminer en: http://localhost:8080
- Sistema: MySQL
- Servidor: mysql
- Usuario: root
- Contraseña: root
- Base de datos: club_lujan

## Paso 7: Instalar Dependencias del Frontend

```bash
cd C:\Users\TuUsuario\Desktop\TalentTracker\frontend

# Instalar dependencias
npm install

# O si quieres una instalación limpia
npm ci
```

## Paso 8: Ejecutar el Frontend

```bash
# Desde la carpeta frontend/
npm run dev
```

El frontend estará disponible en: http://localhost:3001

## Verificación de la Instalación

### 1. Verificar Backend API
```bash
curl http://localhost:3000/api/health
```
O abre en el navegador: http://localhost:3000/api/health

### 2. Verificar Swagger Documentation
http://localhost:3000/api-docs

### 3. Verificar Frontend
http://localhost:3001

### 4. Verificar Servicios AI

**Biométrico:**
```bash
curl http://localhost:8010/biometric/health
```

**Performance:**
```bash
curl http://localhost:8020/performance/health
```

### 5. Verificar Adminer
http://localhost:8080

## Credenciales por Defecto

### Sistema (Admin)
- Usuario: `admin`
- Contraseña: `admin123`

### Adminer (MySQL)
- Usuario: `root` o `club`
- Contraseña: `root` o `club`

## Comandos Útiles

### Docker

```bash
# Ver servicios en ejecución
docker-compose ps

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart api

# Reconstruir las imágenes
docker-compose build

# Reconstruir y reiniciar
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f

# Entrar a un contenedor
docker exec -it talenttracker_api sh
docker exec -it talenttracker_mysql bash
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm run start

# Limpiar cache
rm -rf .next
npm run dev
```

### Backend

```bash
# Si necesitas correr el backend fuera de Docker
cd backend
npm install
npm start
```

## Troubleshooting

### Problema: Docker no inicia

**Solución:**
1. Asegúrate de que Docker Desktop esté corriendo
2. Verifica que no haya otros servicios usando los puertos 3000, 3306, 8010, 8020, 8080
3. Reinicia Docker Desktop

```bash
# Verificar puertos en uso (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :3306
```

### Problema: MySQL no se conecta

**Solución:**
1. Espera 30-60 segundos después de `docker-compose up` para que MySQL se inicialice
2. Verifica logs: `docker-compose logs mysql`
3. Verifica el healthcheck: `docker-compose ps` debe mostrar "healthy"

```bash
# Test de conexión
docker exec talenttracker_mysql mysqladmin -uroot -proot ping
```

### Problema: Frontend no se conecta al backend

**Solución:**
1. Verifica que el backend esté corriendo: http://localhost:3000/api/health
2. Verifica `frontend/.env.local` tenga `NEXT_PUBLIC_API_BASE=http://localhost:3000`
3. Reinicia el servidor de desarrollo:

```bash
cd frontend
# Ctrl+C para detener
npm run dev
```

### Problema: "Cannot find module" en Node.js

**Solución:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

### Problema: Error al importar club_lujan.sql

**Solución:**
```bash
# Asegúrate de que MySQL esté completamente iniciado
docker-compose logs mysql | grep "ready for connections"

# Si el contenedor está corriendo pero no responde
docker-compose restart mysql
sleep 30

# Intenta importar de nuevo
cat ../club_lujan.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan
```

### Problema: Modelo YOLO no encontrado

**Solución:**
```bash
# Verifica que el archivo existe
ls -lh yolov8n-pose.pt

# Si no existe, descárgalo de nuevo o cópialo del backup
# El archivo debe estar en la raíz del proyecto
```

## Actualización de Datos

### Exportar datos de tu PC principal

```bash
# En tu PC principal
cd backend
docker exec talenttracker_mysql mysqldump -uroot -proot club_lujan > club_lujan_backup_$(date +%Y%m%d).sql
```

### Importar en tu notebook

```bash
# En tu notebook
cat club_lujan_backup_20251110.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan
```

## Arquitectura de Servicios

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│              http://localhost:3001               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Frontend (Next.js)  │
          │    Port: 3001        │
          │  (npm run dev)       │
          └──────────┬───────────┘
                     │
                     │ HTTP/WebSocket
                     ▼
          ┌──────────────────────┐
          │  Backend API (Node)  │
          │    Port: 3000        │
          │   (Docker)           │
          └──────┬───────┬───────┘
                 │       │
      ┌──────────┘       └──────────┐
      │                              │
      ▼                              ▼
┌─────────────┐            ┌─────────────────┐
│   MySQL     │            │  AI Services    │
│  Port: 3306 │            │  - Biometric    │
│  (Docker)   │            │    Port: 8010   │
└─────────────┘            │  - Performance  │
                           │    Port: 8020   │
                           │  (Docker)       │
                           └─────────────────┘
```

## Notas Importantes

1. **No incluyas node_modules en el .rar** - Estos se reinstalarán en cada máquina
2. **SÍ incluye los archivos .env** - Son necesarios para la configuración
3. **Incluye club_lujan.sql** - Es tu backup de base de datos
4. **Incluye yolov8n-pose.pt** - Es necesario para el servicio de performance
5. **Primera vez:** Necesitas importar el SQL
6. **Actualizaciones:** Solo necesitas actualizar el código, no la DB completa
7. **Puertos requeridos:** 3000, 3001, 3306, 8010, 8020, 8080

## Resumen de Comandos Rápidos

```bash
# 1. Descomprimir proyecto
cd C:\Users\TuUsuario\Desktop
# [Extraer TalentTracker.rar]

# 2. Iniciar Docker
cd TalentTracker/backend
docker-compose up -d

# 3. Esperar e importar DB (solo primera vez)
sleep 30
cat ../club_lujan.sql | docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan

# 4. Instalar y ejecutar frontend
cd ../frontend
npm install
npm run dev

# 5. Abrir navegador
# http://localhost:3001
```

## Soporte

Si encuentras problemas:
1. Revisa la sección de Troubleshooting
2. Verifica los logs con `docker-compose logs -f`
3. Asegúrate de que todos los puertos estén libres
4. Reinicia Docker Desktop si es necesario

---

**Última actualización:** 2025-11-10
**Versión del documento:** 1.0
