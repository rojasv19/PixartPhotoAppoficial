# Plan de Implementación: Actualización y Alta de Administradores de Somos Pixart

Actualización de las cuentas de administrador del sistema fotográfico según la solicitud:
1. Reemplazar el nombre del administrador principal actual (**Alejandro Sterling**) por **Maurely Carmona**.
2. Agregar una nueva cuenta de administrador para **Victor Rojas** con el correo `victor@somospixart.com` y la contraseña `admin2026`.

---

## 1. Cambios Propuestos

### Cuentas de Usuario (`src/data/initialData.ts`)
- **Administrador Principal**:
  - Modificar el registro existente `usr-admin-1` para actualizar el nombre de `'Alejandro Sterling'` a `'Maurely Carmona'`.
  - Correo: `admin@somospixart.com`
  - Contraseña: `admin2026`
  - Rol: `admin` (acceso al panel de control, gestión de clientes, sesiones y configuración).
  - Actualizar también las referencias en el registro de auditoría inicial (`INITIAL_AUDIT_LOGS`) para reflejar a Maurely Carmona como autora de las acciones administrativas previas.

- **Nuevo Co-Administrador**:
  - Añadir un nuevo registro en `INITIAL_USERS`:
    - `id`: `'usr-admin-2'`
    - `name`: `'Victor Rojas'`
    - `email`: `'victor@somospixart.com'`
    - `password`: `'admin2026'`
    - `role`: `'admin'`
    - `avatar`: `DEFAULT_PROFILE_AVATAR` (isotipo oficial de Somos Pixart)
    - `company`: `'Somos Pixart'`
    - `status`: `'active'`
    - `assignedGalleryIds`: Todas las galerías del estudio (`['gal-wedding-1', 'gal-editorial-2', 'gal-portrait-3', 'gal-corp-4']`)
    - Permisos: `canDownloadHighRes: true`, `canLeaveFeedback: true`, `canSelectFavorites: true`.

### Persistencia y Migración (`src/services/storageService.ts`)
- Incrementar la versión de almacenamiento (`somos_pixart_users_v4` y `somos_pixart_auth_user_v4`) o sincronizar el almacenamiento local de usuarios para que los cambios surtan efecto de forma inmediata sin que los navegadores queden con la lista previa de usuarios en caché.

---

## 2. Experiencia de Usuario y Flujos

- **Inicio de Sesión**:
  - Tanto **Maurely Carmona** (`admin@somospixart.com`) como **Victor Rojas** (`victor@somospixart.com`) podrán autenticarse ingresando sus correos y la clave `admin2026` en la pestaña de Administrador del modal de acceso.
  - Al iniciar sesión con cualquiera de los dos, la interfaz desplegará su nombre correspondiente en la cabecera, en el menú de perfil y en el panel de control.
- **Gestión de Administradores**:
  - En la lista de usuarios y roles del panel de control, ambos administradores figurarán activos con sus insignias de Administrador y permisos de nivel directivo.

---

## 3. Plan de Verificación

### Pruebas de Autenticación
1. **Acceso con Maurely Carmona**:
   - Iniciar sesión con `admin@somospixart.com` / `admin2026`.
   - Verificar que el saludo y el menú de perfil indiquen "Maurely Carmona" y rol "Administrador".
2. **Acceso con Victor Rojas**:
   - Cerrar sesión e iniciar con `victor@somospixart.com` / `admin2026`.
   - Verificar que el acceso sea exitoso, reconozca el perfil de "Victor Rojas" y otorgue acceso total al panel administrativo y las galerías.
3. **Consistencia de Datos y Auditoría**:
   - Confirmar que ambos usuarios puedan navegar por las galerías y gestionar las sesiones fotográficas.
4. **Compilación y Linteo**:
   - Ejecutar `compile_applet` y `lint_applet` para asegurar cero errores de tipos o sintaxis.
