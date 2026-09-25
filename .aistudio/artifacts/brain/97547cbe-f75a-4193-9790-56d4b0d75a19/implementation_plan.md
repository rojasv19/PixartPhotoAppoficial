# Plan de Implementación: Eliminación Individual y Masiva de Fotografías en Galerías

## 1. Resumen de Requerimientos
- **Eliminación Individual (de una en una):**
  - Permitir a los administradores eliminar fotografías una a una directamente desde la vista de la galería (`GalleryView.tsx`), en cada tarjeta de foto de la cuadrícula y desde el visor a pantalla completa (Lightbox).
  - Mantener y mejorar la eliminación individual en la tabla del Inspector de Archivos en el panel de administración (`AdminDashboard.tsx`).
- **Eliminación Masiva (todas las imágenes):**
  - Agregar un botón prominente *"Eliminar todas las fotos"* en la barra de herramientas de la galería (`GalleryView.tsx`) cuando el usuario tiene permisos de administrador.
  - Agregar la opción de *"Vaciar fotos de la sesión"* tanto en la lista de Sesiones como en el Inspector de Fotos de `AdminDashboard.tsx`.
  - Desplegar una **ventana modal de confirmación** de seguridad antes de proceder con el borrado masivo, mostrando la cantidad exacta de fotos que se eliminarán y solicitando confirmación explícita para evitar pérdidas accidentales.

---

## 2. Modificaciones Propuestas

### A. Capa de Servicios y Estado Global (`src/services/instantDbService.ts` & `src/App.tsx`)
1. **Servicio InstantDB:**
   - Crear la función `deleteImagesBatchFromDb(imageIds: string[])` para eliminar múltiples registros de fotos atómicamente de la base de datos.
2. **Controlador en `src/App.tsx`:**
   - Crear `handleDeleteAllImagesInGallery(galleryId: string)`:
     - Filtra y remueve todas las fotos de la galería en el estado local (`setLocalImages`).
     - Sincroniza la eliminación en lote con InstantDB.
     - Registra una entrada en el historial de auditoría (*"Eliminó todas las X fotos de la sesión..."*).
   - Pasar `onDeleteImage` y `onDeleteAllImagesInGallery` como props a `GalleryView.tsx`.

### B. Vista de Galería (`src/components/GalleryView.tsx`)
1. **Acción Individual en Cuadrícula & Tarjetas:**
   - Si `currentUser?.role === 'admin'`, mostrar un botón de eliminación (ícono de papelera) en la esquina o acciones rápidas de cada tarjeta fotográfica.
   - Al pulsar, muestra un diálogo de confirmación: *"¿Eliminar esta fotografía de la galería?"*.
2. **Acción Masiva en Barra Superior:**
   - Botón *"Eliminar todas las fotos ({conteo})"* en la barra de herramientas superior para administradores.
   - Ventana modal de confirmación con advertencia visual:
     - Título: *"¿Eliminar todas las fotografías de esta galería?"*.
     - Mensaje: *"Esta acción eliminará permanentemente las {total} fotos de la sesión '{título}'. Esta acción no se puede deshacer."*.
     - Botones *"Cancelar"* y *"Sí, Eliminar Todas"*.

### C. Panel de Administración (`src/components/AdminDashboard.tsx`)
1. **En la tabla de Sesiones / Galerías:**
   - Agregar una acción rápida en cada fila de sesión para *"Vaciar fotografías"* si la galería cuenta con fotos.
2. **En la pestaña de Inspector de Archivos / Fotos:**
   - Agregar selector/filtro de galería y botón *"Eliminar todas las fotos"* con ventana de confirmación.

---

## 3. Plan de Verificación
1. **Eliminación Individual en Galería:**
   - Entrar a una galería como admin y borrar una foto individualmente; comprobar que desaparece de inmediato de la cuadrícula y se actualiza el contador.
2. **Eliminación Masiva en Galería:**
   - Pulsar *"Eliminar todas las fotos"* en la galería, verificar que aparece el modal de confirmación con el conteo exacto de fotos, confirmar y verificar que la galería queda limpia y con su estado vacío amigable.
3. **Eliminación desde el Panel de Administración:**
   - Probar la opción de vaciar fotos de una sesión desde la tabla de galerías.
4. **Verificación de Compilación y Linter:**
   - Ejecutar `lint_applet` y `compile_applet` para asegurar cero errores de TypeScript y compilación exitosa.
