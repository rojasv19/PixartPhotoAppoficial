# Plan de Implementación: Persistencia Masiva con IndexedDB y Pipeline de Subida por Lotes (700+ Fotos)

## 1. Diagnóstico de la Causa Raíz
Al subir más de 700 imágenes a *"Sesión Corporativa Zaga System Material Extra"*, ocurrieron tres fallas críticas simultáneas:
1. **Límite de 5MB en `localStorage` & Purga Destructiva:**
   - El almacenamiento de `localStorage` tiene una cuota estricta de ~5MB en navegadores. Guardar los metadatos de más de 700 fotos excede ampliamente ese límite arrojando `QuotaExceededError`.
   - Adicionalmente, en `cleanupStaleStorage()` existía una regla que al detectar un tamaño superior a 500KB en la caché de imágenes ejecutaba `localStorage.removeItem(STORAGE_KEYS.IMAGES)`, eliminando todas las fotos locales al refrescar la página.
2. **Saturación y Desconexión por Peticiones Concurrentes en InstantDB:**
   - La subida ejecutaba un `items.forEach()` sin control de concurrencia que enviaba 700 mutaciones individuales de WebSocket simultáneamente, saturando la conexión y provocando desconexiones y cancelaciones en el servidor.
3. **Pérdida de Estado React en Recarga:**
   - Al no haberse persistido en la nube por la saturación ni en el almacenamiento local por el límite de 5MB, al recargar la página la galería volvía a estado vacío.

---

## 2. Arquitectura de la Solución

### A. Capa de Almacenamiento Persistente de Alta Capacidad con IndexedDB
- Implementar un motor de almacenamiento local en **IndexedDB** (`somos_pixart_db`, objectStore `gallery_images`) que no tiene el límite de 5MB de `localStorage` y puede almacenar decenas de miles de fotografías (cientos de megabytes o gigabytes) con lectura y escritura instantánea.
- Eliminar de raíz la regla destructiva de purga en `cleanupStaleStorage()`.
- Cargar las imágenes desde IndexedDB al iniciar la aplicación para que estén disponibles de inmediato aún antes de que concluyan las consultas de red.

### B. Pipeline de Subida por Lotes (Batching) con Reintentos
- Crear en `instantDbService.ts` la función `uploadImagesBatchToDb(images: GalleryImage[], batchSize = 25)` que agrupa las transacciones en lotes seguros (`db.transact(...)`), procesándolas en serie con pausas controladas para evitar la saturación del WebSocket.
- Incluir mecanismo de reintento automático (retry con backoff exponencial) en caso de fallo transitorio en algún lote.

### C. Experiencia de Carga Masiva en `AdminDashboard.tsx`
- Reemplazar la simulación de tiempo fijo por un despachador asíncrono real de lotes:
  - Guardar inmediatamente cada lote procesado en IndexedDB para asegurar persistencia instantánea.
  - Barra de progreso que muestre en tiempo real el lote actual (ej: *"Lote 4/28: 100 de 700 fotos subidas al servidor (14%)"*).
  - Actualización atómica del conteo total (`photoCount`) en la galería seleccionada.

---

## 3. Módulos y Cambios Específicos

### 1. `src/services/indexedDbService.ts` (Nuevo Módulo)
- Inicialización de base de datos IndexedDB `SomosPixartDB` v1 con índices por `galleryId`, `id` y `isFinalSelection`.
- Métodos CRUD masivos:
  - `saveImagesBatchToIndexedDb(images: GalleryImage[])`
  - `getAllImagesFromIndexedDb(): Promise<GalleryImage[]>`
  - `getImagesByGalleryFromIndexedDb(galleryId: string): Promise<GalleryImage[]>`
  - `deleteImagesBatchFromIndexedDb(ids: string[])`
  - `clearGalleryImagesFromIndexedDb(galleryId: string)`

### 2. `src/services/storageService.ts`
- Eliminar la eliminación forzada `localStorage.removeItem(STORAGE_KEYS.IMAGES)` en `cleanupStaleStorage()`.
- Integrar la sincronización entre `saveImagesToStorage` e IndexedDB como capa primaria de almacenamiento seguro.

### 3. `src/services/instantDbService.ts`
- Implementar `uploadImagesBatchToDb(images: GalleryImage[], onBatchProgress?: (completed: number, total: number) => void)`.
- Manejar transacciones agrupadas con `db.transact()` en bloques de hasta 25 imágenes por mutación para cumplir con las especificaciones de InstantDB sin sobrecargar el runtime.

### 4. `src/App.tsx`
- Cargar inicialmente las imágenes desde IndexedDB al montar el componente para tener disponibilidad 100% inmediata.
- En `handleUploadImageBatch`: recibir el arreglo completo de fotografías, persistirlo atómicamente en IndexedDB, enviar los lotes a InstantDB y actualizar `photoCount` en la galería correspondiente.

### 5. `src/components/AdminDashboard.tsx`
- En el modal de subida de fotos, enviar los elementos a través de la canalización por lotes con retroalimentación visual continua.
- Manejar de forma fluida selecciones de cientos o miles de archivos sin congelar la interfaz ni bloquear el hilo principal.

---

## 4. Plan de Verificación

1. **Prueba de Carga Masiva:**
   - Seleccionar un volumen representativo de fotografías y ejecutar la subida a *"Sesión Corporativa Zaga System Material Extra"*.
   - Verificar que la barra de progreso avanza lote a lote reportando el progreso real.
2. **Prueba de Persistencia tras Recarga F5 / Navegador Nuevo:**
   - Una vez finalizada la subida, recargar la página completamente (F5 o Ctrl+R).
   - Confirmar que las imágenes permanecen intactas en la galería sin eliminarse ni reiniciarse a 0.
3. **Prueba de Conteo y Estadísticas:**
   - Comprobar que el número de fotos en la galería y en las estadísticas del disco refleje con precisión la nueva cantidad de fotos subidas.
4. **Validación de Compilación y Tipos:**
   - Ejecutar `lint_applet` (`tsc --noEmit`) y `compile_applet` para confirmar build limpio.
