#!/bin/bash
# =========================================
# INSTALADOR AUTOMÁTICO - SISTEMA DE AUDITORÍA
# TalentTracker
# =========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de log
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Banner
echo ""
echo "========================================="
echo "  INSTALADOR DE SISTEMA DE AUDITORÍA"
echo "         TALENTTRACKER v1.0"
echo "========================================="
echo ""

# =========================================
# PASO 1: Verificar Requisitos
# =========================================

log "Verificando requisitos previos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
    exit 1
fi
success "Docker instalado"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado"
    exit 1
fi
success "Docker Compose instalado"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    error "No se encuentra docker-compose.yml. Ejecuta este script desde el directorio backend/"
    exit 1
fi
success "Directorio correcto"

# Verificar que MySQL está corriendo
if ! docker-compose ps mysql | grep -q "Up"; then
    warning "MySQL no está corriendo. Iniciando..."
    docker-compose up -d mysql
    sleep 10
fi

# Verificar conectividad a MySQL
if ! docker exec talenttracker_mysql mysql -uroot -proot -e "SELECT 1;" &> /dev/null; then
    error "No se puede conectar a MySQL"
    exit 1
fi
success "MySQL disponible"

# =========================================
# PASO 2: Crear Directorios Necesarios
# =========================================

log "Creando directorios necesarios..."

mkdir -p backups
mkdir -p logs
mkdir -p logs/reports

success "Directorios creados"

# =========================================
# PASO 3: Aplicar Migraciones SQL
# =========================================

log "Aplicando migraciones SQL..."

# Migración 1: Base de datos de auditoría
log "  - Creando base de datos de auditoría..."
if docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/014_create_audit_system.sql > /dev/null 2>&1; then
    success "Base de datos de auditoría creada"
else
    error "Error al crear base de datos de auditoría"
    exit 1
fi

# Verificar que la base de datos fue creada
if ! docker exec talenttracker_mysql mysql -uroot -proot -e "USE club_lujan_audit; SHOW TABLES;" > /dev/null 2>&1; then
    error "Base de datos de auditoría no fue creada correctamente"
    exit 1
fi

# Migración 2: Triggers de auditoría
log "  - Creando triggers de auditoría..."
if docker exec -i talenttracker_mysql mysql -uroot -proot < migrations/015_create_audit_triggers.sql > /dev/null 2>&1; then
    success "Triggers de auditoría creados"
else
    warning "Algunos triggers pueden haber fallado (esto es normal si ya existen)"
fi

# Verificar triggers
TRIGGER_COUNT=$(docker exec talenttracker_mysql mysql -uroot -proot club_lujan -N -B -e "SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_NAME LIKE 'trg_audit%';" 2>/dev/null || echo "0")

if [ "$TRIGGER_COUNT" -gt 0 ]; then
    success "$TRIGGER_COUNT triggers creados"
else
    warning "No se encontraron triggers. Verifica manualmente."
fi

# =========================================
# PASO 4: Dar Permisos a Scripts
# =========================================

log "Configurando permisos de scripts..."

