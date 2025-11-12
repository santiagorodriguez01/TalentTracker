# 🎯 Guía: Coordinadores por Deporte Específico

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema de coordinadores por deporte específico. Ahora cada coordinador puede estar asignado a un deporte específico y solo verá los alumnos de ese deporte en la vista de asistencia.

---

## 📊 Cambios Realizados

### 1. Base de Datos

#### Nueva Tabla: `coordinador_deporte`
- Relaciona coordinadores (personas) con deportes específicos
- Campos:
  - `id`: ID único
  - `coordinador_id`: ID de la persona coordinador
  - `deporte_id`: ID del deporte asignado
  - `activo`: Si la asignación está activa (1) o no (0)
  - `created_at`, `updated_at`: Timestamps

#### Deportes Disponibles
- ⚽ Fútbol
- 🥊 Boxeo
- ⚽ Fútbol Femenino
- 🤾 Handball
- 🏒 Hockey

### 2. Backend

#### Modificaciones en `AlumnosService.js`
- Agregado parámetro `coordinador_deporte_id` para filtrar por deporte del coordinador
- Si el coordinador tiene un deporte asignado, automáticamente filtra los alumnos por ese deporte

#### Modificaciones en `AlumnosController.js`
- `listForCoordinador`: Ahora consulta el deporte asignado al coordinador y lo pasa al servicio
- `catalogDeportes`: Si el coordinador tiene un deporte específico, solo devuelve ese deporte

### 3. Frontend

#### Modificaciones en `alumnos/page.tsx`
- Si el coordinador tiene un solo deporte, se selecciona automáticamente
- El selector de deporte se oculta si el coordinador solo tiene un deporte asignado
- Se muestra el deporte asignado en el título de la página
- El deporte se muestra como campo de solo lectura si hay un solo deporte

---

## 🚀 Cómo Usar el Sistema

### Crear un Coordinador por Deporte

Para crear un coordinador específico para un deporte, sigue estos pasos:

#### Paso 1: Crear la Persona

```sql
INSERT INTO persona (nombre, apellido, dni, rol, estado) 
VALUES ('Nombre', 'Apellido', 'DNI_UNICO', 'COORDINADOR', 'ACTIVO');
SET @nuevo_coord_id = LAST_INSERT_ID();
```

#### Paso 2: Asignar Rol de Coordinador

```sql
INSERT INTO persona_rol (persona_id, rol) 
VALUES (@nuevo_coord_id, 'COORDINADOR');
```

#### Paso 3: Crear Usuario

```sql
-- Generar hash de contraseña (usar bcrypt)
-- Ejemplo: password "coordinador123" = '$2a$10$...'
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
VALUES ('coord_boxeo', '$2a$10$...', 'COORDINADOR', @nuevo_coord_id);
```

#### Paso 4: Asignar Deporte al Coordinador

```sql
-- Obtener ID del deporte
SET @deporte_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');

-- Asignar deporte al coordinador
INSERT INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@nuevo_coord_id, @deporte_id, 1);
```

### Ejemplo Completo: Coordinador de Boxeo

```sql
-- 1. Crear persona
INSERT INTO persona (nombre, apellido, dni, genero, email, telefono, rol, estado) 
VALUES ('Roberto', 'Martínez', '50000001', 'MASCULINO', 'roberto.boxeo@clublujan.com', '2323-111111', 'COORDINADOR', 'ACTIVO');
SET @coord_boxeo_id = LAST_INSERT_ID();

-- 2. Asignar rol
INSERT INTO persona_rol (persona_id, rol) 
VALUES (@coord_boxeo_id, 'COORDINADOR');

-- 3. Crear usuario (password: coordinador123)
-- NOTA: Debes generar el hash bcrypt de la contraseña
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
VALUES ('coord_boxeo', '$2a$10$vQXZBqxQxN5h5Z6jK.9xqe3mN8K9YLX6Z7Hb0ZvZ8Z9Z0Z1Z2Z3Z4Z', 'COORDINADOR', @coord_boxeo_id);

-- 4. Obtener ID del deporte Boxeo
SET @boxeo_id = (SELECT id FROM deporte WHERE nombre = 'Boxeo');

-- 5. Asignar deporte
INSERT INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_boxeo_id, @boxeo_id, 1);
```

---

## 🔧 Aplicar la Migración

Para aplicar los cambios en la base de datos:

