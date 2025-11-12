# Solución: Movimientos de caja no se reflejan correctamente

## 🔍 Problema Identificado

Los movimientos creados por el usuario `cajero_test` no aparecen:
1. En la vista del administrador
2. En la lista de "Movimientos por Cajero" (reportes)

## 🎯 Causa Raíz

### Problema 1: Usuario sin persona_id
El usuario `cajero_test` fue creado **sin un `persona_id`** asociado.

**Código afectado** (`CajaService.js` líneas 2-5):
```javascript
export async function altaMovimiento({ ..., usuarioId }) {
  const u = await query('SELECT persona_id FROM usuario WHERE id = ?', [usuarioId]);
  const responsableId = u[0]?.persona_id || null;  // ← Si persona_id es NULL, responsableId es NULL
  // ...
  // INSERT INTO caja (..., responsable_id) VALUES (..., NULL)  ← Se guarda NULL
}
```

**Resultado:**
- Los movimientos se guardan con `responsable_id = NULL`
- El cajero NO aparece en los reportes

### Problema 2: Función obtenerCajeros() con JOIN incorrecto
La función que lista cajeros SOLO muestra cajeros que tienen movimientos con `responsable_id` válido.

**Código afectado** (`CajaService.js` líneas 149-157):
```javascript
export async function obtenerCajeros() {
  const cajeros = await query(`
    SELECT DISTINCT p.id, p.nombre, p.apellido, p.dni
    FROM caja c
    JOIN persona p ON p.id = c.responsable_id  // ← JOIN excluye NULL
    ORDER BY p.apellido, p.nombre
  `);
  return cajeros;
}
```

**Resultado:**
- Si todos los movimientos de un cajero tienen `responsable_id = NULL`, ese cajero NO aparece

## ✅ Solución Completa

### Paso 1: Ejecutar Migration SQL (Arreglar Base de Datos)

**Archivo:** `backend/migrations/005_fix_cajero_test.sql`

**Ejecutar en Adminer:**
1. Abrir Adminer
2. Ir a "SQL command"
3. Copiar y pegar el contenido del archivo `005_fix_cajero_test.sql`
4. Ejecutar

**Lo que hace:**
- ✅ Crea una persona llamada "Cajero Test" con DNI `99999999`
- ✅ Asigna el rol `PERSONAL_CAJA` en la tabla `persona_rol`
- ✅ Actualiza el usuario `cajero_test` para que tenga el `persona_id` correcto
- ✅ (Opcional) Actualiza movimientos antiguos con `responsable_id = NULL`

### Paso 2: Actualizar Código Backend (Arreglar Función)

**Archivo a reemplazar:** `backend/src/domain/services/CajaService.js`

**Opción A - Reemplazo Manual:**
1. Hacer backup del archivo original
2. Copiar el contenido de `backend/src/domain/services/CajaService_FIXED.js`
3. Pegar en `backend/src/domain/services/CajaService.js`

**Opción B - Edición Manual:**
Buscar la función `obtenerCajeros()` (línea 148-157) y reemplazarla con:

```javascript
export async function obtenerCajeros() {
  // Obtener todos los usuarios con rol PERSONAL_CAJA desde persona_rol
  // Esto asegura que todos los cajeros aparezcan, incluso sin movimientos
  const cajeros = await query(`
    SELECT DISTINCT p.id, p.nombre, p.apellido, p.dni
    FROM persona_rol pr
    INNER JOIN persona p ON pr.persona_id = p.id
    WHERE pr.rol = 'PERSONAL_CAJA' AND p.estado = 'ACTIVO'
    ORDER BY p.apellido, p.nombre
  `);

  // Si no hay cajeros en persona_rol, usar el método antiguo
  if (cajeros.length === 0) {
    return await query(`
      SELECT DISTINCT p.id, p.nombre, p.apellido, p.dni
      FROM caja c
      INNER JOIN persona p ON p.id = c.responsable_id
      WHERE c.responsable_id IS NOT NULL
      ORDER BY p.apellido, p.nombre
    `);
  }

  return cajeros;
}
```

### Paso 3: Reiniciar Backend

```bash
# Detener backend
# Ctrl+C en la terminal donde corre

# O si usas Docker
docker-compose restart backend

# O si usas npm directamente
cd backend
npm run dev
```

### Paso 4: Verificar en Base de Datos

```sql
-- 1. Verificar que cajero_test tiene persona_id
SELECT
    u.id,
    u.username,
    u.persona_id,
    CONCAT(p.nombre, ' ', p.apellido) as nombre
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.username = 'cajero_test';

-- 2. Verificar que aparece en persona_rol
SELECT * FROM persona_rol WHERE rol = 'PERSONAL_CAJA';

-- 3. Verificar últimos movimientos
SELECT
    c.id,
    c.fecha,
    c.concepto,
    c.responsable_id,
    CONCAT(p.nombre, ' ', p.apellido) as cajero
FROM caja c
LEFT JOIN persona p ON c.responsable_id = p.id
ORDER BY c.id DESC
LIMIT 10;
```

## 🧪 Testing

### Test 1: Crear Movimiento con cajero_test

