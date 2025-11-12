# 🛡️ SISTEMA DE AUDITORÍA - TALENTTRACKER

## 📖 Resumen Ejecutivo

Sistema completo de auditoría, backups y logging para TalentTracker que registra **quién**, **cuándo** y **qué** cambió en cada tabla de la base de datos.

## ✨ Características

✅ **Auditoría Completa**
- Base de datos separada (`club_lujan_audit`)
- Triggers automáticos en 33+ tablas
- Registro de INSERT/UPDATE/DELETE
- Tracking de usuario, IP, fecha-hora

✅ **Backups Automáticos**
- Diarios a las 3:00 AM (Argentina GMT-3)
- Comprimidos con gzip
- Verificación de integridad
- Retención de 30 días

✅ **Logging Horario**
- Métricas de performance
- Estadísticas de uso
- Análisis de actividad
- Reportes semanales (Lunes 8 AM)

✅ **Monitoreo**
- Health checks cada 15 minutos
- Alertas de espacio en disco
- Detección de queries lentas
- Tracking de sesiones activas

## 🚀 Instalación Rápida

```bash
cd backend
chmod +x install_audit_system.sh
./install_audit_system.sh
```

**Ver:** [AUDIT_INSTALLATION.md](AUDIT_INSTALLATION.md) para instalación detallada.

## 📊 Componentes Creados

### Archivos SQL (Migraciones)
- `migrations/014_create_audit_system.sql` - Base de datos de auditoría
- `migrations/015_create_audit_triggers.sql` - Triggers para todas las tablas

### Scripts de Automatización
- `scripts/backup_full.sh` - Backup completo diario
- `scripts/hourly_logs.sh` - Logging horario
- `scripts/health_check.sh` - Verificación de salud
- `scripts/weekly_report.sh` - Reporte semanal
- `scripts/cleanup_audit.sh` - Limpieza de auditorías antiguas
- `scripts/crontab` - Configuración de cron jobs

### Middleware Backend
- `src/web/middleware/auditContext.js` - Contexto de auditoría
  - `setAuditContext()` - Establece usuario_id en sesión MySQL
  - `logAuditEvent()` - Registra eventos personalizados
  - `getRecordHistory()` - Obtiene historial de registro
  - `getUserActivity()` - Obtiene actividad de usuario

### Docker
- `Dockerfile.automation` - Contenedor de automatización
- `docker-compose.yml` - Actualizado con servicio `automation`

### Documentación
- `AUDIT_README.md` - Este archivo (resumen)
- `AUDIT_INSTALLATION.md` - Guía de instalación
- `AUDIT_SYSTEM_DOCUMENTATION.md` - Documentación completa (100+ páginas)

## 📦 Estructura de la Base de Datos de Auditoría

```sql
club_lujan_audit/
├── audit_master            -- Tabla maestra de auditoría
├── user_sessions           -- Tracking de sesiones
├── backup_logs             -- Registro de backups
├── performance_metrics     -- Métricas de performance
├── database_logs           -- Logs generales
├── audit_statistics        -- Estadísticas diarias
├── v_audit_user_activity   -- Vista: actividad por usuario
├── v_audit_recent_changes  -- Vista: cambios recientes
├── v_active_sessions       -- Vista: sesiones activas
├── v_backup_statistics     -- Vista: estadísticas de backups
├── sp_get_record_history   -- Stored proc: historial de registro
├── sp_get_user_activity    -- Stored proc: actividad de usuario
├── sp_cleanup_old_audits   -- Stored proc: limpieza
└── sp_audit_report         -- Stored proc: reporte
```

## 🔍 Consultas Rápidas

### Ver actividad reciente
```sql
SELECT * FROM club_lujan_audit.v_audit_user_activity
ORDER BY last_operation DESC
LIMIT 10;
```

### Ver historial de un registro
```sql
CALL club_lujan_audit.sp_get_record_history('persona', 42);
```

### Ver último backup
```sql
SELECT * FROM club_lujan_audit.backup_logs
ORDER BY start_time DESC
LIMIT 1;
```

### Ver métricas actuales
```sql
SELECT * FROM club_lujan_audit.performance_metrics
ORDER BY metric_timestamp DESC
LIMIT 1;
```

