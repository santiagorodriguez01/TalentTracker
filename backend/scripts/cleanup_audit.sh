#!/bin/bash
# =========================================
# SCRIPT DE LIMPIEZA DE AUDITORÍAS ANTIGUAS
# Mantiene solo los últimos N días de auditoría
# Ejecuta: Domingos 2:00 AM
# =========================================

set -e

# Configuración
DAYS_TO_KEEP=${AUDIT_RETENTION_DAYS:-90}

# Credenciales MySQL
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-club}"
DB_PASS="${DB_PASS:-club}"
DB_AUDIT="club_lujan_audit"

# Función de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "========================================="
log "INICIO DE LIMPIEZA DE AUDITORÍAS"
log "Retención: $DAYS_TO_KEEP días"
log "========================================="

# Ejecutar stored procedure de limpieza
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
    CALL sp_cleanup_old_audits($DAYS_TO_KEEP);
"

log "Limpieza completada exitosamente"

exit 0
