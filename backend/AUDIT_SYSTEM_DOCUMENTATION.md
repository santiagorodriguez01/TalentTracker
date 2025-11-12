# 📋 SISTEMA DE AUDITORÍA COMPLETO - TALENTTRACKER

## 📖 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Base de Datos de Auditoría](#base-de-datos-de-auditoría)
4. [Triggers de Auditoría](#triggers-de-auditoría)
5. [Sistema de Backups](#sistema-de-backups)
6. [Sistema de Logging](#sistema-de-logging)
7. [Middleware de Auditoría](#middleware-de-auditoría)
8. [Instalación y Configuración](#instalación-y-configuración)
9. [Uso y Consultas](#uso-y-consultas)
10. [Mantenimiento](#mantenimiento)
11. [Troubleshooting](#troubleshooting)

---

## 📝 Descripción General

El **Sistema de Auditoría Completo de TalentTracker** es una solución integral para:

✅ **Rastrear todas las modificaciones** en la base de datos (INSERT/UPDATE/DELETE)
✅ **Registrar quién, cuándo y qué** cambió en cada tabla
✅ **Backups automáticos** diarios a las 3:00 AM (Argentina GMT-3)
✅ **Logs horarios** de métricas y estadísticas
✅ **Reportes semanales** de actividad
✅ **Monitoreo de salud** del sistema cada 15 minutos

### Características Principales

- **Base de datos separada** (`club_lujan_audit`) para auditoría
- **Triggers automáticos** en 33+ tablas transaccionales
- **Tracking de usuarios** a nivel de aplicación y base de datos
- **Retención configurable** (default: 90 días)
- **Vistas y stored procedures** para análisis rápido
- **Contenedor dedicado** para automatización con cron

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    TALENTTRACKER SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │───▶│   Backend    │───▶│    MySQL     │  │
│  │  (Next.js)   │    │  (Express)   │    │   Service    │  │
│  └──────────────┘    └──────────────┘    └───────┬──────┘  │
│                             │                     │          │
│                             │                     │          │
│                      [Middleware]            [Triggers]      │
│                      setAuditContext()           │          │
│                             │                     │          │
│                             ▼                     ▼          │
│                    ┌─────────────────────────────────┐      │
│                    │  club_lujan_audit (Database)    │      │
│                    │  - audit_master                 │      │
│                    │  - user_sessions                │      │
│                    │  - backup_logs                  │      │
│                    │  - performance_metrics          │      │
│                    └─────────────────────────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Automation Container (Cron Jobs)              │  │
│  │  - Backup diario (3 AM)                               │  │
│  │  - Logs horarios                                      │  │
│  │  - Health checks (cada 15 min)                        │  │
│  │  - Reporte semanal (Lunes 8 AM)                       │  │
│  │  - Limpieza auditorías (Domingo 2 AM)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Base de Datos de Auditoría

### Base de Datos: `club_lujan_audit`

#### Tablas Principales

##### 1. `audit_master` - Tabla Maestra de Auditoría

Registra **TODOS** los cambios en **TODAS** las tablas.

```sql
CREATE TABLE audit_master (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Información de la operación
  operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,

  -- Usuario que realizó la operación
  usuario_id BIGINT UNSIGNED,
  usuario_username VARCHAR(60),
  usuario_rol VARCHAR(60),

  -- Metadata de conexión
  connection_id BIGINT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Datos de auditoría
  old_values JSON,
  new_values JSON,
  changed_fields JSON,

  -- Timestamps
  operation_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_operation_timestamp (operation_timestamp)
);
```

**Ejemplo de registro:**

```json
{
  "id": 12345,
  "operation_type": "UPDATE",
  "table_name": "persona",
  "record_id": 42,
  "usuario_id": 3,
  "usuario_username": "admin",
  "usuario_rol": "ADMIN",
  "old_values": {"email": "old@email.com", "telefono": "123456"},
  "new_values": {"email": "new@email.com", "telefono": "789012"},
  "changed_fields": ["email", "telefono"],
  "operation_timestamp": "2025-11-11 14:30:45.123456"
}
```

##### 2. `user_sessions` - Sesiones de Usuario

Tracking de sesiones activas y duraciones.

```sql
CREATE TABLE user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(60) NOT NULL,
  connection_id BIGINT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL,
  session_duration_minutes INT UNSIGNED
);
```

##### 3. `backup_logs` - Registro de Backups

Tracking completo de backups realizados.

```sql
CREATE TABLE backup_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  backup_type ENUM('FULL', 'INCREMENTAL', 'DIFFERENTIAL') NOT NULL,
  backup_file VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT UNSIGNED,
  database_name VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  duration_seconds INT UNSIGNED,
  status ENUM('INICIADO', 'COMPLETADO', 'FALLIDO') NOT NULL
);
```

##### 4. `performance_metrics` - Métricas de Performance

Monitoreo de performance de la BD.

```sql
CREATE TABLE performance_metrics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  metric_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  total_queries BIGINT UNSIGNED,
  slow_queries BIGINT UNSIGNED,
  queries_per_second DECIMAL(10,2),

  active_connections INT UNSIGNED,
  max_connections INT UNSIGNED,

  database_size_mb DECIMAL(12,2),
  table_count INT UNSIGNED,

  active_transactions INT UNSIGNED
);
```

##### 5. `database_logs` - Logs Generales

Logs de eventos del sistema.

```sql
CREATE TABLE database_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  log_timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  log_level ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
  log_category VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  details JSON
);
```

#### Vistas de Auditoría

##### `v_audit_user_activity` - Actividad por Usuario

```sql
SELECT
  usuario_id,
  usuario_username,
  table_name,
  operation_type,
  COUNT(*) AS total_operations,
  MAX(operation_timestamp) AS last_operation
FROM audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY usuario_id, usuario_username, table_name, operation_type;
```

##### `v_audit_recent_changes` - Cambios Recientes

```sql
SELECT
  table_name,
  operation_type,
  COUNT(*) AS total_changes,
  COUNT(DISTINCT usuario_id) AS unique_users,
  MAX(operation_timestamp) AS last_change
FROM audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY table_name, operation_type;
```

##### `v_active_sessions` - Sesiones Activas

```sql
SELECT
  us.usuario_id,
  us.username,
  us.ip_address,
  us.login_time,
  COUNT(am.id) AS total_operations
FROM user_sessions us
LEFT JOIN audit_master am ON am.usuario_id = us.usuario_id
WHERE us.logout_time IS NULL
GROUP BY us.id;
```

#### Stored Procedures

##### `sp_get_record_history` - Historial de un Registro

```sql
CALL sp_get_record_history('persona', 42);
```

Retorna todos los cambios realizados en el registro con ID 42 de la tabla persona.

##### `sp_get_user_activity` - Actividad de un Usuario

```sql
CALL sp_get_user_activity(3, 7);  -- Usuario ID 3, últimos 7 días
```

##### `sp_cleanup_old_audits` - Limpieza de Auditorías Antiguas

```sql
CALL sp_cleanup_old_audits(90);  -- Mantener solo últimos 90 días
```

##### `sp_audit_report` - Reporte de Auditoría

```sql
CALL sp_audit_report('2025-11-01', '2025-11-30');
```

---

## ⚡ Triggers de Auditoría

### Tablas con Triggers (33 tablas)

Cada tabla tiene **3 triggers**:
- `trg_audit_{table}_insert` - AFTER INSERT
- `trg_audit_{table}_update` - AFTER UPDATE
- `trg_audit_{table}_delete` - AFTER DELETE

#### Tablas Auditadas:

**Personas y Usuarios:**
- persona
- usuario
- persona_rol

**Socios y Alumnos:**
- socio
- socio_plan
- alumno
- alumno_categoria
- alumno_deporte
- alumno_coordinador
- jugador

**Finanzas:**
- cuota
- cuota_alumno
- pago_cuota
- pago_cuota_alumno
- caja (ya existente)
- plan
- plan_beneficio
- config_financiera

**Actividades:**
- asistencia_alumno
- deporte
- categoria
- turno
- coordinador_deporte

**Otros:**
- biometric_profile
- physical_session
- physical_metric

### Ejemplo de Trigger

```sql
CREATE TRIGGER trg_audit_persona_update AFTER UPDATE ON persona FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  -- Detectar campos cambiados
  IF OLD.nombre != NEW.nombre THEN
    SET changed = JSON_ARRAY_APPEND(changed, '$', 'nombre');
  END IF;
  IF OLD.email != NEW.email THEN
    SET changed = JSON_ARRAY_APPEND(changed, '$', 'email');
  END IF;

  -- Registrar en audit_master
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id,
    old_values, new_values, changed_fields,
    connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'persona', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'email', OLD.email),
    JSON_OBJECT('nombre', NEW.nombre, 'email', NEW.email),
    changed,
    CONNECTION_ID(), NOW(6)
  );
END;
```

---

## 💾 Sistema de Backups

### Configuración

**Script:** `backend/scripts/backup_full.sh`

**Horario:** Diario a las **3:00 AM** (Argentina GMT-3)

**Retención:** 30 días (configurable)

**Bases de datos respaldadas:**
- `club_lujan` (base principal)
- `club_lujan_audit` (base de auditoría)

### Características

✅ Backups comprimidos con gzip
✅ Verificación de integridad automática
✅ Registro en `backup_logs`
✅ Recolección de estadísticas de la BD
✅ Limpieza automática de backups antiguos

### Estructura de Archivos

```
/backups/
├── club_lujan_20251111_030000.sql.gz
├── club_lujan_audit_20251111_030000.sql.gz
├── club_lujan_20251112_030000.sql.gz
└── ...
```

### Ejecución Manual

```bash
docker exec talenttracker_automation /app/scripts/backup_full.sh
```

### Restaurar un Backup

```bash
# Descomprimir
gunzip club_lujan_20251111_030000.sql.gz

# Restaurar
docker exec -i talenttracker_mysql mysql -uroot -proot club_lujan < club_lujan_20251111_030000.sql
```

---

## 📊 Sistema de Logging

### Logs Horarios

**Script:** `backend/scripts/hourly_logs.sh`

**Horario:** Cada hora (00:00, 01:00, 02:00, ...)

**Retención:** 7 días

### Métricas Recolectadas

- **Performance:**
  - QPS (Queries por segundo)
  - Queries lentas
  - Conexiones activas
  - Tamaño de BD

- **Auditoría:**
  - Operaciones por tabla
  - Usuarios más activos
  - Tablas más modificadas

- **Sistema:**
  - Espacio en disco
  - Sesiones activas
  - Transacciones activas

### Estructura de Logs

```
/var/log/talenttracker/
├── backup.log
├── hourly.log
├── health.log
├── cleanup.log
├── db_stats_20251111_140000.log
└── reports/
    └── weekly_report_20251111.txt
```

---

## 🔧 Middleware de Auditoría

### `setAuditContext()`

Middleware que establece el contexto de usuario en MySQL.

**Ubicación:** `backend/src/web/middleware/auditContext.js`

**Función:** Establece variables de sesión MySQL (`@current_user_id`, `@current_username`, `@current_user_rol`) que los triggers pueden leer.

### Uso en Backend

```javascript
import { setAuditContext } from './middleware/auditContext.js';

// En routes.js, después de authRequired
router.use(setAuditContext);

// Todas las rutas posteriores tendrán contexto de auditoría
```

### Funciones Helper

#### `logAuditEvent()`

Registra eventos de auditoría personalizados.

```javascript
import { logAuditEvent } from './middleware/auditContext.js';

await logAuditEvent(
  userId,
  'UPDATE',
  'persona',
  personaId,
  { email: 'old@email.com' },
  { email: 'new@email.com' },
  'admin',
  'ADMIN'
);
```

#### `getRecordHistory()`

Obtiene el historial completo de un registro.

```javascript
import { getRecordHistory } from './middleware/auditContext.js';

const history = await getRecordHistory('persona', 42);
console.log(history);
// [{ operation_type: 'UPDATE', usuario_username: 'admin', ... }]
```

#### `getUserActivity()`

Obtiene la actividad de un usuario.

```javascript
import { getUserActivity } from './middleware/auditContext.js';

const activity = await getUserActivity(3, 7);  // Últimos 7 días
console.log(activity);
// [{ table_name: 'persona', operation_type: 'UPDATE', total: 15 }]
```

---

## 🚀 Instalación y Configuración

### Paso 1: Aplicar Migraciones SQL

```bash
# Conectar a MySQL
docker exec -it talenttracker_mysql mysql -uroot -proot

# Aplicar script de creación de BD de auditoría
source /app/migrations/014_create_audit_system.sql;

# Aplicar triggers
source /app/migrations/015_create_audit_triggers.sql;
```

### Paso 2: Construir Contenedores

```bash
cd backend

# Construir contenedor de automatización
docker-compose build automation

# Iniciar todos los servicios
docker-compose up -d
```

### Paso 3: Verificar Servicios

```bash
# Verificar que todos los contenedores estén corriendo
docker-compose ps

# Debería mostrar:
# - talenttracker_mysql
# - talenttracker_api
# - talenttracker_adminer
# - talenttracker_automation  ✓ NUEVO
# - talenttracker_biometric
# - talenttracker_performance
```

### Paso 4: Verificar Cron Jobs

```bash
# Ver cron jobs configurados
docker exec talenttracker_automation crontab -l

# Ver logs de cron
docker exec talenttracker_automation tail -f /var/log/talenttracker/hourly.log
```

### Paso 5: Integrar Middleware en Backend

Editar `backend/src/web/routes.js`:

```javascript
import { setAuditContext } from './middleware/auditContext.js';
import { authRequired } from './middleware/auth.js';

// Aplicar middleware globalmente después de authRequired
router.use(authRequired);
router.use(setAuditContext);  // ✓ AGREGAR ESTA LÍNEA

// Todas las rutas posteriores tendrán contexto de auditoría
```

---

## 📖 Uso y Consultas

### Consultas Comunes

#### 1. Ver todas las modificaciones de hoy

```sql
SELECT
  table_name,
  operation_type,
  usuario_username,
  record_id,
  operation_timestamp
FROM club_lujan_audit.audit_master
WHERE DATE(operation_timestamp) = CURDATE()
ORDER BY operation_timestamp DESC;
```

#### 2. Ver historial de un registro específico

```sql
CALL club_lujan_audit.sp_get_record_history('persona', 42);
```

#### 3. Ver actividad de un usuario

```sql
SELECT * FROM club_lujan_audit.v_audit_user_activity
WHERE usuario_id = 3
ORDER BY last_operation DESC;
```

#### 4. Ver tablas más modificadas (últimos 7 días)

```sql
SELECT
  table_name,
  COUNT(*) as total_changes,
  COUNT(DISTINCT usuario_id) as unique_users
FROM club_lujan_audit.audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY table_name
ORDER BY total_changes DESC
LIMIT 10;
```

#### 5. Ver usuarios más activos

```sql
SELECT
  usuario_username,
  COUNT(*) as total_operations,
  COUNT(DISTINCT table_name) as tables_modified
FROM club_lujan_audit.audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY usuario_username
ORDER BY total_operations DESC;
```

#### 6. Ver sesiones activas

```sql
SELECT * FROM club_lujan_audit.v_active_sessions;
```

#### 7. Ver último backup

```sql
SELECT
  backup_file,
  ROUND(file_size_bytes / 1024 / 1024, 2) as size_mb,
  start_time,
  duration_seconds,
  status
FROM club_lujan_audit.backup_logs
ORDER BY start_time DESC
LIMIT 1;
```

#### 8. Ver métricas de performance actuales

```sql
SELECT * FROM club_lujan_audit.performance_metrics
ORDER BY metric_timestamp DESC
LIMIT 1;
```

---

## 🔧 Mantenimiento

### Limpieza de Auditorías Antiguas

**Automático:** Se ejecuta todos los domingos a las 2:00 AM

**Manual:**

```sql
CALL club_lujan_audit.sp_cleanup_old_audits(90);
```

### Verificar Espacio en Disco

```bash
docker exec talenttracker_mysql df -h /var/lib/mysql
```

### Ver Tamaño de Base de Datos

```sql
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema IN ('club_lujan', 'club_lujan_audit')
GROUP BY table_schema;
```

### Regenerar Índices (Optimización)

```sql
USE club_lujan_audit;
OPTIMIZE TABLE audit_master;
ANALYZE TABLE audit_master;
```

---

## 🚨 Troubleshooting

### Problema: Triggers no registran usuario_id

**Causa:** Middleware `setAuditContext` no está aplicado.

**Solución:**

```javascript
// Verificar que esté en routes.js
router.use(setAuditContext);
```

### Problema: Backups no se ejecutan

**Verificar cron:**

```bash
docker exec talenttracker_automation crontab -l
```

**Ver logs:**

```bash
docker logs talenttracker_automation
tail -f backend/logs/backup.log
```

### Problema: Espacio en disco lleno

**Limpiar backups antiguos manualmente:**

```bash
find ./backend/backups -name "*.sql.gz" -mtime +30 -delete
```

**Limpiar auditorías antiguas:**

```sql
CALL club_lujan_audit.sp_cleanup_old_audits(30);
```

### Problema: Performance degradada

**Verificar índices:**

```sql
SHOW INDEX FROM club_lujan_audit.audit_master;
```

**Verificar tamaño de tabla:**

```sql
SELECT
  ROUND(data_length / 1024 / 1024, 2) AS data_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_mb
FROM information_schema.TABLES
WHERE table_schema = 'club_lujan_audit'
  AND table_name = 'audit_master';
```

**Si la tabla es muy grande, considerar particionar:**

```sql
-- Particionar por mes
ALTER TABLE club_lujan_audit.audit_master
PARTITION BY RANGE (TO_DAYS(operation_timestamp)) (
  PARTITION p202511 VALUES LESS THAN (TO_DAYS('2025-12-01')),
  PARTITION p202512 VALUES LESS THAN (TO_DAYS('2026-01-01')),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## 📈 Reportes y Análisis

### Reporte Semanal Automático

**Horario:** Lunes 8:00 AM

**Ubicación:** `/var/log/talenttracker/reports/weekly_report_YYYYMMDD.txt`

**Ver último reporte:**

```bash
cat backend/logs/reports/weekly_report_$(date +%Y%m%d).txt
```

### Generar Reporte Manual

```bash
docker exec talenttracker_automation /app/scripts/weekly_report.sh
```

---

## 🎯 Mejores Prácticas

1. **Revisar logs regularmente:**
   ```bash
   docker logs talenttracker_automation
   ```

2. **Monitorear espacio en disco:**
   ```bash
   docker exec talenttracker_mysql df -h
   ```

3. **Verificar backups:**
   ```sql
   SELECT * FROM club_lujan_audit.backup_logs
   ORDER BY start_time DESC LIMIT 5;
   ```

4. **Analizar actividad sospechosa:**
   ```sql
   SELECT * FROM club_lujan_audit.audit_master
   WHERE operation_type = 'DELETE'
   AND operation_timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

5. **Mantener retención adecuada:**
   - Auditorías: 90 días
   - Backups: 30 días
   - Logs: 7 días

---

## 📞 Soporte

Para más información o soporte:
- Documentación del proyecto: `README.md`
- Logs del sistema: `backend/logs/`
- Base de datos de auditoría: `club_lujan_audit`

---

**Versión:** 1.0
**Fecha:** 2025-11-11
**Autor:** Sistema de Auditoría TalentTracker
