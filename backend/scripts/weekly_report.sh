#!/bin/bash
# =========================================
# REPORTE SEMANAL - TALENTTRACKER
# Genera reporte semanal de actividad y auditoría
# Ejecuta: Lunes 8:00 AM
# =========================================

set -e

# Configuración
REPORT_DIR="/var/log/talenttracker/reports"
TIMESTAMP=$(date +"%Y%m%d")

# Credenciales MySQL
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-club}"
DB_PASS="${DB_PASS:-club}"
DB_AUDIT="club_lujan_audit"

# Crear directorio de reportes si no existe
mkdir -p $REPORT_DIR

# Función de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Generando reporte semanal..."

REPORT_FILE="$REPORT_DIR/weekly_report_${TIMESTAMP}.txt"

{
    echo "========================================="
    echo "TALENTTRACKER - REPORTE SEMANAL"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Período: Últimos 7 días"
    echo "========================================="
    echo ""

    echo "1. RESUMEN DE ACTIVIDAD DE USUARIOS"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT * FROM v_audit_user_activity
        ORDER BY total_operations DESC
        LIMIT 20;
    "

    echo ""
    echo "2. TABLAS MÁS MODIFICADAS"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            table_name,
            SUM(total_operations) as total_ops,
            SUM(CASE WHEN operation_type = 'INSERT' THEN total_operations ELSE 0 END) as inserts,
            SUM(CASE WHEN operation_type = 'UPDATE' THEN total_operations ELSE 0 END) as updates,
            SUM(CASE WHEN operation_type = 'DELETE' THEN total_operations ELSE 0 END) as deletes
        FROM v_audit_recent_changes
        GROUP BY table_name
        ORDER BY total_ops DESC
        LIMIT 15;
    "

    echo ""
    echo "3. ESTADÍSTICAS DE BACKUPS"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT * FROM v_backup_statistics;
    "

    echo ""
    echo "4. BACKUPS RECIENTES"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            backup_type,
            database_name,
            backup_file,
            ROUND(file_size_bytes / 1024 / 1024, 2) as size_mb,
            start_time,
            duration_seconds,
            status
        FROM backup_logs
        WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY start_time DESC;
    "

    echo ""
    echo "5. LOGS DE ERRORES Y WARNINGS"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            log_timestamp,
            log_level,
            log_category,
            message
        FROM database_logs
        WHERE log_level IN ('ERROR', 'WARNING', 'CRITICAL')
        AND log_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY log_timestamp DESC
        LIMIT 50;
    "

    echo ""
    echo "6. MÉTRICAS DE PERFORMANCE (Promedio Semanal)"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            ROUND(AVG(database_size_mb), 2) as avg_db_size_mb,
            ROUND(AVG(queries_per_second), 2) as avg_qps,
            ROUND(AVG(active_connections), 0) as avg_connections,
            SUM(slow_queries) as total_slow_queries,
            ROUND(AVG(active_transactions), 0) as avg_transactions
        FROM performance_metrics
        WHERE metric_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    "

    echo ""
    echo "7. SESIONES DE USUARIO (Resumen)"
    echo "-----------------------------------"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            COUNT(*) as total_sessions,
            COUNT(DISTINCT usuario_id) as unique_users,
            ROUND(AVG(session_duration_minutes), 0) as avg_duration_minutes,
            MAX(session_duration_minutes) as max_duration_minutes
        FROM user_sessions
        WHERE login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY);
    "

    echo ""
    echo "========================================="
    echo "FIN DEL REPORTE"
    echo "========================================="

} > "$REPORT_FILE"

log "Reporte generado: $REPORT_FILE"

# Registrar en logs
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO database_logs (log_level, log_category, message, details)
VALUES ('INFO', 'REPORT', 'Reporte semanal generado',
        JSON_OBJECT('report_file', '$REPORT_FILE', 'timestamp', NOW()));
EOF

exit 0
