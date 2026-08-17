import { StudioBrandingConfig, BrandIconName, ColorPreset, ModalTextsConfig } from '../types';

export const DEFAULT_MODAL_TEXTS: ModalTextsConfig = {
  authModal: {
    adminTabLabel: 'Administrador',
    clientTabLabel: 'Clientes',
    adminTitle: 'Acceso de Administrador',
    adminSubtitle: 'Panel de control, sesiones RAW y almacenamiento',
    clientTitle: 'Portal de Clientes',
    clientSubtitle: 'Accede a tus galerías privadas en alta resolución',
    pinTitle: 'Acceso por PIN de Sesión',
    pinSubtitle: 'Introduce el código numérico de tu sesión fotográfica',
    emailLabel: 'Usuario o Correo:',
    emailPlaceholder: 'Correo',
    passwordLabel: 'Contraseña:',
    passwordPlaceholder: '••••••••',
    pinLabel: 'Código PIN de tu Sesión:',
    pinPlaceholder: 'Ej: 8492',
    submitLoginText: 'Iniciar Sesión',
    submitPinText: 'Acceder a la Galería',
    errorMessageCredentials: 'Credenciales no válidas. Por favor verifica tus datos de acceso.',
    errorMessagePin: 'Código PIN inválido. Verifica el código entregado por el fotógrafo.'
  },
  lockedGalleryModal: {
    title: 'Sesión Privada Protegida',
    subtitle: 'Esta galería fotográfica es privada. Introduce el código PIN de acceso proporcionado por tu fotógrafo para desbloquear el álbum.',
    badgeText: 'Acceso Seguro PIN',
    pinLabel: 'Código PIN de Acceso:',
    pinPlaceholder: 'Introduce el PIN (ej: 8492)',
    submitButtonText: 'Desbloquear y Ver Fotos',
    cancelButtonText: 'Cerrar',
    clientLoginLinkText: '¿Tienes una cuenta registrada? Inicia sesión aquí',
    errorMessage: 'Código PIN incorrecto para esta sesión. Por favor verifica con tu fotógrafo.'
  },
  galleryModal: {
    createTitle: 'Nueva Sesión Fotográfica',
    editTitle: 'Editar Sesión Fotográfica',
    titleLabel: 'Título de la Sesión / Nombre de Clientes:',
    titlePlaceholder: 'Ej. Sofía & Mateo • Boda de Ensueño',
    subtitleLabel: 'Subtítulo / Colección:',
    subtitlePlaceholder: 'Ej. Ceremonia Civil, Banquete & Fiesta',
    categoryLabel: 'Categoría de Fotografía:',
    dateLabel: 'Fecha del Evento:',
    locationLabel: 'Ciudad / Región:',
    locationPlaceholder: 'Ej. Madrid / Palacio de Cristal',
    pinLabel: 'PIN de Acceso Privado (4-6 dígitos):',
    pinPlaceholder: '2024',
    clientsLabel: 'Clientes con Acceso Directo:',
    maxFavoritesLabel: 'Límite Máximo de Fotos Favoritas:',
    submitCreateText: 'Guardar y Publicar Sesión',
    submitEditText: 'Actualizar Sesión'
  },
  userModal: {
    createTitle: 'Registrar Nuevo Cliente / Fotógrafo',
    editTitle: 'Editar Datos de Usuario',
    nameLabel: 'Nombre Completo:',
    namePlaceholder: 'Ej. Sofía Valenzuela',
    emailLabel: 'Correo Electrónico:',
    emailPlaceholder: 'Correo',
    roleLabel: 'Rol en el Sistema:',
    phoneLabel: 'Teléfono / WhatsApp:',
    phonePlaceholder: '+34 600 000 000',
    passwordLabel: 'Contraseña de Acceso:',
    passwordPlaceholder: 'cliente123',
    companyLabel: 'Empresa u Organización (Opcional):',
    companyPlaceholder: 'Ej. Vogue España / Particular',
    notesLabel: 'Notas Internas / Preferencias:',
    notesPlaceholder: 'Estilo preferido, solicitudes especiales...',
    submitCreateText: 'Crear Cliente',
    submitEditText: 'Actualizar Usuario'
  },
  uploadModal: {
    title: 'Subir Nueva Fotografía',
    subtitle: 'Almacena archivos RAW o JPEG de alta resolución en el servidor de Pixart Photo',
    dropzoneTitle: 'Arrastra o selecciona una foto desde tu dispositivo',
    dropzoneHint: 'Compatible con RAW (.CR3, .ARW, .NEF), JPEG, PNG y WebP',
    titleInputLabel: 'Título / Nombre del Archivo:',
    titleInputPlaceholder: 'Ej. PIX_9821_RETRATO_NOVIOS.CR3',
    tagsInputLabel: 'Etiquetas / Metadatos (separadas por coma):',
    tagsInputPlaceholder: 'RAW, Retrato, Master 4K',
    submitButtonText: 'Subir Fotografía al Servidor'
  },
  storageLimitModal: {
    title: 'Límite de Almacenamiento',
    subtitle: 'Ajusta la cuota de disco disponible del servidor',
    presetsLabel: 'Seleccionar Cuota Rápida:',
    customLabel: 'O Especificar Cantidad Personalizada:',
    submitButtonText: 'Guardar Límite',
    cancelButtonText: 'Cancelar'
  },
  feedbackReplyModal: {
    title: 'Responder Comentario del Cliente',
    label: 'Tu Respuesta Oficial:',
    placeholder: 'Escribe tu respuesta para el cliente...',
    submitButtonText: 'Enviar Respuesta',
    cancelButtonText: 'Cancelar'
  },
  userProfileModal: {
    title: 'Mi Perfil de Usuario',
    nameLabel: 'Nombre Completo:',
    emailLabel: 'Correo Electrónico:',
    phoneLabel: 'Teléfono de Contacto:',
    phonePlaceholder: '+34 600 000 000',
    avatarLabel: 'URL de Foto de Perfil / Avatar:',
    submitButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar'
  }
};

