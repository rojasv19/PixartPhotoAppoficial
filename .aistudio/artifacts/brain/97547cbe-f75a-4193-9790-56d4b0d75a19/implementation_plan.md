# Plan de Implementación: Marca de Agua en la Previsualización de Foto (Lightbox)

## 1. Causa Identificada
En la vista de la galería (`GalleryView.tsx`), las miniaturas muestran correctamente la marca de agua. Sin embargo, al hacer clic en una fotografía para abrir la previsualización a pantalla completa (`PhotoLightbox.tsx`), el componente `PhotoLightbox` no estaba recibiendo la propiedad `gallery={gallery}`. Como consecuencia:
- `gallery` era `undefined` dentro del visor modal.
- La condición `{gallery?.watermarkEnabled && <WatermarkOverlay ... />}` nunca se cumplía.
- La previsualización no mostraba la marca de agua configurada en la sesión.

---

## 2. Cambios Específicos

### A. Conectar Datos de la Galería al Visor (`src/components/GalleryView.tsx`)
- Pasar la propiedad `gallery={gallery}` a `PhotoLightbox` al abrir una imagen.
- Pasar `onUpdateImage={onUpdateImage}` y `branding={branding}` para permitir al administrador quitar o reactivar la marca de agua directamente desde la previsualización.

### B. Ajuste de Ajuste Visual en el Lightbox (`src/components/PhotoLightbox.tsx`)
- Asegurar que el contenedor de la imagen (`img`) y `<WatermarkOverlay />` coincidan exactamente en proporciones y dimensiones en el visor (usando un contenedor relativo ajustado a la imagen).
- Mantener los botones de acción del Lightbox:
  - Botón de descarga automática para fotos sin marca de agua (`excludeWatermark === true`).
  - Botón administrativo para quitar/reactivar la marca de agua en esa fotografía.

---

## 3. Verificación
1. Entrar a una galería con marca de agua activa (ej. *Haute Mode*).
2. Hacer clic en cualquier fotografía protegida para abrir la previsualización.
3. Verificar que la marca de agua (frase o logo, centrada o en mosaico) aparece inmediatamente sobre la foto previsualizada.
4. Para un administrador, probar hacer clic en "Quitar Marca" dentro de la previsualización y verificar que la marca se retira al instante y aparece el botón de descarga directa.
5. Ejecutar `compile_applet` y validar compilación exitosa.
