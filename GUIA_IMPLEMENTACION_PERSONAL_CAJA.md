# Guía de Implementación: Vista para PERSONAL_CAJA

## 📋 Resumen

Esta guía explica cómo implementar una vista personalizada para usuarios con rol `PERSONAL_CAJA` que les permita acceder a las funcionalidades de:
- **Módulo de Caja**: Ver y gestionar movimientos de caja
- **Módulo de Cuotas**: Ver y gestionar cuotas de socios

## 🎯 Objetivo

Crear una interfaz específica para el personal de caja donde puedan:
1. Registrar ingresos (ventas de entradas, pagos de cuotas, etc.)
2. Ver movimientos de caja
3. Consultar cuotas de socios
4. Procesar pagos de cuotas

## 📊 Cambios en Base de Datos

### 1. Ejecutar Migration SQL

**Archivo**: `backend/migrations/004_personal_caja_vistas.sql`

**Cómo ejecutar en Adminer:**

1. Abrir Adminer en tu navegador (http://localhost:8080 o el puerto que uses)
2. Conectarse a la base de datos MySQL
3. Ir a la pestaña "SQL command"
4. Copiar y pegar el contenido del archivo `004_personal_caja_vistas.sql`
5. Hacer clic en "Execute"

**Lo que hace este script:**
- ✅ Crea vistas optimizadas para consultas de caja y cuotas
- ✅ Crea función para calcular saldo actual de caja
- ✅ Añade índices para mejorar el rendimiento
- ✅ Registra la migración en la tabla `schema_migrations`

### 2. Verificar Rol PERSONAL_CAJA

El rol ya existe en tu base de datos. Verifica ejecutando:

```sql
-- Ver usuarios con rol PERSONAL_CAJA
SELECT
    u.id,
    u.username,
    u.rol_sistema,
    CONCAT(p.nombre, ' ', p.apellido) as nombre_completo
FROM usuario u
LEFT JOIN persona p ON u.persona_id = p.id
WHERE u.rol_sistema = 'PERSONAL_CAJA';
```

### 3. Crear Usuario de Prueba (si es necesario)

```sql
-- Crear usuario de caja de prueba
INSERT INTO usuario (username, password_hash, rol_sistema, persona_id)
VALUES (
    'cajero01',
    '$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy', -- password: 'password123'
    'PERSONAL_CAJA',
    16  -- ID de Martin Kordi (ajustar según necesites)
);
```

## 🎨 Cambios en Frontend

### 1. Verificar Permisos RBAC

**Archivo**: `frontend/src/lib/rbac.ts`

Asegurarse de que existen los permisos:

```typescript
// Verificar que estas funciones existen
can.verCaja(rol)        // Ver módulo de caja
can.cajaCrear(rol)      // Crear movimientos
can.verCuotas(rol)      // Ver cuotas
can.pagarCuota(rol)     // Procesar pagos
```

### 2. Crear Dashboard para PERSONAL_CAJA

**Archivo nuevo**: `frontend/src/app/(private)/caja-dashboard/page.tsx`

```typescript
'use client';

import * as React from 'react';
import { Box, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import Link from 'next/link';
import PointOfSaleRounded from '@mui/icons-material/PointOfSaleRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';

export default function CajaDashboardPage() {
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;

  const canVerCaja = rol ? can.verCaja(rol) : false;
  const canVerCuotas = rol ? can.verCuotas(rol) : false;

  if (!canVerCaja && !canVerCuotas) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta sección
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Caja
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {canVerCaja && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <PointOfSaleRounded fontSize="large" color="primary" />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Movimientos de Caja
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ver y gestionar ingresos y egresos
                </Typography>
                <Button
                  component={Link}
                  href="/caja"
                  variant="contained"
                  fullWidth
                >
                  Ir a Caja
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {canVerCuotas && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ReceiptRounded fontSize="large" color="primary" />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Gestión de Cuotas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ver y cobrar cuotas de socios
                </Typography>
                <Button
                  component={Link}
                  href="/cuotas"
                  variant="contained"
                  fullWidth
                >
                  Ir a Cuotas
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
```

### 3. Actualizar Menú de Navegación

**Archivo**: `frontend/src/components/layout/Sidebar.tsx` (o donde tengas el menú)

Agregar enlace al dashboard de caja:

```typescript
// En el array de items del menú
{
  title: 'Panel de Caja',
  path: '/caja-dashboard',
  icon: <PointOfSaleRounded />,
  roles: ['PERSONAL_CAJA'], // Solo visible para personal de caja
}
```

### 4. Configurar Rutas

**Archivo**: `frontend/src/app/(private)/layout.tsx`

Asegurarse de que el layout privado permita acceso:

```typescript
// Verificar que PERSONAL_CAJA está en los roles permitidos
const rolesPermitidos = [
  'ADMIN',
  'TESORERIA',
  'DIRECTIVO',
  'COORDINADOR',
  'STAFF',
  'REVISOR_CUENTA',
  'PERSONAL_CAJA', // ✅ Debe estar presente
];
```

## 🔧 Cambios en Backend

### 1. Verificar Middleware de Autorización

**Archivo**: `backend/src/web/middleware/authMiddleware.js`

Asegurarse de que `PERSONAL_CAJA` está en los roles permitidos:

```javascript
// Ejemplo de middleware
function authRequired(allowedRoles = []) {
  return (req, res, next) => {
    // ... lógica de autenticación

    const rolesPermitidos = [
      'ADMIN',
      'TESORERIA',
      'PERSONAL_CAJA', // ✅ Debe estar presente
      ...allowedRoles
    ];

    // ... resto de la lógica
  };
}
```

### 2. Actualizar Controladores

**Archivo**: `backend/src/web/controllers/CajaController.js`

```javascript
// Permitir a PERSONAL_CAJA crear movimientos
router.post('/caja',
  authRequired(['ADMIN', 'TESORERIA', 'PERSONAL_CAJA']),
  CajaController.crear
);

// Permitir ver reportes
router.get('/caja/reporte',
  authRequired(['ADMIN', 'TESORERIA', 'DIRECTIVO', 'REVISOR_CUENTA', 'PERSONAL_CAJA']),
  CajaController.reporte
);
```

**Archivo**: `backend/src/web/controllers/CuotaController.js`

```javascript
// Permitir a PERSONAL_CAJA ver cuotas
router.get('/cuotas',
  authRequired(['ADMIN', 'TESORERIA', 'PERSONAL_CAJA']),
  CuotaController.listar
);

// Permitir procesar pagos
router.post('/cuotas/:id/pagar',
  authRequired(['ADMIN', 'TESORERIA', 'PERSONAL_CAJA']),
  CuotaController.pagarCuota
);
```

## 📝 Vistas SQL Creadas

### Principales Vistas Disponibles:

1. **`v_caja_detallada`**: Movimientos de caja con información del responsable y validador
2. **`v_cuotas_detallada`**: Cuotas con información completa del socio
3. **`v_resumen_caja_hoy`**: Estadísticas del día actual
4. **`v_resumen_caja_mes`**: Estadísticas del mes actual
5. **`v_cuotas_proximas_vencer`**: Cuotas que vencen en los próximos 7 días
6. **`v_cuotas_vencidas`**: Cuotas vencidas con días de atraso
7. **`v_historico_pagos`**: Histórico de pagos realizados
8. **`v_estadisticas_cajero`**: Estadísticas por cajero

### Función SQL Disponible:

- **`fn_saldo_caja_actual()`**: Retorna el saldo actual de caja

```sql
-- Ejemplo de uso
SELECT fn_saldo_caja_actual() as saldo;
```

## 🧪 Testing

### 1. Pruebas en Base de Datos

```sql
-- Verificar vistas creadas
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Probar vista de caja
SELECT * FROM v_caja_detallada LIMIT 10;

-- Probar vista de cuotas
SELECT * FROM v_cuotas_detallada LIMIT 10;

-- Probar función de saldo
SELECT fn_saldo_caja_actual() as saldo_actual;

-- Ver resumen del día
SELECT * FROM v_resumen_caja_hoy;
```

### 2. Pruebas en Backend

```bash
# Desde el directorio backend
cd backend

# Probar endpoint de caja
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/caja

# Probar endpoint de cuotas
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/cuotas
```

### 3. Pruebas en Frontend

1. Iniciar sesión con usuario `cajero01` / `password123`
2. Navegar a `/caja-dashboard`
3. Verificar acceso a:
   - Módulo de Caja
   - Módulo de Cuotas
4. Probar funcionalidades:
   - Crear ingreso
   - Ver movimientos
   - Pagar cuota

## 📊 Flujo de Trabajo para PERSONAL_CAJA

### Inicio de Día:
1. Login al sistema
2. Ver dashboard de caja
3. Verificar saldo inicial

### Durante el Día:
1. Registrar ventas de entradas
2. Cobrar cuotas de socios
3. Ver cuotas próximas a vencer
4. Generar comprobantes

### Cierre de Día:
1. Ver resumen del día
2. Verificar saldo final
3. Generar reporte (si tiene permiso)

## 🔒 Permisos por Rol

### PERSONAL_CAJA puede:
✅ Ver movimientos de caja
✅ Crear ingresos (ventas, pagos)
✅ Ver cuotas de socios
✅ Procesar pagos de cuotas
✅ Generar comprobantes
✅ Ver estadísticas básicas

### PERSONAL_CAJA NO puede:
❌ Aprobar egresos (solo ADMIN, DIRECTIVO, REVISOR_CUENTA)
❌ Ver reportes financieros completos
❌ Modificar configuración financiera
❌ Eliminar movimientos

## 🚀 Próximos Pasos

1. ✅ Ejecutar migration SQL en Adminer
2. ⬜ Crear página de dashboard (`/caja-dashboard`)
3. ⬜ Actualizar permisos en RBAC
4. ⬜ Actualizar controladores backend
5. ⬜ Crear usuario de prueba
6. ⬜ Testing completo
7. ⬜ Deploy a producción

## 🐛 Troubleshooting

### Error: "No tienes permisos"
**Solución**: Verificar que el usuario tiene rol `PERSONAL_CAJA` en la tabla `usuario`

```sql
UPDATE usuario
SET rol_sistema = 'PERSONAL_CAJA'
WHERE username = 'tu_usuario';
```

### Error: "Vista no existe"
**Solución**: Ejecutar nuevamente el script de migration

### Error: "Token inválido"
**Solución**: Hacer logout y login nuevamente

## 📞 Soporte

Si tienes problemas durante la implementación:

1. Verificar logs del backend: `docker logs talenttracker_backend`
2. Verificar logs del frontend: Consola del navegador (F12)
3. Revisar que todas las migraciones se ejecutaron correctamente

## ✅ Checklist de Implementación

- [ ] Migration SQL ejecutada correctamente
- [ ] Vistas SQL creadas y funcionando
- [ ] Usuario PERSONAL_CAJA creado
- [ ] Frontend: Dashboard creado
- [ ] Frontend: Permisos RBAC configurados
- [ ] Frontend: Menú actualizado
- [ ] Backend: Middleware actualizado
- [ ] Backend: Controladores actualizados
- [ ] Testing completado
- [ ] Documentación actualizada

---

**Última actualización**: 2025-11-10
**Versión**: 1.0.0
