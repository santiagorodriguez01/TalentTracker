# Cambios: Gestión de Pago de Cuotas

## 📋 Resumen de Cambios

Se ha movido la funcionalidad de **pago de cuotas** desde la vista de **Caja** a la vista de **Cuotas**, asegurando que todos los pagos se registren correctamente en la tabla `caja` con el `responsable_id` del usuario que realiza el pago.

## ✅ Cambios Realizados

### 1. Vista de Caja (`frontend/src/app/(private)/caja/page.tsx`)

**Eliminado:**
- ❌ Import de `PagoCuotaDialog`
- ❌ Estado `openPagoCuota`
- ❌ Función `crearPagoCuota()`
- ❌ Botón "Pago de Cuota" verde
- ❌ Componente `<PagoCuotaDialog />`

**Resultado:**
La vista de Caja ahora solo tiene:
- ✅ Botón "Entradas" (local y visitante)
- ✅ Botón "Ingreso" (general)
- ✅ Botón "Egreso"
- ✅ Botón "Transferir" (a tesorería)

### 2. Vista de Cuotas (`frontend/src/app/(private)/cuotas/page.tsx`)

**Ya existente (sin cambios necesarios):**
- ✅ Botón "Pagar" en cada cuota pendiente
- ✅ Botón "Pagar Todas" para pagar múltiples cuotas de un socio
- ✅ Vista de tabla y cards
- ✅ Búsqueda por DNI, nombre, apellido
- ✅ Escaneo de QR

### 3. Backend - Endpoint de Pago de Cuotas

**Ya existente (sin cambios necesarios):**
- ✅ Endpoint: `PUT /cuotas/:id/pagar`
- ✅ Registra el pago en la tabla `pago_cuota`
- ✅ Actualiza el estado de la cuota
- ✅ **Crea automáticamente un registro en la tabla `caja`**
- ✅ **Asigna el `responsable_id` correcto** (persona_id del usuario que paga)

**Código relevante** (`backend/src/domain/services/CuotasService.js` líneas 110-115):
```javascript
// 3) Movimiento de caja por el monto efectivamente pagado
const concepto = `Pago cuota ${cuota.periodo} socio_id ${cuota.socio_id} (pago_id ${pagoId})`;
await conn.execute(
  'INSERT INTO caja (fecha, concepto, tipo, monto, medio_pago, responsable_id, nro_tramite) VALUES (NOW(), ?, "INGRESO", ?, ?, ?, ?)',
  [concepto, monto || 0, medio_pago || null, responsableId, nro_tramite || null]
);
```

## 🔄 Flujo de Pago de Cuotas (Actualizado)

### Antes:
```
Usuario → Vista Caja → Botón "Pago de Cuota" → PagoCuotaDialog
  → Endpoint /caja/pago-cuota → Crea movimiento en caja
```

### Ahora:
```
Usuario → Vista Cuotas → Botón "Pagar" en cuota
  → Endpoint PUT /cuotas/:id/pagar
  → 1. Crea registro en pago_cuota
  → 2. Actualiza cuota (importe_pagado, estado)
  → 3. Crea movimiento en caja con responsable_id correcto
```

## 🎯 Ventajas del Nuevo Flujo

1. **Separación de responsabilidades**
   - Vista de Caja: Gestión de ingresos/egresos generales
   - Vista de Cuotas: Gestión completa de cuotas

2. **Mejor UX**
   - Usuario ve directamente las cuotas pendientes
   - Puede pagar una cuota específica o múltiples
   - No necesita recordar el número de socio o periodo

3. **Auditoría completa**
   - Registro en `pago_cuota` (detalle del pago)
   - Registro en `caja` (movimiento contable)
   - `responsable_id` correcto en ambas tablas

4. **Funcionalidades avanzadas**
   - Pago de múltiples cuotas a la vez
   - Pagos parciales
   - Visualización de mora
   - Vista por socio

## 📊 Verificación

### Test 1: Pagar cuota desde vista de Cuotas

1. Login con `cajero_test` o cualquier usuario con rol `PERSONAL_CAJA`
2. Ir a `/cuotas`
3. Buscar un socio con cuotas pendientes
4. Click en "Pagar" en una cuota
5. Ingresar monto, medio de pago
6. Registrar pago

**Verificar en base de datos:**