## 🕐 Cron Jobs Configurados

| Horario | Tarea | Script |
|---------|-------|--------|
| 3:00 AM (diario) | Backup completo | `backup_full.sh` |
| Cada hora | Logging y métricas | `hourly_logs.sh` |
| Cada 15 min | Health check | `health_check.sh` |
| Lunes 8:00 AM | Reporte semanal | `weekly_report.sh` |
| Domingo 2:00 AM | Limpieza | `cleanup_audit.sh` |

## 📍 Ubicación de Archivos

```
backend/
├── backups/                    # Backups (.sql.gz)
├── logs/                       # Logs del sistema
│   ├── backup.log
│   ├── hourly.log
│   ├── health.log
│   └── reports/
│       └── weekly_report_*.txt
├── migrations/
│   ├── 014_create_audit_system.sql
│   └── 015_create_audit_triggers.sql
├── scripts/
│   ├── backup_full.sh
│   ├── hourly_logs.sh
│   ├── health_check.sh
│   ├── weekly_report.sh
│   ├── cleanup_audit.sh
│   └── crontab
├── src/web/middleware/
│   └── auditContext.js
├── Dockerfile.automation
├── docker-compose.yml
├── install_audit_system.sh
├── AUDIT_README.md
├── AUDIT_INSTALLATION.md
└── AUDIT_SYSTEM_DOCUMENTATION.md
```

## 🐳 Servicios Docker

```bash
# Ver estado de servicios
docker-compose ps

# Servicios activos:
# - talenttracker_mysql       (3306)
# - talenttracker_api         (3000)
# - talenttracker_adminer     (8080)
# - talenttracker_automation  (nuevo)
# - talenttracker_biometric   (8010)
# - talenttracker_performance (8020)
```

## 🔧 Comandos Útiles

```bash
# Ver logs de automatización
docker logs -f talenttracker_automation

# Ejecutar backup manualmente
docker exec talenttracker_automation /app/scripts/backup_full.sh

# Ejecutar health check
docker exec talenttracker_automation /app/scripts/health_check.sh

# Ver cron jobs
docker exec talenttracker_automation crontab -l

# Consultar auditoría
docker exec -it talenttracker_mysql mysql -uroot -proot club_lujan_audit

# Ver backups
ls -lh backend/backups/

# Ver logs
tail -f backend/logs/backup.log
tail -f backend/logs/hourly.log
```

## 📋 Checklist de Verificación

- [ ] Base de datos `club_lujan_audit` creada
- [ ] 40+ triggers creados
- [ ] Contenedor `automation` corriendo
- [ ] Cron jobs configurados
- [ ] Middleware integrado en backend
- [ ] Health check pasando
- [ ] Prueba de trigger exitosa
- [ ] Primer backup ejecutado

## 📚 Documentación

- **Instalación:** [AUDIT_INSTALLATION.md](AUDIT_INSTALLATION.md)
- **Documentación completa:** [AUDIT_SYSTEM_DOCUMENTATION.md](AUDIT_SYSTEM_DOCUMENTATION.md)
- **Script instalador:** `install_audit_system.sh`

## 🎯 Próximos Pasos

1. **Instalar el sistema:**
   ```bash
   ./install_audit_system.sh
   ```

2. **Integrar middleware** en `src/web/routes.js`:
   ```javascript
   import { setAuditContext } from './middleware/auditContext.js';
   router.use(setAuditContext);
   ```

3. **Reiniciar backend:**
   ```bash
   docker-compose restart api
   ```

4. **Monitorear logs:**
   ```bash
   docker logs -f talenttracker_automation
   ```

5. **Consultar auditoría:**
   ```sql
   SELECT * FROM club_lujan_audit.audit_master
   ORDER BY operation_timestamp DESC LIMIT 10;
   ```

## 🚨 Soporte

- **Logs:** `backend/logs/`
- **Troubleshooting:** Ver `AUDIT_INSTALLATION.md`
- **Consultas:** Ver `AUDIT_SYSTEM_DOCUMENTATION.md`

---

**Sistema de Auditoría TalentTracker v1.0**
**Fecha:** 2025-11-11
**Estado:** ✅ Listo para Producción
