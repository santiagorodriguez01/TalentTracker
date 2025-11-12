# 🎯 Sistema de Asistencias con Turnos - Actualizado

## ✅ Lo que está FUNCIONANDO

### 📊 Base de Datos - 100% Operativa

#### Deportes Actualizados
Los deportes están configurados según tu requerimiento:
- ⚽ Futbol
- 🥊 Boxeo
- ⚽ Futbol Femenino
- 🏐 Voley
- 🤾 Handball

#### Turnos de Entrenamiento
Sistema de turnos creado y operativo:
- 🌅 **Mañana**: 08:00 - 12:00
- ☀️ **Tarde**: 14:00 - 18:00
- 🌙 **Noche**: 18:00 - 22:00

#### Tabla de Asistencias
La tabla `asistencia_alumno` ahora incluye:
- `alumno_id` - ID del alumno
- `fecha` - Fecha de la asistencia
- `deporte_id` - Deporte específico
- `categoria_id` - Categoría del alumno
- **`turno_id`** - **NUEVO**: Turno de entrenamiento
- `presente` - true/false
- `observacion` - Notas opcionales

**Unique Key**: `(alumno_id, fecha, deporte_id, categoria_id, turno_id)`
Esto significa: Un alumno puede tener múltiples asistencias por día, una por cada combinación de deporte/categoría/turno.

---

## 👥 Usuarios y Datos de Prueba

### Coordinador
```
Usuario: coordinador
Contraseña: coordinador123
```

### Alumnos Creados (con deportes asignados)

| Nombre | Apellido | DNI | Deporte |
|--------|----------|-----|---------|
| Juan | Pérez | 40000001 | Futbol |
| Cristian | Benetti | 45123456 | Boxeo |
| Martina | López | 45234567 | Futbol Femenino |
| Tomás | Fernández | 45345678 | Handball |
| Sofía | Martínez | 45456789 | Voley |
| Valentina | Gómez | 45678901 | Futbol Femenino |

**TODOS** están asignados al coordinador y listos para tomar asistencia.

---

## 🗄️ Administrar con Adminer (Funcional al 100%)

### Acceso a Adminer
1. Abre: **http://localhost:8080**
2. Credenciales:
   - Sistema: **MySQL**
   - Servidor: **mysql**
   - Usuario: **club**
   - Contraseña: **club**
   - Base de datos: **club_lujan**

### Operaciones Disponibles

#### ✅ Ver Deportes
```sql
SELECT id, nombre FROM deporte ORDER BY nombre;
```

#### ✅ Ver Turnos
```sql
SELECT id, nombre, hora_inicio, hora_fin FROM turno;
```

#### ✅ Ver Alumnos con Deportes
```sql
SELECT
  p.nombre,
  p.apellido,
  p.dni,
  d.nombre as deporte,
  c.nombre as categoria
FROM alumno a
INNER JOIN persona p ON a.persona_id = p.id
LEFT JOIN alumno_deporte ad ON a.id = ad.alumno_id
LEFT JOIN deporte d ON ad.deporte_id = d.id
LEFT JOIN alumno_categoria ac ON a.id = ac.alumno_id
LEFT JOIN categoria c ON ac.categoria_id = c.id;
```

#### ✅ Registrar Asistencia Manualmente
```sql
-- Ejemplo: Juan Pérez presente en Futbol, turno Tarde
INSERT INTO asistencia_alumno
  (alumno_id, fecha, deporte_id, categoria_id, turno_id, presente, observacion)
VALUES
  (1, CURDATE(), 10, 3, 2, 1, 'Buen desempeño');

-- IDs importantes:
-- Alumnos: SELECT id FROM alumno;
-- Deportes: SELECT id, nombre FROM deporte;
-- Categorías: SELECT id, nombre FROM categoria;
-- Turnos: 1=Mañana, 2=Tarde, 3=Noche
```

#### ✅ Ver Asistencias Registradas
```sql
SELECT
  DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha,
  CONCAT(p.apellido, ', ', p.nombre) as alumno,
  d.nombre as deporte,
  c.nombre as categoria,
  t.nombre as turno,
  IF(a.presente = 1, 'PRESENTE', 'AUSENTE') as asistencia,
  a.observacion
FROM asistencia_alumno a
INNER JOIN alumno al ON a.alumno_id = al.id
INNER JOIN persona p ON al.persona_id = p.id
INNER JOIN deporte d ON a.deporte_id = d.id
INNER JOIN categoria c ON a.categoria_id = c.id
INNER JOIN turno t ON a.turno_id = t.id
ORDER BY a.fecha DESC, t.hora_inicio;
```

