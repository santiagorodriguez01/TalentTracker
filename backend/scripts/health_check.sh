#!/bin/bash
# =========================================
# HEALTH CHECK - TALENTTRACKER
# Verifica conectividad y salud del sistema
# Ejecuta: Cada 15 minutos
# =========================================

set -e

# Credenciales MySQL
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-club}"
DB_PASS="${DB_PASS:-club}"
DB_MAIN="club_lujan"
DB_AUDIT="club_lujan_audit"

# Función de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función para registrar en la base de datos
log_to_db() {
    local level=$1
    local category=$2
    local message=$3
    local details=$4

    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF 2>/dev/null
INSERT INTO database_logs (log_level, log_category, message, details)
VALUES ('$level', '$category', '$message', $details);
EOF
}

# Verificar MySQL
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
    log "✓ MySQL: OK"
else
    log "✗ MySQL: ERROR - No se puede conectar"
    exit 1
fi

# Verificar base de datos principal
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_MAIN" -e "SELECT 1;" >/dev/null 2>&1; then
    log "✓ DB Principal ($DB_MAIN): OK"
else
    log "✗ DB Principal ($DB_MAIN): ERROR"
    log_to_db "ERROR" "HEALTH_CHECK" "Base de datos principal no accesible" "JSON_OBJECT('database', '$DB_MAIN')"
    exit 1
fi

# Verificar base de datos de auditoría
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "SELECT 1;" >/dev/null 2>&1; then
    log "✓ DB Auditoría ($DB_AUDIT): OK"
else
    log "✗ DB Auditoría ($DB_AUDIT): ERROR"
    exit 1
fi

# Verificar espacio en disco
disk_usage=$(df -h /var/lib/mysql 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")
if [ "$disk_usage" -lt 90 ]; then
    log "✓ Espacio en disco: OK (${disk_usage}%)"
else
    log "✗ Espacio en disco: CRÍTICO (${disk_usage}%)"
    log_to_db "CRITICAL" "HEALTH_CHECK" "Espacio en disco crítico" "JSON_OBJECT('disk_usage_percent', $disk_usage)"
fi

# Health check exitoso
log "Health check completado: SISTEMA OK"

exit 0
