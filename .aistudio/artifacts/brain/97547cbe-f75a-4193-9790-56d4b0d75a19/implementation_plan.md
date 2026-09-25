# Plan de Implementación: Eliminación de Accesos Directos de 1-Clic de Administrador

## 1. Contexto y Objetivo
El usuario solicitó retirar los botones de acceso directo de 1-clic a las cuentas de administrador (**Maurely Carmona** y **Victor Rojas**) del modal de inicio de sesión (`AuthModal.tsx`). La presencia de estos botones permite a cualquier visitante o cliente pulsar una tarjeta y acceder directamente al panel administrativo con privilegios completos, lo cual compromete la privacidad y seguridad del estudio.

El objetivo es convertir la pestaña de Administrador en un formulario de autenticación seguro y profesional donde las credenciales deban ingresarse manualmente.

---

## 2. Cambios Propuestos

### Modificaciones en `src/components/AuthModal.tsx`
- **Eliminar sección de acceso rápido de administrador:**
  - Retirar el bloque JSX correspondiente a las tarjetas demo de 1-clic (`id="quick-login-admin-maurely"` y `id="quick-login-admin-victor"`).
  - Eliminar los textos y badges asociados ("Acceso directo de Administrador:", "1-clic para entrar").
- **Conservar la seguridad y funcionalidad estándar:**
  - Mantener los campos obligatorios de Correo/Usuario y Contraseña con visualizador de contraseña (mostrar/ocultar).
  - Mantener el botón de envío "Iniciar Sesión" con validación de credenciales.
  - Mantener los mensajes de error claros en caso de credenciales incorrectas.
  - Mantener la compatibilidad en el backend/estado para que tanto `admin@somospixart.com` como `victor@somospixart.com` (y sus alias `admin` y `victor`) continúen iniciando sesión normalmente con la contraseña `admin2026`.

---

## 3. Plan de Verificación

### Pruebas de Interfaz de Usuario
1. Abrir el modal de inicio de sesión desde la barra de navegación o portal de clientes.
2. Comprobar que en la pestaña de **Administrador** ya no aparece ningún botón ni tarjeta de 1-clic o autocompletado.
3. Verificar que la pestaña de **Cliente** se mantiene intacta con sus modos de Usuario/Contraseña y PIN de sesión.

### Pruebas Funcionales de Acceso
1. Introducir `admin@somospixart.com` y `admin2026` -> Confirmar inicio de sesión exitoso como Maurely Carmona.
2. Introducir `victor@somospixart.com` y `admin2026` -> Confirmar inicio de sesión exitoso como Victor Rojas.
3. Probar con contraseña errónea -> Confirmar bloqueo y mensaje de advertencia adecuado.

### Validación Técnica
- Ejecutar `lint_applet` para asegurar cero errores de TypeScript.
- Ejecutar `compile_applet` para asegurar una compilación limpia.