chmod +x scripts/*.sh 2>/dev/null || true

success "Permisos configurados"

# =========================================
# PASO 5: Construir Contenedor de Automatización
# =========================================

log "Construyendo contenedor de automatización..."

if docker-compose build automation > /dev/null 2>&1; then
    success "Contenedor de automatización construido"
else
    error "Error al construir contenedor de automatización"
    exit 1
fi

# =========================================
# PASO 6: Iniciar Contenedor de Automatización
# =========================================

log "Iniciando contenedor de automatización..."

docker-compose up -d automation

# Esperar a que inicie
sleep 5

# Verificar que está corriendo
if docker-compose ps automation | grep -q "Up"; then
    success "Contenedor de automatización iniciado"
else
    error "Contenedor de automatización no se inició correctamente"
    docker logs talenttracker_automation
    exit 1
fi

# Verificar cron jobs
log "Verificando configuración de cron jobs..."
docker exec talenttracker_automation crontab -l > /dev/null 2>&1 || warning "Cron jobs no configurados correctamente"

success "Cron jobs configurados"

# =========================================
# PASO 7: Verificar Instalación
# =========================================

log "Ejecutando verificaciones..."

# Verificar base de datos
TABLE_COUNT=$(docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -N -B -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='club_lujan_audit';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -ge 5 ]; then
    success "Base de datos de auditoría: $TABLE_COUNT tablas"
else
    warning "Base de datos de auditoría incompleta"
fi

# Verificar vistas
VIEW_COUNT=$(docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit -N -B -e "SELECT COUNT(*) FROM information_schema.VIEWS WHERE TABLE_SCHEMA='club_lujan_audit';" 2>/dev/null || echo "0")

if [ "$VIEW_COUNT" -ge 4 ]; then
    success "Vistas creadas: $VIEW_COUNT"
else
    warning "Vistas incompletas"
fi

# Ejecutar health check
log "Ejecutando health check..."
if docker exec talenttracker_automation /app/scripts/health_check.sh > /dev/null 2>&1; then
    success "Health check pasado"
else
    warning "Health check falló (puede ser normal en la primera ejecución)"
fi

# =========================================
# PASO 8: Mensaje de Integración de Middleware
# =========================================

echo ""
echo "========================================="
echo "  INSTALACIÓN COMPLETADA"
echo "========================================="
echo ""
success "Sistema de auditoría instalado exitosamente"
echo ""

echo -e "${YELLOW}⚠ IMPORTANTE - INTEGRACIÓN DE MIDDLEWARE${NC}"
echo ""
echo "Para completar la instalación, debes integrar el middleware en el backend:"
echo ""
echo "1. Editar el archivo: ${BLUE}src/web/routes.js${NC}"
echo ""
echo "2. Agregar al inicio del archivo:"
echo "   ${GREEN}import { setAuditContext } from './middleware/auditContext.js';${NC}"
echo ""
echo "3. Agregar después de ${BLUE}authRequired${NC}:"
echo "   ${GREEN}router.use(setAuditContext);${NC}"
echo ""
echo "4. Reiniciar el backend:"
echo "   ${BLUE}docker-compose restart api${NC}"
echo ""

echo "========================================="
echo "  VERIFICACIÓN RÁPIDA"
echo "========================================="
echo ""
echo "Contenedores activos:"
docker-compose ps | grep -E "(mysql|automation|api)"
echo ""

echo "Bases de datos:"
docker exec talenttracker_mysql mysql -uroot -proot -e "SHOW DATABASES;" | grep -E "(club_lujan|audit)"
echo ""

echo "Triggers creados: $TRIGGER_COUNT"
echo "Tablas de auditoría: $TABLE_COUNT"
echo "Vistas: $VIEW_COUNT"
echo ""

echo "========================================="
echo "  PRÓXIMOS PASOS"
echo "========================================="
echo ""
echo "1. Integrar middleware (ver instrucciones arriba)"
echo "2. Reiniciar backend: docker-compose restart api"
echo "3. Ver documentación completa: cat AUDIT_SYSTEM_DOCUMENTATION.md"
echo "4. Monitorear logs: docker logs -f talenttracker_automation"
echo "5. Primer backup automático: 3:00 AM (Argentina)"
echo ""

echo "========================================="
echo "  COMANDOS ÚTILES"
echo "========================================="
echo ""
echo "Ver logs de automatización:"
echo "  ${BLUE}docker logs -f talenttracker_automation${NC}"
echo ""
echo "Ejecutar backup manualmente:"
echo "  ${BLUE}docker exec talenttracker_automation /app/scripts/backup_full.sh${NC}"
echo ""
echo "Ver auditoría:"
echo "  ${BLUE}docker exec talenttracker_mysql mysql -uroot -proot club_lujan_audit${NC}"
echo ""
echo "Consultar actividad:"
echo "  ${BLUE}SELECT * FROM club_lujan_audit.v_audit_user_activity;${NC}"
echo ""

echo "========================================="
echo ""

exit 0
