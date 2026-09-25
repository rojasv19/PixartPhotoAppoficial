# Plan de Implementación: Flujo de Favoritas Pendientes, Marcado Masivo y Gestión de Completadas

## 1. Resumen de Requerimientos
- **Bandeja de Pendientes por Defecto:**
  - En la sección "Selección de Favoritas", la vista predeterminada mostrará **únicamente las fotos pendientes** de retoque.
  - Al presionar el botón **"✅ Listo"** en una foto individual, ésta se actualiza como completada y **se elimina inmediatamente** de la sección de pendientes.
- **Botón de Marcado Masivo con Modal de Confirmación:**
  - Agregar un botón prominente *"Marcar todas como listas"* en la barra de herramientas.
  - Al hacer clic, abre una ventana modal de confirmación con el conteo de fotos a procesar antes de aplicar la acción.
- **Pestaña de Completadas & Gestión de Limpieza:**
  - Pestaña para consultar las fotos completadas / listas cuando sea necesario.
  - **Limpieza masiva:** Botón con confirmación para limpiar/vaciar todo el historial de completadas.
  - **Eliminación individual:** Opción en cada foto de la pestaña completadas para eliminarla o desmarcarla una por una (además de opción para reactivar a pendientes si fue un error).

---

## 2. Modificaciones en Componentes

### A. Vista de Favoritas del Administrador (`src/components/AdminFavoritesView.tsx`)
1. **Estado de Pestañas de Trabajo (`pending` vs `completed` vs `all`):**
   - Cambiar el estado inicial del filtro para que por defecto sea `'pending'`.
   - Crear un selector de pestañas moderno en la parte superior:
     - `⏳ Pendientes (X)` (activa por defecto).
     - `✅ Completadas (Y)`.
     - `📁 Todas (Z)`.
2. **Acción Individual "Listo":**
   - Al marcar `"Listo"` (`completed`), la imagen se archiva y sale de la vista activa de pendientes en tiempo real.
   - Se muestra un toast o notificación temporal con botón para revertir/deshacer.
3. **Modal de Confirmación para "Marcar Todas como Listas":**
   - Estado: `showBatchCompleteModal: boolean`.
   - Modal con diseño limpio:
     - Título: *"Confirmar Marcado de Fotos como Listas"*.
     - Mensaje: *"¿Deseas marcar las {count} fotografías pendientes actuales como completadas? Pasarán a la pestaña de completadas."*
     - Botones: *"Cancelar"* y *"Confirmar y Marcar Todas"*.
   - Ejecuta la actualización de estado para todas las fotos filtradas actuales y sincroniza con `onUpdateImage`.
4. **Pestaña de Completadas:**
   - Botón *"Limpiar Completadas"* en la barra superior:
     - Abre modal de confirmación: *"¿Deseas limpiar las {count} fotos completadas del historial?"*.
     - Al confirmar, remueve las marcas de favoritas o archiva las entradas.
   - En cada tarjeta de foto completada:
     - Botón *"Quitar de favoritas"* (icono papelera/cruz) para eliminarla individualmente.
     - Botón *"Mover a pendientes"* (icono rehacer/flecha) para devolver la foto al flujo de trabajo si el cliente solicita un nuevo retoque.

---

## 3. Plan de Verificación
1. **Verificación de Vista por Defecto:**
   - Abrir "Selección de Favoritas" y comprobar que por defecto solo se muestran fotos con estado `pending` o `in_progress`.
2. **Prueba de "Listo" Individual:**
   - Hacer clic en "Listo" en una foto y verificar que desaparece de inmediato de la bandeja de pendientes y suma al contador de completadas.
3. **Prueba de "Marcar Todas como Listas":**
   - Hacer clic en el botón masivo y verificar que se despliega la ventana modal de confirmación.
   - Al confirmar, verificar que todas las fotos pendientes pasan a la pestaña de completadas y la bandeja queda limpia.
4. **Prueba en Pestaña de Completadas:**
   - Entrar a la pestaña "Completadas".
   - Probar eliminar una foto completada individualmente.
   - Probar el botón de limpiar todas las completadas con su confirmación.
5. **Verificación de Compilación y Linter:**
   - Ejecutar `lint_applet` y `compile_applet` asegurando cero errores.
