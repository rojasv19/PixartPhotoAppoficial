# Plan de Implementación: Sistema Universal de Tipografía Google Fonts y Sincronización en la Nube

## 1. Diagnóstico del Problema de Sincronización Multidispositivo
- **Causa raíz:** Actualmente, las configuraciones de diseño y personalización de marca en `src/services/brandingService.ts` y `src/App.tsx` solo se guardaban en el `localStorage` del navegador local (`somos_pixart_branding_v3`), sin persistir en la base de datos InstantDB.
- **Solución:**
  1. Agregar la entidad `studioSettings` en el esquema de InstantDB (`src/lib/instant.ts`).
  2. Implementar funciones `saveBrandingToDb` y escucha en tiempo real en `App.tsx`.
  3. De esta forma, cuando un administrador cambie fuentes, colores, tamaños o textos en cualquier ordenador, el cambio se reflejará al instante en todos los dispositivos y usuarios.

---

## 2. Catálogo Dinámico de Google Fonts con Actualización en Tiempo Real
- **Servicio `src/services/googleFontsService.ts`:**
  - Base de datos categorizada con las fuentes más reconocidas y versátiles de Google Fonts (Serif, Sans-serif, Display, Handwriting, Monospace: *Playfair Display, Montserrat, Cormorant Garamond, Inter, Roboto, Poppins, Cinzel, Outfit, Plus Jakarta Sans, Syne, Great Vibes, Dancing Script, Space Grotesk*, etc.).
  - Función de **carga bajo demanda (`loadGoogleFont`)**: Inyecta dinámicamente el stylesheet de Google Fonts en el `<head>` del documento al seleccionar o previsualizar una fuente.
  - Buscador dinámico de fuentes con posibilidad de buscar cualquier fuente del catálogo oficial de Google Fonts en tiempo real con previsualización tipográfica en vivo.

---

## 3. Inspector / Barra Flotante de Formato Tipográfico
- **Componente `TypographyInspector` / `TypographyControl`:**
  - **Selector de Familia Tipográfica:** Buscador con chips de categoría (Serif, Sans, Elegante, Display, Cursiva, Mono), previsualización de muestra y carga instantánea.
  - **Tamaño de Fuente:** Selector numérico con botones +/- y opciones predefinidas (de 10px a 72px).
  - **Grosor / Peso (Weight):** Light (300), Regular (400), Medium (500), Semibold (600), Bold (700), Black (900).
  - **Color de Texto:** Paleta rápida de colores del estudio + selector HEX personalizado con soporte de contraste.
  - **Espaciado y Alineación:** Interletreado (tracking), interlineado (leading), alineación (izquierda, centro, derecha) y transformación (mayúsculas, minúsculas, normal).
- **Integración en campos editables:**
  - En la configuración de identidad y marca (`AdminBrandingSettings.tsx`): Estilos tipográficos para títulos de galería, subtítulos, textos de modales, avisos y sellos de marca de agua.
  - En edición y creación de sesiones (`GalleryModal` / `AdminDashboard.tsx`): Tipografía personalizada para títulos y descripciones de álbumes.
  - En el inspector de textos generales del estudio.

---

## 4. Plan de Ejecución Paso a Paso
1. **Paso 1: Persistencia en la Nube (InstantDB)**
   - Actualizar `src/lib/instant.ts` con la entidad `studioSettings`.
   - Crear funciones `saveBrandingConfigToDb` y `fetchBrandingConfigFromDb` en `src/services/instantDbService.ts`.
   - Conectar la sincronización bidireccional en `src/App.tsx`.
2. **Paso 2: Servicio Google Fonts & Inyección Dinámica**
   - Implementar `src/services/googleFontsService.ts` con catálogo dinámico, categorías y carga automática en `<head>`.
3. **Paso 3: Componente de Formato Tipográfico (Inspector / Popover)**
   - Crear `src/components/TypographyControl.tsx` con soporte para fuente Google, tamaño, color, alineación y peso.
4. **Paso 4: Integración en Pantallas Editables**
   - Integrar en `AdminBrandingSettings.tsx` (títulos, subtítulos, botones, textos de modales y marca de agua).
   - Integrar en `AdminDashboard.tsx` (sesiones y galerías).
   - Aplicar dinámicamente las fuentes en `GalleryView.tsx` y en el portal público.
5. **Paso 5: Pruebas y Verificación**
   - Verificar compilación con `compile_applet` y linter con `lint_applet`.
   - Probar carga dinámica de fuentes y persistencia en InstantDB.
