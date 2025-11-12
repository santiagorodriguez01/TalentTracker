@echo off
REM Script de verificación del proyecto TalentTracker
REM Ejecuta este script antes de comprimir el proyecto

echo ============================================
echo   Verificador de Proyecto TalentTracker
echo ============================================
echo.

REM Verificar archivos de configuración
echo [1/6] Verificando archivos de configuracion...
if exist "backend\.env" (
    echo   [OK] backend\.env
) else (
    echo   [ERROR] backend\.env NO ENCONTRADO
    set ERROR=1
)

if exist "backend\.env.example" (
    echo   [OK] backend\.env.example
) else (
    echo   [ERROR] backend\.env.example NO ENCONTRADO
    set ERROR=1
)

if exist "frontend\.env.local" (
    echo   [OK] frontend\.env.local
) else (
    echo   [ERROR] frontend\.env.local NO ENCONTRADO
    set ERROR=1
)

if exist "frontend\.env.local.example" (
    echo   [OK] frontend\.env.local.example
) else (
    echo   [ERROR] frontend\.env.local.example NO ENCONTRADO
    set ERROR=1
)
echo.

REM Verificar Docker
echo [2/6] Verificando Docker...
if exist "backend\docker-compose.yml" (
    echo   [OK] docker-compose.yml
) else (
    echo   [ERROR] docker-compose.yml NO ENCONTRADO
    set ERROR=1
)

if exist "backend\Dockerfile" (
    echo   [OK] backend\Dockerfile
) else (
    echo   [ERROR] backend\Dockerfile NO ENCONTRADO
    set ERROR=1
)

if exist "biometric_access\Dockerfile" (
    echo   [OK] biometric_access\Dockerfile
) else (
    echo   [ERROR] biometric_access\Dockerfile NO ENCONTRADO
    set ERROR=1
)

if exist "performance_tracker\Dockerfile" (
    echo   [OK] performance_tracker\Dockerfile
) else (
    echo   [ERROR] performance_tracker\Dockerfile NO ENCONTRADO
    set ERROR=1
)
echo.

REM Verificar base de datos y modelos
echo [3/6] Verificando base de datos y modelos AI...
if exist "club_lujan.sql" (
    echo   [OK] club_lujan.sql
) else (
    echo   [ADVERTENCIA] club_lujan.sql NO ENCONTRADO - Ejecuta backup de MySQL!
    set WARNING=1
)

if exist "yolov8n-pose.pt" (
    echo   [OK] yolov8n-pose.pt
) else (
    echo   [ERROR] yolov8n-pose.pt NO ENCONTRADO
    set ERROR=1
)
echo.

REM Verificar package.json
echo [4/6] Verificando package.json...
if exist "backend\package.json" (
    echo   [OK] backend\package.json
) else (
    echo   [ERROR] backend\package.json NO ENCONTRADO
    set ERROR=1
)

if exist "frontend\package.json" (
    echo   [OK] frontend\package.json
) else (
    echo   [ERROR] frontend\package.json NO ENCONTRADO
    set ERROR=1
)
echo.

REM Verificar requirements Python
echo [5/6] Verificando requirements.txt...
if exist "biometric_access\requirements.txt" (
    echo   [OK] biometric_access\requirements.txt
) else (
    echo   [ERROR] biometric_access\requirements.txt NO ENCONTRADO
    set ERROR=1
)

if exist "performance_tracker\requirements.txt" (
    echo   [OK] performance_tracker\requirements.txt
) else (
    echo   [ERROR] performance_tracker\requirements.txt NO ENCONTRADO
    set ERROR=1
)
echo.

REM Verificar documentación
echo [6/6] Verificando documentacion...
if exist "INSTALACION_NOTEBOOK.md" (
    echo   [OK] INSTALACION_NOTEBOOK.md
) else (
    echo   [ADVERTENCIA] INSTALACION_NOTEBOOK.md NO ENCONTRADO
    set WARNING=1
)

if exist "PREPARAR_TRANSFERENCIA.md" (
    echo   [OK] PREPARAR_TRANSFERENCIA.md
) else (
    echo   [ADVERTENCIA] PREPARAR_TRANSFERENCIA.md NO ENCONTRADO
    set WARNING=1
)

if exist "README.md" (
    echo   [OK] README.md
) else (
    echo   [ADVERTENCIA] README.md NO ENCONTRADO
    set WARNING=1
)
echo.

REM Estadísticas del proyecto
echo ============================================
echo   Estadisticas del Proyecto
echo ============================================

if exist "backend\node_modules" (
    echo   Backend node_modules: PRESENTE ^(~300MB^)
) else (
    echo   Backend node_modules: NO PRESENTE ^(se instalara en destino^)
)

if exist "frontend\node_modules" (
    echo   Frontend node_modules: PRESENTE ^(~200MB^)
) else (
    echo   Frontend node_modules: NO PRESENTE ^(se instalara en destino^)
)

if exist "backend\mysql-data" (
    echo   MySQL data: PRESENTE ^(se puede limpiar^)
) else (
    echo   MySQL data: NO PRESENTE
)

if exist "frontend\.next" (
    echo   Next.js build: PRESENTE ^(se puede limpiar^)
) else (
    echo   Next.js build: NO PRESENTE
)
echo.

REM Resumen final
echo ============================================
echo   Resumen de Verificacion
echo ============================================

if defined ERROR (
    echo   [ERROR] Se encontraron ERRORES criticos.
    echo   Por favor, revisa los mensajes anteriores.
    echo.
    pause
    exit /b 1
) else if defined WARNING (
    echo   [ADVERTENCIA] Se encontraron advertencias.
    echo   El proyecto puede funcionar, pero revisa los mensajes.
    echo.
) else (
    echo   [OK] Todos los archivos esenciales estan presentes.
    echo   El proyecto esta listo para ser comprimido.
    echo.
)

echo Recomendaciones antes de comprimir:
echo 1. Haz backup de la base de datos: docker exec talenttracker_mysql mysqldump -uroot -proot club_lujan ^> club_lujan.sql
echo 2. Considera eliminar backend\mysql-data para reducir tamaño
echo 3. Considera eliminar frontend\.next para reducir tamaño
echo 4. Si quieres archivo mas pequeño, elimina node_modules
echo.

pause
