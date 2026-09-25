import React from 'react';
import { TypographyStyle } from '../types';

export interface GoogleFontMeta {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants: string[];
  subsets?: string[];
  popularRank?: number;
  previewSample?: string;
}

// Curated collection of the most popular and versatile Google Fonts
export const POPULAR_GOOGLE_FONTS: GoogleFontMeta[] = [
  // Sans-serif
  { family: 'Plus Jakarta Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'Inter', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800', '900'] },
  { family: 'Montserrat', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800', '900'] },
  { family: 'Poppins', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800', '900'] },
  { family: 'Roboto', category: 'sans-serif', variants: ['300', '400', '500', '700', '900'] },
  { family: 'Open Sans', category: 'sans-serif', variants: ['300', '400', '600', '700', '800'] },
  { family: 'Lato', category: 'sans-serif', variants: ['300', '400', '700', '900'] },
  { family: 'Raleway', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'Outfit', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'DM Sans', category: 'sans-serif', variants: ['400', '500', '700'] },
  { family: 'Nunito', category: 'sans-serif', variants: ['300', '400', '600', '700', '800'] },
  { family: 'Work Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Manrope', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'Urbanist', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'Oswald', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Syne', category: 'sans-serif', variants: ['400', '500', '600', '700', '800'] },
  { family: 'Quicksand', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Cabin', category: 'sans-serif', variants: ['400', '500', '600', '700'] },
  { family: 'Barlow', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Rubik', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { family: 'Jost', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Figtree', category: 'sans-serif', variants: ['300', '400', '500', '600', '700'] },

  // Serif
  { family: 'Playfair Display', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'] },
  { family: 'Cormorant Garamond', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Cinzel', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'] },
  { family: 'Merriweather', category: 'serif', variants: ['300', '400', '700', '900'] },
  { family: 'Lora', category: 'serif', variants: ['400', '500', '600', '700'] },
  { family: 'EB Garamond', category: 'serif', variants: ['400', '500', '600', '700', '800'] },
  { family: 'Prata', category: 'serif', variants: ['400'] },
  { family: 'Bodoni Moda', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'] },
  { family: 'Castoro', category: 'serif', variants: ['400'] },
  { family: 'Marcellus', category: 'serif', variants: ['400'] },
  { family: 'Cinzel Decorative', category: 'serif', variants: ['400', '700', '900'] },
  { family: 'Spectral', category: 'serif', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Fraunces', category: 'serif', variants: ['300', '400', '500', '600', '700', '800', '900'] },
  { family: 'Cinzel', category: 'serif', variants: ['400', '600', '700'] },
  { family: 'Baskervville', category: 'serif', variants: ['400'] },
  { family: 'Italiana', category: 'serif', variants: ['400'] },
  { family: 'DM Serif Display', category: 'serif', variants: ['400'] },
  { family: 'Libre Baskerville', category: 'serif', variants: ['400', '700'] },
  { family: 'Cormorant Upright', category: 'serif', variants: ['300', '400', '500', '600', '700'] },

  // Display
  { family: 'Abril Fatface', category: 'display', variants: ['400'] },
  { family: 'Bebas Neue', category: 'display', variants: ['400'] },
  { family: 'Righteous', category: 'display', variants: ['400'] },
  { family: 'Alfa Slab One', category: 'display', variants: ['400'] },
  { family: 'Comfortaa', category: 'display', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Lobster', category: 'display', variants: ['400'] },
  { family: 'Fredoka', category: 'display', variants: ['300', '400', '500', '600', '700'] },
  { family: 'Caveat', category: 'display', variants: ['400', '500', '600', '700'] },
  { family: 'Shrikhand', category: 'display', variants: ['400'] },
  { family: 'Chonburi', category: 'display', variants: ['400'] },
  { family: 'Staatliches', category: 'display', variants: ['400'] },
  { family: 'Monoton', category: 'display', variants: ['400'] },

  // Handwriting & Script
  { family: 'Great Vibes', category: 'handwriting', variants: ['400'] },
  { family: 'Dancing Script', category: 'handwriting', variants: ['400', '500', '600', '700'] },
  { family: 'Pacifico', category: 'handwriting', variants: ['400'] },
  { family: 'Alex Brush', category: 'handwriting', variants: ['400'] },
  { family: 'Sacramento', category: 'handwriting', variants: ['400'] },
  { family: 'Allura', category: 'handwriting', variants: ['400'] },
  { family: 'Satisfy', category: 'handwriting', variants: ['400'] },
  { family: 'Parisienne', category: 'handwriting', variants: ['400'] },
  { family: 'Marck Script', category: 'handwriting', variants: ['400'] },
  { family: 'Homemade Apple', category: 'handwriting', variants: ['400'] },
  { family: 'Kalam', category: 'handwriting', variants: ['300', '400', '700'] },
  { family: 'Yellowtail', category: 'handwriting', variants: ['400'] },
  { family: 'Pinyon Script', category: 'handwriting', variants: ['400'] },

  // Monospace
  { family: 'Space Mono', category: 'monospace', variants: ['400', '700'] },
  { family: 'Fira Code', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
  { family: 'JetBrains Mono', category: 'monospace', variants: ['300', '400', '500', '700'] },
  { family: 'Roboto Mono', category: 'monospace', variants: ['300', '400', '500', '700'] },
  { family: 'Source Code Pro', category: 'monospace', variants: ['300', '400', '600', '700'] },
  { family: 'IBM Plex Mono', category: 'monospace', variants: ['300', '400', '500', '700'] },
];

const loadedFontsSet = new Set<string>();

/**
 * Loads a Google Font dynamically into document head.
 * Ensures font is fetched only once and renders in high quality.
 */
export function loadGoogleFont(fontFamily: string, weights: (string | number)[] = ['300', '400', '500', '600', '700', '800']): void {
  if (!fontFamily || typeof document === 'undefined') return;
  
  const cleanFamily = fontFamily.trim().replace(/^['"]|['"]$/g, '');
  
  // Standard web safe fonts don't need Google Fonts injection
  const webSafe = ['inherit', 'sans-serif', 'serif', 'monospace', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
  if (webSafe.includes(cleanFamily)) return;

  const fontKey = cleanFamily.toLowerCase();
  if (loadedFontsSet.has(fontKey)) return;

  try {
    const formattedFamily = cleanFamily.replace(/\s+/g, '+');
    const weightParam = weights && weights.length > 0
      ? `:ital,wght@0,${weights.join(';0,')}`
      : ':wght@300;400;500;600;700;800';

    const url = `https://fonts.googleapis.com/css2?family=${formattedFamily}${weightParam}&display=swap`;
    
    // Check if link tag already exists
    const existingLink = document.querySelector(`link[data-font="${cleanFamily}"]`);
    if (existingLink) {
      loadedFontsSet.add(fontKey);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-font', cleanFamily);
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    loadedFontsSet.add(fontKey);
  } catch (error) {
    console.warn(`Could not load Google Font: ${cleanFamily}`, error);
  }
}

/**
 * Preload an array of font families (e.g. at app startup)
 */
export function preloadFonts(fontFamilies: (string | undefined | null)[]): void {
  fontFamilies.forEach(family => {
    if (family) loadGoogleFont(family);
  });
}

/**
 * Searches the Google Fonts catalogue. If user types a novel Google font name,
 * dynamically includes it in results and prepares dynamic loading.
 */
export function searchGoogleFonts(
  query: string, 
  categoryFilter?: 'all' | 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
): GoogleFontMeta[] {
  const cleanQuery = query.trim().toLowerCase();

  let results = POPULAR_GOOGLE_FONTS.filter(font => {
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || font.category === categoryFilter;
    const matchesQuery = !cleanQuery || font.family.toLowerCase().includes(cleanQuery);
    return matchesCategory && matchesQuery;
  });

  // If query is specific and not found in curated list, allow dynamic font entry!
  if (cleanQuery && cleanQuery.length > 2) {
    const exactMatch = results.some(f => f.family.toLowerCase() === cleanQuery);
    if (!exactMatch) {
      // Capitalize user query words to format as Google Font name
      const customTitle = query
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      const dynamicEntry: GoogleFontMeta = {
        family: customTitle,
        category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : 'sans-serif',
        variants: ['400', '700'],
      };
      results = [dynamicEntry, ...results];
    }
  }

  return results;
}

/**
 * Converts a TypographyStyle object into a React CSSProperties object.
 */
export function typographyToStyle(typography?: TypographyStyle): React.CSSProperties {
  if (!typography) return {};

  const style: React.CSSProperties = {};

  if (typography.fontFamily) {
    const family = typography.fontFamily.trim();
    // Dynamically trigger font load when style is computed
    loadGoogleFont(family);
    style.fontFamily = `"${family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  }

  if (typography.fontSize) {
    style.fontSize = typography.fontSize;
  }

  if (typography.fontWeight) {
    style.fontWeight = typography.fontWeight as any;
  }

  if (typography.color) {
    style.color = typography.color;
  }

  if (typography.letterSpacing) {
    style.letterSpacing = typography.letterSpacing;
  }

  if (typography.lineHeight) {
    style.lineHeight = typography.lineHeight;
  }

  if (typography.textTransform) {
    style.textTransform = typography.textTransform;
  }

  if (typography.fontStyle) {
    style.fontStyle = typography.fontStyle;
  }

  if (typography.textDecoration) {
    style.textDecoration = typography.textDecoration;
  }

  if (typography.textAlign) {
    style.textAlign = typography.textAlign;
  }

  return style;
}
