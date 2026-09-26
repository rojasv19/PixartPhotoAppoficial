# Plan de Implementación: Modal 90vw/vh, Corrección de Encuadre con Portal Flotante y Encuadre Global de Galería

## 1. Contexto y Objetivos
- **Rediseño del Modal de Galería:** Ajustar el modal de creación y edición de sesiones fotográficas a un tamaño de `90vw` y `90vh`, con cabecera y pie de página fijos, y un cuerpo scrollable (`overflow-y-auto`) organizado en dos columnas amplias para que todos los campos sean visibles y cómodos de editar sin desbordar la pantalla.
- **Corrección de la Herramienta de Encuadre (`ImagePositionPicker`):** Evitar que el menú desplegable quede recortado u oculto por contenedores con `overflow-hidden` o celdas de tabla. Se utilizará `createPortal` hacia `document.body` y cálculo de coordenadas dinámicas (`getBoundingClientRect`), asegurando que siempre flote con máxima prioridad visual (`z-[9999]`).
- **Encuadre en Portadas de Galería:** Incorporar la herramienta de encuadre visual directamente en las tarjetas de galería del panel administrativo, en el visor de cabecera y dentro del modal de edición.
- **Actualización en Lote para Todas las Fotos de la Galería:** Añadir una herramienta para seleccionar una posición cardinal y aplicarla en lote a todas las fotos existentes de la galería seleccionada, sincronizándolo con InstantDB y almacenamiento local.

---

## 2. Cambios Específicos por Archivo

### A. `src/components/ImagePositionPicker.tsx`
- Refactorizar el panel flotante para renderizarse mediante `createPortal` en `document.body`.
- Calcular la posición absoluta en pantalla utilizando las coordenadas (`getBoundingClientRect`) del botón activador.
- Añadir detección de bordes de la ventana (para evitar que se salga por los márgenes) y cierre al hacer clic fuera o pulsar Escape.
- Garantizar estilo `z-[9999]` para máxima prioridad visual en cualquier vista (tablas, tarjetas y modales).

### B. `src/components/AdminDashboard.tsx`
- **Reorganización del Modal de Galería (90vw × 90vh):**
  - Cambiar el contenedor a `w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col rounded-2xl`.
  - Encabezado fijo con título de sesión y botón de cierre.
  - Pie fijo con botones de acción ("Guardar Cambios" / "Crear Galería" y "Cancelar").
  - Contenido scrollable en dos columnas equilibradas:
    - **Columna izquierda:** Datos generales (Título, Cliente asignado, Fecha del evento, Estado, Privacidad y contraseña opcional).
    - **Columna derecha:** Portada de la galería (selector de imagen, previsualización en vivo, y herramienta de encuadre 3×3 integrada).
- **Encuadre en Tarjetas de Galería:**
  - Agregar botón de encuadre rápido en cada tarjeta de sesión en el listado de galerías del admin.
- **Función de Encuadre en Lote para la Galería:**
  - Añadir control en el inspector de fotos / barra de galería para aplicar una posición cardinal a todas las fotos existentes de la sesión activa (`handleBatchUpdateImagePosition`).
  - Sincronizar la actualización en lote tanto en el estado reactivo como en InstantDB.

### C. `src/components/GalleryView.tsx`
- Integrar el control de encuadre en lote directamente en la barra superior de acciones de la galería (accesible para el administrador/fotógrafo).
- Aplicar la actualización inmediata a todas las fotografías de la galería en pantalla.

---

## 3. Verificación y Pruebas
1. Abrir el modal de nueva galería y edición de galería: verificar que ocupe el 90% de la ventana tanto a lo ancho como a lo alto, con scroll suave y todos los campos accesibles.
2. Hacer clic en el botón de encuadre en fotos individuales (tabla del inspector y tarjetas de galería): confirmar que el panel flotante aparezca completo, sin cortes ni solapamientos.
3. Probar la herramienta de encuadre en la portada de la galería y verificar el cambio visual en la cabecera y tarjetas.
4. Ejecutar la función de aplicar encuadre en lote a todas las imágenes y comprobar que todas las fotos de la sesión adopten la alineación seleccionada.
5. Ejecutar linter y compilación (`compile_applet`) para garantizar cero errores de TypeScript.
