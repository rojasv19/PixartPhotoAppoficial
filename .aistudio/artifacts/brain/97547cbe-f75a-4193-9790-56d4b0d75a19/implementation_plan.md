# Plan de Implementación: Botón de Favoritos en Lightbox, Modal de Subida con Pestañas y Flujo de Selección Final

## Resumen Ejecutivo
Se implementarán las 4 funcionalidades clave requeridas por el usuario:
1. **Corrección definitiva del botón de favoritos en el Lightbox:** Sincronizar el estado del `selectedImage` en `GalleryView` y `PhotoLightbox` mediante resolución reactiva con `isSameId` e intercalación optimista para que al hacer clic en el botón de favorita del lightbox cambie de color a rojo/rosa vibrante y actualice su estado al instante.
2. **Pestañas en el modal de subida de imágenes:**
   - **"Imágenes sin edición":** Flujo habitual de fotos para revisión y preselección.
   - **"Selección Final":** Fotografías procesadas y retocadas con marca `isFinalSelection: true` y etiqueta `'Selección Final'`.
3. **Nueva pestaña "Selección Final" en la barra de navegación del cliente:**
   - Ubicada junto a "Todas" y "Favoritas" en `GalleryView`.
   - Muestra las fotografías definitivas aprobadas.
   - Habilita por defecto la descarga en máxima resolución (High-Res) sin restricciones ni bloqueos.
   - Incorpora botón directo de descarga masiva en ZIP para la Selección Final.
4. **Pestaña de "Selección Final" dentro del perfil del cliente (`UserProfileModal`):**
   - Agrega un selector de pestañas dentro de "Mi Perfil & Cuenta": pestaña de datos personales y pestaña de "Selección Final" donde el cliente puede consultar y descargar sus fotos finales entregadas de todas sus sesiones activas.

---

## Decisiones Críticas y Arquitectura

> [!IMPORTANT]
> **Reactividad del Lightbox:** El lightbox recibía una copia inmutable congelada (`selectedImage`) que no se actualizaba cuando `App.tsx` mutaba el estado general de fotos. Al resolver dinámicamente `currentImg = images.find(i => isSameId(i.id, image.id))` y aplicar un toggle optimista en `GalleryView`, el botón del lightbox reacciona en 0ms.

1. **Tipado y Persistencia de `isFinalSelection`:**
   - En `types.ts`, extender `GalleryImage` con `isFinalSelection?: boolean`.
   - En `instantDbService.ts`, persistir `isFinalSelection` en `uploadImageToDb` y `updateImageInDb`.
2. **Descarga en Máxima Resolución por Defecto:**
   - Para toda imagen con `isFinalSelection: true` o en el modo `filterMode === 'final_selection'`, el permiso `canDownload` se fuerza a `true` y el selector de descarga ofrece la descarga de alta resolución directamente.
3. **Flujo de Carga en 2 Pestañas:**
   - En `AdminDashboard.tsx`, el modal de subida presenta dos pestañas visuales con iconos, badges e instrucciones claras para el fotógrafo.

---

## 1. Módulos y Cambios Específicos

### A. `src/types.ts`
- Agregar `isFinalSelection?: boolean;` a la interfaz `GalleryImage`.

### B. `src/services/instantDbService.ts`
- Sincronizar el campo `isFinalSelection` en `uploadImageToDb` y `updateImageInDb`.

### C. `src/components/PhotoLightbox.tsx` & `src/components/GalleryView.tsx`
- **En `PhotoLightbox.tsx`:**
  - Resolver la imagen activa desde la colección viva: `const activeImg = images.find(img => isSameId(img.id, image?.id)) || image;`.
  - Evaluar `isFavorite` sobre `activeImg.favoriteByUsers` usando `isSameId(favId, effectiveUserId)`.
  - Si la imagen es `isFinalSelection`, asegurar que la opción de descarga esté habilitada en máxima resolución.
- **En `GalleryView.tsx`:**
  - Wrapper en `onToggleFavorite` que actualiza concurrentemente `selectedImage` en el estado local si el lightbox está abierto.
  - Añadir botón de filtro `"Selección Final ({finalSelectionImages.length})"` junto a `"Todas"` y `"Favoritas"`.
  - Implementar vista filtrada y botón de descarga de ZIP para la Selección Final.

### D. `src/components/AdminDashboard.tsx`
- En el modal de subida de imágenes a la galería:
  - Añadir selector de pestañas: `uploadTab: 'raw' | 'final'` ("Imágenes sin edición" vs "Selección Final").
  - Al subir fotos en la pestaña "Selección Final", adjuntar automáticamente `isFinalSelection: true` y la etiqueta `Selección Final`.

### E. `src/components/UserProfileModal.tsx` & `src/App.tsx`
- En `UserProfileModal.tsx`:
  - Agregar pestañas en la cabecera del modal: `"Mis Datos"` y `"Selección Final"`.
  - En la pestaña "Selección Final", renderizar la galería de fotografías finales entregadas al cliente con previsualización y botón de descarga directa en máxima resolución.
- En `App.tsx`:
  - Pasar `images` y `galleries` a `UserProfileModal`.

---

## 2. Plan de Verificación
1. **Verificación de tipos y linting:**
   - Ejecutar `lint_applet` (`tsc --noEmit`).
2. **Prueba del Lightbox:**
   - Abrir una fotografía en el visor Lightbox y hacer clic en el botón de favorita.
   - Confirmar que cambia de color inmediatamente a rojo/rosa vibrante y muestra "En Favoritos", y que al cerrarlo la tarjeta en la galería también refleja el corazón activo.
3. **Prueba de Subida con Pestañas:**
   - Abrir el modal de subir imágenes en el panel de administración.
   - Alternar entre "Imágenes sin edición" y "Selección Final". Subir una foto en "Selección Final" y verificar la barra de porcentaje y notificación de éxito.
4. **Prueba de Navegación del Cliente:**
   - En la vista de la sesión del cliente, verificar la nueva pestaña "Selección Final".
   - Comprobar que solo muestra las fotos finales y permite descargarlas en alta resolución.
5. **Prueba del Perfil del Cliente:**
   - Abrir el modal de perfil del cliente y acceder a la pestaña "Selección Final".
