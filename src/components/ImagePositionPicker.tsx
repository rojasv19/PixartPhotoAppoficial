import React, { useState, useRef, useEffect } from 'react';
import { 
  Crosshair, Move, ArrowUpLeft, ArrowUp, ArrowUpRight, 
  ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight,
  Check, Eye
} from 'lucide-react';

export type ImageCardinalPosition = 
  | 'left-top'
  | 'center-top'
  | 'right-top'
  | 'left-center'
  | 'center'
  | 'right-center'
  | 'left-bottom'
  | 'center-bottom'
  | 'right-bottom';

export const POSITION_MAP: Record<ImageCardinalPosition, { 
  id: ImageCardinalPosition;
  label: string; 
  objectPosition: string;
  coordX: string;
  coordY: string;
}> = {
  'left-top': { id: 'left-top', label: 'Arriba Izquierda', objectPosition: '0% 0%', coordX: '0%', coordY: '0%' },
  'center-top': { id: 'center-top', label: 'Centro Arriba', objectPosition: '50% 0%', coordX: '50%', coordY: '0%' },
  'right-top': { id: 'right-top', label: 'Arriba Derecha', objectPosition: '100% 0%', coordX: '100%', coordY: '0%' },
  'left-center': { id: 'left-center', label: 'Centro Izquierda', objectPosition: '0% 50%', coordX: '0%', coordY: '50%' },
  'center': { id: 'center', label: 'Centro', objectPosition: '50% 50%', coordX: '50%', coordY: '50%' },
  'right-center': { id: 'right-center', label: 'Centro Derecha', objectPosition: '100% 50%', coordX: '100%', coordY: '50%' },
  'left-bottom': { id: 'left-bottom', label: 'Abajo Izquierda', objectPosition: '0% 100%', coordX: '0%', coordY: '100%' },
  'center-bottom': { id: 'center-bottom', label: 'Centro Abajo', objectPosition: '50% 100%', coordX: '50%', coordY: '100%' },
  'right-bottom': { id: 'right-bottom', label: 'Abajo Derecha', objectPosition: '100% 100%', coordX: '100%', coordY: '100%' },
};

export function getImagePositionStyle(position?: string): string {
  if (!position) return '50% 50%';
  const match = POSITION_MAP[position as ImageCardinalPosition];
  if (match) return match.objectPosition;
  // If user passes custom CSS object-position string
  return position;
}

export function getImagePositionLabel(position?: string): string {
  if (!position) return 'Centro';
  const match = POSITION_MAP[position as ImageCardinalPosition];
  return match ? match.label : 'Personalizado';
}

interface ImagePositionPickerProps {
  value?: string;
  onChange: (position: string) => void;
  previewImageUrl?: string;
  label?: string;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export const ImagePositionPicker: React.FC<ImagePositionPickerProps> = ({
  value = 'center',
  onChange,
  previewImageUrl,
  label = 'Encuadre / Posición',
  theme = 'dark',
  compact = false,
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePosition: ImageCardinalPosition = (POSITION_MAP[value as ImageCardinalPosition] ? value : 'center') as ImageCardinalPosition;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const gridItems: { id: ImageCardinalPosition; label: string; icon: React.ReactNode }[] = [
    { id: 'left-top', label: 'Arriba Izquierda', icon: <ArrowUpLeft className="w-3.5 h-3.5" /> },
    { id: 'center-top', label: 'Centro Arriba', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'right-top', label: 'Arriba Derecha', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'left-center', label: 'Centro Izquierda', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'center', label: 'Centro', icon: <Circle className="w-3 h-3 fill-current" /> },
    { id: 'right-center', label: 'Centro Derecha', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'left-bottom', label: 'Abajo Izquierda', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'center-bottom', label: 'Centro Abajo', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'right-bottom', label: 'Abajo Derecha', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-xs ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/30'
            : isDark
            ? 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800 hover:border-stone-600'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
        }`}
        title="Configurar encuadre y posición de la imagen (Centro, Arriba, Abajo...)"
      >
        <Crosshair className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">{label}:</span>
        <span className="font-semibold text-blue-400">{getImagePositionLabel(activePosition)}</span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className={`absolute z-50 mt-2 p-3 rounded-2xl border shadow-2xl backdrop-blur-md w-72 animate-in fade-in zoom-in-95 duration-150 right-0 sm:right-auto sm:left-0 ${
          isDark ? 'bg-stone-950/95 border-stone-800 text-stone-100' : 'bg-white/95 border-slate-200 text-slate-800'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/60 mb-3">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold font-serif-display">Encuadre y Alineación</span>
            </div>
            <span className="text-[10px] font-mono-code text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-semibold">
              {getImagePositionLabel(activePosition)}
            </span>
          </div>

          {/* Live Preview Box with Focal Point Indicator */}
          {previewImageUrl && (
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  Vista previa de recorte
                </span>
                <span className="font-mono-code text-[9px] text-slate-500">
                  {POSITION_MAP[activePosition]?.coordX} {POSITION_MAP[activePosition]?.coordY}
                </span>
              </div>
              <div className="relative h-24 rounded-xl overflow-hidden border border-stone-800 bg-black/60 shadow-inner">
                <img
                  src={previewImageUrl}
                  alt="Encuadre"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{
                    objectPosition: getImagePositionStyle(activePosition),
                  }}
                />
                {/* 3x3 Overlay Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
                {/* Focal indicator crosshair badge */}
                <div 
                  className="absolute w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
                  style={{
                    left: POSITION_MAP[activePosition]?.coordX || '50%',
                    top: POSITION_MAP[activePosition]?.coordY || '50%',
                  }}
                />
              </div>
            </div>
          )}

          {/* 3x3 Cardinal Grid Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-stone-400 block">
              Selecciona el punto de interés (3×3):
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-stone-800/80">
              {gridItems.map((item) => {
                const isSelected = activePosition === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 scale-102 ring-1 ring-white/30'
                        : isDark
                        ? 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                    }`}
                    title={item.label}
                  >
                    <span className="mb-0.5">{item.icon}</span>
                    <span className="text-[8px] leading-tight text-center line-clamp-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-stone-800/60">
            <span className="text-[10px] text-stone-400 shrink-0">Rápidos:</span>
            <button
              type="button"
              onClick={() => onChange('center')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activePosition === 'center'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Centro
            </button>
            <button
              type="button"
              onClick={() => onChange('center-top')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activePosition === 'center-top'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Centro Arriba
            </button>
            <button
              type="button"
              onClick={() => onChange('center-bottom')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                activePosition === 'center-bottom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Centro Abajo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
