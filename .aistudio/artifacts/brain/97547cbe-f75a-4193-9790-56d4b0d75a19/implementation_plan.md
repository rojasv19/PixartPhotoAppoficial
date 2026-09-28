# Plan de Implementación: Corrección del Contador Fantasma y Visibilidad de Imágenes en la Galería

## 1. Diagnóstico del Problema

Al analizar el código y el flujo de datos tras el reporte del usuario, se identificaron cuatro factores específicos:

1. **Contador Fantasma de 16 Inicial:**
   - La propiedad numérica `photoCount` de la galería en la base de datos tenía registrado el número `16` (remanente de pruebas previas o metadato desfasado), pero el array de imágenes de esa galería no contenía entidades reales con URL.
   - En `GalleryView.tsx`, `AdminDashboard.tsx` y `PublicClientPortal.tsx`, el cálculo `effectivePhotoCount` hacía:
     `const effectivePhotoCount = galleryImages.length > 0 ? galleryImages.length : (gallery.photoCount || 0);`
     lo que provocaba que la pestaña mostrara `"Todas (16)"` aunque la lista estuviera vacía.

2. **Incremento a 40 (16 + 24):**
   - Al subir 24 fotos nuevas, el manejador de subida tomó `currentCount = 16` y le sumó `24`, actualizando el metadato a `photoCount = 40`.

3. **Por qué no se muestran las 24 imágenes en pantalla:**
   - **Descarte de imágenes locales en `App.tsx`:** El `useMemo` de `images` evaluaba:
     `if (imagesDbData?.images && imagesDbData.images.length > 0)` y si la base de datos remota devolvía imágenes de cualquier sesión, descartaba el `cachedImages` local y solo intentaba rescatar de `localImages` mediante un filtro estricto que se perdía al recargar.
   - **Límite de tamaño de WebSocket en InstantDB:** Las 24 imágenes se enviaban en un solo bloque con URLs en base64 (más de 3.5 MB en un solo `db.transact`). InstantDB rechaza mensajes de WebSocket mayores a 1-2 MB, provocando que la transacción fallara en el servidor.
   - **Discrepancia en resolución de `galleryId`:** El selector `activeGallery` en `App.tsx` (`galleries.find(...)`) no contemplaba slugs ni títulos normalizados, lo que podía hacer que la galería activa no coincidiera con el `galleryId` de las imágenes.

---

## 2. Solución Integral Propuesta

### A. Fusión Unificada de Todas las Fuentes de Imágenes (Sin Pérdidas)
- Reestructurar el `useMemo` de `images` en `App.tsx` utilizando un `Map<string, GalleryImage>` que combina acumulativamente:
  1. Imágenes persistidas en **IndexedDB** (`cachedImages`).
  2. Imágenes cargadas en memoria local (`localImages`).
  3. Imágenes sincronizadas desde la nube (**InstantDB**).
- Ninguna fuente pisará o borrará a la otra: si una imagen existe en IndexedDB o localmente, se mantendrá visible de inmediato en la interfaz aunque la red tarde o falle.

### B. Corrección del Contador: Conteo Real Basado en Fotografías
- Modificar el cálculo de `photoCount` y `effectivePhotoCount` para que **siempre sea verídico y refleje la cantidad real de fotos presentes en la galería**.
- Si una galería tiene 0 fotos físicas, el contador dirá `0` (eliminando el fantasma de 16).
- Si tiene 24 fotos, el contador dirá exactamente `24`.
- Sincronizar el metadato `photoCount` de la galería con `galleryImages.length` en cada render y actualización.

### C. Ajuste de Paquetes en la Subida a InstantDB
- Reducir el tamaño de los lotes de subida a la nube a bloques ligeros (3-5 imágenes por transacción) y optimizar la resolución del thumbnail en canvas (máximo 1000px, 0.72 de compresión JPEG ~40KB por foto).
- De este modo, cada transacción a InstantDB pesará menos de 180KB, garantizando que el WebSocket lo acepte sin errores ni rechazos.
- Guardado inmediato e incondicional en **IndexedDB** en el primer milisegundo de la subida.

### D. Resolución Robusta de `activeGallery` y Filtrado en `GalleryView`
- Mejorar la búsqueda de `activeGallery` en `App.tsx` para coincidir por ID exacto, UUID, slug o título normalizado.
- En `GalleryView.tsx`, asegurar que el filtrado de `galleryImages` verifique:
  - `isSameId(img.galleryId, gallery.id)`
  - `gallery.slug && isSameId(img.galleryId, gallery.slug)`
  - Coincidencia normalizada de título entre la foto y la sesión.

---

## 3. Plan de Verificación

1. **Comprobar Contador Real:**
   - Verificar que las galerías vacías muestren `0 fotos` y no el número fantasma `16`.
2. **Prueba de Subida y Visualización Inmediata:**
   - Subir fotografías a la galería y verificar que inmediatamente aparezcan en la grilla con sus miniaturas, metadatos y botones de interacción.
   - Confirmar que el contador coincida exactamente con la cantidad de tarjetas visibles (ej. `24 fotos`).
3. **Prueba de Recarga (F5):**
   - Recargar la página y confirmar que las 24 fotos permanecen intactas desde IndexedDB y se muestran sin desaparecer.
4. **Validación de Compilación:**
   - Ejecutar `lint_applet` (`tsc --noEmit`) y `compile_applet` para garantizar cero errores de tipos o sintaxis.
