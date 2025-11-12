# 🎯 Sistema de Asistencias para Coordinador - Instrucciones de Uso

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema completo de gestión de asistencias para el rol de coordinador, incluyendo:

### 1. Base de Datos
- ✅ Tabla `asistencia_alumno` creada con todas las relaciones
- ✅ Índices optimizados para consultas rápidas
- ✅ 6 alumnos de prueba creados y asignados al coordinador
- ✅ Deportes y categorías configurados
- ✅ Registros de asistencia de ejemplo

### 2. Backend
- ✅ Endpoints ya implementados y funcionales:
  - `GET /coordinador/alumnos` - Listar alumnos del coordinador
  - `POST /alumnos/:id/asistencias` - Marcar asistencia
  - `GET /coordinador/asistencias` - Consultar historial

### 3. Frontend
- ✅ Vista mejorada de toma de asistencias (`/alumnos`)
- ✅ Vista de historial de asistencias (`/asistencias`)
- ✅ Feedback visual con notificaciones
- ✅ Filtros por deporte, categoría y fecha
- ✅ Exportación a CSV
- ✅ Estadísticas en tiempo real

---

## 🔐 Credenciales de Acceso

### Usuario Coordinador
```
Usuario: coordinador
Contraseña: coordinador123
```

**Persona asociada:**
- Nombre: Carlos Rodríguez
- DNI: 35789456
- Email: carlos.rodriguez@clublujan.com

---

## 👥 Alumnos de Prueba

El coordinador tiene asignados 6 alumnos:

| Nombre | DNI | Deporte(s) | Categoría |
|--------|-----|------------|-----------|
| Lucas González | 45123456 | Fútbol | Sub-12 |
| Martina López | 45234567 | Fútbol, Voley | Sub-12 |
| Tomás Fernández | 45345678 | Basquet | Sub-10 |
| Sofía Martínez | 45456789 | Natación, Voley | Sub-12 |
| Juan Pérez | 40000001 | - | - |
| Valentina Gómez | 45678901 | Basquet | Sub-10 |

---

## 🚀 Cómo Probar el Sistema

### Paso 1: Verificar que los servicios estén corriendo

```bash
# Verificar Docker
docker ps

# Deberías ver:
# - talenttracker_mysql
# - talenttracker_api
# - talenttracker_adminer
# - talenttracker_biometric
# - talenttracker_performance
```

### Paso 2: Acceder al Frontend

1. Abre tu navegador en: **http://localhost:3001**
2. Verás la pantalla de login

### Paso 3: Iniciar Sesión

1. Ingresa las credenciales del coordinador:
   - Usuario: `coordinador`
   - Contraseña: `coordinador123`
2. Click en "Iniciar Sesión"

### Paso 4: Tomar Asistencia

1. Después del login, verás el Dashboard
2. En el menú inferior (mobile) o lateral (desktop), click en **"Alumnos"**
3. Verás la vista de "Tomar Asistencia" con:
   - **Estadísticas**: Total de alumnos, deportes y categorías
   - **Filtros**: Fecha, Deporte, Categoría
   - **Cards de alumnos**: Con información y botones de asistencia

#### Funcionalidades:

##### ✅ Marcar Presente
- Click en el botón verde (✓) en el card del alumno
- Aparecerá una notificación de confirmación
- El registro se guarda en la base de datos

##### ❌ Marcar Ausente
- Click en el botón rojo (✗) en el card del alumno
- Aparecerá una notificación de confirmación
- El registro se guarda en la base de datos

##### 🔍 Filtrar Alumnos
- **Por Deporte**: Selecciona Fútbol, Basquet, Voley o Natación
- **Por Categoría**: Selecciona Sub-8, Sub-10, Sub-12, etc.
- **Por Fecha**: Cambia la fecha para tomar asistencia de otro día
- **Limpiar Filtros**: Click en "Limpiar filtros" para ver todos

##### 🔄 Refrescar
- Click en el ícono de refrescar para actualizar la lista