```sql
-- Ver el pago registrado
SELECT * FROM pago_cuota ORDER BY id DESC LIMIT 1;

-- Ver el movimiento en caja (debe tener responsable_id)
SELECT
    c.id,
    c.fecha,
    c.concepto,
    c.tipo,
    c.monto,
    c.responsable_id,
    CONCAT(p.nombre, ' ', p.apellido) as cajero
FROM caja c
LEFT JOIN persona p ON c.responsable_id = p.id
ORDER BY c.id DESC
LIMIT 1;
```

**Resultado esperado:**
- ✅ Registro en `pago_cuota` con el monto correcto
- ✅ Cuota actualizada (importe_pagado incrementado, estado actualizado)
- ✅ Movimiento en `caja` con tipo='INGRESO'
- ✅ `responsable_id` debe ser el persona_id del usuario que pagó
- ✅ Concepto debe incluir "Pago cuota [periodo] socio_id [id]"

### Test 2: Ver movimiento en vista de Admin

1. Login con usuario `admin`
2. Ir a `/caja`
3. Verificar que el movimiento aparece en la lista
4. Verificar que muestra el nombre del cajero

### Test 3: Ver en reportes por cajero

1. Ir a `/caja/reportes`
2. Seleccionar el cajero que realizó el pago
3. Verificar que aparece el movimiento de pago de cuota

## 🔧 Permisos

### Usuarios que pueden pagar cuotas:

**Endpoint:** `PUT /cuotas/:id/pagar`
**Roles permitidos:**
- ✅ `ADMIN`
- ✅ `TESORERIA`
- ✅ `PERSONAL_CAJA`

**Código** (`backend/src/web/routes.js:205`):
```javascript
r.put('/cuotas/:id/pagar',
  authRequired(['TESORERIA','ADMIN','PERSONAL_CAJA']),
  vCuotaPagar,
  validate,
  Cuotas.pagar
);
```

## 🗑️ Componente Eliminado (Opcional)

El componente `PagoCuotaDialog.tsx` ya no se usa en la vista de Caja, pero **no se ha eliminado** del proyecto por si se necesita en el futuro.

**Ubicación:** `frontend/src/components/caja/PagoCuotaDialog.tsx`

**Decisión recomendada:**
- **Mantenerlo** por ahora (por si se necesita reutilizar)
- **Eliminarlo** si no se usa en ningún otro lugar después de 1-2 meses

Para eliminarlo:
```bash
rm frontend/src/components/caja/PagoCuotaDialog.tsx
```

## 📝 Archivos Modificados

1. **`frontend/src/app/(private)/caja/page.tsx`**
   - Eliminado import de PagoCuotaDialog
   - Eliminado estado openPagoCuota
   - Eliminado función crearPagoCuota
   - Eliminado botón "Pago de Cuota"
   - Eliminado componente <PagoCuotaDialog />

## 📚 Documentación Adicional

### Vista de Cuotas - Funcionalidades

**Búsqueda:**
- Por número de socio
- Por DNI
- Por nombre/apellido
- Por escaneo de QR

**Acciones:**
- Pagar cuota individual (botón "Pagar")
- Pagar todas las cuotas de un socio (botón "Pagar Todas")
- Ver comprobante (botón "Recibo")

**Vistas:**
- Tabla: Lista todas las cuotas pendientes
- Cards: Agrupa cuotas por socio

### API Endpoints Relacionados

```
GET    /cuotas                     - Listar cuotas
PUT    /cuotas/:id/pagar          - Pagar una cuota
POST   /socios/:id/pagar-cuotas   - Pagar múltiples cuotas
GET    /cuotas/:id/comprobante.pdf - Descargar comprobante
```

## ✅ Checklist de Verificación

- [x] Botón "Pago de Cuota" eliminado de vista de Caja
- [x] Import de PagoCuotaDialog eliminado
- [x] Estado y función de pago eliminados
- [x] Componente PagoCuotaDialog eliminado del render
- [x] Endpoint PUT /cuotas/:id/pagar registra en caja
- [x] responsable_id se guarda correctamente
- [x] Permisos correctos en el endpoint
- [x] Vista de Cuotas tiene funcionalidad completa
- [x] Documentación actualizada

---

**Fecha:** 2025-11-10
**Versión:** 1.0.0
**Estado:** ✅ Completado
