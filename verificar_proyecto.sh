#!/bin/bash
# Script de verificación del proyecto TalentTracker
# Ejecuta este script antes de comprimir el proyecto

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERROR_COUNT=0
WARNING_COUNT=0

echo "============================================"
echo "   Verificador de Proyecto TalentTracker"
echo "============================================"
echo ""

# Verificar archivos de configuración
echo "[1/6] Verificando archivos de configuración..."
if [ -f "backend/.env" ]; then
    echo -e "  ${GREEN}[OK]${NC} backend/.env"
else
    echo -e "  ${RED}[ERROR]${NC} backend/.env NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "backend/.env.example" ]; then
    echo -e "  ${GREEN}[OK]${NC} backend/.env.example"
else
    echo -e "  ${RED}[ERROR]${NC} backend/.env.example NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "frontend/.env.local" ]; then
    echo -e "  ${GREEN}[OK]${NC} frontend/.env.local"
else
    echo -e "  ${RED}[ERROR]${NC} frontend/.env.local NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "frontend/.env.local.example" ]; then
    echo -e "  ${GREEN}[OK]${NC} frontend/.env.local.example"
else
    echo -e "  ${RED}[ERROR]${NC} frontend/.env.local.example NO ENCONTRADO"
    ((ERROR_COUNT++))
fi
echo ""

# Verificar Docker
echo "[2/6] Verificando Docker..."
if [ -f "backend/docker-compose.yml" ]; then
    echo -e "  ${GREEN}[OK]${NC} docker-compose.yml"
else
    echo -e "  ${RED}[ERROR]${NC} docker-compose.yml NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "backend/Dockerfile" ]; then
    echo -e "  ${GREEN}[OK]${NC} backend/Dockerfile"
else
    echo -e "  ${RED}[ERROR]${NC} backend/Dockerfile NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "biometric_access/Dockerfile" ]; then
    echo -e "  ${GREEN}[OK]${NC} biometric_access/Dockerfile"
else
    echo -e "  ${RED}[ERROR]${NC} biometric_access/Dockerfile NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "performance_tracker/Dockerfile" ]; then
    echo -e "  ${GREEN}[OK]${NC} performance_tracker/Dockerfile"
else
    echo -e "  ${RED}[ERROR]${NC} performance_tracker/Dockerfile NO ENCONTRADO"
    ((ERROR_COUNT++))
fi
echo ""

# Verificar base de datos y modelos
echo "[3/6] Verificando base de datos y modelos AI..."
if [ -f "club_lujan.sql" ]; then
    SIZE=$(ls -lh club_lujan.sql | awk '{print $5}')
    echo -e "  ${GREEN}[OK]${NC} club_lujan.sql ($SIZE)"
else
    echo -e "  ${YELLOW}[ADVERTENCIA]${NC} club_lujan.sql NO ENCONTRADO - ¡Ejecuta backup de MySQL!"
    ((WARNING_COUNT++))
fi

if [ -f "yolov8n-pose.pt" ]; then
    SIZE=$(ls -lh yolov8n-pose.pt | awk '{print $5}')
    echo -e "  ${GREEN}[OK]${NC} yolov8n-pose.pt ($SIZE)"
else
    echo -e "  ${RED}[ERROR]${NC} yolov8n-pose.pt NO ENCONTRADO"
    ((ERROR_COUNT++))
fi
echo ""

# Verificar package.json
echo "[4/6] Verificando package.json..."
if [ -f "backend/package.json" ]; then
    echo -e "  ${GREEN}[OK]${NC} backend/package.json"
else
    echo -e "  ${RED}[ERROR]${NC} backend/package.json NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "frontend/package.json" ]; then
    echo -e "  ${GREEN}[OK]${NC} frontend/package.json"
else
    echo -e "  ${RED}[ERROR]${NC} frontend/package.json NO ENCONTRADO"
    ((ERROR_COUNT++))
fi
echo ""

# Verificar requirements Python
echo "[5/6] Verificando requirements.txt..."
if [ -f "biometric_access/requirements.txt" ]; then
    echo -e "  ${GREEN}[OK]${NC} biometric_access/requirements.txt"
else
    echo -e "  ${RED}[ERROR]${NC} biometric_access/requirements.txt NO ENCONTRADO"
    ((ERROR_COUNT++))
fi