#### ✅ Asignar Deporte a Alumno
```sql
-- Ejemplo: Asignar Boxeo a Juan Pérez
INSERT INTO alumno_deporte (alumno_id, deporte_id)
VALUES (1, 11)  -- 1=Juan, 11=Boxeo
ON DUPLICATE KEY UPDATE alumno_id=VALUES(alumno_id);
```

#### ✅ Cambiar Deporte de un Alumno
```sql
-- Primero eliminar el actual
DELETE FROM alumno_deporte WHERE alumno_id = 1;

-- Luego asignar el nuevo
INSERT INTO alumno_deporte (alumno_id, deporte_id)
VALUES (1, 12);  -- Cambiar a Futbol Femenino
```

---

## 📋 Casos de Uso Completos

### Caso 1: Tomar Asistencia Completa de Hoy

```sql
-- Obtener IDs necesarios
SET @hoy = CURDATE();
SET @turno_tarde = 2;
SET @sub12 = 3;

-- Futbol - Tarde
-- Juan Pérez - PRESENTE
INSERT INTO asistencia_alumno (alumno_id, fecha, deporte_id, categoria_id, turno_id, presente)
VALUES (1, @hoy, 10, @sub12, @turno_tarde, 1);

-- Boxeo - Tarde
-- Cristian Benetti - AUSENTE
INSERT INTO asistencia_alumno (alumno_id, fecha, deporte_id, categoria_id, turno_id, presente, observacion)
VALUES (2, @hoy, 11, @sub12, @turno_tarde, 0, 'Enfermedad justificada');

-- Futbol Femenino - Tarde
-- Martina López - PRESENTE
INSERT INTO asistencia_alumno (alumno_id, fecha, deporte_id, categoria_id, turno_id, presente)
VALUES (3, @hoy, 12, @sub12, @turno_tarde, 1);

-- Ver resumen
SELECT COUNT(*) as total_registros FROM asistencia_alumno WHERE fecha = @hoy;
```

### Caso 2: Reporte de Asistencia por Deporte

```sql
SELECT
  d.nombre as deporte,
  COUNT(*) as total_asistencias,
  SUM(IF(a.presente = 1, 1, 0)) as presentes,
  SUM(IF(a.presente = 0, 1, 0)) as ausentes,
  ROUND(SUM(IF(a.presente = 1, 1, 0)) * 100.0 / COUNT(*), 1) as porcentaje_asistencia
FROM asistencia_alumno a
INNER JOIN deporte d ON a.deporte_id = d.id
WHERE a.fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
GROUP BY d.id, d.nombre
ORDER BY d.nombre;
```

### Caso 3: Historial de un Alumno

```sql
-- Historial de Juan Pérez
SELECT
  DATE_FORMAT(a.fecha, '%d/%m/%Y') as fecha,
  d.nombre as deporte,
  t.nombre as turno,
  IF(a.presente = 1, '✓ PRESENTE', '✗ AUSENTE') as asistencia,
  a.observacion
FROM asistencia_alumno a
INNER JOIN deporte d ON a.deporte_id = d.id
INNER JOIN turno t ON a.turno_id = t.id
WHERE a.alumno_id = 1
ORDER BY a.fecha DESC
LIMIT 10;
```

---

## 🔧 Gestión de Deportes y Turnos

### Agregar un Nuevo Deporte
```sql
INSERT INTO deporte (nombre) VALUES ('Natación');
```

### Agregar un Nuevo Turno
```sql
INSERT INTO turno (nombre, hora_inicio, hora_fin)
VALUES ('Mediodía', '12:00:00', '14:00:00');
```

### Desactivar un Turno (sin eliminarlo)
```sql
UPDATE turno SET activo = 0 WHERE nombre = 'Noche';
```

### Ver Solo Turnos Activos
```sql
SELECT id, nombre, hora_inicio, hora_fin
FROM turno
WHERE activo = 1
ORDER BY hora_inicio;
```

---

## 📊 Reportes Útiles

