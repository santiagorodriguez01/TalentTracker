# 🚀 INSTALACIÓN RÁPIDA - SISTEMA DE AUDITORÍA

## ⚡ Instalación Automatizada (Recomendada)

```bash
cd backend
chmod +x install_audit_system.sh
./install_audit_system.sh
```

Este script:
✅ Verifica requisitos
✅ Aplica migraciones SQL
✅ Construye contenedor de automatización
✅ Integra middleware en backend
✅ Verifica instalación

---

## 📋 Instalación Manual

### Paso 1: Verificar Requisitos Previos

```bash
# Verificar que Docker esté corriendo
docker --version

# Verificar que MySQL esté corriendo
docker exec talenttracker_mysql mysql -uroot -proot -e "SELECT 1;"
```

### Paso 2: Aplicar Migraciones SQL

```bash
# Navegar al directorio backend
cd backend

# Aplicar migración de base de datos de auditoría
docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/014_create_audit_system.sql

# Aplicar migración de triggers
docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/015_create_audit_triggers.sql
```

**Verificar que las migraciones se aplicaron correctamente:**

```bash
docker exec talenttracker_mysql mysql -uroot -proot -e "SHOW DATABASES;" | grep audit
# Debería mostrar: club_lujan_audit

docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -e "SHOW TABLES;"
# Debería mostrar: audit_master, user_sessions, backup_logs, etc.

docker exec talenttracker_mysql mysql -uroot -proot club_lujan -e "SHOW TRIGGERS WHERE \`Trigger\` LIKE 'trg_audit%';" | wc -l
# Debería mostrar un número mayor a 40 (triggers creados)
```

### Paso 3: Dar Permisos a Scripts

```bash
chmod +x scripts/*.sh
```

### Paso 4: Construir Contenedor de Automatización

```bash
# Construir el contenedor
docker-compose build automation

# Iniciar el contenedor
docker-compose up -d automation
```

**Verificar que el contenedor esté corriendo:**

```bash
docker-compose ps automation
# Estado debería ser: Up

docker logs talenttracker_automation
# Debería mostrar: "Automation container iniciado. Cron daemon en ejecución."
```

### Paso 5: Integrar Middleware en Backend

Editar el archivo `src/web/routes.js` y agregar el middleware:

```javascript
// Al inicio del archivo, agregar import
import { setAuditContext } from './middleware/auditContext.js';

// Después de authRequired, agregar el middleware
router.use(authRequired);
router.use(setAuditContext);  // ⬅️ AGREGAR ESTA LÍNEA
```

### Paso 6: Reiniciar Backend

```bash
docker-compose restart api
```

### Paso 7: Verificar Instalación

```bash
# Verificar que los cron jobs estén configurados
docker exec talenttracker_automation crontab -l

# Debería mostrar algo como:
# 0 3 * * * /app/scripts/backup_full.sh
# 0 * * * * /app/scripts/hourly_logs.sh
# etc.

# Ejecutar health check manualmente
docker exec talenttracker_automation /app/scripts/health_check.sh

# Debería mostrar:
# ✓ MySQL: OK
# ✓ DB Principal: OK
# ✓ DB Auditoría: OK
# ✓ Espacio en disco: OK
```

---

## 🧪 Pruebas del Sistema

### Prueba 1: Verificar Triggers

```bash
docker exec talenttracker_mysql mysql -uroot -proot club_lujan <<EOF
-- Insertar una persona de prueba
INSERT INTO persona (nombre, apellido, dni, rol)
VALUES ('Test', 'Auditoria', '99999999', 'SOCIO');

-- Verificar que se registró en auditoría
SELECT * FROM club_lujan_audit.audit_master
WHERE table_name = 'persona' AND record_id = LAST_INSERT_ID();
EOF
```

**Resultado esperado:** Debería mostrar un registro con operation_type='INSERT'.

### Prueba 2: Verificar Backup Manual

```bash
# Ejecutar backup manualmente
docker exec talenttracker_automation /app/scripts/backup_full.sh

# Verificar que se creó el archivo
ls -lh backend/backups/

# Verificar registro en BD
docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -e "SELECT * FROM backup_logs ORDER BY start_time DESC LIMIT 1;"
```

### Prueba 3: Verificar Logging Horario

```bash
# Ejecutar logging manualmente
docker exec talenttracker_automation /app/scripts/hourly_logs.sh

# Ver el reporte generado
ls -lh backend/logs/db_stats_*.log

# Ver métricas en BD
docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -e "SELECT * FROM performance_metrics ORDER BY metric_timestamp DESC LIMIT 1;"
```

