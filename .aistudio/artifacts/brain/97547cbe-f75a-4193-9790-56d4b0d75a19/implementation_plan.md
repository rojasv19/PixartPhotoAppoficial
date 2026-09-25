# Plan de Corrección: Prevención de Pantalla en Blanco al Subir Imágenes en Lote

## 1. Causa Raíz Identificada
Al subir 3 o más imágenes de alta resolución (cada una de 5MB a 25MB):
1. **Límite de Cuota de `localStorage` Superado (`DOMException: QuotaExceededError`):**
   - El navegador impone un límite estricto de **~5 MB** para todo el `localStorage`.
   - Las imágenes se estaban leyendo como cadenas Base64 completas sin comprimir (cada una ocupaba de 15MB a 35MB de texto). Al intentar guardar 3 fotos en `localStorage.setItem(STORAGE_KEYS.IMAGES, ...)`, el navegador lanzó de forma inmediata un error fatal de cuota excedida.
   - Como `saveImagesToStorage` carecía de bloque `try...catch`, el error no fue capturado y provocó que React desmontara toda la aplicación, dejando la **pantalla totalmente en blanco**.
2. **Saturación del WebSocket de Base de Datos (`InstantDB`):**
   - Al enviar transacciones con imágenes Base64 de decenas de megabytes por el canal de WebSocket, se supera el tamaño máximo de paquete permitido por los navegadores (1MB–4MB por mensaje), provocando desconexiones y fallos en cadena.
3. **Ausencia de `ErrorBoundary` Global:**
   - La aplicación no contaba con un componente protector de errores (`ErrorBoundary`) que atrapara excepciones no controladas y ofreciera una recuperación elegante.

---

## 2. Solución Propuesta

### A. Optimización Automática de Previews para Navegador (`AdminDashboard.tsx`)
- Al seleccionar o soltar archivos reales en el modal de subida:
  - Leer las dimensiones nativas originales (`naturalWidth` × `naturalHeight`) y el peso real del archivo en bytes (`file.size`) para mostrarlos con total fidelidad en la ficha de metadatos.
  - Generar un renderizado web optimizado mediante un elemento `<canvas>` (redimensionado proporcionalmente a un máximo de 1600px con compresión JPEG al 82%).
  - Esto reduce el tamaño en memoria y almacenamiento de **30 MB por imagen a solo ~180 KB**, permitiendo subir decenas de fotos sin saturar la memoria, la cuota de `localStorage` ni el canal de datos de InstantDB.

### B. Blindaje de `saveImagesToStorage` y Limpieza Segura (`src/services/storageService.ts`)
- Envolver `saveImagesToStorage` en un bloque `try...catch` robusto.
- Si se detecta un `QuotaExceededError`:
  - Sanitizar la lista de imágenes para no persistir cadenas base64 gigantes en `localStorage`.
  - Proteger `loadImagesFromStorage` para que detecte si hay datos corruptos o sobrecargados y los depure automáticamente sin dejar caer la aplicación.

### C. Creación del Componente Protector `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)
- Crear un componente `ErrorBoundary` de React con interfaz limpia:
  - Atrapa cualquier error inesperado en el ciclo de vida de los componentes.
  - En lugar de una pantalla en blanco, muestra un mensaje descriptivo con un botón de *"Recuperar y Recargar Aplicación"*, que restablece la caché local segura y recarga la interfaz al instante.
- Envolver la aplicación en `src/main.tsx` o `src/App.tsx`.

---

## 3. Plan de Verificación
1. **Prueba de Carga en Lote con Múltiples Imágenes:**
   - Subir 3 o más fotografías reales (tanto por selector múltiple como arrastrando y soltando).
   - Confirmar que el modal procesa la cola y la subida se completa al 100% sin parpadeos, congelamientos ni pantalla en blanco.
2. **Verificación de Metadatos:**
   - Confirmar que las fotos agregadas en la galería y en la tabla de fotos conservan su peso real en MB, resolución original (ej. 6720x4480) y nombre original de archivo.
3. **Prueba de Persistencia y Recarga:**
   - Recargar el navegador después de subir el lote y verificar que la aplicación inicia inmediatamente sin errores de cuota.
4. **Validación de Compilación y Linter:**
   - Ejecutar `lint_applet` y `compile_applet` para garantizar que la compilación es limpia y sin errores.
