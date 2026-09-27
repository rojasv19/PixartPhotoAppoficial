# Plan de Implementación: Corrección de Error de Cuota de Almacenamiento Local (QuotaExceededError)

## Resumen Ejecutivo
Se solucionará de raíz el error no controlado `Failed to execute 'setItem' on 'Storage': Setting the value of 'somos_pixart_users_v5' exceeded the quota` que activó el ErrorBoundary en la aplicación. La causa es que `localStorage` del navegador alcanzó el límite estricto de 5MB debido a imágenes pesadas en base64 almacenadas en caché, provocando que escrituras posteriores de usuarios y personalización fallen si no tienen manejo de errores.

---

## Decisiones Críticas y Confirmaciones

> [!IMPORTANT]
> **Prioridad de InstantDB sobre LocalStorage:** Todos los datos de galerías, fotografías, usuarios, permisos, registros y configuración de marca residen y se sincronizan en la nube en tiempo real vía **InstantDB**. `localStorage` únicamente opera como respaldo y caché temporal offline. La purga de caché local nunca eliminará datos del servidor en la nube.

1. **Blindaje Total de Escrituras:** Ninguna llamada a `localStorage.setItem` podrá lanzar una excepción no capturada que rompa el árbol de renderizado de React.
2. **Purga Automática de Caché Excesiva:** Si `localStorage` reporta `QuotaExceededError`, el sistema liberará automáticamente la clave de imágenes (`somos_pixart_images_v3`) o logs antiguos, reintentando de inmediato la persistencia de usuarios y branding.
3. **Optimización de Caché de Imágenes:** Solo se almacenarán en `localStorage` metadatos y URLs remotas de fotos, evitando inyectar cadenas base64 gigantes (`data:image/...`) que saturan la cuota del navegador en una sola operación.

---

## 1. Visión General del Sistema y Flujo de Recuperación

```
┌─────────────────────────────────────────────────────────────┐
│                    React UI (App.tsx)                       │
│      Usuarios, Branding, Galerías y Sesiones de Fotos       │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 ┌──────────────────────┐              ┌──────────────────────┐
 │   InstantDB Cloud    │              │  Safe Storage Layer  │
 │ (Persistencia Real)  │              │ (Caché Local Segura) │
 └──────────────────────┘              └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ ¿Excede Cuota (5MB)? │
                                       └──────────┬───────────┘
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        │ SÍ                                                │ NO
                        ▼                                                   ▼
         ┌──────────────────────────────┐                    ┌─────────────────────────┐
         │ Evicción Automática de Caché │                    │ Guardado Exitoso        │
         │ (somos_pixart_images_v3)     │                    └─────────────────────────┘
         │ Reintento de Usuario/Brand   │
         └──────────────────────────────┘
```

---

## 2. Cambios Específicos por Módulo

### A. `src/services/storageService.ts`
- **Blindar `saveUsersToStorage` con `try/catch`:** Capturar cualquier `QuotaExceededError` o `DOMException`.
- **Implementar Helper `safeSetItem(key, value, fallbackEvictKey)`:**
  - Envuelve las escrituras con manejo de cuota.
  - Si ocurre error de cuota, elimina automáticamente claves pesadas de baja prioridad (como imágenes en caché local o logs viejos) y reintenta la escritura crítica (usuario/branding).
- **Proteger todas las funciones de persistencia:**
  - `saveLogsToStorage`
  - `saveNotificationsToStorage`
  - `saveStoredAuthUser`
  - `saveServerQuotaToStorage`
  - `saveGalleriesToStorage`
- **Filtrado de Base64 en `saveImagesToStorage`:** Sanitizar la lista de imágenes para no persistir strings base64 de gran tamaño en `localStorage`.

### B. `src/services/brandingService.ts`
- **Blindaje y Reintento en `saveBrandingToStorage`:**
  - Usar `safeSetItem` para garantizar que la personalización del portal y textos no fallen ante falta de espacio local.
  - Si la cuota está llena, purgar `somos_pixart_images_v3` del navegador y guardar el branding exitosamente.

### C. `src/App.tsx`
- **Blindar efectos de sincronización (`useEffect`):**
  - Asegurar que la sincronización de `users`, `galleries`, `images`, `deletedUserIds` y `theme` no genere bloqueos ni excepciones hacia `ErrorBoundary`.
- **Rutina de inicialización preventiva:**
  - Al iniciar la app, verificar el tamaño de `localStorage`. Si está al borde del límite (>4.5MB), realizar una limpieza preventiva de cachés redundantes para mantener la aplicación rápida y estable.

---

## 3. Plan de Verificación
1. **Verificación de Compilación y Sintaxis:** Ejecutar `compile_applet` para asegurar cero errores de TypeScript.
2. **Prueba de Resistencia de Cuota:** Simular almacenamiento lleno en `localStorage` y verificar que la app no lance errores ni se bloquee.
3. **Comprobación de InstantDB:** Confirmar que los usuarios, galerías y ajustes de marca continúen sincronizándose en tiempo real con la nube sin interrupción.