### Prueba 4: Verificar Middleware

Realizar una petición al backend que requiera autenticación:

```bash
# Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Hacer una operación que genere auditoría
curl -X GET http://localhost:3000/personas \
  -H "Authorization: Bearer $TOKEN"

# Verificar que se registró en auditoría
docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -e "SELECT * FROM audit_master WHERE usuario_username = 'admin' ORDER BY operation_timestamp DESC LIMIT 5;"
```

---

## 📊 Verificación Final

Ejecutar el siguiente script SQL para verificar que todo esté funcionando:

```sql
-- Conectar a MySQL
docker exec -it talenttracker_mysql mysql -uroot -proot

-- Verificar base de datos de auditoría
USE club_lujan_audit;
SHOW TABLES;

-- Debería mostrar:
-- - audit_master
-- - audit_statistics
-- - backup_logs
-- - database_logs
-- - performance_metrics
-- - user_sessions

-- Verificar triggers en base de datos principal
USE club_lujan;
SHOW TRIGGERS WHERE `Trigger` LIKE 'trg_audit%';

-- Debería mostrar 40+ triggers

-- Verificar vistas
USE club_lujan_audit;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Debería mostrar:
-- - v_active_sessions
-- - v_audit_recent_changes
-- - v_audit_user_activity
-- - v_backup_statistics

-- Verificar stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'club_lujan_audit';

-- Debería mostrar:
-- - sp_audit_report
-- - sp_cleanup_old_audits
-- - sp_get_record_history
-- - sp_get_user_activity
```

---

## ✅ Checklist de Instalación

- [ ] MySQL corriendo
- [ ] Migraciones SQL aplicadas
- [ ] Base de datos `club_lujan_audit` creada
- [ ] Tablas de auditoría creadas
- [ ] Triggers creados en todas las tablas
- [ ] Vistas creadas
- [ ] Stored procedures creados
- [ ] Scripts de automatización con permisos de ejecución
- [ ] Contenedor de automatización construido y corriendo
- [ ] Cron jobs configurados
- [ ] Middleware integrado en backend
- [ ] Backend reiniciado
- [ ] Health check pasando
- [ ] Pruebas exitosas

---

## 🎯 Próximos Pasos

1. **Monitorear logs:**
   ```bash
   # Ver logs de automatización
   docker logs -f talenttracker_automation

   # Ver logs de backup
   tail -f backend/logs/backup.log

   # Ver logs horarios
   tail -f backend/logs/hourly.log
   ```

2. **Esperar al primer backup automático** (3:00 AM Argentina)

3. **Revisar reporte semanal** (Lunes 8:00 AM)

4. **Consultar auditoría regularmente:**
   ```sql
   SELECT * FROM club_lujan_audit.v_audit_user_activity;
   SELECT * FROM club_lujan_audit.v_audit_recent_changes;
   ```

---

## 🚨 Troubleshooting

### Error: "Can't connect to MySQL server"

```bash
# Verificar que MySQL esté corriendo
docker-compose ps mysql

# Reiniciar MySQL si es necesario
docker-compose restart mysql
```

### Error: "Permission denied" en scripts

```bash
chmod +x scripts/*.sh
```

### Error: "Database 'club_lujan_audit' doesn't exist"

```bash
# Aplicar migración nuevamente
docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/014_create_audit_system.sql
```

### Error: Triggers no funcionan

```bash
# Verificar que los triggers existan
docker exec talenttracker_mysql mysql -uroot -proot club_lujan -e "SHOW TRIGGERS;"

# Si no existen, aplicar migración de triggers
docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/015_create_audit_triggers.sql
```

---

## 📚 Documentación Adicional

- **Documentación completa:** `AUDIT_SYSTEM_DOCUMENTATION.md`
- **Consultas útiles:** Ver sección "Uso y Consultas" en la documentación
- **Mantenimiento:** Ver sección "Mantenimiento" en la documentación

---

## 📞 Soporte

Si encuentras algún problema durante la instalación:

1. Revisar logs:
   ```bash
   docker logs talenttracker_mysql
   docker logs talenttracker_automation
   ```

2. Verificar estado de contenedores:
   ```bash
   docker-compose ps
   ```

3. Consultar la documentación completa en `AUDIT_SYSTEM_DOCUMENTATION.md`

---

**¡Sistema de Auditoría Instalado Exitosamente! 🎉**
