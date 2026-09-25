# Plan de Implementación: Permisos por Galería, Sistema de Marca de Agua y Excepciones Individuales

## 1. Resumen de Requerimientos
- **Traslado de Permisos de Cliente a Galería:**
  - Eliminar los permisos de cliente ("Descarga Directa", "Selección de Favoritas", "Dejar Feedback") del perfil/modal de usuario cliente.
  - Integrar estos permisos directamente en la configuración de cada galería (formulario de creación y edición en el panel de administrador).
- **Control de Marca de Agua por Galería (Exclusivo Administrador):**
  - Checkbox para activar/desactivar marca de agua en la galería específica.
  - Selección de formato: Frase / Texto personalizado o Imagen / Logotipo (con opción de carga desde el dispositivo o URL).
  - Selección de disposición: **Una sola vez en el centro** (`center`) o **Repetida por toda la imagen** (`repeated` / mosaico diagonal).
  - Regla de negocio estricta: Si la marca de agua está activada en la galería, la opción de "Permitir Descarga Directa" de la galería queda bloqueada y deshabilitada.
- **Excepción de Marca de Agua por Imagen Individual:**
  - En la vista de gestión de fotos de la galería (solo para administradores), agregar la opción de **"Quitar marca de agua"** en fotos específicas.
  - **Descarga automática de fotos sin marca de agua:** Si una foto tiene la marca de agua desactivada/excluida, el botón de descarga se activa automáticamente para esa imagen en el visor y la galería, permitiendo su descarga limpia.
  - Para fotos con marca de agua, si se intenta descargar en modo protegido, se procesa la descarga con la marca de agua estampada en Canvas o queda restringida según la configuración.

---

## 2. Modificaciones en Modelos de Datos (`src/types.ts`)
- **`GallerySession`:**
  - `watermarkEnabled: boolean;` (Indica si la galería tiene marca de agua activa)
  - `watermarkType: 'text' | 'image';` ('text' para frase, 'image' para logo)
  - `watermarkText?: string;` (Texto de la marca de agua, ej. "SOMOS PIXART STUDIOS")
  - `watermarkImageUrl?: string;` (URL o DataURL de la imagen/logo de marca de agua)
  - `watermarkPosition: 'center' | 'repeated';` ('center' = centro, 'repeated' = mosaico)
  - `watermarkOpacity?: number;` (Opacidad, ej. 0.35)
  - `allowDownloadHighRes: boolean;` (Permiso general de descarga a nivel de galería)
  - `allowFavoritesSubmission: boolean;` (Permiso de selección de favoritas a nivel de galería)
  - `allowFeedback: boolean;` (Permiso de feedback a nivel de galería)

- **`GalleryImage`:**
  - `excludeWatermark?: boolean;` (Si es `true`, esta foto específica no lleva marca de agua y permite descarga directa)

- **`User`:**
  - Mantener retrocompatibilidad opcional pero retirar los controles del formulario de cliente.

---

## 3. Cambios en la Interfaz de Administrador (`src/components/AdminDashboard.tsx`)
1. **Modal de Crear/Editar Cliente:**
   - Remover el bloque *"Permisos Específicos para este Cliente"* (los 3 toggles de descarga, favoritos y feedback).
2. **Modal de Crear/Editar Galería:**
   - Agregar sección de **Permisos de la Galería**:
     - *Permitir Selección y Envío de Fotos Favoritas*
     - *Permitir Dejar Feedback y Solicitudes de Retoque*
     - *Permitir Descarga Directa de Alta Resolución (RAW/4K)*: Se desactiva y deshabilita automáticamente si la marca de agua de la galería está activada, con una nota informativa explicativa.
   - Agregar sección de **Configuración de Marca de Agua**:
     - Checkbox: *Activar marca de agua en esta galería*
     - Selector: *Tipo de marca de agua* (Frase de texto o Imagen/Logo).
     - Campo de texto para la frase o botón para subir imagen/logo desde el dispositivo.
     - Selector de posición: *Una sola vez en el centro* vs *Repetida en mosaico por toda la imagen*.
     - Vista previa interactiva en tiempo real del efecto de la marca de agua sobre una foto muestra.
3. **Gestor de Fotos de la Galería (Solo Administrador):**
   - En cada tarjeta de foto y en el modal de detalle/edición de foto:
     - Botón / Switch rápido: *"Quitar marca de agua de esta foto"* / *"Sin marca de agua"*.
     - Indicador visual claro (badge) de estado: `Protegida con marca de agua` vs `Exenta (Descargable)`.

---

## 4. Renderizado de Marca de Agua y Lógica de Descarga en el Portal / Visor
1. **Componente de Marca de Agua Reutilizable (`src/components/WatermarkOverlay.tsx`):**
   - Renderiza sobre la imagen el texto o logo según la configuración de la galería (`center` o patrón repetido `repeated` con rotación suave tipo diagonal).
   - Respeta de forma inmediata la propiedad `photo.excludeWatermark`.
2. **Lógica de Descarga en la Galería del Cliente (`PublicClientPortal.tsx`, `GalleryView.tsx`, Lightbox):**
   - Si la galería tiene marca de agua activada:
     - El botón de descarga masiva/general no está disponible.
     - Para las fotos que tengan `excludeWatermark === true`, se muestra de forma destacada el botón de descarga individual directa.
     - Si una foto tiene marca de agua, no permite descarga limpia (o quema la marca de agua en el Canvas antes de exportar).
   - Los permisos de la galería (`allowFeedback`, `allowFavoritesSubmission`) controlan directamente las pestañas y acciones del cliente en esa galería.

---

## 5. Verificación y Pruebas
1. Comprobar que en el perfil del cliente ya no aparecen los tres checks de permisos.
2. Comprobar que en la edición y creación de galería aparecen los tres permisos de galería y la sección de marca de agua.
3. Verificar la regla de exclusión mutua: activar marca de agua bloquea la descarga general de la galería.
4. Probar los dos tipos de marca de agua (texto personalizado e imagen) y las dos disposiciones (centro y mosaico repetido).
5. Probar marcar una foto individual como "Sin marca de agua" y verificar que en la vista del cliente esa foto se muestra limpia y con el botón de descarga habilitado.
6. Ejecutar linter y `compile_applet` para garantizar cero errores de tipos o compilación.