```bash
# Conectarse a MySQL en Docker
docker exec -i talenttracker_mysql mysql -uclub -pclub club_lujan < backend/migrations/010_coordinador_deporte.sql
```

O desde Adminer (http://localhost:8080):
1. Seleccionar la base de datos `club_lujan`
2. Ir a "SQL command"
3. Copiar y pegar el contenido de `backend/migrations/010_coordinador_deporte.sql`
4. Ejecutar

---

## 📝 Asignar Deporte a Coordinador Existente

Si ya tienes un coordinador creado y quieres asignarle un deporte:

```sql
-- 1. Obtener persona_id del coordinador
SET @coord_persona_id = (SELECT persona_id FROM usuario WHERE username = 'coordinador');

-- 2. Obtener ID del deporte
SET @deporte_id = (SELECT id FROM deporte WHERE nombre = 'Futbol');

-- 3. Asignar deporte
INSERT INTO coordinador_deporte (coordinador_id, deporte_id, activo)
VALUES (@coord_persona_id, @deporte_id, 1)
ON DUPLICATE KEY UPDATE activo = 1;
```

---

## 🔍 Verificar Asignaciones

Para ver qué coordinadores tienen asignados qué deportes:

```sql
SELECT 
  p.nombre,
  p.apellido,
  u.username,
  d.nombre AS deporte,
  cd.activo
FROM coordinador_deporte cd
JOIN persona p ON p.id = cd.coordinador_id
JOIN usuario u ON u.persona_id = p.id
JOIN deporte d ON d.id = cd.deporte_id
WHERE cd.activo = 1
ORDER BY d.nombre, p.apellido;
```

---

## 🎨 Comportamiento del Sistema

### Coordinador SIN Deporte Asignado
- Ve todos los alumnos asignados a él
- Puede filtrar por cualquier deporte
- Ve todos los deportes en el selector

### Coordinador CON Deporte Asignado
- Solo ve alumnos de su deporte específico
- El selector de deporte está oculto (solo ve su deporte)
- El deporte se muestra en el título de la página
- El filtro de deporte se aplica automáticamente

---

## ⚠️ Notas Importantes

1. **Un coordinador puede tener múltiples deportes**: La tabla permite múltiples asignaciones, pero el sistema actualmente toma el primero activo. Si necesitas soporte para múltiples deportes, se puede modificar.

2. **Alumnos deben estar asignados al coordinador**: Los alumnos deben estar en la tabla `alumno_coordinador` para que el coordinador los vea.

3. **Alumnos deben tener el deporte asignado**: Los alumnos deben tener el deporte en la tabla `alumno_deporte` para que aparezcan filtrados correctamente.

4. **Migración segura**: La migración es idempotente (se puede ejecutar múltiples veces sin problemas).

---

## 🐛 Troubleshooting

### El coordinador no ve alumnos
1. Verificar que el coordinador tenga un deporte asignado:
   ```sql
   SELECT * FROM coordinador_deporte WHERE coordinador_id = ?;
   ```

2. Verificar que los alumnos estén asignados al coordinador:
   ```sql
   SELECT * FROM alumno_coordinador WHERE coordinador_id = ?;
   ```

3. Verificar que los alumnos tengan el deporte asignado:
   ```sql
   SELECT a.*, d.nombre 
   FROM alumno_deporte ad
   JOIN alumno a ON a.id = ad.alumno_id
   JOIN deporte d ON d.id = ad.deporte_id
   WHERE ad.deporte_id = ?;
   ```

### El selector de deporte sigue apareciendo
- Verificar que el coordinador tenga exactamente un deporte asignado y activo
- Verificar que el endpoint `/catalogo/deportes` esté devolviendo solo un deporte

### No se aplica el filtro automático
- Verificar que el backend esté consultando correctamente la tabla `coordinador_deporte`
- Revisar los logs del backend para ver errores de SQL

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs del backend: `docker logs talenttracker_api`
2. Verifica la base de datos con Adminer: http://localhost:8080
3. Revisa que la migración se haya aplicado correctamente

---

## ✅ Checklist de Implementación

- [x] Tabla `coordinador_deporte` creada
- [x] Migración SQL creada
- [x] Backend modificado para filtrar por deporte
- [x] Frontend modificado para mostrar solo deporte del coordinador
- [x] Catálogo de deportes filtrado para coordinadores
- [x] Documentación creada

---

**Fecha de implementación**: 2025-01-XX
**Versión**: 1.0

