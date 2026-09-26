# Plan de Implementación: Corrección de Clientes, Extracción Real de EXIF, Hero 1:1 y Reorganización de Textos

## 1. Corrección en la Eliminación de Clientes y Modal de Confirmación
### Diagnóstico
- **Causa raíz:** 
  1. En `AdminDashboard.tsx`, el botón de borrar usaba `window.confirm(...)`, el cual es bloqueado o suprimido por navegadores dentro de `iframe` en modo sandboxed, impidiendo que la acción se ejecute.
  2. En `App.tsx`, el hook `useMemo` de `users` reinyectaba automáticamente a todos los clientes definidos en `INITIAL_USERS` en cada renderizado (debido a `INITIAL_USERS.forEach(...)`), ignorando la eliminación tanto en estado local como en InstantDB.
- **Solución:**
  - Crear un **Modal de Confirmación Elegante** dentro de `AdminDashboard.tsx` (`clientToDelete`) con detalles del cliente (nombre, email, galerías asignadas), advertencia visual clara y botones de "Cancelar" y "Eliminar Cliente".
  - En `App.tsx`:
    - Filtrar únicamente los administradores iniciales fijos (`INITIAL_USERS.filter(u => u.role === 'admin')`) y no los clientes demo.
    - Mantener un registro `deletedUserIds` persistente para garantizar que un cliente eliminado nunca reaparezca ni desde `INITIAL_USERS` ni desde caché remota.
    - Ejecutar la eliminación en InstantDB mediante `deleteUserInDb(targetId)`.

---

## 2. Lectura y Extracción Real de Metadatos EXIF de Fotografía
### Diagnóstico
- Al subir archivos en `App.tsx` (líneas 723-728), los metadatos de cámara estaban fijos en código como `'Canon EOS R5 Master'` con lente `'RF 50mm f/1.2L USM'`.
- **Solución:**
  - Instalar la librería ligera de extracción de metadatos de fotografía `exifr` (o implementar lector EXIF nativo para JPEG/RAW).
  - En `AdminDashboard.tsx` / `processImageFile`:
    - Extraer los datos reales del archivo: **Marca y Modelo de Cámara** (`Make` + `Model`), **Lente** (`LensModel`), **Sensibilidad ISO** (`ISO`), **Velocidad de Obturación** (`ExposureTime` o `ShutterSpeedValue`), **Apertura** (`FNumber`) y **Distancia Focal** (`FocalLength`).
    - En caso de imágenes sin EXIF (capturas o archivos exportados para web sin metadatos), mostrar elegantemente el nombre de archivo o indicar `"No disponible / Exportación Web"` en lugar de inventar una cámara Canon falsa.

---

## 3. Previsualización del Hero en Personalización y Marca Idéntica al Hero Real
### Diagnóstico
- La previsualización actual en `AdminBrandingSettings.tsx` contenía tarjetas de acceso simuladas que no existen en el Hero real de `PublicClientPortal.tsx`, y difería en padding, dimensiones, tipografía y buscador.
- **Solución:**
  - Reemplazar el contenedor de previsualización en `AdminBrandingSettings.tsx` para replicar con exactitud el layout de `PublicClientPortal.tsx`:
    - Barra de navegación simulada superior con logo, nombre y badge.
    - Fondo dinámico con soporte de imagen o video real, desenfoque (`blur`), color y opacidad de overlay seleccionados, y gradiente inferior de transición.
    - Badge superior centrado con ícono de destello.
    - Título principal con frase destacada coloreada con la tipografía personalizada.
    - Subtítulo descriptivo centrado.
    - Barra de búsqueda idéntica a la del portal público.

---

## 4. Permitir Campos de Texto Vacíos y Reorganización Centrada Automática del Hero
### Diagnóstico
- Los textos del hero (`portalHeroBadge`, `portalHeroTitle`, `portalHeroSubtitle`, etc.) utilizaban operadores de coalescencia `||` con valores predeterminados (ej. `branding?.portalHeroTitle || 'Galerías fotográficas...'`), impidiendo que el usuario borrase el texto para dejarlo en blanco.
- Además, los contenedores (`div`, `p`, `h1`) se renderizaban aún con cadenas vacías, ocupando espacio residual e impidiendo el centrado armónico.
- **Solución:**
  - En `PublicClientPortal.tsx` y en la previsualización de `AdminBrandingSettings.tsx`:
    - Usar comprobaciones explícitas de presencia con `trim()`: sólo renderizar el badge si `branding.portalHeroBadge?.trim()` existe y no está vacío.
    - Si el usuario borra el título, subtítulo o badge, **no mostrar texto por defecto** y no renderizar el elemento contenedor.
    - La disposición flexbox vertical (`flex flex-col items-center justify-center`) reorganizará dinámicamente el contenido restante, manteniéndolo perfectamente centrado en pantalla.

---

## 5. Plan de Ejecución
1. **Paso 1:** Instalar `exifr` y crear el servicio extractor de EXIF en `src/services/exifService.ts`.
2. **Paso 2:** Actualizar `AdminDashboard.tsx` para extraer metadatos reales de cada archivo y enviarlos en `onUploadImage`.
3. **Paso 3:** Corregir `handleDeleteUser` en `App.tsx` y crear el modal de confirmación en `AdminDashboard.tsx`.
4. **Paso 4:** Actualizar `PublicClientPortal.tsx` y `AdminBrandingSettings.tsx` para permitir campos vacíos y auto-centrado del Hero.
5. **Paso 5:** Reestructurar la previsualización en `AdminBrandingSettings.tsx` para que coincida 1:1 con el Hero real.
6. **Paso 6:** Verificar con `lint_applet` y `compile_applet`.