1. Login con `cajero_test` / `password123`
2. Crear un nuevo ingreso (ej: venta de entrada)
3. Verificar en base de datos:

```sql
SELECT
    c.id,
    c.concepto,
    c.responsable_id,
    CONCAT(p.nombre, ' ', p.apellido) as cajero
FROM caja c
LEFT JOIN persona p ON c.responsable_id = p.id
WHERE c.id = (SELECT MAX(id) FROM caja);
```

**Resultado esperado:**
- `responsable_id` debe ser el ID de la persona "Cajero Test" (NO NULL)
- `cajero` debe mostrar "Test Cajero"

### Test 2: Ver en Vista de Administrador

1. Login con usuario `admin`
2. Ir a `/caja`
3. Verificar que el movimiento aparece en la lista
4. Verificar que muestra el nombre del cajero

### Test 3: Ver en Reportes por Cajero

1. Ir a `/caja/reportes`
2. Verificar que "Test Cajero" aparece en el dropdown de cajeros
3. Seleccionar "Test Cajero"
4. Verificar que aparecen sus movimientos

## 📊 Comparación Antes/Después

### ANTES (con el bug):

```sql
-- Usuario cajero_test
| id | username     | persona_id |
|----|--------------|------------|
| 4  | cajero_test  | NULL       |  ← PROBLEMA

-- Movimientos de caja
| id | concepto                | responsable_id |
|----|-------------------------|----------------|
| 56 | Venta Entrada Local     | NULL           |  ← No se sabe quién lo hizo

-- Lista de cajeros (vacía si solo hay movimientos con NULL)
(sin resultados)
```

### DESPUÉS (solucionado):

```sql
-- Usuario cajero_test
| id | username     | persona_id | nombre_completo |
|----|--------------|------------|-----------------|
| 4  | cajero_test  | 33         | Test Cajero     |  ← SOLUCIONADO

-- Persona creada
| id | nombre  | apellido | dni      | rol      | estado  |
|----|---------|----------|----------|----------|---------|
| 33 | Cajero  | Test     | 99999999 | PERSONAL | ACTIVO  |

-- persona_rol
| persona_id | rol           |
|------------|---------------|
| 33         | PERSONAL_CAJA |

-- Movimientos de caja
| id | concepto                | responsable_id | cajero       |
|----|-------------------------|----------------|--------------|
| 56 | Venta Entrada Local     | 33             | Test Cajero  |  ← SOLUCIONADO

-- Lista de cajeros
| id | nombre  | apellido | dni      |
|----|---------|----------|----------|
| 33 | Cajero  | Test     | 99999999 |  ← APARECE
| 16 | Martin  | Kordi    | 40250369 |
```

## 🔧 Prevenir el Problema en el Futuro

### Validación al Crear Usuarios

Agregar validación en el backend al crear usuarios con rol `PERSONAL_CAJA`:

```javascript
// En el controlador de usuarios
if (rol_sistema === 'PERSONAL_CAJA' && !persona_id) {
  return res.status(400).json({
    error: 'Los usuarios con rol PERSONAL_CAJA deben tener una persona asociada'
  });
}
```

### Script de Verificación

Crear un script para verificar consistencia:

```sql
-- Verificar usuarios PERSONAL_CAJA sin persona_id
SELECT
    u.id,
    u.username,
    u.rol_sistema,
    u.persona_id,
    CASE
        WHEN u.persona_id IS NULL THEN 'ERROR: Sin persona_id'
        ELSE 'OK'
    END as estado
FROM usuario u
WHERE u.rol_sistema = 'PERSONAL_CAJA';
```

## 📝 Resumen de Archivos

1. **`005_fix_cajero_test.sql`** - Migration SQL para arreglar la base de datos
2. **`CajaService_FIXED.js`** - Código backend corregido
3. **`debug_caja_issue.sql`** - Queries de diagnóstico
4. **`SOLUCION_PROBLEMA_CAJERO.md`** - Este documento

## ⚠️ Notas Importantes

1. **Backup:** Hacer backup de la base de datos antes de ejecutar el script SQL
2. **Testing:** Probar en ambiente de desarrollo primero
3. **Movimientos antiguos:** El script SQL incluye una opción para actualizar movimientos antiguos con `responsable_id = NULL`, pero está comentada por seguridad
4. **Reiniciar backend:** Es necesario reiniciar el backend después de modificar `CajaService.js`

## ✅ Checklist de Implementación

- [ ] Hacer backup de la base de datos
- [ ] Ejecutar `005_fix_cajero_test.sql` en Adminer
- [ ] Verificar que el usuario cajero_test tiene persona_id
- [ ] Verificar que la persona existe y tiene rol PERSONAL_CAJA
- [ ] Reemplazar `CajaService.js` con la versión corregida
- [ ] Reiniciar backend
- [ ] Test 1: Crear movimiento con cajero_test
- [ ] Test 2: Verificar en vista de admin
- [ ] Test 3: Verificar en reportes por cajero
- [ ] Documentar el cambio en el equipo

---

**Última actualización:** 2025-11-10
**Versión:** 1.0.0
**Estado:** Listo para implementar
