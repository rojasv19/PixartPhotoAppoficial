import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, Heart, Download, MessageSquare, Share2, MapPin, 
  Calendar, Camera, Check, Filter, Grid, LayoutGrid, Sparkles, 
  Star, Send, HardDrive, ShieldAlert, CheckCircle2, ChevronDown, 
  Info, Eye, Layers, Lock, Upload, X, ImageIcon, Maximize2
} from 'lucide-react';
import { GallerySession, GalleryImage, User, FeedbackItem, StudioBrandingConfig } from '../types';
import { formatBytes, downloadSingleImage, downloadImagesAsZip } from '../services/storageService';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { PhotoLightbox } from './PhotoLightbox';
import { BatchDownloadModal } from './BatchDownloadModal';

interface GalleryViewProps {
  gallery: GallerySession;
  images: GalleryImage[];
  currentUser: User | null;
  onBack: () => void;
  onToggleFavorite: (imageId: string) => void;
  onAddFeedback: (galleryId: string, feedback: Omit<FeedbackItem, 'id' | 'createdAt'>) => void;
  onUpdateGallery?: (updatedGallery: GallerySession) => void;
  onRequestLogin: () => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  gallery,
  images,
  currentUser,
  onBack,
  onToggleFavorite,
  onAddFeedback,
  onRequestLogin,
  theme = 'dark',
  branding,
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | string>('all');
  const [gridColumns, setGridColumns] = useState<'masonry' | 'standard' | 'large'>('masonry');
  
  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackItem['category']>('felicitacion');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackAttachment, setFeedbackAttachment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState<boolean>(false);
  const feedbackFileInputRef = useRef<HTMLInputElement>(null);

  const handleFeedbackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFeedbackAttachment(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Batch ZIP Download State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchCurrentFile, setBatchCurrentFile] = useState('');
  const [batchIsDone, setBatchIsDone] = useState(false);
  const [favoritesSentSuccess, setFavoritesSentSuccess] = useState(false);

  // Gallery specific images
  const galleryImages = useMemo(() => {
    return images.filter(img => img.galleryId === gallery.id);
  }, [images, gallery.id]);

  // Client Favorites
  const clientFavorites = useMemo(() => {
    if (!currentUser) return [];
    return galleryImages.filter(img => img.favoriteByUsers.includes(currentUser.id));
  }, [galleryImages, currentUser]);

  // Unique tags for filter
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    galleryImages.forEach(img => img.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [galleryImages]);

  // Filtered Images
  const displayedImages = useMemo(() => {
    if (filterMode === 'all') return galleryImages;
    if (filterMode === 'favorites') return clientFavorites;
    return galleryImages.filter(img => img.tags?.includes(filterMode));
  }, [galleryImages, clientFavorites, filterMode]);

  // Total Storage Size of this gallery
  const totalGalleryBytes = useMemo(() => {
    return galleryImages.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
  }, [galleryImages]);

  const canDownload = currentUser ? (currentUser.canDownloadHighRes ?? gallery.allowDownloadHighRes) : gallery.allowDownloadHighRes;
  const canFavorite = currentUser ? (currentUser.canSelectFavorites ?? gallery.allowFavoritesSubmission) : true;
  const canFeedback = currentUser ? (currentUser.canLeaveFeedback ?? gallery.allowFeedback) : true;

  // Effective personalized max favorites limit
  const effectiveMaxFavorites = useMemo(() => {
    if (currentUser && gallery.clientPhotoLimits && gallery.clientPhotoLimits[currentUser.id] !== undefined) {
      return gallery.clientPhotoLimits[currentUser.id];
    }
    return gallery.maxFavoritesSelection;
  }, [currentUser, gallery.clientPhotoLimits, gallery.maxFavoritesSelection]);

  // Handle favorites submission to photographer
  const handleSendFavorites = () => {
    if (clientFavorites.length === 0) return;
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setFavoritesSentSuccess(true);
    setTimeout(() => setFavoritesSentSuccess(false), 4500);

    // Auto-record feedback notice
    if (currentUser) {
      onAddFeedback(gallery.id, {
        galleryId: gallery.id,
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientAvatar: currentUser.avatar,
        rating: 5,
        message: `Selección confirmada de ${clientFavorites.length} fotografías favoritas para la maquetación y entrega final.`,
        category: 'entrega',
        favoriteCountAtTime: clientFavorites.length,
        status: 'reviewed',
      });
    }
  };

