import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, Search, Check, RotateCcw, ChevronDown, 
  AlignLeft, AlignCenter, AlignRight, Italic, 
  Underline, Sparkles, X, Palette
} from 'lucide-react';
import { TypographyStyle } from '../types';
import { 
  searchGoogleFonts, 
  loadGoogleFont, 
  typographyToStyle, 
  GoogleFontMeta 
} from '../services/googleFontsService';

interface TypographyControlProps {
  label?: string;
  value?: TypographyStyle;
  onChange: (newStyle: TypographyStyle) => void;
  sampleText?: string;
  theme?: 'light' | 'dark';
  compact?: boolean; // If true, shows a button that opens a floating popover
  allowAlignment?: boolean;
}

export const TypographyControl: React.FC<TypographyControlProps> = ({
  label = 'Estilo Tipográfico',
  value = {},
  onChange,
  sampleText = 'The quick brown fox jumps over the lazy dog — 0123456789',
  theme = 'dark',
  compact = true,
  allowAlignment = true,
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(!compact);
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategory, setFontCategory] = useState<'all' | 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'>('all');
  const [showFontList, setShowFontList] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentFamily = value.fontFamily || 'Plus Jakarta Sans';
  const currentSizeNum = parseInt(value.fontSize || '16', 10) || 16;
  const currentWeight = value.fontWeight || '400';
  const currentColor = value.color || (isDark ? '#f8fafc' : '#0f172a');
  const currentTracking = value.letterSpacing || 'normal';
  const currentTransform = value.textTransform || 'none';
  const isItalic = value.fontStyle === 'italic';
  const isUnderline = value.textDecoration === 'underline';
  const currentAlign = value.textAlign || 'left';

  // Ensure current font is loaded
  useEffect(() => {
    if (currentFamily) {
      loadGoogleFont(currentFamily);
    }
  }, [currentFamily]);

  // Close floating popover when clicking outside
  useEffect(() => {
    if (!compact) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFontList(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, compact]);

  const filteredFonts = searchGoogleFonts(fontSearch, fontCategory);

  const handleUpdate = (updates: Partial<TypographyStyle>) => {
    const updated: TypographyStyle = {
      ...value,
      ...updates,
    };
    onChange(updated);
  };

  const handleSelectFont = (font: GoogleFontMeta) => {
    loadGoogleFont(font.family, font.variants);
    handleUpdate({ fontFamily: font.family });
    setShowFontList(false);
  };

  const handleReset = () => {
    onChange({});
  };

  const colorPresets = [
    '#ffffff', '#f8fafc', '#94a3b8', '#3b82f6', '#6366f1', 
    '#8b5cf6', '#d946ef', '#f43f5e', '#ef4444', '#f59e0b', 
    '#10b981', '#06b6d4', '#1e293b', '#000000'
  ];

  const content = (
    <div className={`p-4 rounded-2xl border space-y-4 text-xs ${
      isDark ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
    } ${compact ? 'w-84 sm:w-96 shadow-2xl max-h-[85vh] overflow-y-auto' : 'w-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-800/60">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            title="Restablecer valores por defecto"
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {compact && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Font Family Selector with Google Fonts Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-stone-400 block">
          Familia Tipográfica (Google Fonts)
        </label>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontList(!showFontList)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left font-medium transition-colors ${
              isDark ? 'bg-stone-950 border-stone-800 hover:border-stone-700' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span 
                className="text-sm truncate font-semibold"
                style={{ fontFamily: `"${currentFamily}", sans-serif` }}
              >
                {currentFamily}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono-code shrink-0">
                Google
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
          </button>

          {showFontList && (
            <div className={`absolute z-50 left-0 right-0 top-full mt-1 rounded-2xl border shadow-2xl p-2 space-y-2 ${
              isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-white border-slate-200 text-slate-800'
            } max-h-72 flex flex-col`}>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar fuente de Google..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                    isDark ? 'bg-stone-900 border-stone-800 text-white placeholder-stone-500 focus:border-amber-400' : 'bg-slate-100 border-slate-300 placeholder-slate-400 focus:border-blue-500'
                  }`}
                  autoFocus
                />
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] shrink-0 no-scrollbar">
                {(['all', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFontCategory(cat)}
                    className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors ${
                      fontCategory === cat
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : isDark ? 'bg-stone-900 text-stone-400 hover:text-stone-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>

              {/* Fonts List */}
              <div className="overflow-y-auto flex-1 divide-y divide-stone-800/40 space-y-0.5">
                {filteredFonts.map((font) => {
                  const isSelected = font.family === currentFamily;
                  return (
                    <button
                      key={font.family}
                      type="button"
                      onMouseEnter={() => loadGoogleFont(font.family)}
                      onClick={() => handleSelectFont(font)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : isDark ? 'hover:bg-stone-900 text-stone-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <p 
                          className="text-sm truncate" 
                          style={{ fontFamily: `"${font.family}", sans-serif` }}
                        >
                          {font.family}
                        </p>
                        <span className="text-[9px] text-stone-500 capitalize">{font.category}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}

                {filteredFonts.length === 0 && (
                  <div className="py-4 text-center text-xs text-stone-500">
                    No se encontraron fuentes. Escribe el nombre exacto de la fuente de Google para cargarla.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Font Size & Weight Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Size */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-400 flex items-center justify-between">
            <span>Tamaño</span>
            <span className="font-mono-code font-bold text-amber-400">{currentSizeNum}px</span>
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: `${Math.max(10, currentSizeNum - 1)}px` })}
              className={`p-1.5 rounded-lg border font-bold text-xs ${
                isDark ? 'bg-stone-950 border-stone-800 hover:bg-stone-800' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
              }`}
            >
              -
            </button>
            <input
              type="range"
              min="10"
              max="72"
              value={currentSizeNum}
              onChange={(e) => handleUpdate({ fontSize: `${e.target.value}px` })}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleUpdate({ fontSize: `${Math.min(100, currentSizeNum + 1)}px` })}
              className={`p-1.5 rounded-lg border font-bold text-xs ${
                isDark ? 'bg-stone-950 border-stone-800 hover:bg-stone-800' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-stone-400 block">
            Grosor (Peso)
          </label>
          <select
            value={currentWeight}
            onChange={(e) => handleUpdate({ fontWeight: e.target.value })}
            className={`w-full py-1.5 px-2 rounded-xl border text-xs outline-none ${
              isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semibold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
      </div>

      {/* Color Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Color de la Tipografía</span>
          </label>
          <span className="font-mono-code text-[10px] text-stone-400">{currentColor}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {colorPresets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleUpdate({ color })}
              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${
                currentColor.toLowerCase() === color.toLowerCase() 
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900 scale-110 border-white' 
                  : 'border-stone-700/50'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}

          {/* Custom color input */}
          <label 
            title="Seleccionar color personalizado" 
            className="w-5 h-5 rounded-full border border-dashed border-stone-600 flex items-center justify-center cursor-pointer hover:border-amber-400 relative overflow-hidden"
          >
            <input
              type="color"
              value={currentColor.startsWith('#') ? currentColor : '#ffffff'}
              onChange={(e) => handleUpdate({ color: e.target.value })}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
            <Sparkles className="w-3 h-3 text-amber-400" />
          </label>
        </div>
      </div>

      {/* Style, Spacing & Align Toolbar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/60">
        
        {/* Style Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleUpdate({ fontStyle: isItalic ? 'normal' : 'italic' })}
            className={`p-1.5 rounded-lg border transition-colors ${
              isItalic 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : isDark ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
            title="Cursiva (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleUpdate({ textDecoration: isUnderline ? 'none' : 'underline' })}
            className={`p-1.5 rounded-lg border transition-colors ${
              isUnderline 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : isDark ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
            title="Subrayado"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Transform */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleUpdate({ textTransform: currentTransform === 'uppercase' ? 'none' : 'uppercase' })}
            className={`px-2 py-1 rounded-lg border font-mono-code font-bold text-[10px] transition-colors ${
              currentTransform === 'uppercase'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : isDark ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
            title="MAYÚSCULAS"
          >
            AA
          </button>

          <button
            type="button"
            onClick={() => handleUpdate({ textTransform: currentTransform === 'capitalize' ? 'none' : 'capitalize' })}
            className={`px-2 py-1 rounded-lg border font-mono-code font-bold text-[10px] transition-colors ${
              currentTransform === 'capitalize'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : isDark ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
            title="Capitalizar Palabras"
          >
            Aa
          </button>
        </div>

        {/* Alignment */}
        {allowAlignment && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleUpdate({ textAlign: 'left' })}
              className={`p-1.5 rounded-lg border transition-colors ${
                currentAlign === 'left'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ textAlign: 'center' })}
              className={`p-1.5 rounded-lg border transition-colors ${
                currentAlign === 'center'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdate({ textAlign: 'right' })}
              className={`p-1.5 rounded-lg border transition-colors ${
                currentAlign === 'right'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : isDark ? 'bg-stone-950 border-stone-800 text-stone-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Letter Spacing (Tracking) */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-stone-400 block">
          Interletreado (Tracking)
        </label>
        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono-code">
          {[
            { label: 'Normal', value: 'normal' },
            { label: 'Ajustado', value: '-0.025em' },
            { label: 'Amplio', value: '0.05em' },
            { label: 'Expandido', value: '0.15em' },
          ].map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleUpdate({ letterSpacing: opt.value })}
              className={`py-1 rounded-lg border transition-colors ${
                currentTracking === opt.value
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                  : isDark ? 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-1 pt-2 border-t border-stone-800/60">
        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
          Vista Previa en Vivo
        </span>
        <div className={`p-3 rounded-xl border overflow-hidden ${
          isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div 
            style={typographyToStyle(value)}
            className="transition-all duration-150 break-words"
          >
            {sampleText}
          </div>
        </div>
      </div>

    </div>
  );

  if (!compact) {
    return content;
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          isOpen
            ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md'
            : isDark 
              ? 'bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-400 hover:text-amber-300' 
              : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'
        }`}
        title={`Editar estilo y tipografía de: ${label}`}
      >
        <Type className="w-3.5 h-3.5 text-amber-400" />
        <span className="max-w-[120px] truncate">{value.fontFamily || 'Tipografía'}</span>
        {value.fontSize && (
          <span className="text-[10px] opacity-75 font-mono-code">{value.fontSize}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-2">
          {content}
        </div>
      )}
    </div>
  );
};