if [ -f "performance_tracker/requirements.txt" ]; then
    echo -e "  ${GREEN}[OK]${NC} performance_tracker/requirements.txt"
else
    echo -e "  ${RED}[ERROR]${NC} performance_tracker/requirements.txt NO ENCONTRADO"
    ((ERROR_COUNT++))
fi
echo ""

# Verificar documentación
echo "[6/6] Verificando documentación..."
if [ -f "INSTALACION_NOTEBOOK.md" ]; then
    echo -e "  ${GREEN}[OK]${NC} INSTALACION_NOTEBOOK.md"
else
    echo -e "  ${YELLOW}[ADVERTENCIA]${NC} INSTALACION_NOTEBOOK.md NO ENCONTRADO"
    ((WARNING_COUNT++))
fi

if [ -f "PREPARAR_TRANSFERENCIA.md" ]; then
    echo -e "  ${GREEN}[OK]${NC} PREPARAR_TRANSFERENCIA.md"
else
    echo -e "  ${YELLOW}[ADVERTENCIA]${NC} PREPARAR_TRANSFERENCIA.md NO ENCONTRADO"
    ((WARNING_COUNT++))
fi

if [ -f "README.md" ]; then
    echo -e "  ${GREEN}[OK]${NC} README.md"
else
    echo -e "  ${YELLOW}[ADVERTENCIA]${NC} README.md NO ENCONTRADO"
    ((WARNING_COUNT++))
fi
echo ""

# Estadísticas del proyecto
echo "============================================"
echo "   Estadísticas del Proyecto"
echo "============================================"

if [ -d "backend/node_modules" ]; then
    SIZE=$(du -sh backend/node_modules 2>/dev/null | awk '{print $1}')
    echo -e "  Backend node_modules: ${YELLOW}PRESENTE${NC} (~$SIZE)"
else
    echo "  Backend node_modules: NO PRESENTE (se instalará en destino)"
fi

if [ -d "frontend/node_modules" ]; then
    SIZE=$(du -sh frontend/node_modules 2>/dev/null | awk '{print $1}')
    echo -e "  Frontend node_modules: ${YELLOW}PRESENTE${NC} (~$SIZE)"
else
    echo "  Frontend node_modules: NO PRESENTE (se instalará en destino)"
fi

if [ -d "backend/mysql-data" ]; then
    SIZE=$(du -sh backend/mysql-data 2>/dev/null | awk '{print $1}')
    echo -e "  MySQL data: ${YELLOW}PRESENTE${NC} (~$SIZE) - se puede limpiar"
else
    echo "  MySQL data: NO PRESENTE"
fi

if [ -d "frontend/.next" ]; then
    SIZE=$(du -sh frontend/.next 2>/dev/null | awk '{print $1}')
    echo -e "  Next.js build: ${YELLOW}PRESENTE${NC} (~$SIZE) - se puede limpiar"
else
    echo "  Next.js build: NO PRESENTE"
fi
echo ""

# Tamaño total estimado
TOTAL_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')
echo "  Tamaño total del proyecto: $TOTAL_SIZE"
echo ""

# Resumen final
echo "============================================"
echo "   Resumen de Verificación"
echo "============================================"

if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}[ERROR]${NC} Se encontraron $ERROR_COUNT errores críticos."
    echo "Por favor, revisa los mensajes anteriores."
    echo ""
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo -e "${YELLOW}[ADVERTENCIA]${NC} Se encontraron $WARNING_COUNT advertencias."
    echo "El proyecto puede funcionar, pero revisa los mensajes."
    echo ""
else
    echo -e "${GREEN}[OK]${NC} Todos los archivos esenciales están presentes."
    echo "El proyecto está listo para ser comprimido."
    echo ""
fi

echo "Recomendaciones antes de comprimir:"
echo "1. Haz backup de la base de datos:"
echo "   docker exec talenttracker_mysql mysqldump -uroot -proot club_lujan > club_lujan.sql"
echo ""
echo "2. Para reducir tamaño, considera eliminar:"
echo "   - backend/mysql-data (se regenerará con Docker)"
echo "   - frontend/.next (se regenerará con npm run dev)"
echo "   - node_modules (se reinstalarán con npm install)"
echo ""
echo "3. Comprime el proyecto:"
echo "   tar -czf TalentTracker_\$(date +%Y%m%d).tar.gz TalentTracker/"
echo ""

exit 0