### Paso 5: Ver Historial de Asistencias

1. En la vista de "Tomar Asistencia", click en el botón **"Ver Historial"**
2. Verás la vista de "Historial de Asistencias" con:
   - **Estadísticas**: Total de registros, presentes, ausentes y tasa de asistencia
   - **Filtros**: Fecha desde/hasta, Deporte, Categoría
   - **Tabla**: Con todos los registros de asistencia

#### Funcionalidades del Historial:

##### 📊 Visualizar Registros
- Tabla completa con todos los registros de asistencia
- Columnas: Fecha, Alumno, DNI, Deporte, Categoría, Asistencia, Observación
- Ordenamiento por fecha (descendente por defecto)
- Paginación: 10, 25, 50 o 100 registros por página

##### 📥 Exportar a CSV
- Click en el botón **"Exportar CSV"**
- Se descargará un archivo CSV con todos los registros filtrados
- Nombre del archivo: `asistencias_YYYY-MM-DD_YYYY-MM-DD.csv`
- Compatible con Excel, Google Sheets, etc.

##### 🔙 Volver
- Click en el botón "Volver" para regresar a la vista de toma de asistencia

---

## 🗄️ Verificar Datos en la Base de Datos

### Opción 1: Usando Adminer (GUI)

1. Abre tu navegador en: **http://localhost:8080**
2. Ingresa las credenciales:
   - Sistema: **MySQL**
   - Servidor: **mysql**
   - Usuario: **club**
   - Contraseña: **club**
   - Base de datos: **club_lujan**
3. Click en "Login"
4. Explora las tablas:
   - `asistencia_alumno` - Registros de asistencia
   - `alumno` - Información de alumnos
   - `persona` - Datos personales
   - `alumno_coordinador` - Asignaciones coordinador-alumno
   - `deporte` - Catálogo de deportes
   - `categoria` - Catálogo de categorías

### Opción 2: Usando MySQL CLI

```bash
# Conectar a MySQL
docker exec -it talenttracker_mysql mysql -uclub -pclub club_lujan

# Ver asistencias
SELECT
  a.fecha,
  CONCAT(p.apellido, ', ', p.nombre) as alumno,
  d.nombre as deporte,
  c.nombre as categoria,
  IF(a.presente = 1, 'PRESENTE', 'AUSENTE') as asistencia,
  a.observacion
FROM asistencia_alumno a
INNER JOIN alumno al ON a.alumno_id = al.id
INNER JOIN persona p ON al.persona_id = p.id
INNER JOIN deporte d ON a.deporte_id = d.id
INNER JOIN categoria c ON a.categoria_id = c.id
ORDER BY a.fecha DESC;

# Ver alumnos del coordinador
SELECT
  CONCAT(p.apellido, ', ', p.nombre) as alumno,
  p.dni,
  GROUP_CONCAT(DISTINCT d.nombre) as deportes,
  GROUP_CONCAT(DISTINCT c.nombre) as categorias
FROM alumno a
INNER JOIN persona p ON a.persona_id = p.id
LEFT JOIN alumno_deporte ad ON a.id = ad.alumno_id
LEFT JOIN deporte d ON ad.deporte_id = d.id
LEFT JOIN alumno_categoria ac ON a.id = ac.alumno_id
LEFT JOIN categoria c ON ac.categoria_id = c.id
INNER JOIN alumno_coordinador acoord ON a.id = acoord.alumno_id
WHERE acoord.fecha_hasta IS NULL
GROUP BY a.id;
```

---

## 🧪 Casos de Prueba

### Test 1: Marcar asistencia de hoy
1. Login como coordinador
2. Ir a "Alumnos"
3. Marcar a "Lucas González" como PRESENTE
4. Verificar notificación de éxito
5. Ir a "Ver Historial"
6. Verificar que aparece el registro de hoy

### Test 2: Filtrar por deporte
1. En "Tomar Asistencia"
2. Seleccionar "Fútbol" en el filtro de Deporte
3. Verificar que solo aparecen: Lucas González, Martina López
4. Marcar ambos como PRESENTE
5. Verificar notificaciones

