# Plan de Implementación: Botón de Favoritas, Vista Previa del Hero y Barra de Progreso de Subida

## Resumen Ejecutivo
Se implementarán tres soluciones concretas para optimizar la interacción del cliente y del administrador:
1. **Feedback Visual y Cambio de Color en Botón de Favoritas:** Solucionar el problema por el cual el corazón de favoritas no cambiaba de color en la vista de cliente (debido a la discrepancia entre IDs de sesión de invitados/PIN y UUIDs en InstantDB). Ahora el botón se iluminará inmediatamente en tono rosa/carmesí (`bg-rose-600` con corazón relleno) al hacer clic, con retroalimentación táctil y toast de confirmación.
2. **Actualización de la Vista Previa en Tiempo Real (Admin Branding):** Sincronizar el lienzo de previsualización en vivo en el panel de Marca/Personalización para que coincida exactamente con el nuevo diseño del Hero a pantalla completa (`100vw`/`100vh`), eliminando la barra de búsqueda del Hero y ubicando el menú de galerías con su buscador contiguo tal como luce en el portal público.
3. **Barra de Porcentaje y Notificación en Subida de Fotos:** Incorporar en el modal de carga de imágenes una barra de progreso animada con porcentaje en tiempo real (`0%` a `100%`) que procese las fotografías agregadas o arrastradas al hacer clic en el botón de confirmación, culminando con una notificación de éxito que confirme que las fotos se subieron correctamente.

---

## Decisiones Críticas y Arquitectura

> [!IMPORTANT]
> **Compatibilidad de IDs para Favoritas:** Tanto si el cliente ha iniciado sesión formalmente como si accede mediante PIN de galería como invitado (`usr-guest`), la condición de favorita verificará `isSameId(favUserId, targetUserId)` en `GalleryView` y `PhotoLightbox`, garantizando que el corazón cambie de color de forma inmediata y persista tanto en la nube (InstantDB) como en el estado local de React.

1. **Optimismo Visual Inmediato:** Al hacer clic en el botón de favoritas, el estado de la fotografía cambiará al instante en la interfaz antes de esperar la respuesta del servidor, brindando retroalimentación instantánea con microanimación.
2. **Fidelidad 1:1 en Vista Previa:** La vista previa en `AdminBrandingSettings` reflejará la tipografía seleccionada, los colores del badge y resaltado, el degradado inferior y la nueva barra de sesiones sin buscador en el Hero.
3. **Simulación de Carga Realista con Porcentaje:** Durante la subida en el modal, se calculará el porcentaje acumulado por archivo, mostrando el progreso fluido y deshabilitando envíos duplicados hasta concluir con el mensaje de confirmación.

---

## 1. Cambios Específicos por Módulo

### A. `src/components/GalleryView.tsx` y `src/components/PhotoLightbox.tsx`
- **Cálculo de `isFav`:**
  - Definir `targetUserId = currentUser?.id || 'usr-guest'`.
  - Comprobar pertenencia usando `(image.favoriteByUsers || []).some(id => isSameId(id, targetUserId))`.
  - Asegurar que `canFavorite` permita marcar favoritas tanto a usuarios registrados como a invitados autorizados por PIN.
- **Estilo visual activo:**
  - Cuando `isFav` sea verdadero: fondo `bg-rose-600 text-white fill-current shadow-lg shadow-rose-600/30 scale-110`.
  - Cuando sea falso: `bg-slate-950/70 text-slate-300 hover:text-rose-400 hover:bg-slate-900`.
- **Aviso Toast y contador de selección:**
  - Mostrar una pequeña animación o mensaje flotante ("Añadida a tus favoritas") al marcar la foto para despejar cualquier duda del cliente.

### B. `src/App.tsx`
- **Mapeo de Usuario en `handleToggleFavorite`:**
  - Si `currentUser` no existe, usar el identificador de invitado asignado a la sesión (`usr-guest` o enlace de la galería actual).
  - Almacenar el UUID en `favoriteByUsers` de manera uniforme para sincronizarse perfectamente con InstantDB.

### C. `src/components/AdminBrandingSettings.tsx`
- **Eliminar el buscador interior del Hero:**
  - Retirar el `input` de búsqueda del contenedor del Hero en la "Vista Previa en Tiempo Real".
- **Alinear con el nuevo diseño del portal:**
  - Agregar bajo el Hero el bloque de cabecera de "Galerías de Sesiones Fotográficas" con la barra de búsqueda y selector de categorías idéntico al de `PublicClientPortal.tsx`.
  - Garantizar que los ajustes de opacidad, blur, tipografía y colores se reflejen con total exactitud.

### D. `src/components/AdminDashboard.tsx`
- **Modal de Subida de Fotografías (`UploadImageModal`):**
  - Añadir estados: `uploadProgress` (número del 0 al 100), `isUploadingWithProgress` (boolean) y `uploadSuccessNotification` (boolean).
  - Al hacer clic en el botón de confirmación ("Selecciona Fotografías" / "Subir Fotografías al Servidor"):
    - Si no hay fotos pendientes en la lista, abrir el selector nativo de archivos.
    - Si ya hay fotos arrastradas o agregadas, iniciar la barra de porcentaje con transición fluida de `0%` a `100%`.
    - Al llegar al `100%`: ejecutar `onUploadImage` para cada fotografía, mostrar una alerta verde destacada: *"¡Las fotografías fueron subidas correctamente al servidor!"*, y cerrar el modal tras 1.5 segundos con limpieza de archivos pendientes.

---

## 2. Plan de Verificación
1. **Verificación de Compilación:** Ejecutar `compile_applet` y `lint_applet` (`tsc --noEmit`).
2. **Prueba de Favoritas en Portal de Clientes:**
   - Abrir una galería como cliente/invitado y pulsar el corazón en varias fotos.
   - Comprobar que cambie inmediatamente a color rojo/rosa con corazón relleno y el contador "Favoritas (X)" se actualice.
   - Abrir la foto en la Lightbox y verificar que el botón refleje el estado activo.
3. **Prueba de Vista Previa en Tiempo Real:**
   - Ir a Administración -> Marca / Personalización y comprobar que la vista previa refleje el Hero sin barra de búsqueda interna y con la barra de menú exterior.
4. **Prueba de Subida con Barra de Porcentaje:**
   - En el panel de administración, abrir el modal de subida de fotos, arrastrar o seleccionar archivos y presionar el botón de subida.
   - Observar la barra de porcentaje incrementando de 0% a 100% y la notificación de confirmación de subida exitosa.
