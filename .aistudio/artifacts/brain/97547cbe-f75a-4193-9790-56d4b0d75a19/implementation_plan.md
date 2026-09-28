# Plan de Implementación: Barra de Búsqueda Integrada en la Galería

## 1. Resumen Ejecutivo
Se implementará una barra de búsqueda visible y reactiva dentro de la barra de herramientas de la galería (`GalleryView.tsx`), ubicada junto a las pestañas de navegación (**"Todas"**, **"Favoritas"** y **"Selección Final"**). 

De acuerdo con las preferencias del usuario, la búsqueda filtrará de forma instantánea según:
1. **Título de la fotografía** (ej: *"Retrato Luis 01"*, *"Tomas ejecutivas"*).
2. **Nombre original del archivo** (ej: `DSC_0042.RAW`, `IMG_2026.jpg`).
3. **Número o índice de foto** (ej: buscar *"15"*, *"#15"*, o coincidencia numérica del orden de la sesión).
4. **Etiquetas / tags** (ej: `editorial`, `blanco y negro`, `destacada`, `Selección Final`).

---

## 2. Decisiones de Diseño y UX

- **Ubicación e Integración:**
  - Se integrará directamente en la barra sticky de herramientas (`GalleryView.tsx`), a la derecha de las pestañas o en un bloque flexible que conviva armónicamente tanto en computadoras de escritorio como en tablets y móviles.
  - Diseño minimalista y moderno acorde al tema activo (Dark mode `bg-[#181A1D]` / Light mode `bg-white`) con bordes sutiles, icono de lupa (`Search`), placeholder intuitivo y botón de limpieza rápida (`X`) cuando haya texto ingresado.
- **Filtrado Combinado:**
  - El buscador funcionará en combinación con la pestaña activa. Por ejemplo: si el cliente está en "Favoritas" y busca *"04"*, se filtrarán únicamente sus fotos favoritas que coincidan con *"04"*. Si está en "Todas", filtrará sobre la totalidad de la sesión.
- **Feedback Visual y Contador de Coincidencias:**
  - Si hay un término de búsqueda activo, se mostrará el número de resultados encontrados (ej: *"4 fotos encontradas"*).
  - Si no hay coincidencias, se mostrará un estado vacío estilizado con sugerencia y botón directo *"Restablecer búsqueda"*.

---

## 3. Módulos y Cambios Específicos

### `src/components/GalleryView.tsx`
1. **Nuevo Estado Local:**
   - `searchQuery: string`: almacena el texto ingresado en el buscador.
2. **Lógica de Filtrado Inteligente (`displayedImages`):**
   - Incorporar normalización insensible a mayúsculas y acentos.
   - Evaluar coincidencias contra:
     - `img.title`
     - `img.originalFileName`
     - `img.tags`
     - Índice / número de la fotografía en la sesión (ej: foto 1, foto 2, #05, etc.) y subcadenas numéricas.
3. **Componente de UI en el Toolbar:**
   - Renderizar el input de búsqueda con icono `Search` de Lucide, botón para borrar búsqueda rápida `X`, y atajo de teclado opcional (ESC para limpiar).
   - Ajustar el layout flexbox/grid para que en pantallas móviles se apile limpiamente y en escritorio se mantenga alineado junto a las pestañas y controles de cuadrícula.
4. **Estado Vacío para Búsquedas sin Coincidencias:**
   - Mensaje amigable con icono de búsqueda vacía y botón para limpiar el filtro.

---

## 4. Plan de Verificación

1. **Prueba de Filtrado en Tiempo Real:**
   - Escribir en la barra de búsqueda nombres de archivo (ej: `.jpg`, `.raw`), títulos o números.
   - Verificar que la grilla de imágenes responda en tiempo real sin latencia ni recargas.
2. **Prueba de Búsqueda Cruzada con Pestañas:**
   - Cambiar entre "Todas", "Favoritas" y "Selección Final" manteniendo un texto de búsqueda para comprobar que el filtrado respeta la categoría activa.
3. **Prueba de Interfaz Responsive y Limpieza:**
   - Probar el botón `X` de limpiar búsqueda y verificar que se restablece la vista completa.
   - Comprobar visualmente en modo oscuro y claro.
4. **Verificación de Compilación y Calidad:**
   - Ejecutar `lint_applet` (`tsc --noEmit`) para garantizar cero errores de TypeScript.
   - Ejecutar `compile_applet` para asegurar el build de producción en Vite.
