# Remover Debugger de Boletería

Una vez solucionado el problema 403, sigue estos pasos para limpiar el código:

## Opción 1: Comentar el componente (Rápido)

Edita: `frontend/src/app/(private)/boleteria/page.tsx`

```typescript
// Comentar estas líneas:
// import { TokenDebugger } from './debug-token';

// Y en el return, comentar:
// <TokenDebugger />
```

## Opción 2: Eliminar archivos (Limpieza completa)

```bash
# Eliminar el archivo de debug
rm frontend/src/app/(private)/boleteria/debug-token.tsx

# Editar boleteria/page.tsx y remover:
# - import { TokenDebugger } from './debug-token';
# - <TokenDebugger />
```

## Opcional: Remover logs de consola

En `boleteria/page.tsx`, puedes remover el `useEffect` que hace debugging:

```typescript
// Remover esto:
React.useEffect(() => {
  console.log('[Boletería Debug] Usuario:', authUser);
  console.log('[Boletería Debug] Rol actual:', rol);
  console.log('[Boletería Debug] Puede vender:', puedeVender);
  console.log('[Boletería Debug] Roles permitidos: ADMIN, BOLETERIA, TESORERIA, PERSONAL_CAJA');
}, [authUser, rol, puedeVender]);
```