export const DEFAULT_BRANDING: StudioBrandingConfig = {
  studioName: 'Pixart',
  studioTagline: 'Galerias Privadas',
  studioBadgeText: 'Photo Pro',
  logoType: 'image',
  logoIcon: 'Camera',
  logoImageUrl: '/logo-pixart.svg',

  colorPreset: 'violet',
  customPrimaryColor: '#8b5cf6',
  fontHeadingStyle: 'serif',
  borderRadiusStyle: 'smooth',

  portalHeroBadge: 'Pixart Photo • Plataforma Fotográfica',
  portalHeroTitle: 'Galerías fotográficas privadas en',
  portalHeroHighlight: 'máxima resolución.',
  portalHeroSubtitle: 'Visualización, selección de favoritas y descarga directa en alta fidelidad RAW y 4K con almacenamiento seguro.',
  portalHeroMediaType: 'image',
  portalHeroBgImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=2400&q=90',
  portalHeroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-photographer-taking-photos-in-a-studio-41407-large.mp4',
  portalHeroOverlayColor: '#090a0f',
  portalHeroOverlayOpacity: 72,
  portalHeroBlur: 0,

  adminCardTitle: 'Ingresar como Administrador',
  adminCardBadge: 'Fotógrafos & Estudio',
  adminCardDescription: 'Accede al panel de control para crear sesiones, subir fotos en alta resolución, gestionar clientes y monitorear almacenamiento.',
  clientCardTitle: 'Ingresar como Cliente / Invitado',
  clientCardBadge: 'Álbumes Privados',
  clientCardDescription: 'Introduce tus credenciales de cliente o tu código PIN de 4 dígitos para acceder a tus colecciones fotográficas exclusivas.',

  watermarkEnabled: true,
  watermarkType: 'text',
  watermarkText: '© PIXART PHOTO • PREVIEW',
  watermarkImageUrl: '',
  watermarkOpacity: 30,
  watermarkPosition: 'bottom-right',

  footerStudioName: 'Pixart Photo',
  footerTagline: 'Galerias Privadas & Almacenamiento Profesional',
  contactEmail: 'info@somospixart.com',
  contactPhone: '+584120174583',
  contactAddress: 'Torre BEL, Av. Los Leones, Barquisimeto, Lara',
  instagramHandle: '@somospixart',
  websiteUrl: 'https://somospixart.com',
  copyrightYear: '2026',

  allowClientDownloads: true,
  allowClientFeedback: true,
  showExifDataLightbox: true,

  modalTexts: DEFAULT_MODAL_TEXTS,
};

const BRANDING_STORAGE_KEY = 'pixart_branding_v2';

export function loadBrandingFromStorage(): StudioBrandingConfig {
  try {
    const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_BRANDING, 
        ...parsed,
        modalTexts: {
          ...DEFAULT_MODAL_TEXTS,
          ...(parsed.modalTexts || {}),
          authModal: { ...DEFAULT_MODAL_TEXTS.authModal, ...(parsed.modalTexts?.authModal || {}) },
          lockedGalleryModal: { ...DEFAULT_MODAL_TEXTS.lockedGalleryModal, ...(parsed.modalTexts?.lockedGalleryModal || {}) },
          galleryModal: { ...DEFAULT_MODAL_TEXTS.galleryModal, ...(parsed.modalTexts?.galleryModal || {}) },
          userModal: { ...DEFAULT_MODAL_TEXTS.userModal, ...(parsed.modalTexts?.userModal || {}) },
          uploadModal: { ...DEFAULT_MODAL_TEXTS.uploadModal, ...(parsed.modalTexts?.uploadModal || {}) },
          storageLimitModal: { ...DEFAULT_MODAL_TEXTS.storageLimitModal, ...(parsed.modalTexts?.storageLimitModal || {}) },
          feedbackReplyModal: { ...DEFAULT_MODAL_TEXTS.feedbackReplyModal, ...(parsed.modalTexts?.feedbackReplyModal || {}) },
          userProfileModal: { ...DEFAULT_MODAL_TEXTS.userProfileModal, ...(parsed.modalTexts?.userProfileModal || {}) },
        }
      };
    }
  } catch (error) {
    console.error('Failed to load branding from storage:', error);
  }
  return DEFAULT_BRANDING;
}

