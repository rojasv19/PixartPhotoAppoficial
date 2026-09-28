# Plan de Implementación: Corrección de Favoritas, Nombres de Clientes y Rediseño de Hero en Portal

## Resumen Ejecutivo
Se implementarán 4 mejoras clave solicitadas:
1. **Reparación del botón de quitar/eliminar favoritas:** Sincronizar la eliminación de fotos favoritas directamente con InstantDB (`updateImageFavoritesInDb`) y actualizar el estado local de forma inmediata para que desaparezcan al hacer clic en "Quitar" o "Limpiar completadas".
2. **Resolución correcta del nombre de clientes:** Corregir la correspondencia de identificadores con `isSameId` para resolver UUIDs de InstantDB con los usuarios registrados, e incorporar el respaldo con `clientIds` y `clientNames` de la galería asociada, eliminando el nombre genérico "Cliente Asignado".
3. **Reubicación de la barra de búsqueda:** Retirar el buscador del Hero en el portal de clientes y colocarlo en la barra de menú/cabecera junto al título "Galerías de Sesiones Fotográficas".
4. **Hero 100%vw y 100%vh:** Configurar la sección Hero para que ocupe el 100% del ancho (`100vw`) y el 100% del alto de la ventana (`100vh`), ofreciendo una experiencia inmersiva a pantalla completa.

---

## Decisiones Críticas y Arquitectura

> [!IMPORTANT]
> **Persistencia y Reactividad Instantánea:** El botón de "Quitar" favorita actualizará el arreglo `favoriteByUsers` de la imagen en InstantDB en la nube y en el estado local en memoria en un solo paso, garantizando que la lista de fotos favoritas se actualice de inmediato sin recargar la página.

1. **Resolución de Clientes sin Nombres Genéricos:**
   - Comparación de IDs robusta: `isSameId(user.id, favUserId)` soporta tanto IDs legibles (`usr-client-sofia`) como UUIDs generados por InstantDB.
   - Enlace contextual por galería: Si una fotografía fue marcada por un visitante autenticado mediante PIN de galería, se asocia automáticamente a los nombres de clientes reales de la sesión (`parentGallery.clientNames` o `parentGallery.clientIds`).
2. **Hero Viewport Completo:**
   - La sección Hero se dimensiona a `w-screen h-screen min-h-screen` con alineación vertical perfecta del título, destacando el fondo de fotografía/video sin cortes.
3. **Buscador en la Barra de Sesiones:**
   - Se integra de forma limpia y responsiva en el contenedor de "Galerías de Sesiones Fotográficas", permitiendo filtrar por nombre, evento o locación junto a los filtros de categorías.

---

## 1. Cambios Específicos por Módulo

### A. `src/services/instantDbService.ts`
- Implementar y exportar `updateImageFavoritesInDb(imageId: string, favoriteByUsers: string[])`:
  - Realiza una mutación atómica en `tx.images[imageUuid].update({ favoriteByUsers })` asegurando persistencia en la nube.
- Exportar `updateImageRetouchAndTagsInDb(imageId: string, tags?: string[], clientNote?: string)` para notas y etiquetas de retoque.

### B. `src/components/AdminFavoritesView.tsx`
- **Reparar `handleRemoveSingleFavorite`:**
  - Desasociar los favoritos de la imagen seleccionada y llamar a `onUpdateImage` o a la función directa de actualización.
  - Actualizar el estado visual de inmediato para que la tarjeta de la foto desaparezca al instante.
- **Corregir `clientsWithFavorites` y `favoriteEntries`:**
  - Utilizar `isSameId` para emparejar `favUserIds` con `users`.
  - Si no coincide con un usuario registrado, buscar el cliente en `parentGallery.clientIds` o tomar el nombre de `parentGallery.clientNames[0]` (ej. "Sofía Delgado & Mateo Morales") en vez del genérico "Cliente Asignado".
- **Reparar `handleClearAllCompleted`:**
  - Limpiar los favoritos de todas las fotos marcadas como completadas tanto en local como en la base de datos.

### C. `src/App.tsx`
- Actualizar `handleUpdateImage`:
  - Detectar si cambió `favoriteByUsers` y persistirlo con `updateImageFavoritesInDb`.
  - Detectar si cambiaron `tags` o notas de retoque y persistirlos con `updateImageRetouchAndTagsInDb`.

### D. `src/components/PublicClientPortal.tsx`
- **Hero a Pantalla Completa (100%vw y 100%vh):**
  - Ajustar clases a `w-screen h-screen min-h-screen max-w-full flex flex-col justify-center items-center`.
  - Asegurar que la imagen o video de fondo cubran la totalidad de la pantalla.
  - Eliminar el bloque del buscador del Hero.
- **Barra de Búsqueda en Menú de Galerías:**
  - Agregar el `input` con ícono de búsqueda junto a la barra de títulos de "Galerías de Sesiones Fotográficas" y el selector de categorías.
  - Mantener la reactividad en tiempo real de filtrado por título, subtítulo y locación.

---

## 2. Plan de Verificación
1. **Verificación de Compilación y Tipos:**
   - Ejecutar `compile_applet` y `lint_applet` (`tsc --noEmit`) para validar tipado estricto.
2. **Prueba de "Quitar Favorita":**
   - Acceder al panel de administración -> "Selección Favoritas" y presionar "Quitar" en una fotografía.
   - Confirmar que la foto se retira de la lista y el contador disminuye.
3. **Prueba de "Clientes con Selección Activa":**
   - Confirmar que se muestren los nombres reales de los clientes de las sesiones (ej. "Sofía & Mateo", "Isabella Fontana") y nunca "Cliente Asignado".
4. **Prueba de Vista Pública / Portal de Clientes:**
   - Validar que el Hero ocupe el 100% del alto y ancho de la ventana sin la barra de búsqueda en medio.
   - Validar que el nuevo buscador en la sección "Galerías de Sesiones Fotográficas" filtre las galerías correctamente en tiempo real.
