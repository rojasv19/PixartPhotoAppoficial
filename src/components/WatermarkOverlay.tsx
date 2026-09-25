import React from 'react';

interface WatermarkOverlayProps {
  watermarkEnabled?: boolean;
  excludeWatermark?: boolean;
  watermarkType?: 'text' | 'image';
  watermarkText?: string;
  watermarkImageUrl?: string;
  watermarkPosition?: 'center' | 'repeated';
  watermarkOpacity?: number;
  className?: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  watermarkEnabled,
  excludeWatermark,
  watermarkType = 'text',
  watermarkText = 'SOMOS PIXART',
  watermarkImageUrl,
  watermarkPosition = 'center',
  watermarkOpacity = 0.4,
  className = '',
}) => {
  // If not enabled or explicitly excluded for this photo, render nothing
  if (!watermarkEnabled || excludeWatermark) {
    return null;
  }

  const opacityValue = watermarkOpacity ?? 0.4;
  const safeText = (watermarkText || 'SOMOS PIXART').trim();

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none z-10 overflow-hidden flex items-center justify-center ${className}`}
      style={{ opacity: opacityValue }}
      aria-hidden="true"
    >
      {watermarkType === 'image' && watermarkImageUrl ? (
        watermarkPosition === 'repeated' ? (
          // Repeated image pattern
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${watermarkImageUrl})`,
              backgroundRepeat: 'repeat',
              backgroundSize: '140px auto',
              backgroundPosition: 'center',
              transform: 'rotate(-15deg) scale(1.3)',
            }}
          />
        ) : (
          // Single center image
          <div className="flex items-center justify-center w-full h-full p-6">
            <img
              src={watermarkImageUrl}
              alt="Watermark"
              className="max-w-[55%] max-h-[55%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] filter contrast-125"
            />
          </div>
        )
      ) : (
        // Text watermark
        watermarkPosition === 'repeated' ? (
          // Repeated diagonal tiled text across the entire canvas
          <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id={`wm-pattern-${safeText.replace(/[^a-zA-Z0-9]/g, '')}`}
                width="240"
                height="140"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-28)"
              >
                <text
                  x="20"
                  y="50"
                  fill="white"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                  fontSize="16"
                  fontWeight="800"
                  letterSpacing="3"
                  fontFamily="system-ui, sans-serif"
                >
                  {safeText}
                </text>
                <text
                  x="140"
                  y="120"
                  fill="white"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="1"
                  fontSize="16"
                  fontWeight="800"
                  letterSpacing="3"
                  fontFamily="system-ui, sans-serif"
                >
                  {safeText}
                </text>
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={`url(#wm-pattern-${safeText.replace(/[^a-zA-Z0-9]/g, '')})`}
            />
          </svg>
        ) : (
          // Single centered text badge with security styling
          <div className="transform -rotate-12 px-6 py-3 rounded-2xl border-2 border-white/60 bg-black/40 backdrop-blur-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-[85%] text-center">
            <span
              className="text-white font-extrabold tracking-[0.25em] text-sm sm:text-base md:text-xl uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] block truncate"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)' }}
            >
              {safeText}
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/80 tracking-widest uppercase block mt-0.5 font-medium">
              Protegido por Pixart Studios
            </span>
          </div>
        )
      )}
    </div>
  );
};
