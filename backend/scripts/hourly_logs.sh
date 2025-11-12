#!/bin/bash
# =========================================
# SCRIPT DE LOGGING HORARIO - TALENTTRACKER
# Recolecta estadísticas y logs cada hora
# =========================================

set -e

# Configuración
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="/var/log/talenttracker"
RETENTION_DAYS=7

# Credenciales MySQL
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-club}"
DB_PASS="${DB_PASS:-club}"
DB_ROOT_PASS="${MYSQL_ROOT_PASSWORD:-root}"
DB_MAIN="club_lujan"
DB_AUDIT="club_lujan_audit"

# Crear directorio de logs si no existe
mkdir -p $LOG_DIR

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

    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO database_logs (log_level, log_category, message, details)
VALUES ('$level', '$category', '$message', $details);
EOF
}

# =========================================
# RECOLECCIÓN DE MÉTRICAS DE PERFORMANCE
# =========================================

collect_performance_metrics() {
    log "Recolectando métricas de performance..."

    # Obtener métricas de MySQL
    local db_size=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -B -e "
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2)
        FROM information_schema.TABLES
        WHERE table_schema = '$DB_MAIN';
    ")

    local table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -B -e "
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE table_schema = '$DB_MAIN';
    ")

    local active_connections=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW STATUS LIKE 'Threads_connected';
    " | awk '{print $2}')

    local max_connections=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW VARIABLES LIKE 'max_connections';
    " | awk '{print $2}')

    local total_queries=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW GLOBAL STATUS LIKE 'Questions';
    " | awk '{print $2}')

    local slow_queries=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW GLOBAL STATUS LIKE 'Slow_queries';
    " | awk '{print $2}')

    local buffer_pool_size=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SELECT ROUND(@@innodb_buffer_pool_size / 1024 / 1024, 2);
    ")

    local active_transactions=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SELECT COUNT(*)
        FROM information_schema.INNODB_TRX;
    ")

    # Calcular QPS (queries por segundo) - basado en uptime
    local uptime=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW GLOBAL STATUS LIKE 'Uptime';
    " | awk '{print $2}')

    local qps=0
    if [ "$uptime" -gt 0 ]; then
        qps=$(echo "scale=2; $total_queries / $uptime" | bc)
    fi

    # Insertar métricas en la BD de auditoría
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO performance_metrics (
    database_size_mb, table_count, active_connections, max_connections,
    total_queries, slow_queries, queries_per_second, buffer_pool_size_mb,
    active_transactions
) VALUES (
    $db_size, $table_count, $active_connections, $max_connections,
    $total_queries, $slow_queries, $qps, $buffer_pool_size,
    $active_transactions
);
EOF

    log "Métricas registradas: DB=${db_size}MB, QPS=$qps, Active Conn=$active_connections"

    # Registrar en logs
    log_to_db "INFO" "METRICS" "Métricas horarias recolectadas" \
        "JSON_OBJECT('db_size_mb', $db_size, 'qps', $qps, 'active_connections', $active_connections, 'slow_queries', $slow_queries)"
}

# =========================================
# ESTADÍSTICAS DE AUDITORÍA
# =========================================

collect_audit_stats() {
    log "Recolectando estadísticas de auditoría..."

    # Obtener estadísticas de la última hora
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO audit_statistics (fecha, table_name, operation_type, total_operations, unique_users)
SELECT
    CURDATE(),
    table_name,
    operation_type,
    COUNT(*) as total_operations,
    COUNT(DISTINCT usuario_id) as unique_users
FROM audit_master
WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY table_name, operation_type
ON DUPLICATE KEY UPDATE
    total_operations = total_operations + VALUES(total_operations),
    unique_users = GREATEST(unique_users, VALUES(unique_users));
EOF

    # Contar operaciones de la última hora
    local total_ops=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -N -B -e "
        SELECT COUNT(*)
        FROM audit_master
        WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
    ")

    log "Operaciones de auditoría en la última hora: $total_ops"

    log_to_db "INFO" "AUDIT_STATS" "Estadísticas de auditoría de la última hora" \
        "JSON_OBJECT('total_operations', $total_ops)"
}

# =========================================
# ANÁLISIS DE TABLAS MÁS ACTIVAS
# =========================================

analyze_active_tables() {
    log "Analizando tablas más activas..."

    local active_tables=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
        SELECT
            table_name,
            operation_type,
            COUNT(*) as operations,
            COUNT(DISTINCT usuario_id) as unique_users
        FROM audit_master
        WHERE operation_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY table_name, operation_type
        ORDER BY operations DESC
        LIMIT 10;
    " | tail -n +2)  # Omitir encabezado

    if [ -z "$active_tables" ]; then
        log "No hay actividad en la última hora"
    else
        log "Tablas más activas:"
        echo "$active_tables" | while read -r line; do
            log "  $line"
        done
    fi
}

