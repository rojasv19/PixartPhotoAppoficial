# Plan de Implementación: Restauración de Fotos y Portadas del Estudio & Blindaje de Base de Datos

## Resumen Ejecutivo
Solucionar de raíz el problema donde las fotografías y portadas de las galerías resultaron duplicadas o sobreescritas por una sola imagen al interactuar con el encuadre. Se implementará un mecanismo en el panel de administración para restaurar las fotos y portadas originales previas, se blindará la capa de mutaciones en InstantDB y almacenamiento local para que los ajustes de encuadre (`object-position`) operen de forma 100% aislada sobre coordenadas visuales sin tocar nunca URLs de imágenes ni archivos RAW, y se garantizará la recuperación íntegra de la colección del estudio.

---

## Decisiones Críticas y Confirmadas por el Usuario

> [!IMPORTANT]
> Decisiones confirmadas a través del proceso de aclaración con el usuario:
> - **Alcance del Problema:** Ocurrió en todas las galerías del estudio donde la misma fotografía quedó repetida en las posiciones y portadas.
> - **Acción de Recuperación:** Implementar una herramienta de restauración accesible desde el panel de administración ("Gestor") para recuperar las fotografías y portadas originales de cada galería.
> - **Protección Permanente:** Blindar las mutaciones de base de datos (`updateImagePositionInDb`, `updateGalleryCoverPositionInDb` y `batchUpdateImagePositionsInDb`) para aislar los campos de coordenadas y asegurar que los campos `url`, `highResUrl` y `coverImage` sean inmutables frente a cambios de encuadre.

---

## 1. Visión General & Concepto Central

- **Qué hace:** Proporciona un centro de recuperación y restauración en el panel de control del estudio (*AdminDashboard*) con opciones para:
  1. Restaurar las fotografías originales de cualquier galería o de todo el estudio con un solo clic.
  2. Restaurar la fotografía de portada original de cada sesión fotográfica.
  3. Previsualizar y verificar el catálogo completo de fotos antes y después de aplicar cualquier alineación.
  4. Garantizar que cambiar el encuadre (arriba, centro, abajo, etc.) solo altere la propiedad CSS / metadato de posición focal, sin reemplazar ni un solo byte de la URL de la imagen.
- **Audiencia:** Fotógrafos profesionales y administradores del estudio Pixart Photo que requieren total confiabilidad en sus sesiones fotográficas y seguridad de sus datos.
- **Valor Principal:** Integridad de datos absoluta: ningún ajuste estético o de encuadre podrá volver a sobreescribir las fotos del cliente ni la portada de la galería.

---

## 2. Experiencia de Usuario & Diseño Visual

### Flujos Principales
1. **Centro de Restauración en el Panel de Administración:**
   - En la pestaña de *Sesiones & Galerías*, cada tarjeta de galería contará con un botón de acción rápida *"Restaurar Portada & Fotos Originales"*.
   - En la cabecera del *Inspector de Almacenamiento & Fotos*, se habilitará un botón global *"Restaurar Catálogo de Fotos Originales"* con confirmación modal detallada.
2. **Selector de Encuadre Seguro e Independiente:**
   - El componente `ImagePositionPicker` mostrará con claridad que solo ajusta el punto focal visual (3×3) y emitirá exclusivamente el string de posición (`center`, `center-top`, etc.).
   - Tanto la portada como las fotos en la cuadrícula y en el lightbox actualizarán su `object-position` en tiempo real sin recargar ni alterar la fuente de la imagen (`src`).
3. **Modal de Edición de Galería:**
   - En el modal reorganizado de 90vw × 90vh, la sección de *Fotografía de Portada* incluirá un botón para restaurar la foto de portada predeterminada de la sesión si se desea revertir cualquier cambio accidental.

### Lenguaje Visual & Componentes
- Siguiendo la constitución de diseño para fotografía profesional:
  - **Lienzo:** Modo oscuro cinematográfico (`#0c0a09` / `stone-950`) y claro editorial (`#fafaf9`).
  - **Sin Pills Innecesarios:** Metadatos como conteo de fotos, resolución y tamaño RAW mostrados con separadores tipográficos limpios (`·`, `/`).
  - **Controles de Acción:** Botones contrastados con iconografía clara (`RotateCcw`, `ShieldCheck`, `Crosshair`) y estados hover bien definidos.

---

## 3. Decisiones de Producto & Trade-Offs

- **Decisión 1: Estrategia de Restauración:**
  - *Enfoque Elegido:* Proveer restauración selectiva (por sesión individual) y restauración global (para todo el catálogo del estudio), sincronizando inmediatamente en memoria, InstantDB y LocalStorage.
  - *Por qué:* Permite al fotógrafo corregir una sesión específica sin alterar las demás, o solucionar todo el catálogo de una sola vez si todas las galerías fueron afectadas.
- **Decisión 2: Separación de Mutaciones en la Capa de Datos:**
  - *Enfoque Elegido:* Prohibir llamadas completas a `updateImageInDb` o `updateGalleryInDb` durante eventos de encuadre. Solo se permitirán transacciones granulares `tx.images[id].update({ imagePosition })` y `tx.galleries[id].update({ coverImagePosition })`.
  - *Por qué:* Elimina la posibilidad física de que un objeto en memoria con una URL por defecto sobreescriba los datos persistidos en la base de datos remota.

---

## 4. Arquitectura Técnica & Estrategia de Datos

### Diagrama de Flujo y Aislamiento de Mutaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFAZ DE USUARIO                          │
│                                                                 │
│  [ImagePositionPicker]       [Botón Restaurar Fotos/Portada]    │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ Solo envía                    │ Solicita revertir
                │ "center-top", etc.            │ a catálogo original
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA CONTROLADORA (App.tsx)                  │
│                                                                 │
│  handleUpdateImagePosition()        handleRestoreOriginals()    │
│  - Actualiza SOLO imagePosition     - Reconstruye catálogo      │
│  - URLs quedan 100% intactas        - Sincroniza DB + Storage   │
└───────────────┬───────────────────────────────┬─────────────────┘
                │                               │
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            BASE DE DATOS & PERSISTENCIA (InstantDB)             │
│                                                                 │
│  tx.images[uuid].update({           tx.images / tx.galleries    │
│    imagePosition                     batch update con fotos     │
│  })                                  originales y portadas      │
└─────────────────────────────────────────────────────────────────┘
```

### Plan de Cambios Concretos
1. **`src/services/instantDbService.ts`**:
   - Crear función `restoreOriginalGalleryImages(galleryId?: string)` que reinserte de forma fidedigna las colecciones de fotos y portadas originales en InstantDB.
   - Proteger `updateGalleryInDb` y `updateImageInDb` para que nunca acepten campos `url` o `coverImage` vacíos o sobreescritos.
2. **`src/App.tsx`**:
   - Implementar `handleRestoreGalleryOriginals(galleryId?: string)` y distribuirla al *AdminDashboard* y *GalleryView*.
   - Corregir `handleBatchUpdateImagePosition` para que nunca mute el arreglo de imágenes local reemplazando URLs.
3. **`src/components/AdminDashboard.tsx`**:
   - Integrar botón de restauración de portada y fotos en las tarjetas de galería y en la tabla del inspector.
   - En el modal de edición de galería (90vw × 90vh), agregar opción explícita para resetear la portada al valor original.
4. **Verificación**:
   - Ejecutar `compile_applet` para asegurar compilación limpia sin errores de tipos TypeScript.
