import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Heart, Download, Camera, Sliders, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, Info, Sparkles, Check, HardDrive
} from 'lucide-react';
import { GalleryImage, User, StudioBrandingConfig } from '../types';
import { formatBytes, downloadSingleImage } from '../services/storageService';
import { COLOR_PRESET_MAP } from '../services/brandingService';

interface PhotoLightboxProps {
  image: GalleryImage | null;
  images: GalleryImage[];
  currentUser: User | null;
  canDownload: boolean;
  canFavorite: boolean;
  onClose: () => void;
  onSelectImage: (image: GalleryImage) => void;
  onToggleFavorite: (imageId: string) => void;
  branding?: StudioBrandingConfig;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  image,
  images,
  currentUser,
  canDownload,
  canFavorite,
  onClose,
  onSelectImage,
  onToggleFavorite,
  branding,
}) => {
  const [showExif, setShowExif] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [downloadingType, setDownloadingType] = useState<'high-res' | 'web-res' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);

  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  useEffect(() => {
    setZoomLevel(1);
    setDownloadSuccess(false);
  }, [image?.id]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const modalEl = document.getElementById('photo-lightbox-modal');
        if (modalEl && modalEl.requestFullscreen) {
          await modalEl.requestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsImmersive(prev => !prev);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      // In case iframe blocks requestFullscreen, activate immersive overlay mode
      setIsImmersive(prev => !prev);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;
      if (e.key === 'Escape') {
        if (isImmersive) {
          setIsImmersive(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'i' || e.key === 'I') {
        setIsImmersive(prev => !prev);
      }
      if (e.key === 'h' || e.key === 'H' || e.key === 'v' || e.key === 'V') {
        if (canFavorite) onToggleFavorite(image.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, images, canFavorite, isImmersive]);

  if (!image) return null;

  const currentIndex = images.findIndex(img => img.id === image.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectImage(images[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectImage(images[currentIndex + 1]);
  };

  const isFavorite = currentUser ? image.favoriteByUsers.includes(currentUser.id) : false;

  const handleDownload = async (type: 'high-res' | 'web-res') => {
    setDownloadingType(type);
    await downloadSingleImage(image, type);
    setDownloadingType(null);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div 
      id="photo-lightbox-modal"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="text-slate-100 font-medium text-sm sm:text-base truncate max-w-[280px] sm:max-w-md">
              {image.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono-code">{currentIndex + 1} de {images.length}</span>
              <span>•</span>
              <span className="font-mono-code">{image.width} × {image.height} px</span>
              <span>•</span>
              <span className={`${colorTheme.twText} font-mono-code`}>{formatBytes(image.fileSizeBytes)} RAW</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-900 rounded-lg border border-slate-800 p-1">
            <button
              id="lightbox-zoom-out-btn"
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono-code text-slate-300 min-w-[48px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="lightbox-zoom-in-btn"
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Exif */}
          <button
            id="lightbox-toggle-exif-btn"
            onClick={() => setShowExif(!showExif)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showExif 
                ? `${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}` 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Ver detalles técnicos y metadatos EXIF"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Fullscreen / Immersive Toggle */}
          <button
            id="lightbox-fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              isFullscreen || isImmersive
                ? `${colorTheme.twBg} text-white ${colorTheme.twBorder} shadow-sm`
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            title={isFullscreen || isImmersive ? 'Salir de pantalla completa (F o Esc)' : 'Expandir a pantalla completa (F)'}
          >
            {isFullscreen || isImmersive ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
            <span className="hidden md:inline text-xs font-medium">
              {isFullscreen || isImmersive ? 'Ventana' : 'Pantalla Completa'}
            </span>
          </button>

          {/* Favorite Button */}
          {canFavorite && (
            <button
              id="lightbox-fav-btn"
              onClick={() => onToggleFavorite(image.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-rose-500/50 hover:text-rose-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'En Favoritos' : 'Favorita'}</span>
            </button>
          )}

          {/* Download Button */}
          {canDownload && (
            <div className="relative group">
              <button
                id="lightbox-download-highres-btn"
                onClick={() => handleDownload('high-res')}
                disabled={downloadingType !== null}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Descargado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Descargar RAW</span>
                    <span className="sm:hidden">Descargar</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Close button */}
          <button
            id="lightbox-close-btn"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Area with Sidebar */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Previous Button */}
        {hasPrev && (
          <button
            id="lightbox-prev-arrow-btn"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all shadow-2xl cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Stage Image */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={image.highResUrl || image.url}
              alt={image.title}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
              }}
              className={`${
                isFullscreen || isImmersive ? 'max-h-[88vh] max-w-[96vw]' : 'max-h-[75vh] max-w-full'
              } object-contain rounded-lg shadow-2xl border border-slate-800 transition-all`}
            />
            {isFavorite && (
              <div className="absolute top-4 right-4 bg-rose-600/90 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Foto Seleccionada</span>
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        {hasNext && (
          <button
            id="lightbox-next-arrow-btn"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white transition-all shadow-2xl cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Technical EXIF & Metadata Sidebar */}
        {showExif && (
          <div 
            id="lightbox-exif-drawer"
            className="w-80 bg-slate-900/95 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto z-20 animate-in slide-in-from-right duration-200"
          >
            <div className="space-y-6">
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${colorTheme.twText}`}>
                  Especificaciones de Archivo
                </span>
                <h4 className="text-base font-medium text-slate-100 mt-1 font-serif-display">
                  {image.title}
                </h4>
                <p className="text-xs text-slate-400 font-mono-code mt-0.5">
                  {image.originalFileName}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    Cámara
                  </span>
                  <span className="text-slate-200 font-medium">{image.cameraModel || 'Canon Pro System'}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    Objetivo
                  </span>
                  <span className="text-slate-200 font-medium">{image.lens || 'Prime Master Lens'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Distancia Focal</span>
                    <span className="text-slate-200 font-mono-code">{image.focalLength || '50mm'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Apertura</span>
                    <span className="text-slate-200 font-mono-code">{image.aperture || 'f/1.8'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Velocidad</span>
                    <span className="text-slate-200 font-mono-code">{image.shutterSpeed || '1/1000s'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sensibilidad ISO</span>
                    <span className="text-slate-200 font-mono-code">ISO {image.iso || 100}</span>
                  </div>
                </div>
              </div>

              {/* Storage & Resolution Metrics */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                    Peso en Servidor
                  </span>
                  <span className={`${colorTheme.twText} font-semibold font-mono-code`}>{formatBytes(image.fileSizeBytes)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Resolución Nativa</span>
                  <span className="text-slate-200 font-mono-code">{image.width} × {image.height} px</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estado de Optimización</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    image.optimized ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {image.optimized ? 'WebP Optimizado' : 'RAW Sin comprimir'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {image.tags && image.tags.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">
                    Etiquetas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {image.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Download options in Drawer */}
            {canDownload && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400 mb-1">Opciones de Descarga Directa:</p>
                <button
                  id="drawer-download-raw-btn"
                  onClick={() => handleDownload('high-res')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                    Original High-Res
                  </span>
                  <span className="font-mono-code text-[11px] text-slate-400">{formatBytes(image.fileSizeBytes)}</span>
                </button>
                <button
                  id="drawer-download-web-btn"
                  onClick={() => handleDownload('web-res')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    Web & Redes Sociales
                  </span>
                  <span className="font-mono-code text-[11px] text-slate-400">~2.5 MB</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnail bar */}
      <div className="h-20 bg-slate-950 border-t border-slate-800 px-6 flex items-center gap-3 overflow-x-auto">
        {images.map((img, idx) => {
          const isSelected = img.id === image.id;
          const isFav = currentUser ? img.favoriteByUsers.includes(currentUser.id) : false;
          return (
            <div
              key={img.id}
              onClick={() => onSelectImage(img)}
              className={`relative flex-shrink-0 h-14 w-20 rounded-md overflow-hidden cursor-pointer transition-all ${
                isSelected 
                  ? `ring-2 ${colorTheme.twRing} scale-105 opacity-100` 
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              {isFav && (
                <div className="absolute top-1 right-1 p-0.5 bg-rose-600 rounded-full text-white">
                  <Heart className="w-2.5 h-2.5 fill-current" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