export function saveBrandingToStorage(config: StudioBrandingConfig): void {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save branding to storage:', error);
  }
}

export function updateDocumentFaviconAndTitle(branding: StudioBrandingConfig): void {
  try {
    // 1. Update Title
    if (branding.studioName) {
      document.title = `${branding.studioName} — Plataforma de Fotografía & Galerías Privadas`;
    }

    // 2. Find or create favicon link element
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }

    // 3. If a custom image logo is provided and used, apply it directly as favicon
    if (branding.logoType === 'image' && branding.logoImageUrl) {
      link.type = branding.logoImageUrl.includes('.svg') || branding.logoImageUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
      link.href = branding.logoImageUrl;
    } else {
      // Generate clean vector SVG favicon matching active brand color & icon
      const themeColors: Record<ColorPreset, string> = {
        blue: '#2563eb',
        amber: '#f59e0b',
        emerald: '#10b981',
        rose: '#f43f5e',
        violet: '#8b5cf6',
        indigo: '#6366f1',
        cyan: '#06b6d4',
        slate: '#475569'
      };
      const bgColor = branding.customPrimaryColor || themeColors[branding.colorPreset] || '#2563eb';
      
      let iconSvgInner = '<path d="M9 13.5V23a2 2 0 002 2h10a2 2 0 002-2v-9.5a2 2 0 00-2-2h-1.5l-1-2h-5l-1 2H11a2 2 0 00-2 2z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="16" cy="18" r="3.5" stroke="#ffffff" stroke-width="2" fill="none"/>';

      if (branding.logoIcon === 'Aperture') {
        iconSvgInner = '<circle cx="16" cy="16" r="8" stroke="#ffffff" stroke-width="2" fill="none"/><line x1="19.5" y1="8.5" x2="12.5" y2="23.5" stroke="#ffffff" stroke-width="2"/><line x1="8.5" y1="12.5" x2="23.5" y2="19.5" stroke="#ffffff" stroke-width="2"/><line x1="12.5" y1="8.5" x2="19.5" y2="23.5" stroke="#ffffff" stroke-width="2"/>';
      } else if (branding.logoIcon === 'Crown') {
        iconSvgInner = '<path d="M8 22h16l2-12-6 4-4-6-4 6-6-4 2 12z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      } else if (branding.logoIcon === 'Sparkles') {
        iconSvgInner = '<path d="M16 7l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5 2.5-6z" stroke="#ffffff" stroke-width="2" fill="none"/>';
      } else if (branding.logoIcon === 'Film') {
        iconSvgInner = '<rect x="8" y="9" width="16" height="14" rx="2" stroke="#ffffff" stroke-width="2" fill="none"/><line x1="8" y1="13" x2="24" y2="13" stroke="#ffffff" stroke-width="1.5"/><line x1="8" y1="19" x2="24" y2="19" stroke="#ffffff" stroke-width="1.5"/><line x1="13" y1="9" x2="13" y2="13" stroke="#ffffff" stroke-width="1.5"/><line x1="19" y1="9" x2="19" y2="13" stroke="#ffffff" stroke-width="1.5"/><line x1="13" y1="19" x2="13" y2="23" stroke="#ffffff" stroke-width="1.5"/><line x1="19" y1="19" x2="19" y2="23" stroke="#ffffff" stroke-width="1.5"/>';
      } else if (branding.logoIcon === 'Flame') {
        iconSvgInner = '<path d="M16 7c2 3 5 5 5 10a5 5 0 01-10 0c0-3 2-6 5-10z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      } else if (branding.logoIcon === 'Heart') {
        iconSvgInner = '<path d="M16 23s-7-4.5-7-10a4 4 0 017-2.5 4 4 0 017 2.5c0 5.5-7 10-7 10z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      }

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <rect width="32" height="32" rx="8" fill="${bgColor}"/>
        ${iconSvgInner}
      </svg>`;

      link.type = 'image/svg+xml';
      link.href = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    }
  } catch (error) {
    console.error('Failed to update document favicon:', error);
  }
}

// Color Preset theme dictionary for consistent styling classes and hexes
export const COLOR_PRESET_MAP: Record<ColorPreset, {
  name: string;
  hex: string;
  twText: string;
  twBg: string;
  twBgHover: string;
  twBorder: string;
  twRing: string;
  twShadow: string;
  twBadgeBg: string;
  twBadgeBorder: string;
  twBadgeText: string;
}> = {
  blue: {
    name: 'Azul Zafiro Pro',
    hex: '#2563eb',
    twText: 'text-blue-500',
    twBg: 'bg-blue-600',
    twBgHover: 'hover:bg-blue-500',
    twBorder: 'border-blue-500/30',
    twRing: 'focus:ring-blue-500',
    twShadow: 'shadow-blue-600/25',
    twBadgeBg: 'bg-blue-500/10',
    twBadgeBorder: 'border-blue-500/20',
    twBadgeText: 'text-blue-500',
  },
  amber: {
    name: 'Ámbar & Oro Dorado',
    hex: '#f59e0b',
    twText: 'text-amber-500',
    twBg: 'bg-amber-500',
    twBgHover: 'hover:bg-amber-400',
    twBorder: 'border-amber-500/30',
    twRing: 'focus:ring-amber-500',
    twShadow: 'shadow-amber-500/25',
    twBadgeBg: 'bg-amber-500/10',
    twBadgeBorder: 'border-amber-500/20',
    twBadgeText: 'text-amber-500',
  },
  emerald: {
    name: 'Esmeralda Editorial',
    hex: '#10b981',
    twText: 'text-emerald-500',
    twBg: 'bg-emerald-600',
    twBgHover: 'hover:bg-emerald-500',
    twBorder: 'border-emerald-500/30',
    twRing: 'focus:ring-emerald-500',
    twShadow: 'shadow-emerald-600/25',
    twBadgeBg: 'bg-emerald-500/10',
    twBadgeBorder: 'border-emerald-500/20',
    twBadgeText: 'text-emerald-500',
  },
  rose: {
    name: 'Rosa & Magenta Velvet',
    hex: '#f43f5e',
    twText: 'text-rose-500',
    twBg: 'bg-rose-600',
    twBgHover: 'hover:bg-rose-500',
    twBorder: 'border-rose-500/30',
    twRing: 'focus:ring-rose-500',
    twShadow: 'shadow-rose-600/25',
    twBadgeBg: 'bg-rose-500/10',
    twBadgeBorder: 'border-rose-500/20',
    twBadgeText: 'text-rose-500',
  },
  violet: {
    name: 'Violeta Imperial',
    hex: '#8b5cf6',
    twText: 'text-violet-500',
    twBg: 'bg-violet-600',
    twBgHover: 'hover:bg-violet-500',
    twBorder: 'border-violet-500/30',
    twRing: 'focus:ring-violet-500',
    twShadow: 'shadow-violet-600/25',
    twBadgeBg: 'bg-violet-500/10',
    twBadgeBorder: 'border-violet-500/20',
    twBadgeText: 'text-violet-500',
  },
  indigo: {
    name: 'Índigo Ultra',
    hex: '#6366f1',
    twText: 'text-indigo-500',
    twBg: 'bg-indigo-600',
    twBgHover: 'hover:bg-indigo-500',
    twBorder: 'border-indigo-500/30',
    twRing: 'focus:ring-indigo-500',
    twShadow: 'shadow-indigo-600/25',
    twBadgeBg: 'bg-indigo-500/10',
    twBadgeBorder: 'border-indigo-500/20',
    twBadgeText: 'text-indigo-500',
  },
  cyan: {
    name: 'Cian Neón Moderno',
    hex: '#06b6d4',
    twText: 'text-cyan-500',
    twBg: 'bg-cyan-600',
    twBgHover: 'hover:bg-cyan-500',
    twBorder: 'border-cyan-500/30',
    twRing: 'focus:ring-cyan-500',
    twShadow: 'shadow-cyan-600/25',
    twBadgeBg: 'bg-cyan-500/10',
    twBadgeBorder: 'border-cyan-500/20',
    twBadgeText: 'text-cyan-500',
  },
  slate: {
    name: 'Monocromo Minimalista',
    hex: '#475569',
    twText: 'text-slate-400',
    twBg: 'bg-slate-700',
    twBgHover: 'hover:bg-slate-600',
    twBorder: 'border-slate-600/30',
    twRing: 'focus:ring-slate-500',
    twShadow: 'shadow-slate-700/25',
    twBadgeBg: 'bg-slate-500/10',
    twBadgeBorder: 'border-slate-500/20',
    twBadgeText: 'text-slate-300',
  },
};
