# Plan de Implementación: Tipografía/Color de Frase Resaltada y Selector de Encuadre de 9 Puntos Cardinales

## 1. Tipografía y Color Personalizado para la Frase Resaltada del Hero
### Requisitos
- Permitir configurar la fuente, tamaño, grosor, estilo (cursiva/normal) y **color independiente** (distinto al color de marca) para la frase destacada (`portalHeroHighlight`).
- Reflejar estos estilos en:
  1. El configurador de marca (`AdminBrandingSettings.tsx`).
  2. La previsualización interactiva del Hero (`AdminBrandingSettings.tsx`).
  3. El portal público de clientes (`PublicClientPortal.tsx`).

### Implementación
- Añadir el control tipográfico flotante (`TypographyControl`) al campo `portalHeroHighlight` en `AdminBrandingSettings.tsx`.
- En `PublicClientPortal.tsx` y en el lienzo de previsualización:
  - Aplicar `typographyToStyle(branding?.customTypographyMap?.portalHeroHighlight)` al elemento `<span>` de la frase resaltada.
  - Si el usuario no selecciona un color específico en el inspector, se mantiene como respaldo el color temático de la marca (`colorTheme.twText`).
  - Si el usuario selecciona un color HEX o temático personalizado, este prevalece sobre el color de marca global.

---

## 2. Herramienta de Encuadre y Posición de Imagen con Cuadrícula de 9 Puntos Cardinales
### Requisitos
- Permitir ajustar el punto focal / alineación (`object-position`) tanto en:
  1. **Portadas de sesiones/galerías** (tarjetas del portal y cabeceras de galería).
  2. **Fotografías individuales** dentro de cada galería.
- Utilizar un **selector visual interactivo con cuadrícula de 9 puntos cardinales** según la preferencia seleccionada por el usuario.

### Componente `ImagePositionPicker.tsx`
- Crear un componente modular y reutilizable con:
  - **Cuadrícula táctil 3x3** con 9 puntos cardinales:
    - `top-left` (Arriba Izquierda) · `top` (Centro Arriba) · `top-right` (Arriba Derecha)
    - `left` (Centro Izquierda) · `center` (Centro) · `right` (Centro Derecha)
    - `bottom-left` (Abajo Izquierda) · `bottom` (Centro Abajo) · `bottom-right` (Abajo Derecha)
  - **Mini visor de encuadre en tiempo real:** Muestra una miniatura de la imagen ajustando su `object-position` de inmediato al hacer clic en cualquier punto de la cuadrícula.
  - **Etiquetas en español:** Muestra el nombre legible de la posición seleccionada (ej. *"Centro Arriba"*, *"Centro Abajo"*, etc.).

---

## 3. Integración en Galerías y Sesiones
1. **Tipos de Datos (`src/types.ts`):**
   - Extender `GallerySession` con `coverImagePosition?: string` (por defecto `'center'`).
   - Extender `GalleryImage` con `position?: string` (por defecto `'center'`).
2. **Modal de Creación/Edición de Galería (`AdminDashboard.tsx`):**
   - Integrar `ImagePositionPicker` junto a la imagen de portada para ajustar cómo se encuadra en la cabecera y en las tarjetas del portal.
3. **Inspector y Gestor de Fotografías (`AdminDashboard.tsx`):**
   - Integrar `ImagePositionPicker` para ajustar el encuadre de cualquier foto individual subida o existente.
4. **Vista de Galería (`GalleryView.tsx`):**
   - Para administradores: botón flotante/herramienta rápida de encuadre en el menú de foto para reajustar la alineación al instante mientras navega la galería.
   - Aplicar `object-position` en las miniaturas de la cuadrícula y en la cabecera de la galería.
5. **Portal de Clientes (`PublicClientPortal.tsx`):**
   - Aplicar `style={{ objectPosition: gallery.coverImagePosition || 'center' }}` en las tarjetas de galería.
6. **Persistencia en InstantDB (`src/services/instantDbService.ts`):**
   - Guardar `coverImagePosition` en las sesiones y `position` en las imágenes para sincronización multidispositivo.

---

## 4. Verificación y Calidad
- Ejecutar `lint_applet` para asegurar ausencia de errores de tipado.
- Ejecutar `compile_applet` para confirmar compilación correcta con Vite.
- Comprobar que dev server responde en puerto 3000.
