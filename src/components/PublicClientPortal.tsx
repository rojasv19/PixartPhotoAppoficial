import React, { useState } from 'react';
import { 
  ShieldCheck, Camera, Sparkles, ArrowRight, 
  MapPin, Calendar, HardDrive, Heart, Star, Download, Eye,
  Lock, KeyRound, CheckCircle2, ChevronRight, LogOut, Palette, Search
} from 'lucide-react';
import { GallerySession, GalleryImage, User, StudioBrandingConfig } from '../types';
import { formatBytes } from '../services/storageService';
import { COLOR_PRESET_MAP, DEFAULT_BRANDING } from '../services/brandingService';
import { BrandIcon } from './BrandIcon';
import { LockedGalleryModal } from './LockedGalleryModal';

interface PublicClientPortalProps {
  currentUser: User | null;
  galleries: GallerySession[];
  images: GalleryImage[];
  onOpenGallery: (galleryId: string) => void;
  onLogin: (email: string, pass: string, targetRole?: 'admin' | 'client') => boolean;
  onPinSubmit: (pin: string) => boolean;
  onOpenAuthModal?: (tab?: 'admin' | 'client' | 'pin') => void;
  onLogout?: () => void;
  onNavigateAdmin?: () => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const PublicClientPortal: React.FC<PublicClientPortalProps> = ({
  currentUser,
  galleries,
  images,
  onOpenGallery,
  onLogin,
  onPinSubmit,
  onOpenAuthModal,
  onLogout,
  onNavigateAdmin,
  theme = 'dark',
  branding,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lockedGalleryTarget, setLockedGalleryTarget] = useState<GallerySession | null>(null);

  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  // Client accessible galleries
  const clientGalleries = currentUser
    ? galleries.filter(g => 
        currentUser.role === 'admin' || 
        currentUser.assignedGalleryIds?.includes(g.id) || 
        g.clientIds?.includes(currentUser.id)
      )
    : galleries.filter(g => g.status === 'published');

  const filteredGalleries = clientGalleries.filter(g => {
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGalleryCardClick = (gallery: GallerySession) => {
    if (!currentUser) {
      // Unauthenticated visitor: requires PIN to access
      setLockedGalleryTarget(gallery);
    } else {
      // Authenticated user (Admin or authorized client): opens directly
      onOpenGallery(gallery.id);
    }
  };

  const handleUnlockPin = (galleryId: string, pin: string): boolean => {
    const target = galleries.find(g => g.id === galleryId);
    if (!target) return false;
    
    // Check against session PIN or default studio master PINs
    const validPins = [target.accessPin, '2024', '1234'].filter(Boolean);
    if (validPins.includes(pin.trim())) {
      onOpenGallery(galleryId);
      return true;
    }
    return false;
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#0F1012] text-slate-100' : 'bg-[#F8F9FA] text-slate-800'
    } pb-24`}>
      
      {/* Hero Section: 80% screen height, clean, uncluttered, no access cards */}
      <div className={`relative overflow-hidden border-b transition-colors -mt-16 min-h-[80vh] flex flex-col justify-center items-center ${
        isDark ? 'border-slate-800 bg-[#0c0d0e] text-white' : 'border-slate-200 bg-slate-900 text-white'
      }`}>
        
        {/* Background Media (High Definition Image or Video) */}
        {branding?.portalHeroMediaType !== 'none' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {branding?.portalHeroMediaType === 'video' && branding.portalHeroVideoUrl ? (
              <video
                key={branding.portalHeroVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105"
                poster={branding.portalHeroBgImage || undefined}
                style={{
                  filter: branding.portalHeroBlur ? `blur(${branding.portalHeroBlur}px)` : undefined,
                }}
              >
                <source src={branding.portalHeroVideoUrl} type="video/mp4" />
                <source src={branding.portalHeroVideoUrl} type="video/webm" />
              </video>
            ) : (
              (branding?.portalHeroBgImage || DEFAULT_BRANDING.portalHeroBgImage) && (
                <img
                  src={branding?.portalHeroBgImage || DEFAULT_BRANDING.portalHeroBgImage}
                  alt="Hero Background"
                  className="w-full h-full object-cover scale-105 animate-in fade-in duration-700"
                  style={{
                    filter: branding?.portalHeroBlur ? `blur(${branding.portalHeroBlur}px)` : undefined,
                  }}
                />
              )
            )}

            {/* Configurable Color Overlay Layer */}
            <div 
              className="absolute inset-0 transition-all duration-300 pointer-events-none"
              style={{
                backgroundColor: branding?.portalHeroOverlayColor || '#090a0f',
                opacity: (branding?.portalHeroOverlayOpacity ?? 72) / 100,
              }}
            />

            {/* Smooth gradient blend into portal body */}
            <div 
              className={`absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t pointer-events-none ${
                isDark ? 'from-[#0F1012] via-[#0F1012]/80 to-transparent' : 'from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent'
              }`} 
            />
          </div>
        )}

        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 text-center space-y-6 flex flex-col items-center justify-center my-auto">
          
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-md ${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ${colorTheme.twBadgeText}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{branding?.portalHeroBadge || 'Pixart Photo • Plataforma Fotográfica'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-serif-display leading-tight max-w-4xl mx-auto drop-shadow-md text-white">
            {branding?.portalHeroTitle || 'Galerías fotográficas privadas en'}{' '}
            <span className={`${colorTheme.twText} italic drop-shadow-md`}>
              {branding?.portalHeroHighlight || 'máxima resolución.'}
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-slate-200 drop-shadow-sm font-medium">
            {branding?.portalHeroSubtitle || 'Visualización, selección de favoritas y descarga directa en alta fidelidad RAW y 4K con almacenamiento seguro.'}
          </p>

          {/* Clean Quick Search input */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <div className="relative w-full">
              <input
                id="portal-hero-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sesión, locación o evento..."
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-lg"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

        </div>
      </div>

      {/* Featured / Client Galleries Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold font-serif-display">
              {currentUser?.role === 'client' ? 'Tus Galerías Privadas Asignadas' : 'Galerías de Sesiones Fotográficas'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {filteredGalleries.length} {filteredGalleries.length === 1 ? 'sesión disponible' : 'sesiones disponibles'} para visualización
            </p>
          </div>

          {/* Categories Pill Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'boda', label: 'Bodas' },
              { id: 'editorial', label: 'Editorial' },
              { id: 'retrato', label: 'Retrato' },
              { id: 'eventos', label: 'Eventos' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? `${colorTheme.twBg} text-white shadow-xs`
                    : isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Galleries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map(gallery => {
            const galleryImages = images.filter(img => img.galleryId === gallery.id);

            return (
              <div
                key={gallery.id}
                id={`gallery-card-${gallery.id}`}
                onClick={() => handleGalleryCardClick(gallery)}
                className={`group rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between ${
                  isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Cover Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-950">
                  <img
                    src={gallery.coverImage}
                    alt={gallery.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {gallery.category}
                  </span>

                  {/* Lock Indicator */}
                  <span 
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md border ${
                      !currentUser 
                        ? 'bg-rose-500/80 text-white border-rose-400/40 shadow-xs' 
                        : gallery.isPasswordProtected 
                          ? 'bg-black/60 text-amber-300 border-amber-500/30' 
                          : 'bg-emerald-500/80 text-white border-emerald-400/30'
                    }`} 
                    title={!currentUser ? "Requiere PIN de sesión para ingresar" : "Acceso verificado"}
                  >
                    {!currentUser ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </span>

                  {/* Bottom Meta on Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold flex items-center gap-1.5 opacity-90">
                      <MapPin className="w-3 h-3 text-slate-300" />
                      <span>{gallery.location || 'Estudio Pixart Photo'}</span>
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className={`font-bold text-lg font-serif-display transition-colors line-clamp-1 group-hover:underline ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {gallery.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {gallery.subtitle || gallery.description}
                    </p>
                  </div>

                  <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                        <span>{gallery.eventDate}</span>
                      </span>
                      <span>•</span>
                      <span>{galleryImages.length} fotos</span>
                    </div>

                    <span className={`font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${colorTheme.twText}`}>
                      <span>{!currentUser ? 'Ingresar PIN' : 'Ver galería'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Locked Gallery Access Modal for Unauthenticated Visitors */}
      <LockedGalleryModal
        isOpen={!!lockedGalleryTarget}
        onClose={() => setLockedGalleryTarget(null)}
        gallery={lockedGalleryTarget}
        onUnlock={handleUnlockPin}
        onOpenAuthModal={() => onOpenAuthModal?.('client')}
        theme={theme}
        branding={branding}
      />

    </div>
  );
};
