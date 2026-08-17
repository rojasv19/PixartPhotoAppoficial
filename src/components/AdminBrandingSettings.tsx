import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Sliders, Sparkles, Check, RefreshCw, Eye, 
  Camera, Aperture, Film, Crown, Sun, Compass, Layers, 
  Flame, Heart, Type, Shield, Image as ImageIcon, CheckCircle2,
  ExternalLink, Mail, Phone, MapPin, Instagram, Globe, HelpCircle,
  Copy, ArrowRight, ShieldCheck, Lock, Download, MessageSquare,
  Upload, Trash2, FileImage, Video, Play, SlidersHorizontal,
  Key, Users, HardDrive, FolderPlus, UserPlus, ShieldAlert, Sparkle, Info, X
} from 'lucide-react';
import { StudioBrandingConfig, BrandIconName, ColorPreset, ModalTextsConfig } from '../types';
import { COLOR_PRESET_MAP, DEFAULT_BRANDING, DEFAULT_MODAL_TEXTS } from '../services/brandingService';
import { BrandIcon } from './BrandIcon';

interface AdminBrandingSettingsProps {
  branding: StudioBrandingConfig;
  onSaveBranding: (updated: StudioBrandingConfig) => void;
  onPreviewPortal?: () => void;
  theme?: 'light' | 'dark';
}

const AVAILABLE_ICONS: { name: BrandIconName; label: string }[] = [
  { name: 'Camera', label: 'Cámara Clásica' },
  { name: 'Aperture', label: 'Apertura / Diafragma' },
  { name: 'Sparkles', label: 'Destello / Glow' },
  { name: 'Film', label: 'Película Analógica' },
  { name: 'Crown', label: 'Corona VIP' },
  { name: 'Eye', label: 'Enfoque / Ojo' },
  { name: 'Sun', label: 'Luz Natural / Sol' },
  { name: 'Palette', label: 'Paleta Creativa' },
  { name: 'Compass', label: 'Brújula / Estudio' },
  { name: 'Layers', label: 'Capas / Portfolio' },
  { name: 'Flame', label: 'Fuego / Pro' },
  { name: 'Heart', label: 'Emoción / Bodas' },
];

