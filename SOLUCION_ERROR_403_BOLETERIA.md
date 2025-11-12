# Solución: Error 403 en Boletería

## 🔍 Problema Identificado

El sistema está generando un error **403 Forbidden** al intentar realizar ventas de entrada desde la vista de boletería. El problema se debe a un **desajuste entre el código y la base de datos**:

### Causa Raíz

- **Backend** (routes.js): Espera que el usuario tenga uno de estos roles: `ADMIN`, `TESORERIA`, `PERSONAL_CAJA`, `BOLETERIA`
- **Base de Datos** (tabla `usuario`): El ENUM de `rol_sistema` **NO incluye** el rol `BOLETERIA`

```sql
-- ENUM actual en la base de datos:
rol_sistema ENUM('ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA')
--                                                                                        ^^^ Falta BOLETERIA
```

---

## ✅ Soluciones Disponibles

Tienes **dos opciones** para solucionar este problema:

### 📌 Opción 1: Agregar el rol BOLETERIA (Recomendado)

Esta es la solución completa que permite tener un rol dedicado para el personal de boletería.

#### Pasos:

1. **Conectar a MySQL**

```bash
# Desde el contenedor de Docker
docker exec -it talenttracker-mysql-1 mysql -u root -p
# Contraseña: tu_password (ver docker-compose.yml)
```

O si tienes MySQL instalado localmente:

```bash
mysql -u root -p -h localhost -P 3306
```

2. **Seleccionar la base de datos**

```sql
USE club_lujan;
```

3. **Ejecutar la migración**

```sql
-- Archivo: backend/migrations/add_boleteria_role.sql
ALTER TABLE `usuario`
MODIFY COLUMN `rol_sistema` ENUM(
  'ADMIN',
  'TESORERIA',
  'COORDINADOR',
  'STAFF',
  'DIRECTIVO',
  'REVISOR_CUENTA',
  'PERSONAL_CAJA',
  'BOLETERIA'
) NOT NULL;
```

4. **Verificar el cambio**

```sql
SELECT COLUMN_NAME, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'usuario'
  AND COLUMN_NAME = 'rol_sistema';
```

5. **Asignar el rol a un usuario**

Opción A - Crear un nuevo usuario:
```sql
INSERT INTO `usuario` (`username`, `password_hash`, `rol_sistema`, `persona_id`)
VALUES ('boleteria', '$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy', 'BOLETERIA', NULL);
-- Contraseña: admin123
```

Opción B - Actualizar un usuario existente:
```sql
UPDATE `usuario`
SET `rol_sistema` = 'BOLETERIA'
WHERE `username` = 'tu_usuario';
```

6. **Cerrar sesión y volver a iniciar sesión** en el frontend para obtener un nuevo token JWT con el rol actualizado.

---

### 📌 Opción 2: Usar el rol PERSONAL_CAJA (Rápido)

Si no quieres modificar la estructura de la base de datos, puedes usar el rol `PERSONAL_CAJA` que ya existe y tiene los mismos permisos.

#### Pasos:

1. **Actualizar el usuario**

```sql
UPDATE `usuario`
SET `rol_sistema` = 'PERSONAL_CAJA'
WHERE `username` = 'tu_usuario';
```

2. **Cerrar sesión y volver a iniciar sesión** en el frontend.

---

## 🧪 Verificación

### 1. Verificar en la consola del navegador

Al entrar a la página de boletería, abre la **Consola de Desarrollador** (F12) y verás:

```
[Boletería Debug] Usuario: {user: {...}, rol_sistema: "BOLETERIA"}
[Boletería Debug] Rol actual: BOLETERIA
[Boletería Debug] Puede vender: true
[Boletería Debug] Roles permitidos: ADMIN, BOLETERIA, TESORERIA, PERSONAL_CAJA
```

### 2. Probar la venta de entrada

- Click en **"Venta Entrada Local (No Socio)"**
- Si funciona correctamente, debe aparecer una alerta con el mensaje de éxito
- **No debe aparecer el error 403**

---

## 📁 Archivos Creados

Se han creado los siguientes archivos para facilitar la solución:

| Archivo | Descripción |
|---------|-------------|
| `backend/migrations/add_boleteria_role.sql` | Migración para agregar el rol BOLETERIA al ENUM |
| `backend/migrations/create_boleteria_user.sql` | Scripts para crear o actualizar usuarios de boletería |
| `SOLUCION_ERROR_403_BOLETERIA.md` | Esta documentación |

---

## 🔧 Cambios Realizados en el Código

### Frontend

1. **Creado**: `frontend/src/utils/errors.ts` - Función helper para manejo de errores
2. **Modificado**: `frontend/src/app/(private)/boleteria/page.tsx`
   - Agregado debugging de roles en consola
   - Mejorado mensaje de error sin permisos
   - Agregado manejo específico para errores 403
3. **Modificados**: Otros componentes para uso consistente de `getErrorMessage()`

### Errores Corregidos

- ✅ Error: "Objects are not valid as a React child" - SOLUCIONADO
- ⚠️ Error 403 Forbidden - **REQUIERE MIGRACIÓN DE BASE DE DATOS** (ver arriba)

---

## 🚀 Comandos Rápidos

### Ejecutar migración desde Docker

```bash
# Copiar el archivo SQL al contenedor
docker cp backend/migrations/add_boleteria_role.sql talenttracker-mysql-1:/tmp/

# Ejecutar el script
docker exec -it talenttracker-mysql-1 mysql -u root -p club_lujan -e "source /tmp/add_boleteria_role.sql"
```

### Ver usuarios actuales

```bash
docker exec -it talenttracker-mysql-1 mysql -u root -p club_lujan -e "SELECT id, username, rol_sistema FROM usuario;"
```

### Actualizar un usuario específico

```bash
docker exec -it talenttracker-mysql-1 mysql -u root -p club_lujan -e "UPDATE usuario SET rol_sistema='BOLETERIA' WHERE username='admin';"
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué aparece el error 403?

El backend valida el JWT del usuario y verifica que el `rol_sistema` esté en la lista de roles permitidos. Si el rol no coincide, rechaza la petición con un 403.

### ¿Necesito reiniciar el backend después de la migración?

No es necesario. La migración solo modifica la base de datos. Sin embargo, el usuario **sí debe cerrar sesión y volver a iniciar** para obtener un nuevo token con el rol actualizado.

### ¿Qué permisos tiene cada rol?

| Rol | Permisos |
|-----|----------|
| `ADMIN` | Acceso total |
| `BOLETERIA` | Solo venta de entradas |
| `PERSONAL_CAJA` | Movimientos de caja + venta de entradas |
| `TESORERIA` | Gestión financiera completa |

---

## 📞 Soporte

Si tienes problemas con la migración:

1. Verifica que el contenedor de MySQL esté corriendo: `docker ps`
2. Revisa los logs: `docker logs talenttracker-mysql-1`
3. Verifica la conexión: `docker exec -it talenttracker-mysql-1 mysql -u root -p`

---

**Fecha de solución**: 2025-11-11
**Versión del sistema**: TalentTracker v1.0
