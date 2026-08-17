import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldCheck, KeyRound, ArrowRight, ShieldAlert, 
  Sparkles, Eye, UserCheck, Calendar, MapPin
} from 'lucide-react';
import { GallerySession, StudioBrandingConfig } from '../types';
import { COLOR_PRESET_MAP, DEFAULT_MODAL_TEXTS } from '../services/brandingService';

interface LockedGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: GallerySession | null;
  onUnlock: (galleryId: string, pin: string) => boolean;
  onOpenAuthModal?: () => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const LockedGalleryModal: React.FC<LockedGalleryModalProps> = ({
  isOpen,
  onClose,
  gallery,
  onUnlock,
  onOpenAuthModal,
  theme = 'dark',
  branding,
}) => {
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const modalTexts = branding?.modalTexts?.lockedGalleryModal || DEFAULT_MODAL_TEXTS.lockedGalleryModal;

  useEffect(() => {
    if (isOpen) {
      setPinCode('');
      setErrorMsg(null);
      setIsSuccess(false);
    }
  }, [isOpen, gallery]);

  if (!isOpen || !gallery) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pinCode.trim()) {
      setErrorMsg('Por favor ingresa el código PIN de acceso.');
      return;
    }

    const success = onUnlock(gallery.id, pinCode.trim());
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 400);
    } else {
      setErrorMsg(modalTexts.errorMessage || 'Código PIN incorrecto para esta sesión. Por favor verifica con tu fotógrafo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id={`locked-gallery-modal-${gallery.id}`}
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 my-6 relative border transition-colors ${
          isDark 
            ? 'bg-[#141618] border-slate-700/80 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button 
          id="close-locked-gallery-btn"
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-colors z-10 cursor-pointer ${
            isDark 
              ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={modalTexts.cancelButtonText}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Preview Header Banner */}
        <div className="relative rounded-2xl overflow-hidden aspect-16/8 bg-slate-950 border border-slate-800/80 shadow-md">
          <img 
            src={gallery.coverImage} 
            alt={gallery.title}
            className="w-full h-full object-cover filter brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/90 text-white shadow-xs">
            <Lock className="w-3 h-3" />
            <span>{modalTexts.badgeText || 'Acceso Seguro PIN'}</span>
          </div>

          <div className="absolute bottom-3 inset-x-3 text-left text-white">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-300">
              {gallery.category}
            </span>
            <h4 className="text-sm sm:text-base font-bold font-serif-display truncate drop-shadow-xs">
              {gallery.title}
            </h4>
            {gallery.eventDate && (
              <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {gallery.eventDate}
                </span>
                {gallery.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {gallery.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Info */}
        <div className="space-y-2 text-center">
          <div className={`inline-flex p-2.5 rounded-2xl border mx-auto ${
            isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <KeyRound className="w-6 h-6" />
          </div>

          <h3 className={`text-xl font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {modalTexts.title || 'Sesión Privada Protegida'}
          </h3>
          <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {modalTexts.subtitle || 'Esta galería requiere el código PIN de acceso proporcionado por el fotógrafo para mostrar sus fotografías.'}
          </p>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {modalTexts.pinLabel || 'Código PIN de Acceso:'}
            </label>
            <div className="relative">
              <input
                id="input-locked-gallery-pin"
                type="text"
                autoFocus
                maxLength={8}
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder={modalTexts.pinPlaceholder || 'Introduce el PIN (ej: 8492)'}
                className={`w-full border rounded-2xl pl-10 pr-4 py-3 text-sm font-mono-code font-bold tracking-widest text-center focus:ring-2 ${colorTheme.twRing} focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-950 border-slate-700 text-amber-300 placeholder:text-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-blue-600 placeholder:text-slate-400'
                }`}
              />
              <KeyRound className={`w-4 h-4 absolute left-3.5 top-3.5 ${isDark ? 'text-amber-400' : 'text-blue-500'}`} />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in shake duration-200">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>¡Código correcto! Abriendo galería...</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              id="cancel-locked-gallery-btn"
              onClick={onClose}
              className={`w-1/3 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark ? 'bg-slate-900 text-slate-300 hover:text-white border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              {modalTexts.cancelButtonText || 'Cerrar'}
            </button>

            <button
              type="submit"
              id="submit-locked-gallery-pin-btn"
              className={`w-2/3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${colorTheme.twBg} ${colorTheme.twShadow} hover:opacity-95 hover:scale-[1.01]`}
            >
              <span>{modalTexts.submitButtonText || 'Desbloquear y Ver Fotos'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Alternative Option: Client Login */}
        {onOpenAuthModal && (
          <div className={`pt-2 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <button
              type="button"
              id="switch-to-client-login-btn"
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className={`text-xs transition-colors hover:underline cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-amber-300' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              {modalTexts.clientLoginLinkText || '¿Tienes una cuenta registrada? Inicia sesión aquí'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
