# Checklist: Preparar TalentTracker para Transferencia

Este documento te guía paso a paso para preparar el proyecto antes de comprimirlo y transferirlo a tu notebook.

## Checklist Rápido

```
[ ] 1. Verificar que Docker esté funcionando correctamente
[ ] 2. Hacer backup de la base de datos actualizada
[ ] 3. Verificar archivos de configuración (.env)
[ ] 4. Limpiar archivos temporales
[ ] 5. Verificar archivos esenciales
[ ] 6. Comprimir el proyecto
[ ] 7. Verificar el archivo comprimido
```

## Paso 1: Verificar Docker y Servicios

```bash
cd C:\Users\osuna\Desktop\TalentTracker\backend

# Verificar estado de servicios
docker-compose ps

# Deberías ver todos los servicios "Up" o "Up (healthy)"
```

## Paso 2: Hacer Backup Actualizado de la Base de Datos

```bash
# Crear backup con fecha actual
docker exec talenttracker_mysql mysqldump -uroot -proot club_lujan > ../club_lujan.sql

# Verificar que el archivo se creó correctamente
ls -lh ../club_lujan.sql

# Debería tener un tamaño razonable (100KB - 10MB dependiendo de los datos)
```

## Paso 3: Verificar Archivos de Configuración

### Backend .env
```bash
# Verificar que existe
ls backend/.env

# Ver contenido (asegúrate de que las credenciales sean correctas)
cat backend/.env
```

Debe contener al menos:
- `DB_HOST=mysql`
- `DB_USER=club`
- `DB_PASSWORD=club`
- `DB_NAME=club_lujan`
- `JWT_SECRET=cambiar_super_secreto`
- `PUBLIC_BASE_URL=http://localhost:3000`

### Frontend .env.local
```bash
# Verificar que existe
ls frontend/.env.local

# Ver contenido
cat frontend/.env.local
```

Debe contener:
- `NEXT_PUBLIC_API_BASE=http://localhost:3000`
- `NEXT_PUBLIC_WS_PERFORMANCE=ws://localhost:3000/ws/performance`

### Archivos .example
```bash
# Verificar que los archivos .example existen (son plantillas)
ls backend/.env.example
ls frontend/.env.local.example
```

## Paso 4: Limpiar Archivos Temporales

### Opción A: Limpieza Ligera (Recomendado)

Esta opción mantiene node_modules para instalar más rápido en el notebook.

```bash
cd C:\Users\osuna\Desktop\TalentTracker

# Limpiar builds de Next.js
rm -rf frontend/.next

# Limpiar datos de MySQL (se restaurarán desde club_lujan.sql)
# CUIDADO: Esto borra los datos locales. Asegúrate de haber hecho el backup en Paso 2
# rm -rf backend/mysql-data/*

# Limpiar logs
find . -name "*.log" -delete

# Limpiar cache de Python
find . -name "__pycache__" -type d -exec rm -rf {} +
```

### Opción B: Limpieza Completa (Archivo más pequeño)

Esta opción elimina node_modules. Tendrás que reinstalarlos en el notebook.

```bash
cd C:\Users\osuna\Desktop\TalentTracker

# TODO lo de la Opción A más:

# Eliminar node_modules (se reinstalarán en el notebook)
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Esto reducirá el tamaño del archivo considerablemente
# De ~500MB a ~20MB
```

## Paso 5: Verificar Archivos Esenciales

Ejecuta este comando para verificar que todos los archivos importantes estén presentes:

```bash
cd C:\Users\osuna\Desktop\TalentTracker

echo "Verificando archivos esenciales..."

# Archivos de configuración
[ -f backend/.env ] && echo "✓ backend/.env" || echo "✗ backend/.env FALTA"
[ -f backend/.env.example ] && echo "✓ backend/.env.example" || echo "✗ backend/.env.example FALTA"
[ -f frontend/.env.local ] && echo "✓ frontend/.env.local" || echo "✗ frontend/.env.local FALTA"
[ -f frontend/.env.local.example ] && echo "✓ frontend/.env.local.example" || echo "✗ frontend/.env.local.example FALTA"

# Docker
[ -f backend/docker-compose.yml ] && echo "✓ docker-compose.yml" || echo "✗ docker-compose.yml FALTA"
[ -f backend/Dockerfile ] && echo "✓ backend/Dockerfile" || echo "✗ backend/Dockerfile FALTA"
[ -f biometric_access/Dockerfile ] && echo "✓ biometric_access/Dockerfile" || echo "✗ biometric_access/Dockerfile FALTA"
[ -f performance_tracker/Dockerfile ] && echo "✓ performance_tracker/Dockerfile" || echo "✗ performance_tracker/Dockerfile FALTA"

# Base de datos y modelos
[ -f club_lujan.sql ] && echo "✓ club_lujan.sql" || echo "✗ club_lujan.sql FALTA (HACER BACKUP!)"
[ -f yolov8n-pose.pt ] && echo "✓ yolov8n-pose.pt" || echo "✗ yolov8n-pose.pt FALTA"

# Package.json
[ -f backend/package.json ] && echo "✓ backend/package.json" || echo "✗ backend/package.json FALTA"
[ -f frontend/package.json ] && echo "✓ frontend/package.json" || echo "✗ frontend/package.json FALTA"

# Requirements Python
[ -f biometric_access/requirements.txt ] && echo "✓ biometric_access/requirements.txt" || echo "✗ biometric_access/requirements.txt FALTA"
[ -f performance_tracker/requirements.txt ] && echo "✓ performance_tracker/requirements.txt" || echo "✗ performance_tracker/requirements.txt FALTA"

# Documentación
[ -f INSTALACION_NOTEBOOK.md ] && echo "✓ INSTALACION_NOTEBOOK.md" || echo "✗ INSTALACION_NOTEBOOK.md FALTA"

echo ""
echo "Verificación completada."
```