### Reporte de Asistencia del Mes Actual
```sql
SELECT
  CONCAT(p.apellido, ', ', p.nombre) as alumno,
  d.nombre as deporte,
  COUNT(*) as total_clases,
  SUM(IF(a.presente = 1, 1, 0)) as presentes,
  SUM(IF(a.presente = 0, 1, 0)) as ausentes,
  ROUND(SUM(IF(a.presente = 1, 1, 0)) * 100.0 / COUNT(*), 1) as '% asistencia'
FROM asistencia_alumno a
INNER JOIN alumno al ON a.alumno_id = al.id
INNER JOIN persona p ON al.persona_id = p.id
INNER JOIN deporte d ON a.deporte_id = d.id
WHERE YEAR(a.fecha) = YEAR(CURDATE())
  AND MONTH(a.fecha) = MONTH(CURDATE())
GROUP BY al.id, p.nombre, p.apellido, d.nombre
ORDER BY p.apellido, p.nombre;
```

### Asistencia por Turno
```sql
SELECT
  t.nombre as turno,
  COUNT(*) as total_asistencias,
  SUM(IF(a.presente = 1, 1, 0)) as presentes
FROM asistencia_alumno a
INNER JOIN turno t ON a.turno_id = t.id
WHERE a.fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()
GROUP BY t.id, t.nombre
ORDER BY t.hora_inicio;
```

### Alumnos Sin Asistencia en los Últimos 7 Días
```sql
SELECT
  CONCAT(p.apellido, ', ', p.nombre) as alumno,
  p.dni,
  d.nombre as deporte
FROM alumno a
INNER JOIN persona p ON a.persona_id = p.id
LEFT JOIN alumno_deporte ad ON a.id = ad.alumno_id
LEFT JOIN deporte d ON ad.deporte_id = d.id
WHERE a.id NOT IN (
  SELECT DISTINCT alumno_id
  FROM asistencia_alumno
  WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
)
ORDER BY p.apellido, p.nombre;
```

---

## 🚀 Estado del Sistema

### ✅ Funcionando Perfectamente
- Base de datos MySQL
- Tabla de deportes con los 5 deportes solicitados
- Tabla de turnos (Mañana, Tarde, Noche)
- Tabla de asistencias con soporte para turnos
- 6 alumnos de prueba con deportes asignados
- Usuario coordinador creado
- Adminer para administración directa
- Todos los alumnos asignados al coordinador

### ⚠️ Pendiente (Backend)
- El archivo `AlumnosService.js` tiene errores de sintaxis
- Los endpoints REST del backend necesitan ser reparados
- Una vez reparado, el frontend podrá consumir los endpoints

### 💡 Próximos Pasos Sugeridos

1. **Opción A - Usar Adminer** (Disponible AHORA):
   - Gestionar asistencias directamente con SQL
   - Ver reportes y estadísticas
   - Asignar deportes a alumnos

2. **Opción B - Reparar Backend** (Requiere corrección):
   - Reconstruir imagen Docker con código corregido
   - Crear endpoints simplificados
   - Conectar frontend con backend

3. **Opción C - Frontend Independiente**:
   - Crear una app simple de gestión con SQL directo
   - Bypass del backend problemático
   - Interfaz web para tomar asistencias

---

## 📞 Información Técnica

### Puertos
- **MySQL**: 3306
- **Adminer**: 8080
- **Backend API**: 3000 (con errores)
- **Frontend**: 3001 (corriendo)

### Contenedores Docker
```bash
docker ps
```
Deberías ver:
- talenttracker_mysql
- talenttracker_adminer
- talenttracker_api (con errores de inicio)
- talenttracker_biometric
- talenttracker_performance

### Archivos Importantes
- **Migrations**: `backend/migrations/009_sistema_asistencias_completo.sql`
- **DB Dump**: `club_lujan.sql`
- **Docker Compose**: `backend/docker-compose.yml`

---

## 🎉 Resumen

**Lo que FUNCIONA al 100%:**
- ✅ Base de datos con deportes actualizados (Futbol, Boxeo, Futbol Femenino, Voley, Handball)
- ✅ Sistema de turnos (Mañana, Tarde, Noche)
- ✅ Tabla de asistencias con turno incluido
- ✅ 6 alumnos de prueba con deportes asignados
- ✅ Adminer para gestión directa
- ✅ Todas las queries SQL necesarias documentadas

**Puedes empezar a usar el sistema AHORA mismo con Adminer** mientras decides si quieres que repare el backend o crees una solución alternativa.

¿Qué prefieres hacer a continuación?
1. Usar Adminer y gestionar todo con SQL
2. Que repare el backend para tener endpoints REST
3. Crear una interfaz web simple que conecte directo a MySQL
