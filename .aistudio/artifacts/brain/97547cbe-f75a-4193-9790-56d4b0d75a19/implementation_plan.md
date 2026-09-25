# Plan de Implementación: Carga Múltiple y Detección Automática de Metadatos en Subida de Fotografías

## 1. Diagnóstico del Estado Actual
- Actualmente, el modal de *"Subir Nueva Fotografía"* (`AdminDashboard.tsx`) contiene campos manuales editables:
  - Input de texto para *"Título de la Fotografía"*.
  - Input numérico para *"Tamaño RAW en MB"*.
  - Inputs numéricos para *"Resolución (px)"* (ancho × alto).
- Además, solo admite la selección de **un único archivo a la vez**, y no cuenta con soporte nativo de arrastrar y soltar múltiple ni con una lista de previsualización de cola de subida.

---

## 2. Modificaciones Propuestas

### A. Eliminación de Campos Manuales & Lectura Real de Metadatos
- **Eliminar inputs manuales:**
  - Se retirarán los campos de entrada de texto/número correspondientes al título, tamaño en MB y resolución en píxeles.
- **Detección Automática y Exacta:**
  - **Título / Nombre Original:** Extraído directamente del nombre del archivo en el sistema operativo (ej. `IMG_4920_RAW.CR3` o `Boda_Valenzuela_01.jpg`), limpiando la extensión para el título visual y preservando el nombre completo en `originalFileName`.
  - **Peso Real:** Calculado con precisión milimétrica a partir de `file.size` en bytes y formateado dinámicamente (ej. `24.6 MB`, `8.4 MB`, `950 KB`).
  - **Resolución Real:** Obtenida al instanciar el objeto nativo `new Image()` y leer sus dimensiones naturales `naturalWidth` y `naturalHeight` (ej. `6720 × 4480 px`, `4000 × 3000 px`).

### B. Carga Múltiple Simultánea (Selector & Arrastrar y Soltar / Drag & Drop)
- **Soporte de Entrada Múltiple:**
  - Agregar el atributo `multiple` al `<input type="file" multiple accept="image/*" />`.
  - Permitir seleccionar varios archivos de golpe en el explorador del sistema operativo.
- **Zona de Arrastrar y Soltar (Drag & Drop):**
  - Configurar manejadores `onDragOver`, `onDragLeave` y `onDrop` sobre la zona de carga del modal con retroalimentación visual interactiva al arrastrar archivos.
  - Capacidad de soltar múltiples archivos directamente en el modal para agregarlos a la cola.
- **Cola de Subida con Fichas de Metadatos Reales:**
  - Mostrar una lista o cuadrícula de previsualización con cada una de las fotografías agregadas:
    - Miniatura de la imagen real.
    - Nombre del archivo y título detectado.
    - Peso real en MB/KB.
    - Resolución real detectada en px (`Ancho × Alto`).
    - Botón individual para descartar/quitar cualquier fotografía antes de confirmar.
  - Resumen global en la parte inferior: e.g. *"5 fotografías listas para subir • 118.4 MB en total"*.

### C. Procesamiento de Subida en Lote
- Botón de confirmación dinámico: *"Subir X Fotografías al Servidor"*.
- Procesar cada archivo de la cola creando los registros correspondientes en la galería mediante `onUploadImage`, registrando las entradas de auditoría y cerrando el modal al completar satisfactoriamente.

---

## 3. Plan de Verificación
1. **Verificación de la Interfaz:**
   - Comprobar que ya no existen campos editables para escribir título, peso ni resolución.
2. **Prueba de Selección Múltiple y Drag & Drop:**
   - Seleccionar varios archivos a la vez con el botón *"Seleccionar desde tu dispositivo"*.
   - Arrastrar y soltar varios archivos dentro del modal y comprobar que se incorporan a la cola.
3. **Prueba de Metadatos Reales:**
   - Verificar que cada archivo en la cola muestra su nombre original, su peso en MB exacto y su resolución nativa en píxeles.
4. **Prueba de Carga en Lote:**
   - Confirmar la subida y verificar que todas las fotos aparecen en la galería y en la pestaña de fotos con sus metadatos reales.
5. **Validación de Compilación y Linter:**
   - Ejecutar `lint_applet` y `compile_applet` para garantizar que la compilación es limpia y sin errores.