# =========================================
# VERIFICACIÓN DE SESIONES ACTIVAS
# =========================================

check_active_sessions() {
    log "Verificando sesiones activas..."

    local active_sessions=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -N -B -e "
        SELECT COUNT(*)
        FROM user_sessions
        WHERE logout_time IS NULL;
    ")

    log "Sesiones activas: $active_sessions"

    # Si hay sesiones activas hace más de 24 horas, reportar
    local stale_sessions=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -N -B -e "
        SELECT COUNT(*)
        FROM user_sessions
        WHERE logout_time IS NULL
        AND login_time < DATE_SUB(NOW(), INTERVAL 24 HOUR);
    ")

    if [ "$stale_sessions" -gt 0 ]; then
        log "WARNING: $stale_sessions sesiones activas hace más de 24 horas"
        log_to_db "WARNING" "SESSIONS" "Sesiones antiguas detectadas" \
            "JSON_OBJECT('stale_sessions', $stale_sessions)"
    fi
}

# =========================================
# VERIFICACIÓN DE ESPACIO EN DISCO
# =========================================

check_disk_space() {
    log "Verificando espacio en disco..."

    local disk_usage=$(df -h /var/lib/mysql 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ -z "$disk_usage" ]; then
        disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    fi

    log "Uso de disco: ${disk_usage}%"

    if [ "$disk_usage" -gt 80 ]; then
        log "WARNING: Uso de disco alto: ${disk_usage}%"
        log_to_db "WARNING" "DISK_SPACE" "Uso de disco alto" \
            "JSON_OBJECT('disk_usage_percent', $disk_usage)"
    elif [ "$disk_usage" -gt 90 ]; then
        log "CRITICAL: Uso de disco crítico: ${disk_usage}%"
        log_to_db "CRITICAL" "DISK_SPACE" "Uso de disco crítico" \
            "JSON_OBJECT('disk_usage_percent', $disk_usage)"
    fi
}

# =========================================
# ANÁLISIS DE QUERIES LENTAS
# =========================================

check_slow_queries() {
    log "Analizando queries lentas..."

    local slow_queries=$(mysql -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" -N -B -e "
        SHOW GLOBAL STATUS LIKE 'Slow_queries';
    " | awk '{print $2}')

    log "Total de queries lentas: $slow_queries"

    if [ "$slow_queries" -gt 100 ]; then
        log "WARNING: Cantidad alta de queries lentas"
        log_to_db "WARNING" "SLOW_QUERIES" "Cantidad alta de queries lentas detectadas" \
            "JSON_OBJECT('slow_queries', $slow_queries)"
    fi
}

# =========================================
# LIMPIEZA DE LOGS ANTIGUOS
# =========================================

cleanup_old_logs() {
    log "Limpiando logs antiguos (más de $RETENTION_DAYS días)..."

    find $LOG_DIR -name "*.log" -type f -mtime +$RETENTION_DAYS -delete

    local deleted_count=$(find $LOG_DIR -name "*.log" -type f -mtime +$RETENTION_DAYS | wc -l)

    log "Logs eliminados: $deleted_count"
}

# =========================================
# EXPORTAR LOGS A ARCHIVO
# =========================================

export_logs_to_file() {
    local log_file="$LOG_DIR/db_stats_${TIMESTAMP}.log"

    log "Exportando logs a archivo: $log_file"

    {
        echo "========================================="
        echo "TALENTTRACKER - REPORTE HORARIO"
        echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "========================================="
        echo ""

        echo "MÉTRICAS DE PERFORMANCE (última hora):"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
            SELECT * FROM performance_metrics
            ORDER BY metric_timestamp DESC
            LIMIT 1;
        "

        echo ""
        echo "ESTADÍSTICAS DE AUDITORÍA (último día):"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
            SELECT table_name, operation_type, total_operations, unique_users
            FROM audit_statistics
            WHERE fecha = CURDATE()
            ORDER BY total_operations DESC
            LIMIT 10;
        "

        echo ""
        echo "LOGS RECIENTES (últimas 10 entradas):"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" -e "
            SELECT log_timestamp, log_level, log_category, message
            FROM database_logs
            ORDER BY log_timestamp DESC
            LIMIT 10;
        "

        echo ""
        echo "========================================="

    } > "$log_file"

    log "Logs exportados exitosamente"
}

# =========================================
# EJECUCIÓN PRINCIPAL
# =========================================

log "========================================="
log "INICIO DE LOGGING HORARIO - TALENTTRACKER"
log "========================================="

# Verificar conectividad
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
    log "ERROR: No se puede conectar a MySQL"
    exit 1
fi

# Ejecutar todas las funciones
collect_performance_metrics
collect_audit_stats
analyze_active_tables
check_active_sessions
check_disk_space
check_slow_queries
export_logs_to_file
cleanup_old_logs

log "========================================="
log "LOGGING HORARIO COMPLETADO"
log "========================================="

exit 0