### Test 3: Filtrar por categoría
1. Seleccionar "Sub-10" en el filtro de Categoría
2. Verificar que aparecen: Tomás Fernández, Valentina Gómez
3. Marcar uno PRESENTE y otro AUSENTE

### Test 4: Ver historial con filtros
1. Ir a "Ver Historial"
2. Establecer rango de fechas (últimos 7 días)
3. Seleccionar un deporte específico
4. Verificar que solo aparecen registros de ese deporte
5. Exportar CSV y verificar el contenido

### Test 5: Asistencia de fecha pasada
1. En "Tomar Asistencia"
2. Cambiar la fecha a ayer (o cualquier día anterior)
3. Marcar asistencias
4. Verificar que se guardan con la fecha correcta

---

## 📁 Archivos Importantes

### Migrations SQL
- `backend/migrations/005_asistencia_alumno.sql` - Creación de tabla
- `backend/migrations/007_agregar_alumnos.sql` - Datos de prueba
- `backend/migrations/008_actualizar_password_coordinador.sql` - Password coordinador

### Backend
- `backend/src/web/controllers/AlumnosController.js` - Controlador de asistencias
- `backend/src/web/routes.js` - Rutas (líneas 145-149)

### Frontend
- `frontend/src/app/(private)/alumnos/page.tsx` - Vista de toma de asistencia (MEJORADA)
- `frontend/src/app/(private)/asistencias/page.tsx` - Vista de historial (NUEVA)

---

## 🎨 Características Visuales

### Vista de Toma de Asistencia
- ✨ Cards con hover effect y animaciones
- 📊 Estadísticas en tiempo real con colores
- 🎯 Botones grandes y fáciles de usar (verde/rojo)
- 📱 Responsive (mobile-first)
- 🔔 Notificaciones de feedback instantáneo
- 🎨 Chips de estado (ACTIVO/INACTIVO)
- 📅 Selector de fecha intuitivo

### Vista de Historial
- 📊 DataGrid con ordenamiento y paginación
- 📈 Estadísticas: Total, Presentes, Ausentes, Tasa %
- 🎨 Chips de colores para PRESENTE/AUSENTE
- 📥 Exportación a CSV con un click
- 🔍 Filtros avanzados por rango de fechas
- 📱 Responsive y optimizado

---

## 🔧 Troubleshooting

### El login no funciona
- Verificar que el backend esté corriendo: `docker ps`
- Verificar que la password sea: `coordinador123`
- Revisar la consola del navegador (F12) para errores

### No aparecen alumnos
- Verificar que el usuario sea rol COORDINADOR
- Verificar en la BD que existan asignaciones en `alumno_coordinador`
- Revisar la consola del navegador para errores de API

### Error al marcar asistencia
- Verificar que el deporte y categoría del alumno estén asignados
- Revisar logs del backend: `docker logs talenttracker_api`
- Verificar que la tabla `asistencia_alumno` exista

### El frontend no carga
- Verificar que esté corriendo: `curl http://localhost:3001`
- Si no está corriendo: `cd frontend && npm run dev`
- Verificar dependencias: `cd frontend && npm install`

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs del backend:
```bash
docker logs talenttracker_api
```

2. Revisa los logs de MySQL:
```bash
docker logs talenttracker_mysql
```

3. Verifica la estructura de datos:
```bash
docker exec talenttracker_mysql mysql -uclub -pclub club_lujan -e "SHOW TABLES;"
```

---

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional y listo para tomar asistencias. Puedes:

- ✅ Tomar asistencia de alumnos en tiempo real
- ✅ Filtrar por deporte, categoría y fecha
- ✅ Ver historial completo con estadísticas
- ✅ Exportar reportes a CSV
- ✅ Todo integrado: Frontend ↔ Backend ↔ Base de Datos ↔ Docker

**¡Disfruta del sistema!** 🚀
