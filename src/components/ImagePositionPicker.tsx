import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Crosshair, Move, ArrowUpLeft, ArrowUp, ArrowUpRight, 
  ArrowLeft, Circle, ArrowRight, ArrowDownLeft, ArrowDown, ArrowDownRight,
  Eye, X, CheckCheck
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
  onApplyToAll?: (position: string) => void;
  previewImageUrl?: string;
  label?: string;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export const ImagePositionPicker: React.FC<ImagePositionPickerProps> = ({
  value = 'center',
  onChange,
  onApplyToAll,
  previewImageUrl,
  label = 'Encuadre',
  theme = 'dark',
  compact = false,
}) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activePosition: ImageCardinalPosition = (POSITION_MAP[value as ImageCardinalPosition] ? value : 'center') as ImageCardinalPosition;

  // Calculate dynamic viewport coordinates for Portal mounting
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 310;
    const popoverHeight = onApplyToAll ? 440 : 380;
    
    // Horizontal positioning: align with button left or right, clamped to viewport
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    // Vertical positioning: default below trigger, flip up if close to bottom
    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight - 12) {
      const topFlipped = rect.top - popoverHeight - 8;
      if (topFlipped >= 12) {
        top = topFlipped;
      } else {
        // Fallback: clamp within screen
        top = Math.max(12, window.innerHeight - popoverHeight - 12);
      }
    }

    setCoords({ top, left });
  }, [onApplyToAll]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleWindowResize = () => {
      updatePosition();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const gridItems: { id: ImageCardinalPosition; label: string; icon: React.ReactNode }[] = [
    { id: 'left-top', label: 'Arriba Izquierda', icon: <ArrowUpLeft className="w-3.5 h-3.5" /> },
    { id: 'center-top', label: 'Centro Arriba', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { id: 'right-top', label: 'Arriba Derecha', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { id: 'left-center', label: 'Centro Izquierda', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'center', label: 'Centro', icon: <Circle className="w-2.5 h-2.5 fill-current" /> },
    { id: 'right-center', label: 'Centro Derecha', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'left-bottom', label: 'Abajo Izquierda', icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: 'center-bottom', label: 'Centro Abajo', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { id: 'right-bottom', label: 'Abajo Derecha', icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Trigger Button (stays in regular layout flow) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer select-none shadow-xs ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5'
        } ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/30'
            : isDark
            ? 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800 hover:border-stone-600'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
        }`}
        title="Configurar encuadre y alineación de la imagen (Centro, Arriba, Abajo...)"
      >
        <Crosshair className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        {!compact && <span className="hidden sm:inline">{label}:</span>}
        <span className="font-semibold text-blue-400 truncate max-w-[100px]">
          {getImagePositionLabel(activePosition)}
        </span>
      </button>

      {/* Floating Popover rendered through React Portal to document.body (Never clipped by tables or overflow:hidden) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99990] flex items-start justify-start pointer-events-auto">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/25 backdrop-blur-[1px] transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />

          {/* Floating Popper Panel */}
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '310px',
            }}
            className={`z-[99999] p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none ${
              isDark 
                ? 'bg-stone-950/98 border-stone-800 text-stone-100 shadow-black/80' 
                : 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/20'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/60 mb-3">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold font-serif-display block">Alineación y Encuadre</span>
                  <span className="text-[10px] text-stone-400 block font-normal">Define el punto focal de la imagen</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Preview Box with Focal Point Indicator */}
            {previewImageUrl && (
              <div className="mb-3 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Eye className="w-3 h-3 text-blue-400" />
                    Vista previa del recorte
                  </span>
                  <span className="font-mono-code text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded font-semibold">
                    {getImagePositionLabel(activePosition)}
                  </span>
                </div>
                <div className="relative h-28 rounded-xl overflow-hidden border border-stone-800 bg-black/80 shadow-inner">
                  <img
                    src={previewImageUrl}
                    alt="Encuadre"
                    className="w-full h-full object-cover transition-all duration-300"
                    style={{
                      objectPosition: getImagePositionStyle(activePosition),
                    }}
                  />
                  {/* 3x3 Overlay Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
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
                    className="absolute w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ring-2 ring-blue-400/40"
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
                Selecciona la orientación deseada (3×3):
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-black/40 border border-stone-800">
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
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40 scale-102 ring-1 ring-white/40'
                          : isDark
                          ? 'bg-stone-900/90 text-stone-300 hover:bg-stone-800 hover:text-white'
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
                    ? 'bg-blue-600 text-white font-bold'
                    : isDark ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => onChange('center-top')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  activePosition === 'center-top'
                    ? 'bg-blue-600 text-white font-bold'
                    : isDark ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Arriba
              </button>
              <button
                type="button"
                onClick={() => onChange('center-bottom')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  activePosition === 'center-bottom'
                    ? 'bg-blue-600 text-white font-bold'
                    : isDark ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Abajo
              </button>
            </div>

            {/* Optional: Batch Apply to All Photos */}
            {onApplyToAll && (
              <div className="pt-2.5 mt-2.5 border-t border-stone-800/60">
                <button
                  type="button"
                  onClick={() => {
                    onApplyToAll(activePosition);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md cursor-pointer transition-all"
                  title="Aplica este encuadre a todas las fotos existentes de esta galería"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Aplicar a todas las fotos de esta galería</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