### PowerShell (Windows alternativo)

Si usas PowerShell en lugar de Git Bash:

```powershell
cd C:\Users\osuna\Desktop\TalentTracker

Write-Host "Verificando archivos esenciales..."

# Archivos de configuración
if (Test-Path "backend\.env") { Write-Host "✓ backend\.env" -ForegroundColor Green } else { Write-Host "✗ backend\.env FALTA" -ForegroundColor Red }
if (Test-Path "frontend\.env.local") { Write-Host "✓ frontend\.env.local" -ForegroundColor Green } else { Write-Host "✗ frontend\.env.local FALTA" -ForegroundColor Red }
if (Test-Path "club_lujan.sql") { Write-Host "✓ club_lujan.sql" -ForegroundColor Green } else { Write-Host "✗ club_lujan.sql FALTA" -ForegroundColor Red }
if (Test-Path "yolov8n-pose.pt") { Write-Host "✓ yolov8n-pose.pt" -ForegroundColor Green } else { Write-Host "✗ yolov8n-pose.pt FALTA" -ForegroundColor Red }
```

## Paso 6: Comprimir el Proyecto

### Opción A: Usando 7-Zip (Recomendado para Windows)

1. Click derecho en la carpeta `TalentTracker`
2. 7-Zip > Agregar a archivo...
3. Configuración recomendada:
   - Formato: RAR o ZIP
   - Nivel de compresión: Normal
   - Método de compresión: LZMA2 (RAR) o Deflate (ZIP)
   - Diccionario: 32 MB
4. Nombre: `TalentTracker_[FECHA].rar` (ej: TalentTracker_20251110.rar)
5. Click "Aceptar"

### Opción B: Usando tar (Git Bash)

```bash
cd C:\Users\osuna\Desktop

# Crear archivo tar.gz
tar -czf TalentTracker_$(date +%Y%m%d).tar.gz TalentTracker/

# O crear archivo zip
zip -r TalentTracker_$(date +%Y%m%d).zip TalentTracker/ -x "*/node_modules/*" "*/mysql-data/*" "*/.next/*"
```

### Tamaños Esperados

**Con node_modules:**
- Sin comprimir: ~500 MB - 1 GB
- Comprimido: ~150 MB - 300 MB

**Sin node_modules (Opción B del Paso 4):**
- Sin comprimir: ~50 MB - 100 MB
- Comprimido: ~20 MB - 40 MB

## Paso 7: Verificar el Archivo Comprimido

### Verificar integridad

```bash
# Para .rar (usando 7-Zip)
"C:\Program Files\7-Zip\7z.exe" t TalentTracker_20251110.rar

# Para .tar.gz
tar -tzf TalentTracker_20251110.tar.gz | head -20

# Para .zip
unzip -l TalentTracker_20251110.zip | head -20
```

### Lista de verificación final

```
[ ] El archivo comprimido se creó correctamente
[ ] El tamaño del archivo es razonable (ver "Tamaños Esperados")
[ ] Se puede abrir el archivo sin errores
[ ] Al listar el contenido, aparecen las carpetas principales (backend, frontend, etc.)
```

## Paso 8: Transferir a Notebook

### Opciones de transferencia:

1. **USB/Disco Externo** (Más rápido para archivos grandes)
   - Copiar el .rar al USB
   - Conectar USB al notebook
   - Copiar a ubicación deseada

2. **Red Local/Compartir Carpetas**
   - Compartir carpeta en PC principal
   - Acceder desde notebook
   - Copiar archivo

3. **Nube** (OneDrive, Google Drive, Dropbox)
   - Subir a la nube (puede tardar según tu internet)
   - Descargar en el notebook

4. **Cable de Red Directo**
   - Usar cable Ethernet directo entre PCs
   - Compartir archivos por red

## Notas Importantes

1. **NUNCA** borres el proyecto original hasta verificar que funciona en el notebook
2. **GUARDA** una copia del club_lujan.sql actualizado por separado
3. **VERIFICA** que los archivos .env estén incluidos
4. **ANOTA** cualquier configuración especial que hayas hecho
5. Si usas la Opción B (sin node_modules), planea ~30 minutos extra para reinstalar dependencias

## Problemas Comunes

### "Error al crear archivo: Espacio insuficiente"
- Libera espacio en tu disco
- Usa una ubicación diferente
- Usa la Opción B (sin node_modules)

### "Archivo muy grande para transferir"
- Usa la Opción B de limpieza
- Divide en partes con 7-Zip (Click en "Dividir en volúmenes")
- Usa transferencia por red en lugar de USB

### "No puedo encontrar 7-Zip"
- Descarga desde: https://www.7-zip.org/
- O usa el compresor integrado de Windows (ZIP)
- O usa Git Bash con tar

## Siguiente Paso

Una vez que hayas transferido el archivo al notebook, sigue la guía:
**INSTALACION_NOTEBOOK.md**

---

**Checklist Final antes de comprimir:**

```
[ ] ✓ Docker funcionando y servicios corriendo
[ ] ✓ Backup de base de datos actualizado (club_lujan.sql)
[ ] ✓ Archivos .env verificados
[ ] ✓ Archivos .env.example presentes
[ ] ✓ Archivos temporales limpiados
[ ] ✓ yolov8n-pose.pt presente
[ ] ✓ Todos los archivos esenciales verificados
[ ] ✓ Proyecto comprimido exitosamente
[ ] ✓ Archivo comprimido verificado
[ ] ✓ Listo para transferir
```

¡Listo para transferir a tu notebook!
