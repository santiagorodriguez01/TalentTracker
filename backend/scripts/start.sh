#!/bin/bash
set -e

echo "Configurando cron jobs..."

# Instalar crontab
crontab /app/scripts/crontab

echo "Cron jobs configurados:"
crontab -l

echo "Iniciando cron daemon..."
crond

echo "Automation container iniciado. Cron daemon en ejecución."

# Ejecutar health check inicial
sleep 10
/app/scripts/health_check.sh || true

# Mantener el contenedor en ejecución y mostrar logs
tail -f /var/log/cron 2>/dev/null || tail -f /dev/null