  // Trigger batch ZIP download
  const handleStartBatchDownload = async (onlyFavorites = false) => {
    const targetImages = onlyFavorites ? clientFavorites : galleryImages;
    if (targetImages.length === 0) return;

    setIsBatchModalOpen(true);
    setBatchProgress(0);
    setBatchIsDone(false);
    setBatchCurrentFile('Iniciando empaquetado seguro...');

    await downloadImagesAsZip(
      targetImages,
      `${gallery.title}_${onlyFavorites ? 'Favoritas' : 'Completa'}`,
      (percent, fileName) => {
        setBatchProgress(percent);
        setBatchCurrentFile(fileName);
      }
    );

    setBatchIsDone(true);
  };

  // Submit Feedback
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    if (!currentUser) {
      onRequestLogin();
      return;
    }

    onAddFeedback(gallery.id, {
      galleryId: gallery.id,
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientAvatar: currentUser.avatar,
      rating: feedbackRating,
      message: feedbackText.trim(),
      attachmentUrl: feedbackAttachment || undefined,
      category: feedbackCategory,
      favoriteCountAtTime: clientFavorites.length,
      status: 'pending',
    });

    setFeedbackText('');
    setFeedbackAttachment('');
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 4000);
  };

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors ${
      isDark ? 'bg-[#0F1012] text-slate-100' : 'bg-[#F8F9FA] text-slate-800'
    }`}>
      
      {/* Top Breadcrumb & Quick Actions Bar */}
      <div className={`sticky top-16 z-30 backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 py-3 shadow-xs transition-colors ${
        isDark ? 'bg-[#141618]/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              id="gallery-back-btn"
              onClick={onBack}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isDark ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Galerías</span>
            </button>

            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className={`hidden sm:inline text-xs font-mono-code truncate max-w-[200px] uppercase font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {gallery.category}
            </span>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            
            {/* Toggle Feedback Section */}
            <button
              id="gallery-feedback-toggle-btn"
              onClick={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showFeedbackDrawer 
                  ? `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder}` 
                  : isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
              <span>Feedback & Comentarios ({gallery.feedbackList?.length || 0})</span>
            </button>

            {/* Batch Download Button */}
            {canDownload && (
              <button
                id="gallery-batch-download-btn"
                onClick={() => handleStartBatchDownload(false)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Download className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span className="hidden md:inline">Descargar Álbum ZIP ({galleryImages.length})</span>
                <span className="md:hidden">ZIP ({galleryImages.length})</span>
              </button>
            )}

            {/* Send Favorites Selection */}
            {canFavorite && clientFavorites.length > 0 && (
              <button
                id="gallery-send-favorites-btn"
                onClick={handleSendFavorites}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Enviar {clientFavorites.length} Favoritas</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Success Notification Alert */}
      {favoritesSentSuccess && (
        <div 
          id="favorites-success-toast"
          className="max-w-xl mx-auto mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>¡Excelente! Tu selección de <strong>{clientFavorites.length} fotografías favoritas</strong> ha sido enviada al fotógrafo para procesar tu álbum.</span>
          </div>
          <button 
            onClick={() => setFavoritesSentSuccess(false)}
            className="text-emerald-500 hover:text-emerald-400 font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className={`relative rounded-3xl overflow-hidden border shadow-2xl text-white ${
          isDark ? 'border-slate-800 bg-[#16181B]' : 'border-slate-800 bg-slate-900'
        }`}>
          
          {/* Background blurred cover */}
          <div className="absolute inset-0 z-0">
            <img 
              src={gallery.coverImage} 
              alt={gallery.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-35 filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-6">
            
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
                {gallery.category}
              </span>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700">
                <Calendar className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span>{new Date(gallery.eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700">
                <MapPin className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span>{gallery.location}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700">
                <HardDrive className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span className="font-mono-code">{formatBytes(totalGalleryBytes)} en Servidor</span>
              </div>
            </div>

            {/* Main Title & Subtitle */}
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-serif-display leading-tight">
                {gallery.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {gallery.subtitle || gallery.description}
              </p>
            </div>

            {/* Quick Stat summary pills */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Cliente Asignado:</span>
                <span className="text-white text-xs font-semibold">{gallery.clientNames?.join(', ') || 'Cliente VIP'}</span>
              </div>

              <span className="text-slate-700">•</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Total Fotografías:</span>
                <span className={`font-mono-code text-xs font-bold ${colorTheme.twText}`}>{galleryImages.length} fotos</span>
              </div>

              <span className="text-slate-700">•</span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Favoritas Seleccionadas:</span>
                <span className="text-rose-400 font-mono-code text-xs font-bold">
                  {clientFavorites.length} {effectiveMaxFavorites ? `/ máx. ${effectiveMaxFavorites}` : ''}
                </span>
              </div>

              {gallery.accessPin && (
                <>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock className={`w-3 h-3 ${colorTheme.twText}`} />
                    <span>PIN de Galería: <strong className="font-mono-code text-slate-200">{gallery.accessPin}</strong></span>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Layout with Filter Toolbar & Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Sticky Filters & View Layout Toolbar */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl border shadow-sm transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              id="filter-all-btn"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                filterMode === 'all'
                  ? `${colorTheme.twBg} text-white font-bold shadow-md`
                  : isDark ? 'bg-slate-850 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({galleryImages.length})
            </button>

            <button
              id="filter-favorites-btn"
              onClick={() => setFilterMode('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                filterMode === 'favorites'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                  : isDark ? 'bg-slate-850 text-rose-400 hover:bg-slate-800' : 'bg-slate-100 text-rose-600 hover:bg-slate-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${filterMode === 'favorites' ? 'fill-current' : ''}`} />
              <span>Favoritas ({clientFavorites.length})</span>
            </button>

            {/* Tag filters */}
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                id={`filter-tag-${tag.toLowerCase()}-btn`}
                onClick={() => setFilterMode(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  filterMode === tag
                    ? `${colorTheme.twBg} text-white font-semibold`
                    : isDark ? 'bg-slate-850 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Grid Density View Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {filterMode === 'favorites' && clientFavorites.length > 0 && canDownload && (
              <button
                id="download-favorites-zip-btn"
                onClick={() => handleStartBatchDownload(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar {clientFavorites.length} Favoritas (ZIP)</span>
              </button>
            )}

            <div className={`flex items-center rounded-xl p-1 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                id="grid-masonry-btn"
                onClick={() => setGridColumns('masonry')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  gridColumns === 'masonry' ? `${colorTheme.twBg} text-white shadow-xs` : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Diseño Editorial Masonry"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                id="grid-standard-btn"
                onClick={() => setGridColumns('standard')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  gridColumns === 'standard' ? `${colorTheme.twBg} text-white shadow-xs` : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cuadrícula Estándar (3 columnas)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                id="grid-large-btn"
                onClick={() => setGridColumns('large')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  gridColumns === 'large' ? `${colorTheme.twBg} text-white shadow-xs` : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista Detallada Grande (2 columnas)"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Empty state if no images match filter */}
        {displayedImages.length === 0 && (
          <div className={`text-center py-20 rounded-3xl border p-8 space-y-4 shadow-sm transition-colors ${
            isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isDark ? 'bg-slate-850 text-slate-500' : 'bg-slate-100 text-slate-400'
            }`}>
              <Heart className="w-8 h-8" />
            </div>
            <h3 className={`text-lg font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {filterMode === 'favorites' ? 'Aún no has marcado fotos favoritas' : 'No hay fotografías en esta categoría'}
            </h3>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {filterMode === 'favorites' 
                ? 'Haz clic en el icono de corazón en cualquier foto para guardarla en tu selección personal para el álbum o retoques.'
                : 'Cambia el filtro a "Todas" para explorar el catálogo completo de la sesión.'
              }
            </p>
            {filterMode === 'favorites' && (
              <button
                id="reset-filter-to-all-btn"
                onClick={() => setFilterMode('all')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Ver Todas las Fotos
              </button>
            )}
          </div>
        )}

        {/* Gallery Image Grid */}
        <div className={`grid gap-6 ${
          gridColumns === 'masonry'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : gridColumns === 'standard'
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {displayedImages.map((image, idx) => {
            const isFav = currentUser ? image.favoriteByUsers.includes(currentUser.id) : false;
            return (
              <div
                key={image.id}
                id={`photo-card-${image.id}`}
                className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col ${
                  isDark ? 'bg-[#181A1D] border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                {/* Image Container */}
                <div 
                  onClick={() => setSelectedImage(image)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  
                  {/* Subtle Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  
                  {/* Click to open indicator */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-xs font-medium border border-slate-700/60 shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform">
                      <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Pantalla Completa</span>
                    </span>
                  </div>

                  {/* Top Badges: File Size & High-res indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono-code text-blue-300 border border-blue-500/30">
                      {formatBytes(image.fileSizeBytes)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono-code text-slate-300 border border-slate-700/60">
                      {image.width} × {image.height}
                    </span>
                  </div>

                  {/* Top Right Heart Favorite Button */}
                  {canFavorite && (
                    <button
                      id={`fav-toggle-btn-${image.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(image.id);
                      }}
                      className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer ${
                        isFav
                          ? 'bg-rose-600 text-white scale-110 shadow-rose-600/30'
                          : 'bg-slate-950/70 text-slate-300 hover:text-rose-400 hover:bg-slate-900 border border-slate-700/60'
                      }`}
                      title={isFav ? 'Eliminar de favoritos' : 'Agregar a favoritas'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Card Info Footer */}
                <div className={`p-4 flex items-center justify-between gap-3 border-t transition-colors ${
                  isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <div className="truncate">
                    <h4 className={`text-xs sm:text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {image.title}
                    </h4>
                    <p className={`text-[11px] font-mono-code truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {image.cameraModel ? `${image.cameraModel} • ${image.lens || 'Prime'}` : image.originalFileName}
                    </p>
                  </div>

                  {/* Direct Download Icon */}
                  {canDownload && (
                    <button
                      id={`direct-download-img-${image.id}`}
                      onClick={() => downloadSingleImage(image, 'high-res')}
                      className={`p-2 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
                        isDark ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-blue-600 border-slate-200'
                      }`}
                      title="Descargar archivo en alta resolución"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Integrated Feedback & Client Impressions Section */}
        <div 
          id="gallery-feedback-section" 
          className={`mt-16 rounded-3xl border p-6 sm:p-10 shadow-xl space-y-8 transition-colors ${
            isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">
                Comunicación & Reseñas
              </span>
              <h3 className={`text-2xl font-bold font-serif-display mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Impresiones del Proyecto Fotográfico
              </h3>
              <p className={`text-xs mt-1 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Espacio integrado para que el cliente comparta comentarios, valoraciones o solicite retoques específicos sobre esta sesión.
              </p>
            </div>

            {/* Client feedback count summary */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-right">
                <span className={`text-lg font-bold font-mono-code ${isDark ? 'text-white' : 'text-slate-800'}`}>5.0</span>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Valoración Promedio</p>
              </div>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
          </div>

          {/* Form to leave feedback */}
          {canFeedback && (
            <form onSubmit={handleSubmitFeedback} className={`p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Rating stars picker */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tu Calificación de la Sesión:</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        id={`rating-star-${star}`}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= feedbackRating ? 'fill-current' : isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className={`text-xs font-semibold ml-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{feedbackRating} de 5 estrellas</span>
                  </div>
                </div>

                {/* Feedback Category */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Tipo de Mensaje:</label>
                  <select
                    id="feedback-category-select"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value as any)}
                    className={`text-xs rounded-xl px-3 py-2 border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="felicitacion">🌟 Felicitación & Reseña General</option>
                    <option value="retoque">🎨 Solicitud de Retoque o Ajuste</option>
                    <option value="entrega">📦 Consulta de Entrega & Álbum</option>
                    <option value="general">💬 Comentario General</option>
                  </select>
                </div>

              </div>

              {/* Feedback text area */}
              <div className="space-y-1">
                <label className={`text-xs font-medium block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tus Impresiones y Comentarios:
                </label>
                <textarea
                  id="feedback-message-input"
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Escribe aquí tu opinión sobre las tomas, la iluminación, momentos favoritos o solicitudes de encuadre..."
                  className={`w-full rounded-xl p-3 text-xs border focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Optional image attachment from device */}
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Adjuntar Imagen de Referencia o Retoque (Opcional):
                  </span>
                  {feedbackAttachment && (
                    <button
                      type="button"
                      onClick={() => setFeedbackAttachment('')}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {feedbackAttachment ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shadow-xs shrink-0">
                      <img 
                        src={feedbackAttachment} 
                        alt="Adjunto preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : null}

                  <div>
                    <input
                      ref={feedbackFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFeedbackFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="upload-feedback-attachment-btn"
                      onClick={() => feedbackFileInputRef.current?.click()}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' 
                          : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>{feedbackAttachment ? 'Cambiar imagen desde dispositivo' : 'Subir imagen desde tu dispositivo'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className={`text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Se adjuntará tu estado actual de <strong>{clientFavorites.length} favoritas</strong> seleccionadas.</span>
                </div>

                <button
                  type="submit"
                  id="submit-feedback-btn"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Feedback</span>
                </button>
              </div>

              {feedbackSubmitted && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>¡Tu feedback ha sido guardado exitosamente y notificado al equipo del estudio!</span>
                </div>
              )}
            </form>
          )}

          {/* Past Comments & Reviews Feed */}
          <div className="space-y-4 pt-4">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Historial de Comentarios ({gallery.feedbackList?.length || 0})
            </h4>

            {(!gallery.feedbackList || gallery.feedbackList.length === 0) ? (
              <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No hay comentarios aún. Sé el primero en dejar tus impresiones sobre esta sesión.</p>
            ) : (
              <div className="space-y-4">
                {gallery.feedbackList.map((item) => (
                  <div 
                    key={item.id} 
                    id={`feedback-item-${item.id}`}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.clientAvatar ? (
                          <img 
                            src={item.clientAvatar} 
                            alt={item.clientName} 
                            className="w-8 h-8 rounded-full object-cover border border-blue-400"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {item.clientName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.clientName}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              item.category === 'retoque' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {item.category === 'retoque' ? 'Solicitud de Retoque' : 'Reseña'}
                            </span>
                          </div>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.createdAt}</span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed pl-11 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.message}
                    </p>

                    {/* Attached Image */}
                    {item.attachmentUrl && (
                      <div className="ml-11 mt-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Imagen Adjunta:
                        </span>
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700/60 shadow-xs">
                          <img 
                            src={item.attachmentUrl} 
                            alt="Adjunto feedback" 
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(item.attachmentUrl, '_blank')}
                          />
                        </div>
                      </div>
                    )}

                    {/* Photographer Reply */}
                    {item.photographerReply && (
                      <div className={`ml-11 mt-3 p-3 rounded-xl border space-y-1 ${
                        isDark ? 'bg-slate-950 border-blue-500/30' : 'bg-white border-blue-200'
                      }`}>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-500">
                          <Camera className="w-3 h-3" />
                          <span>Respuesta del Estudio Lumina:</span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.photographerReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <PhotoLightbox
          image={selectedImage}
          images={displayedImages}
          currentUser={currentUser}
          canDownload={canDownload}
          canFavorite={canFavorite}
          onClose={() => setSelectedImage(null)}
          onSelectImage={(img) => setSelectedImage(img)}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Batch ZIP Download Progress Modal */}
      <BatchDownloadModal
        isOpen={isBatchModalOpen}
        totalPhotos={filterMode === 'favorites' ? clientFavorites.length : galleryImages.length}
        totalBytes={totalGalleryBytes}
        progressPercent={batchProgress}
        currentFileName={batchCurrentFile}
        isCompleted={batchIsDone}
        onClose={() => setIsBatchModalOpen(false)}
        theme={theme}
      />

    </div>
  );
};