const PRESET_LOGO_IMAGES = [
  { label: 'Minimalist Signature', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80' },
  { label: 'Geometric Monogram', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=120&h=120&q=80' },
  { label: 'Gold Emblem', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=120&h=120&q=80' },
];

const PRESET_HERO_PHOTOS = [
  { 
    label: 'Darkroom & Softbox Studio', 
    category: 'Estudio Dark',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=2400&q=90' 
  },
  { 
    label: 'Cámara & Lente Bokeh 50mm', 
    category: 'Cinemático',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=90' 
  },
  { 
    label: 'Retrato Editorial Iluminado', 
    category: 'Retrato & Moda',
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2400&q=90' 
  },
  { 
    label: 'Golden Hour & Paisaje Épico', 
    category: 'Luz Natural',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=90' 
  },
  { 
    label: 'Monocromo High-Fashion', 
    category: 'Black & White',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=2400&q=90' 
  },
  { 
    label: 'Minimalismo & Sombras Lineales', 
    category: 'Arquitectura',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=90' 
  },
];

const PRESET_HERO_VIDEOS = [
  {
    label: 'Sesión Fotográfica en Estudio (Loop)',
    duration: 'Cinemático 1080p',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-photographer-taking-photos-in-a-studio-41407-large.mp4',
    poster: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
  },
  {
    label: 'Enfoque & Zoom de Lente Reflex (Loop)',
    duration: 'Cinemático 1080p',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-camera-lens-zooming-in-and-out-41408-large.mp4',
    poster: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'
  },
  {
    label: 'Modelo & Luces de Neón Studio (Loop)',
    duration: 'Editorial 1080p',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-neon-lights-39878-large.mp4',
    poster: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80'
  }
];

const PRESET_OVERLAY_COLORS = [
  { label: 'Negro Puro', hex: '#000000' },
  { label: 'Obsidiana Dark', hex: '#090a0f' },
  { label: 'Pizarra Slate', hex: '#0f172a' },
  { label: 'Carbón Cálido', hex: '#18181b' },
  { label: 'Noche Índigo', hex: '#1e1b4b' },
  { label: 'Esmeralda Dark', hex: '#062419' },
  { label: 'Borgoña / Vino', hex: '#2a0c16' },
];

export const AdminBrandingSettings: React.FC<AdminBrandingSettingsProps> = ({
  branding,
  onSaveBranding,
  onPreviewPortal,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Local draft state for live editing
  const [formData, setFormData] = useState<StudioBrandingConfig>(branding);
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'heroMedia' | 'colors' | 'texts' | 'watermark' | 'footer' | 'experience' | 'modals'>('identity');
  const [activeModalCategory, setActiveModalCategory] = useState<keyof ModalTextsConfig>('authModal');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Keep local draft in sync if external branding prop changes
  useEffect(() => {
    setFormData(branding);
  }, [branding]);

  const activeColorTheme = COLOR_PRESET_MAP[formData.colorPreset] || COLOR_PRESET_MAP.blue;

  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const heroBgInputRef = useRef<HTMLInputElement>(null);
  const heroVideoInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = <K extends keyof StudioBrandingConfig>(field: K, value: StudioBrandingConfig[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleModalTextChange = <M extends keyof ModalTextsConfig, F extends keyof ModalTextsConfig[M]>(
    modal: M,
    field: F,
    value: string
  ) => {
    setFormData(prev => {
      const currentModalTexts = prev.modalTexts || DEFAULT_MODAL_TEXTS;
      const targetModal = currentModalTexts[modal] || DEFAULT_MODAL_TEXTS[modal];
      return {
        ...prev,
        modalTexts: {
          ...currentModalTexts,
          [modal]: {
            ...targetModal,
            [field]: value
          }
        }
      };
    });
  };

  const handleResetModalCategory = (modal: keyof ModalTextsConfig) => {
    setFormData(prev => {
      const currentModalTexts = prev.modalTexts || DEFAULT_MODAL_TEXTS;
      return {
        ...prev,
        modalTexts: {
          ...currentModalTexts,
          [modal]: { ...DEFAULT_MODAL_TEXTS[modal] }
        }
      };
    });
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleFieldChange('logoImageUrl', event.target.result as string);
        handleFieldChange('logoType', 'image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleFieldChange('watermarkImageUrl', event.target.result as string);
        handleFieldChange('watermarkType', 'image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleFieldChange('portalHeroBgImage', event.target.result as string);
        handleFieldChange('portalHeroMediaType', 'image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleFieldChange('portalHeroVideoUrl', event.target.result as string);
        handleFieldChange('portalHeroMediaType', 'video');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const payload: StudioBrandingConfig = {
      ...formData,
      modalTexts: {
        ...DEFAULT_MODAL_TEXTS,
        ...(formData.modalTexts || {}),
        authModal: { ...DEFAULT_MODAL_TEXTS.authModal, ...(formData.modalTexts?.authModal || {}) },
        lockedGalleryModal: { ...DEFAULT_MODAL_TEXTS.lockedGalleryModal, ...(formData.modalTexts?.lockedGalleryModal || {}) },
        galleryModal: { ...DEFAULT_MODAL_TEXTS.galleryModal, ...(formData.modalTexts?.galleryModal || {}) },
        userModal: { ...DEFAULT_MODAL_TEXTS.userModal, ...(formData.modalTexts?.userModal || {}) },
        uploadModal: { ...DEFAULT_MODAL_TEXTS.uploadModal, ...(formData.modalTexts?.uploadModal || {}) },
        storageLimitModal: { ...DEFAULT_MODAL_TEXTS.storageLimitModal, ...(formData.modalTexts?.storageLimitModal || {}) },
        feedbackReplyModal: { ...DEFAULT_MODAL_TEXTS.feedbackReplyModal, ...(formData.modalTexts?.feedbackReplyModal || {}) },
        userProfileModal: { ...DEFAULT_MODAL_TEXTS.userProfileModal, ...(formData.modalTexts?.userProfileModal || {}) },
      }
    };
    onSaveBranding(payload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Estás seguro de restablecer toda la configuración de diseño y textos a los valores predeterminados?')) {
      setFormData(DEFAULT_BRANDING);
      onSaveBranding(DEFAULT_BRANDING);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">

      {/* Floating Global Success Toast Notification */}
      {savedSuccess && (
        <div 
          id="branding-save-success-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-500 text-white shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-emerald-300 font-serif-display">¡Guardado Exitoso!</h4>
              <span className="text-[10px] font-mono-code bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                100% Sincronizado
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Todos los cambios de diseño, logotipos, colores y textos de las ventanas emergentes (modales) se han guardado y aplicado correctamente.
            </p>
          </div>
          <button 
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Header with Title & Action Buttons */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#181A1D] border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl text-white ${activeColorTheme.twBg}`}>
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-xl font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Personalización & Diseño del Estudio
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configura en tiempo real la identidad de marca, logotipos, colores, tipografías, textos y marca de agua de tu portal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onPreviewPortal && (
            <button
              type="button"
              id="settings-preview-portal-btn"
              onClick={onPreviewPortal}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Ver Portal Público</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          )}

          <button
            type="button"
            id="settings-reset-defaults-btn"
            onClick={handleResetDefaults}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="Restablecer plantilla original"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            id="settings-save-branding-btn"
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer ${activeColorTheme.twBg} ${activeColorTheme.twBgHover} ${activeColorTheme.twShadow}`}
          >
            <Check className="w-4 h-4" />
            <span>Guardar y Aplicar Cambios</span>
          </button>
        </div>
      </div>

      {/* Success Toast banner */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>¡Configuración de diseño guardada!</strong> Los cambios en logotipos, colores, textos y marcas de agua se han sincronizado en todo el sistema.
            </span>
          </div>
          <span className="text-[10px] font-mono-code bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
            En vivo
          </span>
        </div>
      )}

      {/* LIVE PREVIEW COMPONENT (Shows instant feedback as user changes controls) */}
      <div className={`p-6 rounded-3xl border space-y-4 transition-colors ${
        isDark ? 'bg-[#15171A] border-slate-800' : 'bg-slate-100/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${activeColorTheme.twText}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Vista Previa en Tiempo Real
            </span>
            <span className="text-[10px] text-slate-500">
              (Refleja los cambios al instante)
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                previewMode === 'desktop' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                previewMode === 'mobile' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Móvil
            </button>
          </div>
        </div>

        {/* Mock Live Canvas */}
        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${
          previewMode === 'mobile' ? 'max-w-md mx-auto' : 'w-full'
        } ${isDark ? 'bg-[#0F1012] border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}>
          
          {/* Mock Hero Container with Transparent Header on Top */}
          <div className="relative overflow-hidden bg-slate-950 text-white min-h-[280px]">
            
            {/* Real Background Media in Mock Preview */}
            {formData.portalHeroMediaType !== 'none' && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {formData.portalHeroMediaType === 'video' && formData.portalHeroVideoUrl ? (
                  <video
                    key={formData.portalHeroVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-105"
                    style={{
                      filter: formData.portalHeroBlur ? `blur(${formData.portalHeroBlur}px)` : undefined,
                    }}
                  >
                    <source src={formData.portalHeroVideoUrl} type="video/mp4" />
                  </video>
                ) : (
                  formData.portalHeroBgImage && (
                    <img 
                      src={formData.portalHeroBgImage} 
                      alt="Hero Background Preview" 
                      className="w-full h-full object-cover scale-105"
                      style={{
                        filter: formData.portalHeroBlur ? `blur(${formData.portalHeroBlur}px)` : undefined,
                      }}
                    />
                  )
                )}

                {/* Live Color Overlay Layer */}
                <div 
                  className="absolute inset-0 transition-all duration-200 pointer-events-none"
                  style={{
                    backgroundColor: formData.portalHeroOverlayColor || '#090a0f',
                    opacity: (formData.portalHeroOverlayOpacity ?? 72) / 100,
                  }}
                />
              </div>
            )}

            {/* Mock Transparent Header Preview */}
            <div className="relative z-10 px-4 py-3 border-b border-white/10 bg-black/25 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden ${activeColorTheme.twBg}`}>
                  {formData.logoType === 'image' && formData.logoImageUrl ? (
                    <img src={formData.logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <BrandIcon name={formData.logoIcon} className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold tracking-tight flex items-center gap-1 font-sans text-white drop-shadow-sm">
                    {formData.studioName}
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase backdrop-blur-md ${activeColorTheme.twBadgeBg} ${activeColorTheme.twBadgeText}`}>
                      {formData.studioBadgeText}
                    </span>
                  </span>
                  <p className="text-[9px] text-slate-200/80 truncate max-w-[200px]">
                    {formData.studioTagline}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold text-white shadow-sm ${activeColorTheme.twBg}`}>
                  Portal
                </span>
              </div>
            </div>

            {/* Mock Hero Content Preview */}
            <div className="p-6 sm:p-8 text-center space-y-3 relative z-10">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-md ${activeColorTheme.twBadgeBg} ${activeColorTheme.twBadgeBorder} ${activeColorTheme.twBadgeText}`}>
                <Sparkles className="w-3 h-3" />
                <span>{formData.portalHeroBadge}</span>
              </div>

              <h3 className="text-lg sm:text-2xl font-bold font-serif-display leading-tight max-w-xl mx-auto drop-shadow-sm text-white">
                {formData.portalHeroTitle}{' '}
                <span className={`${activeColorTheme.twText} italic drop-shadow-sm`}>
                  {formData.portalHeroHighlight}
                </span>
              </h3>

              <p className="text-xs text-slate-200 max-w-md mx-auto line-clamp-2 drop-shadow-xs">
                {formData.portalHeroSubtitle}
              </p>

              {/* Mock Access Cards preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-left max-w-lg mx-auto">
                <div className={`p-3 rounded-2xl border text-xs space-y-1.5 backdrop-blur-md ${
                  isDark ? 'bg-slate-900/85 border-slate-700/80' : 'bg-white/90 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${activeColorTheme.twBadgeBg} ${activeColorTheme.twText}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono-code">{formData.adminCardBadge}</span>
                  </div>
                  <div className={`font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.adminCardTitle}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{formData.adminCardDescription}</div>
                </div>

                <div className={`p-3 rounded-2xl border text-xs space-y-1.5 backdrop-blur-md ${
                  isDark ? 'bg-slate-900/85 border-slate-700/80' : 'bg-white/90 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${activeColorTheme.twBadgeBg} ${activeColorTheme.twText}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono-code">{formData.clientCardBadge}</span>
                  </div>
                  <div className={`font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.clientCardTitle}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{formData.clientCardDescription}</div>
                </div>
              </div>
            </div>

            {/* Mock Watermark Preview Box */}
            {formData.watermarkEnabled && (
              <div className="mt-4 pt-3 border-t border-slate-800/60 relative z-10">
                <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span>Previsualización de Marca de Agua sobre Fotografía:</span>
                </div>
                <div className="relative w-full max-w-sm mx-auto h-28 rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80" 
                    alt="Sample for watermark" 
                    className="w-full h-full object-cover" 
                  />
                  {/* Overlay Watermark according to settings */}
                  <div className={`absolute inset-0 pointer-events-none flex ${
                    formData.watermarkPosition === 'center' ? 'items-center justify-center' :
                    formData.watermarkPosition === 'bottom-left' ? 'items-end justify-start p-3' :
                    formData.watermarkPosition === 'top-right' ? 'items-start justify-end p-3' :
                    formData.watermarkPosition === 'diagonal' ? 'items-center justify-center -rotate-12' :
                    'items-end justify-end p-3'
                  }`}>
                    {formData.watermarkType === 'image' && formData.watermarkImageUrl ? (
                      <img 
                        src={formData.watermarkImageUrl} 
                        alt="Watermark Preview" 
                        style={{ opacity: formData.watermarkOpacity / 100 }}
                        className="max-h-8 max-w-[120px] object-contain drop-shadow-md select-none"
                      />
                    ) : (
                      <span 
                        style={{ opacity: formData.watermarkOpacity / 100 }}
                        className="font-mono-code font-bold tracking-widest text-[11px] text-white px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs border border-white/20 select-none shadow-sm"
                      >
                        {formData.watermarkText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION FOR CONFIGURATION SECTIONS */}
      <div className={`flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border transition-colors ${
        isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          type="button"
          id="config-tab-identity"
          onClick={() => setActiveSubTab('identity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'identity'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>1. Identidad & Logotipo</span>
        </button>

        <button
          type="button"
          id="config-tab-heromedia"
          onClick={() => setActiveSubTab('heroMedia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'heroMedia'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>2. Fondo Hero & Multimedia (Foto / Video / Overlay)</span>
        </button>

        <button
          type="button"
          id="config-tab-colors"
          onClick={() => setActiveSubTab('colors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'colors'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>3. Colores & Estilo</span>
        </button>

        <button
          type="button"
          id="config-tab-texts"
          onClick={() => setActiveSubTab('texts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'texts'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>4. Títulos & Textos del Portal</span>
        </button>

        <button
          type="button"
          id="config-tab-watermark"
          onClick={() => setActiveSubTab('watermark')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'watermark'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>5. Marca de Agua (Watermark)</span>
        </button>

        <button
          type="button"
          id="config-tab-footer"
          onClick={() => setActiveSubTab('footer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'footer'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>6. Pie de Página & Contacto</span>
        </button>

        <button
          type="button"
          id="config-tab-experience"
          onClick={() => setActiveSubTab('experience')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'experience'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>7. Experiencia & Permisos</span>
        </button>

        <button
          type="button"
          id="config-tab-modals"
          onClick={() => setActiveSubTab('modals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'modals'
              ? `${activeColorTheme.twBg} text-white shadow-md`
              : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>8. Ventanas y Modales</span>
        </button>
      </div>

      {/* SECTION 1: IDENTITY & LOGO */}
      {activeSubTab === 'identity' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Identidad de Marca y Logotipo
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Personaliza el nombre de tu estudio fotográfico, el badge de versión y el ícono o imagen corporativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nombre del Estudio:
              </label>
              <input
                type="text"
                id="branding-studio-name-input"
                value={formData.studioName}
                onChange={(e) => handleFieldChange('studioName', e.target.value)}
                placeholder="Ej. LUMINA STUDIO"
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Slogan / Tagline del Header:
              </label>
              <input
                type="text"
                id="branding-studio-tagline-input"
                value={formData.studioTagline}
                onChange={(e) => handleFieldChange('studioTagline', e.target.value)}
                placeholder="Ej. Galerías Privadas & Almacenamiento RAW"
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Badge Distintivo (Etiqueta):
              </label>
              <input
                type="text"
                id="branding-studio-badge-input"
                value={formData.studioBadgeText}
                onChange={(e) => handleFieldChange('studioBadgeText', e.target.value)}
                placeholder="Ej. PRO, VIP, STUDIO"
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Logo Type Switcher */}
          <div className="pt-4 border-t border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Formato de Logotipo:
                </label>
                <p className="text-[11px] text-slate-400">
                  Elige entre un ícono vectorial estilizado o una imagen/URL personalizada.
                </p>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  id="logo-type-icon-btn"
                  onClick={() => handleFieldChange('logoType', 'icon')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    formData.logoType === 'icon' ? `${activeColorTheme.twBg} text-white shadow-xs` : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ícono Vectorial
                </button>
                <button
                  type="button"
                  id="logo-type-image-btn"
                  onClick={() => handleFieldChange('logoType', 'image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    formData.logoType === 'image' ? `${activeColorTheme.twBg} text-white shadow-xs` : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Imagen / URL de Logo
                </button>
              </div>
            </div>

            {/* If Icon chosen */}
            {formData.logoType === 'icon' && (
              <div className="space-y-3 pt-2">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Selecciona el Ícono Principal de tu Estudio ({AVAILABLE_ICONS.length} opciones):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = formData.logoIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        id={`icon-choice-${item.name.toLowerCase()}`}
                        onClick={() => handleFieldChange('logoIcon', item.name)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${activeColorTheme.twBg} text-white border-transparent shadow-lg scale-105`
                            : isDark
                            ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <BrandIcon name={item.name} className="w-6 h-6" />
                        <span className="text-[10px] font-medium text-center truncate w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Image Logo chosen */}
            {formData.logoType === 'image' && (
              <div className="space-y-4 pt-2">
                
                {/* Device Upload Zone for Logo */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Current Logo Preview */}
                    <div className="relative group shrink-0">
                      <div className={`w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center p-2 shadow-md ${
                        isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'
                      }`}>
                        {formData.logoImageUrl ? (
                          <img 
                            src={formData.logoImageUrl} 
                            alt="Logo Estudio" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        )}
                      </div>
                      {formData.logoImageUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('logoImageUrl', '')}
                          title="Eliminar logo"
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md text-xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Upload button & actions */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div>
                        <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Subir Logotipo desde tu Dispositivo
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Soporta formatos PNG transparente, SVG, WebP y JPEG de alta resolución.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          id="upload-logo-device-btn"
                          onClick={() => logoInputRef.current?.click()}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${activeColorTheme.twBg} ${activeColorTheme.twBgHover}`}
                        >
                          <Upload className="w-4 h-4" />
                          <span>Seleccionar Archivo de Imagen</span>
                        </button>

                        {formData.logoImageUrl && (
                          <span className="text-[10px] text-emerald-400 font-mono-code bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            ✓ Imagen cargada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Or enter URL manually */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    O introduce la URL directa de la imagen:
                  </label>
                  <input
                    type="url"
                    id="branding-logo-url-input"
                    value={formData.logoImageUrl}
                    onChange={(e) => handleFieldChange('logoImageUrl', e.target.value)}
                    placeholder="https://tudominio.com/logo.png"
                    className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[11px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    O prueba uno de estos logos de muestra:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {PRESET_LOGO_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleFieldChange('logoImageUrl', preset.url)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                          formData.logoImageUrl === preset.url 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                            : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded object-cover" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SECTION 2: HERO BACKGROUND & MULTIMEDIA (IMAGE / VIDEO / OVERLAY) */}
      {activeSubTab === 'heroMedia' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-7 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <Film className={`w-5 h-5 ${activeColorTheme.twText}`} />
              <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Fondo Hero & Multimedia del Portal Público
              </h3>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Personaliza el fondo principal detrás del título "Galerías Fotográficas privadas en máxima resolución". Puedes subir o enlazar una fotografía en alta definición, un video cinemático en bucle continuo, y configurar la capa de color Overlay para un contraste óptimo.
            </p>
          </div>

          {/* Media Type Selector */}
          <div className="space-y-3">
            <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Tipo de Medio de Fondo para el Hero:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                id="hero-media-type-image-btn"
                onClick={() => handleFieldChange('portalHeroMediaType', 'image')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  (formData.portalHeroMediaType === 'image' || !formData.portalHeroMediaType)
                    ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30'
                    : isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Fotografía en Alta Definición</div>
                  <div className="text-[10px] text-slate-400">Imágenes RAW, JPG, WebP o Unsplash HD</div>
                </div>
              </button>

              <button
                type="button"
                id="hero-media-type-video-btn"
                onClick={() => handleFieldChange('portalHeroMediaType', 'video')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.portalHeroMediaType === 'video'
                    ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/30'
                    : isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Video Cinemático (Loop)</div>
                  <div className="text-[10px] text-slate-400">Video MP4/WebM en bucle sin audio</div>
                </div>
              </button>

              <button
                type="button"
                id="hero-media-type-none-btn"
                onClick={() => handleFieldChange('portalHeroMediaType', 'none')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.portalHeroMediaType === 'none'
                    ? 'bg-amber-600/15 border-amber-500 ring-2 ring-amber-500/30'
                    : isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sin Fondo Multimedia</div>
                  <div className="text-[10px] text-slate-400">Solo gradiente oscuro estándar</div>
                </div>
              </button>
            </div>
          </div>

          {/* IMAGE CONTROLS */}
          {formData.portalHeroMediaType === 'image' && (
            <div className={`p-5 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Configuración de Fotografía de Fondo
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sube tu propia foto de estudio o utiliza una de las tomas de alta fidelidad curadas.
                  </p>
                </div>
                {formData.portalHeroBgImage && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('portalHeroBgImage', '')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar foto</span>
                  </button>
                )}
              </div>

              {/* Upload Box with file upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative shadow-sm">
                  {formData.portalHeroBgImage ? (
                    <img 
                      src={formData.portalHeroBgImage} 
                      alt="Hero Background Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Subir Imagen desde tu Dispositivo (PC / Móvil)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Recomendado: Imágenes horizontales de al menos 1920x1080px (JPG, PNG, WebP).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={heroBgInputRef}
                      type="file"
                      id="hero-bg-file-upload-input"
                      accept="image/*"
                      onChange={handleHeroBgFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="upload-hero-bg-device-btn"
                      onClick={() => heroBgInputRef.current?.click()}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${activeColorTheme.twBg} ${activeColorTheme.twBgHover}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar Archivo de Foto</span>
                    </button>

                    {formData.portalHeroBgImage && (
                      <span className="text-[10px] text-emerald-400 font-mono-code bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        ✓ Imagen activa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct URL Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  O introduce una URL de imagen externa directa:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="branding-hero-bg-url-input"
                    value={formData.portalHeroBgImage || ''}
                    onChange={(e) => handleFieldChange('portalHeroBgImage', e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className={`flex-1 text-xs rounded-xl p-3 border font-mono-code focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                  {formData.portalHeroBgImage && (
                    <a
                      href={formData.portalHeroBgImage}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                      title="Ver imagen en tamaño completo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Curated Presets Grid */}
              <div className="space-y-2.5 pt-2">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Galería de Fotos de Alta Definición Recomendadas:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRESET_HERO_PHOTOS.map((preset) => {
                    const isSelected = formData.portalHeroBgImage === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handleFieldChange('portalHeroBgImage', preset.url)}
                        className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer h-24 ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg' 
                            : isDark ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.label} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 flex flex-col justify-between">
                          <span className="text-[9px] font-mono-code font-bold uppercase tracking-wider text-slate-300 bg-black/60 px-1.5 py-0.5 rounded w-max backdrop-blur-xs">
                            {preset.category}
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white leading-tight drop-shadow-sm truncate pr-2">
                              {preset.label}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIDEO CONTROLS */}
          {formData.portalHeroMediaType === 'video' && (
            <div className={`p-5 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Configuración de Video Cinemático en Bucle
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Sube un clip de video o introduce una URL (formato MP4 o WebM). El video se reproduce automáticamente en silencio continuo.
                  </p>
                </div>
                {formData.portalHeroVideoUrl && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('portalHeroVideoUrl', '')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar video</span>
                  </button>
                )}
              </div>

              {/* Upload Box for video */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative shadow-sm flex items-center justify-center">
                  {formData.portalHeroVideoUrl ? (
                    <video
                      key={formData.portalHeroVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={formData.portalHeroVideoUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <Video className="w-6 h-6 text-purple-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Subir Video desde tu Dispositivo
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Soporta archivos MP4 y WebM. Para mejor rendimiento, utiliza clips ligeros de 5 a 20 segundos.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={heroVideoInputRef}
                      type="file"
                      id="hero-video-file-upload-input"
                      accept="video/mp4,video/webm"
                      onChange={handleHeroVideoFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="upload-hero-video-device-btn"
                      onClick={() => heroVideoInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all bg-purple-600 hover:bg-purple-500"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar Archivo de Video</span>
                    </button>

                    {formData.portalHeroVideoUrl && (
                      <span className="text-[10px] text-purple-400 font-mono-code bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        ✓ Video cargado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Video URL Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  O ingresa una URL directa de Video (.mp4 / .webm):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="branding-hero-video-url-input"
                    value={formData.portalHeroVideoUrl || ''}
                    onChange={(e) => handleFieldChange('portalHeroVideoUrl', e.target.value)}
                    placeholder="https://assets.mixkit.co/videos/preview/..."
                    className={`flex-1 text-xs rounded-xl p-3 border font-mono-code focus:ring-2 focus:outline-none transition-all ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-purple-500'
                    }`}
                  />
                  {formData.portalHeroVideoUrl && (
                    <a
                      href={formData.portalHeroVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                      title="Abrir video"
                    >
                      <Play className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Curated Video Presets */}
              <div className="space-y-2.5 pt-2">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Videos Cinemáticos Prediseñados para Fotografía:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESET_HERO_VIDEOS.map((preset) => {
                    const isSelected = formData.portalHeroVideoUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => handleFieldChange('portalHeroVideoUrl', preset.url)}
                        className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer h-28 ${
                          isSelected 
                            ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg' 
                            : isDark ? 'border-slate-800 hover:border-slate-700' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={preset.poster} 
                          alt={preset.label} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 p-2.5 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono-code font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                              {preset.duration}
                            </span>
                            <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                              <Play className="w-2.5 h-2.5 fill-current" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white leading-tight drop-shadow-sm truncate pr-1">
                              {preset.label}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY COLOR & OPACITY & BLUR (Applies to both image & video) */}
          <div className={`p-5 sm:p-6 rounded-2xl border space-y-6 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className={`w-4 h-4 ${activeColorTheme.twText}`} />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  2. Capa de Superposición de Color (Overlay) y Efectos
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Añade una capa de color y ajusta su opacidad y desenfoque para que los títulos y botones del Hero tengan un contraste impecable sobre cualquier imagen o video.
              </p>
            </div>

            {/* Color Swatches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Color del Overlay:
                </label>
                <div className="flex items-center gap-2 font-mono-code text-xs text-slate-400">
                  <span>Color activo:</span>
                  <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-950 text-white flex items-center gap-1.5">
                    <span 
                      className="w-3 h-3 rounded-full inline-block border border-white/20"
                      style={{ backgroundColor: formData.portalHeroOverlayColor || '#090a0f' }} 
                    />
                    {formData.portalHeroOverlayColor || '#090a0f'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PRESET_OVERLAY_COLORS.map((preset) => {
                  const isSelected = (formData.portalHeroOverlayColor || '#090a0f').toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleFieldChange('portalHeroOverlayColor', preset.hex)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500/20 text-white ring-2 ring-blue-500/30' 
                          : isDark ? 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs" 
                        style={{ backgroundColor: preset.hex }} 
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}

                {/* Custom Color input */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-700 bg-slate-950">
                  <input
                    type="color"
                    id="branding-hero-overlay-color-picker"
                    value={formData.portalHeroOverlayColor || '#090a0f'}
                    onChange={(e) => handleFieldChange('portalHeroOverlayColor', e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="Elegir color personalizado"
                  />
                  <input
                    type="text"
                    value={formData.portalHeroOverlayColor || '#090a0f'}
                    onChange={(e) => handleFieldChange('portalHeroOverlayColor', e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                    className="w-20 bg-transparent text-[11px] font-mono-code text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Opacity & Blur Sliders in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-slate-800/60">
              
              {/* Opacity slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Opacidad de la Capa Overlay:
                  </label>
                  <span className="font-mono-code font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {formData.portalHeroOverlayOpacity ?? 72}%
                  </span>
                </div>
                <input
                  type="range"
                  id="branding-hero-overlay-opacity-slider"
                  min="0"
                  max="100"
                  step="2"
                  value={formData.portalHeroOverlayOpacity ?? 72}
                  onChange={(e) => handleFieldChange('portalHeroOverlayOpacity', Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0% (Transparente)</span>
                  <span className="text-emerald-400 font-semibold">70-75% (Recomendado)</span>
                  <span>100% (Sólido)</span>
                </div>
              </div>

              {/* Blur slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Desenfoque de Fondo (Blur):
                  </label>
                  <span className="font-mono-code font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {formData.portalHeroBlur ?? 0} px
                  </span>
                </div>
                <input
                  type="range"
                  id="branding-hero-overlay-blur-slider"
                  min="0"
                  max="16"
                  step="1"
                  value={formData.portalHeroBlur ?? 0}
                  onChange={(e) => handleFieldChange('portalHeroBlur', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0px (Nítido HD)</span>
                  <span>4px (Bokeh suave)</span>
                  <span>16px (Difuminado)</span>
                </div>
              </div>

            </div>

            {/* Quick Preview mini-banner */}
            <div className="pt-2">
              <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Muestra con la configuración actual:</span>
              </div>
              <div className="relative h-20 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                {formData.portalHeroMediaType === 'video' && formData.portalHeroVideoUrl ? (
                  <video
                    key={formData.portalHeroVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: formData.portalHeroBlur ? `blur(${formData.portalHeroBlur}px)` : undefined }}
                  >
                    <source src={formData.portalHeroVideoUrl} type="video/mp4" />
                  </video>
                ) : formData.portalHeroBgImage ? (
                  <img
                    src={formData.portalHeroBgImage}
                    alt="Hero preview"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: formData.portalHeroBlur ? `blur(${formData.portalHeroBlur}px)` : undefined }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}

                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: formData.portalHeroOverlayColor || '#090a0f',
                    opacity: (formData.portalHeroOverlayOpacity ?? 72) / 100,
                  }}
                />

                <span className="relative z-10 text-xs font-bold text-white font-serif-display drop-shadow-md tracking-wide px-3 py-1 rounded-lg bg-black/30 backdrop-blur-xs border border-white/10">
                  Texto de Prueba sobre Fondo Hero con Overlay
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SECTION 3: COLORS & STYLE */}
      {activeSubTab === 'colors' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Paleta de Colores & Estética Visual
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecciona la combinación cromática y el estilo que definen la personalidad del estudio.
            </p>
          </div>

          {/* Color Palettes Grid */}
          <div className="space-y-3">
            <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Paletas de Color Prediseñadas:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(Object.keys(COLOR_PRESET_MAP) as ColorPreset[]).map((key) => {
                const item = COLOR_PRESET_MAP[key];
                const isSelected = formData.colorPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    id={`color-preset-${key}`}
                    onClick={() => {
                      handleFieldChange('colorPreset', key);
                      handleFieldChange('customPrimaryColor', item.hex);
                    }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-2 border-white shadow-xl scale-[1.02]'
                        : isDark
                        ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                        : 'bg-slate-50 hover:bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        style={{ backgroundColor: item.hex }} 
                        className="w-7 h-7 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center text-white"
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </span>
                      <div className="text-left">
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono-code text-slate-400">
                          {item.hex}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Input & Typography Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
            <div className="space-y-2">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Código de Color HEX Personalizado:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.customPrimaryColor || activeColorTheme.hex}
                  onChange={(e) => handleFieldChange('customPrimaryColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formData.customPrimaryColor || activeColorTheme.hex}
                  onChange={(e) => handleFieldChange('customPrimaryColor', e.target.value)}
                  placeholder="#2563eb"
                  className={`text-xs font-mono-code rounded-xl p-2.5 border flex-1 focus:ring-2 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Estilo Tipográfico para Títulos:
              </label>
              <select
                id="branding-font-select"
                value={formData.fontHeadingStyle}
                onChange={(e) => handleFieldChange('fontHeadingStyle', e.target.value as any)}
                className={`w-full text-xs rounded-xl p-2.5 border focus:ring-2 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="serif">Editorial Serif Clásico (Playfair / Garamond)</option>
                <option value="sans">Modern Sans Pro (Plus Jakarta Sans)</option>
                <option value="editorial">Cormorant Garamond (Alta Costura)</option>
                <option value="mono">Clean Mono (Estudio Técnico)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: HERO TEXTS & TITLES */}
      {activeSubTab === 'texts' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Textos y Títulos del Portal Público
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Personaliza los encabezados, mensajes de bienvenida y títulos de las tarjetas de acceso.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Badge Superior del Hero:
              </label>
              <input
                type="text"
                id="branding-hero-badge-input"
                value={formData.portalHeroBadge}
                onChange={(e) => handleFieldChange('portalHeroBadge', e.target.value)}
                placeholder="Ej. Lumina Studio Pro • Plataforma Fotográfica"
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Título Principal del Hero:
                </label>
                <input
                  type="text"
                  id="branding-hero-title-input"
                  value={formData.portalHeroTitle}
                  onChange={(e) => handleFieldChange('portalHeroTitle', e.target.value)}
                  placeholder="Ej. Galerías fotográficas privadas en"
                  className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Palabra / Frase Resaltada (Color de Marca):
                </label>
                <input
                  type="text"
                  id="branding-hero-highlight-input"
                  value={formData.portalHeroHighlight}
                  onChange={(e) => handleFieldChange('portalHeroHighlight', e.target.value)}
                  placeholder="Ej. máxima resolución."
                  className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Subtítulo Descriptivo del Hero:
              </label>
              <textarea
                id="branding-hero-subtitle-input"
                rows={2}
                value={formData.portalHeroSubtitle}
                onChange={(e) => handleFieldChange('portalHeroSubtitle', e.target.value)}
                placeholder="Ej. Visualización, selección de favoritas y descarga directa en alta fidelidad RAW y 4K con almacenamiento seguro."
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Hero Background Image Customizer */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Imagen de Fondo / Banner del Hero:
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Agrega una imagen o fotografía de fondo panorámica para el portal de clientes.
                  </p>
                </div>
                {formData.portalHeroBgImage && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('portalHeroBgImage', '')}
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Quitar Fondo
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref={heroBgInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroBgFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  id="upload-herobg-device-btn"
                  onClick={() => heroBgInputRef.current?.click()}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${activeColorTheme.twBg} ${activeColorTheme.twBgHover}`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Fondo desde tu Dispositivo</span>
                </button>

                <div className="flex-1 w-full">
                  <input
                    type="url"
                    value={formData.portalHeroBgImage || ''}
                    onChange={(e) => handleFieldChange('portalHeroBgImage', e.target.value)}
                    placeholder="O escribe URL https://..."
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {formData.portalHeroBgImage && (
                <div className="relative h-24 rounded-xl overflow-hidden border border-slate-700">
                  <img 
                    src={formData.portalHeroBgImage} 
                    alt="Banner de Fondo" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                    Vista previa de fondo hero
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cards Customization */}
          <div className="pt-4 border-t border-slate-800/60 space-y-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Textos de las Tarjetas de Acceso
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Admin Card */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wide">
                  Opción 1: Tarjeta Administrador
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.adminCardTitle}
                    onChange={(e) => handleFieldChange('adminCardTitle', e.target.value)}
                    placeholder="Título ej. Ingresar como Administrador"
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.adminCardBadge}
                    onChange={(e) => handleFieldChange('adminCardBadge', e.target.value)}
                    placeholder="Badge ej. Fotógrafos & Estudio"
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <textarea
                    rows={2}
                    value={formData.adminCardDescription}
                    onChange={(e) => handleFieldChange('adminCardDescription', e.target.value)}
                    placeholder="Descripción de la tarjeta..."
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Client Card */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wide">
                  Opción 2: Tarjeta Cliente / Invitado
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.clientCardTitle}
                    onChange={(e) => handleFieldChange('clientCardTitle', e.target.value)}
                    placeholder="Título ej. Ingresar como Cliente / Invitado"
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.clientCardBadge}
                    onChange={(e) => handleFieldChange('clientCardBadge', e.target.value)}
                    placeholder="Badge ej. Álbumes Privados"
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <textarea
                    rows={2}
                    value={formData.clientCardDescription}
                    onChange={(e) => handleFieldChange('clientCardDescription', e.target.value)}
                    placeholder="Descripción de la tarjeta..."
                    className={`w-full text-xs rounded-xl p-2.5 border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WATERMARK & SECURITY */}
      {activeSubTab === 'watermark' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Marca de Agua (Watermark) & Protección de Imagen
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Protege tus fotos en vista previa con marcas de agua personalizadas antes de la entrega final.
              </p>
            </div>

            {/* Watermark Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {formData.watermarkEnabled ? 'Marca de Agua Activada' : 'Marca de Agua Desactivada'}
              </span>
              <input
                type="checkbox"
                id="branding-watermark-toggle"
                checked={formData.watermarkEnabled}
                onChange={(e) => handleFieldChange('watermarkEnabled', e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </label>
          </div>

          {/* Watermark Type Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => handleFieldChange('watermarkType', 'text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                formData.watermarkType !== 'image' ? `${activeColorTheme.twBg} text-white shadow-xs` : 'text-slate-400 hover:text-white'
              }`}
            >
              Marca en Texto
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('watermarkType', 'image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                formData.watermarkType === 'image' ? `${activeColorTheme.twBg} text-white shadow-xs` : 'text-slate-400 hover:text-white'
              }`}
            >
              Logo / Imagen de Agua
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {formData.watermarkType === 'image' ? (
              <div className="space-y-2 md:col-span-1">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Imagen / Logotipo de Marca de Agua:
                </label>
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleWatermarkFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  id="upload-watermark-device-btn"
                  onClick={() => watermarkInputRef.current?.click()}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${activeColorTheme.twBg} ${activeColorTheme.twBgHover}`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Marca desde Dispositivo</span>
                </button>
                {formData.watermarkImageUrl && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <img src={formData.watermarkImageUrl} alt="Watermark" className="h-6 object-contain" />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('watermarkImageUrl', '')}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Texto de la Marca de Agua:
                </label>
                <input
                  type="text"
                  id="branding-watermark-text-input"
                  value={formData.watermarkText}
                  onChange={(e) => handleFieldChange('watermarkText', e.target.value)}
                  placeholder="Ej. © LUMINA STUDIO • PROOF"
                  className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Opacidad de la Marca:
                </label>
                <span className="text-xs font-mono-code text-blue-500 font-bold">
                  {formData.watermarkOpacity}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={formData.watermarkOpacity}
                onChange={(e) => handleFieldChange('watermarkOpacity', Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-700 accent-blue-500 cursor-pointer mt-2"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Posición en la Fotografía:
              </label>
              <select
                id="branding-watermark-position-select"
                value={formData.watermarkPosition}
                onChange={(e) => handleFieldChange('watermarkPosition', e.target.value as any)}
                className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="bottom-right">Esquina Inferior Derecha</option>
                <option value="center">Centro de la Imagen</option>
                <option value="bottom-left">Esquina Inferior Izquierda</option>
                <option value="top-right">Esquina Superior Derecha</option>
                <option value="diagonal">Diagonal Central Inclinada</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: FOOTER & CONTACT */}
      {activeSubTab === 'footer' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pie de Página & Datos de Contacto
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configura los datos que se mostrarán al pie del portal y en las comunicaciones del estudio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nombre del Estudio en Pie de Página:
              </label>
              <input
                type="text"
                value={formData.footerStudioName}
                onChange={(e) => handleFieldChange('footerStudioName', e.target.value)}
                placeholder="Ej. LUMINA STUDIO PRO"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email de Atención:
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                placeholder="contacto@luminastudio.com"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Teléfono de Contacto:
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                placeholder="+34 910 882 120"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Instagram / Red Social:
              </label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => handleFieldChange('instagramHandle', e.target.value)}
                placeholder="@luminastudiopro"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Dirección del Estudio:
              </label>
              <input
                type="text"
                value={formData.contactAddress}
                onChange={(e) => handleFieldChange('contactAddress', e.target.value)}
                placeholder="Paseo de la Castellana 45, Madrid"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Sitio Web Oficial:
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                placeholder="https://luminastudio.com"
                className={`w-full text-xs rounded-xl p-3 border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: CLIENT EXPERIENCE & PERMISSIONS */}
      {activeSubTab === 'experience' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Experiencia del Cliente & Opciones Globales
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Activa o desactiva módulos funcionales para tus clientes en el visor y las galerías.
            </p>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Descargas Masivas en Archivo ZIP
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Permite que los clientes descarguen todas las fotos o sus favoritas empaquetadas en un único archivo ZIP.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.allowClientDownloads}
                onChange={(e) => handleFieldChange('allowClientDownloads', e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Módulo de Feedback y Reseñas de Clientes
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Habilita la caja de comentarios, valoraciones de 5 estrellas y solicitudes de retoque en cada galería.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.allowClientFeedback}
                onChange={(e) => handleFieldChange('allowClientFeedback', e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mostrar Metadatos EXIF de Cámara en Visor (Lightbox)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Muestra modelo de cámara, lente, apertura, obturador e ISO a los visitantes.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.showExifDataLightbox}
                onChange={(e) => handleFieldChange('showExifDataLightbox', e.target.checked)}
                className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: MODALS & POPUPS EDITOR */}
      {activeSubTab === 'modals' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-slate-800/60">
            <div>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white ${activeColorTheme.twBg}`}>
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Editor Integral de Ventanas Emergentes y Modales
                </h3>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Personaliza los títulos, subtítulos, etiquetas de campos, placeholders, botones y mensajes de error de todas las ventanas emergentes del sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleResetModalCategory(activeModalCategory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer self-start sm:self-auto ${
                isDark ? 'bg-slate-900 text-slate-400 hover:text-white border-slate-700' : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-300'
              }`}
              title="Restablecer textos del modal seleccionado a sus valores por defecto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer este Modal</span>
            </button>
          </div>

          {/* Modal Selection Tabs Bar */}
          <div className="space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Selecciona la Ventana Emergente a Personalizar:
            </span>
            <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-1.5 rounded-2xl border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              {[
                { id: 'authModal' as const, label: 'Login & PIN', icon: Key },
                { id: 'lockedGalleryModal' as const, label: 'PIN Visitante', icon: Lock },
                { id: 'galleryModal' as const, label: 'Sesiones', icon: FolderPlus },
                { id: 'userModal' as const, label: 'Clientes', icon: UserPlus },
                { id: 'uploadModal' as const, label: 'Subir Fotos', icon: Upload },
                { id: 'storageLimitModal' as const, label: 'Almacenaje', icon: HardDrive },
                { id: 'feedbackReplyModal' as const, label: 'Feedback', icon: MessageSquare },
                { id: 'userProfileModal' as const, label: 'Perfil Usuario', icon: Users },
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = activeModalCategory === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    id={`modal-selector-btn-${m.id}`}
                    onClick={() => setActiveModalCategory(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${activeColorTheme.twBg} text-white shadow-md font-bold scale-[1.02]`
                        : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[11px] leading-tight line-clamp-1">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Modal Editor Fields */}
          {(() => {
            const currentTexts = formData.modalTexts || DEFAULT_MODAL_TEXTS;

            if (activeModalCategory === 'authModal') {
              const modal = currentTexts.authModal || DEFAULT_MODAL_TEXTS.authModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Key className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">1. Modal de Inicio de Sesión & Autenticación (AuthModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono-code">Acceso Global</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título Pestaña Administrador:
                      </label>
                      <input
                        type="text"
                        value={modal.adminTabLabel}
                        onChange={(e) => handleModalTextChange('authModal', 'adminTabLabel', e.target.value)}
                        placeholder="Administrador"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título Pestaña Clientes:
                      </label>
                      <input
                        type="text"
                        value={modal.clientTabLabel}
                        onChange={(e) => handleModalTextChange('authModal', 'clientTabLabel', e.target.value)}
                        placeholder="Clientes"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de Cabecera (Admin):
                      </label>
                      <input
                        type="text"
                        value={modal.adminTitle}
                        onChange={(e) => handleModalTextChange('authModal', 'adminTitle', e.target.value)}
                        placeholder="Acceso de Administrador"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Subtítulo de Cabecera (Admin):
                      </label>
                      <input
                        type="text"
                        value={modal.adminSubtitle}
                        onChange={(e) => handleModalTextChange('authModal', 'adminSubtitle', e.target.value)}
                        placeholder="Panel de control, sesiones RAW y almacenamiento"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de Cabecera (Clientes):
                      </label>
                      <input
                        type="text"
                        value={modal.clientTitle}
                        onChange={(e) => handleModalTextChange('authModal', 'clientTitle', e.target.value)}
                        placeholder="Portal de Clientes"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Subtítulo de Cabecera (Clientes):
                      </label>
                      <input
                        type="text"
                        value={modal.clientSubtitle}
                        onChange={(e) => handleModalTextChange('authModal', 'clientSubtitle', e.target.value)}
                        placeholder="Accede a tus galerías privadas en alta resolución"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Usuario / Correo:
                      </label>
                      <input
                        type="text"
                        value={modal.emailLabel}
                        onChange={(e) => handleModalTextChange('authModal', 'emailLabel', e.target.value)}
                        placeholder="Usuario o Correo:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder Campo Usuario / Correo:
                      </label>
                      <input
                        type="text"
                        value={modal.emailPlaceholder}
                        onChange={(e) => handleModalTextChange('authModal', 'emailPlaceholder', e.target.value)}
                        placeholder="demo23 o correo admin"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Contraseña:
                      </label>
                      <input
                        type="text"
                        value={modal.passwordLabel}
                        onChange={(e) => handleModalTextChange('authModal', 'passwordLabel', e.target.value)}
                        placeholder="Contraseña:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder Campo Contraseña:
                      </label>
                      <input
                        type="text"
                        value={modal.passwordPlaceholder}
                        onChange={(e) => handleModalTextChange('authModal', 'passwordPlaceholder', e.target.value)}
                        placeholder="••••••••"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Iniciar Sesión:
                      </label>
                      <input
                        type="text"
                        value={modal.submitLoginText}
                        onChange={(e) => handleModalTextChange('authModal', 'submitLoginText', e.target.value)}
                        placeholder="Iniciar Sesión"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Acceso por PIN:
                      </label>
                      <input
                        type="text"
                        value={modal.submitPinText}
                        onChange={(e) => handleModalTextChange('authModal', 'submitPinText', e.target.value)}
                        placeholder="Acceder a la Galería"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-semibold block ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                      Mensaje de Error por Credenciales Incorrectas:
                    </label>
                    <input
                      type="text"
                      value={modal.errorMessageCredentials}
                      onChange={(e) => handleModalTextChange('authModal', 'errorMessageCredentials', e.target.value)}
                      placeholder="Credenciales no válidas. Por favor verifica tus datos de acceso."
                      className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                        isDark ? 'bg-slate-950 border-rose-900/60 text-rose-200 focus:ring-rose-500' : 'bg-rose-50 border-rose-200 text-rose-900 focus:ring-rose-500'
                      }`}
                    />
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'lockedGalleryModal') {
              const modal = currentTexts.lockedGalleryModal || DEFAULT_MODAL_TEXTS.lockedGalleryModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Lock className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">2. Modal de Galería Bloqueada para Visitantes (LockedGalleryModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono-code">Seguridad PIN</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título Principal:
                      </label>
                      <input
                        type="text"
                        value={modal.title}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'title', e.target.value)}
                        placeholder="Sesión Privada Protegida"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto del Badge de Seguridad:
                      </label>
                      <input
                        type="text"
                        value={modal.badgeText}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'badgeText', e.target.value)}
                        placeholder="Acceso Seguro PIN"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Descripción / Subtítulo del Modal:
                      </label>
                      <textarea
                        rows={2}
                        value={modal.subtitle}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'subtitle', e.target.value)}
                        placeholder="Esta galería fotográfica es privada. Introduce el código PIN de acceso..."
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta del Campo PIN:
                      </label>
                      <input
                        type="text"
                        value={modal.pinLabel}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'pinLabel', e.target.value)}
                        placeholder="Código PIN de Acceso:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder del Campo PIN:
                      </label>
                      <input
                        type="text"
                        value={modal.pinPlaceholder}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'pinPlaceholder', e.target.value)}
                        placeholder="Introduce el PIN (ej: 8492)"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto del Botón de Desbloqueo:
                      </label>
                      <input
                        type="text"
                        value={modal.submitButtonText}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'submitButtonText', e.target.value)}
                        placeholder="Desbloquear y Ver Fotos"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto del Botón Cancelar / Cerrar:
                      </label>
                      <input
                        type="text"
                        value={modal.cancelButtonText}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'cancelButtonText', e.target.value)}
                        placeholder="Cerrar"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto de Enlace para Clientes Registrados:
                      </label>
                      <input
                        type="text"
                        value={modal.clientLoginLinkText}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'clientLoginLinkText', e.target.value)}
                        placeholder="¿Tienes una cuenta registrada? Inicia sesión aquí"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                        Mensaje de Error por PIN Incorrecto:
                      </label>
                      <input
                        type="text"
                        value={modal.errorMessage}
                        onChange={(e) => handleModalTextChange('lockedGalleryModal', 'errorMessage', e.target.value)}
                        placeholder="Código PIN incorrecto para esta sesión. Por favor verifica con tu fotógrafo."
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-rose-900/60 text-rose-200 focus:ring-rose-500' : 'bg-rose-50 border-rose-200 text-rose-900 focus:ring-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'galleryModal') {
              const modal = currentTexts.galleryModal || DEFAULT_MODAL_TEXTS.galleryModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FolderPlus className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">3. Modal de Creación y Edición de Sesiones (GalleryModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono-code">Álbumes</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título al Crear Sesión:
                      </label>
                      <input
                        type="text"
                        value={modal.createTitle}
                        onChange={(e) => handleModalTextChange('galleryModal', 'createTitle', e.target.value)}
                        placeholder="Nueva Sesión Fotográfica"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título al Editar Sesión:
                      </label>
                      <input
                        type="text"
                        value={modal.editTitle}
                        onChange={(e) => handleModalTextChange('galleryModal', 'editTitle', e.target.value)}
                        placeholder="Editar Sesión Fotográfica"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Título:
                      </label>
                      <input
                        type="text"
                        value={modal.titleLabel}
                        onChange={(e) => handleModalTextChange('galleryModal', 'titleLabel', e.target.value)}
                        placeholder="Título de la Sesión / Nombre de Clientes:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder Campo Título:
                      </label>
                      <input
                        type="text"
                        value={modal.titlePlaceholder}
                        onChange={(e) => handleModalTextChange('galleryModal', 'titlePlaceholder', e.target.value)}
                        placeholder="Ej. Sofía & Mateo • Boda de Ensueño"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Subtítulo:
                      </label>
                      <input
                        type="text"
                        value={modal.subtitleLabel}
                        onChange={(e) => handleModalTextChange('galleryModal', 'subtitleLabel', e.target.value)}
                        placeholder="Subtítulo / Colección:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo PIN:
                      </label>
                      <input
                        type="text"
                        value={modal.pinLabel}
                        onChange={(e) => handleModalTextChange('galleryModal', 'pinLabel', e.target.value)}
                        placeholder="PIN de Acceso Privado (4-6 dígitos):"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Publicar Sesión:
                      </label>
                      <input
                        type="text"
                        value={modal.submitCreateText}
                        onChange={(e) => handleModalTextChange('galleryModal', 'submitCreateText', e.target.value)}
                        placeholder="Guardar y Publicar Sesión"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Actualizar Sesión:
                      </label>
                      <input
                        type="text"
                        value={modal.submitEditText}
                        onChange={(e) => handleModalTextChange('galleryModal', 'submitEditText', e.target.value)}
                        placeholder="Actualizar Sesión"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'userModal') {
              const modal = currentTexts.userModal || DEFAULT_MODAL_TEXTS.userModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <UserPlus className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">4. Modal de Clientes y Usuarios (UserModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono-code">CRM</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título al Registrar Cliente:
                      </label>
                      <input
                        type="text"
                        value={modal.createTitle}
                        onChange={(e) => handleModalTextChange('userModal', 'createTitle', e.target.value)}
                        placeholder="Registrar Nuevo Cliente / Fotógrafo"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título al Editar Usuario:
                      </label>
                      <input
                        type="text"
                        value={modal.editTitle}
                        onChange={(e) => handleModalTextChange('userModal', 'editTitle', e.target.value)}
                        placeholder="Editar Datos de Usuario"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Nombre:
                      </label>
                      <input
                        type="text"
                        value={modal.nameLabel}
                        onChange={(e) => handleModalTextChange('userModal', 'nameLabel', e.target.value)}
                        placeholder="Nombre Completo:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder Campo Nombre:
                      </label>
                      <input
                        type="text"
                        value={modal.namePlaceholder}
                        onChange={(e) => handleModalTextChange('userModal', 'namePlaceholder', e.target.value)}
                        placeholder="Ej. Sofía Valenzuela"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Correo:
                      </label>
                      <input
                        type="text"
                        value={modal.emailLabel}
                        onChange={(e) => handleModalTextChange('userModal', 'emailLabel', e.target.value)}
                        placeholder="Correo Electrónico:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Teléfono:
                      </label>
                      <input
                        type="text"
                        value={modal.phoneLabel}
                        onChange={(e) => handleModalTextChange('userModal', 'phoneLabel', e.target.value)}
                        placeholder="Teléfono / WhatsApp:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Crear Cliente:
                      </label>
                      <input
                        type="text"
                        value={modal.submitCreateText}
                        onChange={(e) => handleModalTextChange('userModal', 'submitCreateText', e.target.value)}
                        placeholder="Crear Cliente"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Actualizar Usuario:
                      </label>
                      <input
                        type="text"
                        value={modal.submitEditText}
                        onChange={(e) => handleModalTextChange('userModal', 'submitEditText', e.target.value)}
                        placeholder="Actualizar Usuario"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'uploadModal') {
              const modal = currentTexts.uploadModal || DEFAULT_MODAL_TEXTS.uploadModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Upload className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">5. Modal de Subida de Fotografías RAW / JPEG (UploadModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono-code">Archivos</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de Cabecera:
                      </label>
                      <input
                        type="text"
                        value={modal.title}
                        onChange={(e) => handleModalTextChange('uploadModal', 'title', e.target.value)}
                        placeholder="Subir Nueva Fotografía"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Subtítulo / Descripción:
                      </label>
                      <input
                        type="text"
                        value={modal.subtitle}
                        onChange={(e) => handleModalTextChange('uploadModal', 'subtitle', e.target.value)}
                        placeholder="Almacena archivos RAW o JPEG de alta resolución..."
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Zona de Arrastre (Dropzone):
                      </label>
                      <input
                        type="text"
                        value={modal.dropzoneTitle}
                        onChange={(e) => handleModalTextChange('uploadModal', 'dropzoneTitle', e.target.value)}
                        placeholder="Arrastra o selecciona una foto desde tu dispositivo"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Formatos Compatibles (Hint):
                      </label>
                      <input
                        type="text"
                        value={modal.dropzoneHint}
                        onChange={(e) => handleModalTextChange('uploadModal', 'dropzoneHint', e.target.value)}
                        placeholder="Compatible con RAW (.CR3, .ARW, .NEF), JPEG, PNG y WebP"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto del Botón de Subida:
                      </label>
                      <input
                        type="text"
                        value={modal.submitButtonText}
                        onChange={(e) => handleModalTextChange('uploadModal', 'submitButtonText', e.target.value)}
                        placeholder="Subir Fotografía al Servidor"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'storageLimitModal') {
              const modal = currentTexts.storageLimitModal || DEFAULT_MODAL_TEXTS.storageLimitModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <HardDrive className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">6. Modal de Límite de Almacenamiento (StorageLimitModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono-code">Disco</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de Cabecera:
                      </label>
                      <input
                        type="text"
                        value={modal.title}
                        onChange={(e) => handleModalTextChange('storageLimitModal', 'title', e.target.value)}
                        placeholder="Límite de Almacenamiento"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Subtítulo:
                      </label>
                      <input
                        type="text"
                        value={modal.subtitle}
                        onChange={(e) => handleModalTextChange('storageLimitModal', 'subtitle', e.target.value)}
                        placeholder="Ajusta la cuota de disco disponible del servidor"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Guardar Límite:
                      </label>
                      <input
                        type="text"
                        value={modal.submitButtonText}
                        onChange={(e) => handleModalTextChange('storageLimitModal', 'submitButtonText', e.target.value)}
                        placeholder="Guardar Límite"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Cancelar:
                      </label>
                      <input
                        type="text"
                        value={modal.cancelButtonText}
                        onChange={(e) => handleModalTextChange('storageLimitModal', 'cancelButtonText', e.target.value)}
                        placeholder="Cancelar"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'feedbackReplyModal') {
              const modal = currentTexts.feedbackReplyModal || DEFAULT_MODAL_TEXTS.feedbackReplyModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">7. Modal de Respuestas a Feedback de Clientes (FeedbackReplyModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono-code">Atención</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de la Ventana:
                      </label>
                      <input
                        type="text"
                        value={modal.title}
                        onChange={(e) => handleModalTextChange('feedbackReplyModal', 'title', e.target.value)}
                        placeholder="Responder Comentario del Cliente"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta del Campo de Respuesta:
                      </label>
                      <input
                        type="text"
                        value={modal.label}
                        onChange={(e) => handleModalTextChange('feedbackReplyModal', 'label', e.target.value)}
                        placeholder="Tu Respuesta Oficial:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder del Campo:
                      </label>
                      <input
                        type="text"
                        value={modal.placeholder}
                        onChange={(e) => handleModalTextChange('feedbackReplyModal', 'placeholder', e.target.value)}
                        placeholder="Escribe tu respuesta para el cliente..."
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Enviar Respuesta:
                      </label>
                      <input
                        type="text"
                        value={modal.submitButtonText}
                        onChange={(e) => handleModalTextChange('feedbackReplyModal', 'submitButtonText', e.target.value)}
                        placeholder="Enviar Respuesta"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Cancelar:
                      </label>
                      <input
                        type="text"
                        value={modal.cancelButtonText}
                        onChange={(e) => handleModalTextChange('feedbackReplyModal', 'cancelButtonText', e.target.value)}
                        placeholder="Cancelar"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (activeModalCategory === 'userProfileModal') {
              const modal = currentTexts.userProfileModal || DEFAULT_MODAL_TEXTS.userProfileModal;
              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${activeColorTheme.twText}`} />
                      <span className="text-xs font-bold">8. Modal de Perfil de Usuario (UserProfileModal)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono-code">Cuenta</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Título de la Ventana:
                      </label>
                      <input
                        type="text"
                        value={modal.title}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'title', e.target.value)}
                        placeholder="Mi Perfil de Usuario"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Nombre:
                      </label>
                      <input
                        type="text"
                        value={modal.nameLabel}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'nameLabel', e.target.value)}
                        placeholder="Nombre Completo:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Correo:
                      </label>
                      <input
                        type="text"
                        value={modal.emailLabel}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'emailLabel', e.target.value)}
                        placeholder="Correo Electrónico:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Etiqueta Campo Teléfono:
                      </label>
                      <input
                        type="text"
                        value={modal.phoneLabel}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'phoneLabel', e.target.value)}
                        placeholder="Teléfono de Contacto:"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Placeholder Campo Teléfono:
                      </label>
                      <input
                        type="text"
                        value={modal.phonePlaceholder}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'phonePlaceholder', e.target.value)}
                        placeholder="+34 600 000 000"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Guardar Cambios:
                      </label>
                      <input
                        type="text"
                        value={modal.submitButtonText}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'submitButtonText', e.target.value)}
                        placeholder="Guardar Cambios"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Texto Botón Cancelar:
                      </label>
                      <input
                        type="text"
                        value={modal.cancelButtonText}
                        onChange={(e) => handleModalTextChange('userProfileModal', 'cancelButtonText', e.target.value)}
                        placeholder="Cancelar"
                        className={`w-full text-xs rounded-xl p-3 border focus:ring-2 focus:outline-none transition-all ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })()}

        </div>
      )}

      {/* Floating Save Footer Bar */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-lg ${
        isDark ? 'bg-[#141618] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className={`w-4 h-4 ${activeColorTheme.twText}`} />
          <span>Configuración activa: <strong>{formData.studioName}</strong> ({activeColorTheme.name})</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer ${activeColorTheme.twBg} ${activeColorTheme.twBgHover} ${activeColorTheme.twShadow}`}
        >
          <Check className="w-4 h-4" />
          <span>Guardar Cambios de Marca & Diseño</span>
        </button>
      </div>

    </div>
  );
};
