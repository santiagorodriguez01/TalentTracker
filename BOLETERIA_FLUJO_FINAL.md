# Flujo Final de Boletería - TalentTracker

## 📅 Fecha: 2025-11-11

---

## 🎯 Flujos de Venta Definitivos

### 1. **Venta para SOCIOS** (con descuento)
**Método**: Lector de QR únicamente

#### Paso a paso:
1. Socio muestra su QR frente a la cámara
2. Sistema escanea y detecta el QR del socio
3. ✅ **Se abre automáticamente** el formulario de venta con:
   - Número de socio **YA CARGADO**
   - Opción "Sí, es socio" **OCULTA** (forzada)
   - Sistema valida automáticamente:
     - ✅ Si está al día → Precio $1,500
     - ⚠️ Si está moroso → Precio $1,500
   - Muestra nombre y DNI del socio
4. Usuario solo necesita:
   - Confirmar/ajustar cantidad (default: 1)
   - Seleccionar medio de pago (default: Efectivo)
   - Si es Mercado Pago, ingresar número de trámite
5. Click en **"Registrar Venta"**
6. ✅ Venta registrada exitosamente
7. Dialog permanece abierto para la siguiente venta

#### ⚠️ Importante:
- **NO hay botón** para venta de socios
- **SOLO** funciona con el lector QR
- Si el QR no es de un socio, muestra error

---

### 2. **Venta para NO SOCIOS** (sin descuento)
**Método**: Botón "Venta Entrada Local (No Socio)"

#### Paso a paso:
1. Usuario hace click en **"Venta Entrada Local (No Socio)"**
2. ✅ Se abre el formulario con:
   - Alert azul: "Modo: Venta para NO socios"
   - Precio fijo: $3,000 por entrada
   - Campo de número de socio **NO VISIBLE**
   - Opción de elegir socio/no socio **OCULTA**
3. Usuario ingresa:
   - Cantidad de entradas
   - Medio de pago
   - Número de trámite (si es Mercado Pago)
4. Click en **"Registrar Venta"**
5. ✅ Venta registrada
6. Dialog permanece abierto

---

### 3. **Venta VISITANTE** (precio especial)
**Método**: Botón "Venta Entrada Visitante"

#### Paso a paso:
1. Usuario hace click en **"Venta Entrada Visitante"**
2. Se abre formulario específico con:
   - Precio fijo: $5,000 por entrada
   - Campo de cantidad
   - Medio de pago
3. Click en **"Confirmar Venta"**
4. ✅ Venta registrada
5. Dialog permanece abierto

---

## 🖥️ Interfaz de Usuario

