#!/bin/bash
# =========================================
# SCRIPT DE BACKUP COMPLETO - TALENTTRACKER
# Realiza backup full de ambas bases de datos
# Horario: 3:00 AM Argentina (GMT-3)
# =========================================

set -e  # Salir si hay error

# Configuración
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y-%m-%d")
BACKUP_DIR="/backups"
RETENTION_DAYS=30

# Credenciales MySQL
DB_HOST="${DB_HOST:-mysql}"
DB_USER="${DB_USER:-club}"
DB_PASS="${DB_PASS:-club}"
DB_ROOT_PASS="${MYSQL_ROOT_PASSWORD:-root}"

# Bases de datos a respaldar
DB_MAIN="club_lujan"
DB_AUDIT="club_lujan_audit"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Función de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función para registrar en la base de datos de auditoría
log_to_db() {
    local backup_type=$1
    local backup_file=$2
    local file_size=$3
    local database_name=$4
    local start_time=$5
    local end_time=$6
    local duration=$7
    local status=$8
    local error_msg=$9

    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
UPDATE backup_logs
SET
    end_time = '$end_time',
    duration_seconds = $duration,
    file_size_bytes = $file_size,
    status = '$status',
    error_message = $(if [ -z "$error_msg" ]; then echo "NULL"; else echo "'$error_msg'"; fi)
WHERE backup_file = '$backup_file';
EOF
}

# Función de backup
backup_database() {
    local db_name=$1
    local backup_file="${BACKUP_DIR}/${db_name}_${TIMESTAMP}.sql.gz"
    local backup_log_id

    log "Iniciando backup de base de datos: $db_name"

    # Registrar inicio del backup en la BD de auditoría
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO backup_logs (backup_type, backup_file, database_name, start_time, status)
VALUES ('FULL', '$(basename $backup_file)', '$db_name', NOW(), 'INICIADO');
EOF

    local start_seconds=$(date +%s)
    local start_time=$(date '+%Y-%m-%d %H:%M:%S')

    # Realizar el backup
    if mysqldump -h "$DB_HOST" -u root -p"$DB_ROOT_PASS" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --quick \
        --lock-tables=false \
        "$db_name" | gzip > "$backup_file"; then

        local end_seconds=$(date +%s)
        local end_time=$(date '+%Y-%m-%d %H:%M:%S')
        local duration=$((end_seconds - start_seconds))
        local file_size=$(stat -c%s "$backup_file" 2>/dev/null || stat -f%z "$backup_file")

        log "Backup completado: $backup_file ($(du -h $backup_file | cut -f1))"

        # Actualizar registro en la BD de auditoría
        log_to_db "FULL" "$(basename $backup_file)" "$file_size" "$db_name" "$start_time" "$end_time" "$duration" "COMPLETADO" ""

        # Verificar integridad del backup
        if gunzip -t "$backup_file" 2>/dev/null; then
            log "Verificación de integridad OK"
        else
            log "ERROR: Verificación de integridad falló"
            log_to_db "FULL" "$(basename $backup_file)" "$file_size" "$db_name" "$start_time" "$end_time" "$duration" "FALLIDO" "Verificación de integridad falló"
            return 1
        fi
    else
        local end_seconds=$(date +%s)
        local end_time=$(date '+%Y-%m-%d %H:%M:%S')
        local duration=$((end_seconds - start_seconds))

        log "ERROR: Backup falló para $db_name"
        log_to_db "FULL" "$(basename $backup_file)" "0" "$db_name" "$start_time" "$end_time" "$duration" "FALLIDO" "mysqldump falló"
        return 1
    fi
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    log "Limpiando backups antiguos (más de $RETENTION_DAYS días)"

    find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

    local deleted_count=$(find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS | wc -l)

    log "Backups eliminados: $deleted_count"

    # Registrar limpieza en logs
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO database_logs (log_level, log_category, message, details)
VALUES ('INFO', 'BACKUP_CLEANUP', 'Limpieza de backups antiguos',
        JSON_OBJECT('retention_days', $RETENTION_DAYS, 'deleted_count', $deleted_count));
EOF
}

# Función para obtener estadísticas de la BD
collect_db_stats() {
    log "Recolectando estadísticas de la base de datos"

    # Obtener métricas
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

    # Insertar métricas en la BD de auditoría
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_AUDIT" <<EOF
INSERT INTO performance_metrics (
    database_size_mb, table_count, active_connections, max_connections,
    total_queries, slow_queries
) VALUES (
    $db_size, $table_count, $active_connections, $max_connections,
    $total_queries, $slow_queries
);
EOF

    log "Estadísticas recolectadas: DB Size=${db_size}MB, Tables=${table_count}, Active Connections=${active_connections}"
}

# =========================================
# EJECUCIÓN PRINCIPAL
# =========================================

log "========================================="
log "INICIO DE BACKUP FULL - TALENTTRACKER"
log "========================================="

# Verificar conectividad
if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
    log "ERROR: No se puede conectar a MySQL"
    exit 1
fi

# Realizar backup de ambas bases de datos
backup_database "$DB_MAIN"
backup_database "$DB_AUDIT"

# Recolectar estadísticas
collect_db_stats

# Limpiar backups antiguos
cleanup_old_backups

# Resumen final
log "========================================="
log "BACKUP COMPLETADO EXITOSAMENTE"
log "Archivos generados:"
ls -lh $BACKUP_DIR/*${TIMESTAMP}*.sql.gz 2>/dev/null || log "No se encontraron archivos de backup"
log "========================================="

exit 0
