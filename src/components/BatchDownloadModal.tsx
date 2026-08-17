import React from 'react';
import { Download, Loader2, CheckCircle2, X } from 'lucide-react';
import { formatBytes } from '../services/storageService';
import { StudioBrandingConfig } from '../types';
import { COLOR_PRESET_MAP } from '../services/brandingService';

interface BatchDownloadModalProps {
  isOpen: boolean;
  totalPhotos: number;
  totalBytes: number;
  progressPercent: number;
  currentFileName: string;
  isCompleted: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  isOpen,
  totalPhotos,
  totalBytes,
  progressPercent,
  currentFileName,
  isCompleted,
  onClose,
  theme = 'dark',
  branding,
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="batch-download-dialog"
        className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Empaquetado de Descarga
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {totalPhotos} fotos en alta resolución ({formatBytes(totalBytes)})
              </p>
            </div>
          </div>
          {isCompleted && (
            <button 
              id="batch-download-close-btn"
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Display */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className={`font-medium truncate max-w-[260px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {currentFileName || 'Preparando archivos...'}
            </span>
            <span className={`font-mono-code font-bold ${colorTheme.twText}`}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div 
              className={`h-full ${colorTheme.twBg} transition-all duration-200 rounded-full`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className={`rounded-2xl p-4 border flex items-center gap-3 text-xs ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-500">¡Descarga Lista!</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tu navegador ha iniciado la descarga del archivo .ZIP empaquetado.</p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className={`w-5 h-5 animate-spin flex-shrink-0 ${colorTheme.twText}`} />
              <div>
                <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Comprimiendo álbum en alta resolución...</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No cierres esta ventana mientras procesamos los archivos RAW y JPEGs.</p>
              </div>
            </>
          )}
        </div>

        {isCompleted && (
          <button
            id="batch-download-done-btn"
            onClick={onClose}
            className={`w-full py-3 rounded-2xl text-white font-bold text-xs transition-all shadow-lg cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
          >
            Aceptar y Continuar
          </button>
        )}
      </div>
    </div>
  );
};