```
┌─────────────────────────────────────────────────┐
│         Boletería Automatizada                  │
│ Para socios: Escanea el QR | Para no socios:   │
│ Usa el botón correspondiente                    │
└─────────────────────────────────────────────────┘

┌────────────────────┐  ┌────────────────────────┐
│ Venta Entrada      │  │ Venta Entrada          │
│ Local (No Socio)   │  │ Visitante              │
│ [ICONO]            │  │ [ICONO]                │
└────────────────────┘  └────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Escáner de QR                           │
│ Coloca el código QR del socio frente a la      │
│ cámara                                          │
│                                                 │
│ [VIDEO PREVIEW CON OVERLAY]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Precios

| Tipo | Precio Unitario | Método de Venta | Validación |
|------|----------------|-----------------|------------|
| Socio al Día | $1,500 | Lector QR | Automática |
| Socio Moroso | $1,500 | Lector QR | Automática |
| No Socio | $3,000 | Botón | No requiere |
| Visitante | $5,000 | Botón | No requiere |

---

## ✅ Validaciones Implementadas

### En Lector QR:
- ✅ Detecta si el QR tiene número de socio
- ✅ Si NO es socio → Muestra error y sugiere usar el botón
- ✅ Si SÍ es socio → Abre formulario con datos pre-cargados
- ✅ Evita escaneos duplicados (debounce de 2 segundos)

### En Formulario de Socios (QR):
- ✅ Valida número de socio automáticamente
- ✅ Muestra estado (Al día / Moroso)
- ✅ Muestra nombre y DNI
- ✅ Calcula precio según estado
- ✅ No permite cambiar a "No es socio" (modo forzado)

### En Formulario de No Socios (Botón):
- ✅ Precio fijo $3,000
- ✅ No muestra opción de socio
- ✅ No pide número de socio
- ✅ Validación de cantidad mínima: 1
- ✅ Si es Mercado Pago, exige número de trámite

---

## 🔄 Comparación Antes vs Ahora

### ANTES (Problema Original):

| Aspecto | Comportamiento |
|---------|----------------|
| Botón "Venta Local" | Vendía directo sin formulario |
| Lector QR | Solo mostraba info, no vendía |
| Socios | Tenían que usar botón igual que no socios |
| Validación | Manual |

### AHORA (Solución Implementada):

| Aspecto | Comportamiento |
|---------|----------------|
| Botón "Venta Local (No Socio)" | Abre formulario SOLO para no socios |
| Lector QR | Abre formulario CON datos pre-cargados |
| Socios | Usan SOLO el lector QR (más rápido) |
| Validación | Automática al escanear |

---

## 🧪 Cómo Probar

### Prueba 1: Venta a Socio con QR ⭐
```
1. Genera un QR de socio desde el sistema
2. En boletería, coloca el QR frente a la cámara
3. ✅ Debe abrir el formulario automáticamente
4. ✅ Debe mostrar: "Sí, es socio" (sin opción de cambiar)
5. ✅ Debe cargar el número de socio
6. ✅ Debe validar y mostrar el estado
7. Confirma cantidad: 1
8. Medio de pago: Efectivo
9. Registrar Venta
10. ✅ Debe mostrar alerta de éxito
```

### Prueba 2: Venta a No Socio
```
1. Click en "Venta Entrada Local (No Socio)"
2. ✅ Debe abrir formulario
3. ✅ Debe mostrar: "Modo: Venta para NO socios"
4. ✅ NO debe mostrar campo de número de socio
5. Cantidad: 2
6. Medio de pago: Mercado Pago
7. Número de trámite: MP-123456
8. Registrar Venta
9. ✅ Debe calcular: 2 × $3,000 = $6,000
```

### Prueba 3: Escaneo de QR No-Socio (Error)
```
1. Genera un QR de una persona que NO es socio
2. Escanea el QR
3. ✅ Debe mostrar error: "El QR escaneado no pertenece a un socio..."
4. ✅ Debe sugerir usar el botón de No Socio
```

### Prueba 4: Venta Visitante
```
1. Click en "Venta Entrada Visitante"
2. Cantidad: 3
3. Registrar
4. ✅ Debe calcular: 3 × $5,000 = $15,000
```

---

## 💡 Ventajas de esta Implementación

### Para Socios:
✅ **Proceso más rápido**: Solo escanean QR y confirman
✅ **Sin errores de digitación**: Número pre-cargado automáticamente
✅ **Validación instantánea**: Ven su estado al momento

### Para Personal de Boletería:
✅ **Menos clicks**: No hay que elegir socio/no socio para cada venta
✅ **Menos errores**: Sistema fuerza el flujo correcto
✅ **Más claro**: Cada botón tiene un propósito específico

### Para el Sistema:
✅ **Datos más confiables**: Validación automática reduce errores
✅ **Mejor UX**: Flujo intuitivo y directo
✅ **Auditoría**: Se registra correctamente el tipo de venta

---

## 🎨 Mejoras Visuales

### Botones:
- ✅ Tamaño grande para fácil uso
- ✅ Iconos descriptivos
- ✅ Colores diferenciados (primario/secundario)
- ✅ Texto claro y específico

### Formularios:
- ✅ Alert informativo según modo
- ✅ Validación en tiempo real
- ✅ Chips de estado (Al día / Moroso)
- ✅ Cálculo automático de totales

### Lector QR:
- ✅ Overlay de enfoque
- ✅ Indicador de carga
- ✅ Mensajes de error claros

---

## 📝 Notas Técnicas

### Archivos Modificados:
- `frontend/src/app/(private)/boleteria/page.tsx`
  - Agregada lógica de `forceNoSocio`
  - Modificado comportamiento del QR
  - Actualizado texto de botones

- `frontend/src/components/caja/VentaEntradaDialog.tsx`
  - Agregada prop `forceNoSocio`
  - Agregado useEffect para modo forzado
  - Ocultado selector socio/no-socio cuando `forceNoSocio=true`

### Estados Clave:
```typescript
forceNoSocio: boolean    // true = Fuerza modo NO socio
initialNroSocio: string  // Número pre-cargado desde QR
openVentaLocal: boolean  // Controla apertura del dialog
```

---

## ✅ Estado Final

**TODO FUNCIONAL Y PROBADO** ✓

- ✅ Botón de No Socios abre formulario correcto
- ✅ Lector QR abre formulario con datos pre-cargados
- ✅ Validación automática funcionando
- ✅ Precios calculados correctamente
- ✅ Errores manejados apropiadamente
- ✅ UX clara e intuitiva

---

**Versión**: 3.0 Final
**Fecha**: 2025-11-11
**Estado**: ✅ Completado
