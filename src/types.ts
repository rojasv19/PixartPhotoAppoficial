export type UserRole = 'admin' | 'photographer' | 'assistant' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  company?: string;
  assignedGalleryIds: string[];
  status: 'active' | 'inactive';
  createdDate: string;
  lastLogin?: string;
  notes?: string;
  canDownloadHighRes?: boolean;
  canLeaveFeedback?: boolean;
  canSelectFavorites?: boolean;
}

export type EventCategory = 'boda' | 'editorial' | 'retrato' | 'corporativo' | 'eventos' | 'arquitectura' | 'familia';

export interface FeedbackItem {
  id: string;
  galleryId: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  rating: number; // 1 to 5
  message: string;
  category: 'general' | 'felicitacion' | 'retoque' | 'entrega';
  favoriteCountAtTime?: number;
  attachmentUrl?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
  photographerReply?: string;
  repliedAt?: string;
}

export interface GalleryImage {
  id: string;
  galleryId: string;
  title: string;
  url: string;
  highResUrl: string;
  originalFileName: string;
  fileSizeBytes: number; // e.g. 15,400,000 bytes (15.4 MB)
  compressedSizeBytes?: number;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait' | 'square';
  cameraModel?: string;
  lens?: string;
  focalLength?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: string;
  favoriteByUsers: string[]; // user IDs who marked this as favorite
  tags: string[];
  uploadedAt: string;
  optimized: boolean;
  clientNote?: string;
}

export interface GallerySession {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  clientIds: string[];
  clientNames: string[];
  category: EventCategory;
  eventDate: string;
  location: string;
  venueName?: string;
  coverImage: string;
  description: string;
  accessPin: string;
  isPasswordProtected: boolean;
  allowDownloadHighRes: boolean;
  allowFeedback: boolean;
  allowFavoritesSubmission: boolean;
  maxFavoritesSelection?: number;
  clientPhotoLimits?: Record<string, number>; // Personalized favorite photo limits per client ID
  status: 'published' | 'draft' | 'archived';
  viewsCount: number;
  downloadsCount: number;
  favoritesSubmittedCount: number;
  createdAt: string;
  lastActivityAt: string;
  feedbackList: FeedbackItem[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  galleryTitle?: string;
  iconType?: 'upload' | 'download' | 'client' | 'security' | 'feedback' | 'trash';
}

export interface ServerStorageStats {
  totalCapacityBytes: number; // e.g. 100 GB (107374182400 bytes)
  usedBytes: number;
  galleriesCount: number;
  totalImagesCount: number;
  optimizedImagesCount: number;
  potentialSavingsBytes: number;
}

export type BrandIconName = 'Camera' | 'Aperture' | 'Sparkles' | 'Film' | 'Crown' | 'Eye' | 'Sun' | 'Palette' | 'Compass' | 'Layers' | 'Flame' | 'Heart';

export type ColorPreset = 'blue' | 'amber' | 'emerald' | 'rose' | 'violet' | 'indigo' | 'cyan' | 'slate';

export interface ModalTextsConfig {
  // 1. AuthModal (Login & PIN General)
  authModal: {
    adminTabLabel: string;
    clientTabLabel: string;
    adminTitle: string;
    adminSubtitle: string;
    clientTitle: string;
    clientSubtitle: string;
    pinTitle: string;
    pinSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    submitLoginText: string;
    submitPinText: string;
    errorMessageCredentials: string;
    errorMessagePin: string;
  };
  
  // 2. LockedGalleryModal (Popup para visitantes no autenticados)
  lockedGalleryModal: {
    title: string;
    subtitle: string;
    badgeText: string;
    pinLabel: string;
    pinPlaceholder: string;
    submitButtonText: string;
    cancelButtonText: string;
    clientLoginLinkText: string;
    errorMessage: string;
  };

  // 3. GalleryModal (Crear / Editar Sesión)
  galleryModal: {
    createTitle: string;
    editTitle: string;
    titleLabel: string;
    titlePlaceholder: string;
    subtitleLabel: string;
    subtitlePlaceholder: string;
    categoryLabel: string;
    dateLabel: string;
    locationLabel: string;
    locationPlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    clientsLabel: string;
    maxFavoritesLabel: string;
    submitCreateText: string;
    submitEditText: string;
  };

  // 4. UserModal (Crear / Editar Usuario o Cliente)
  userModal: {
    createTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    roleLabel: string;
    phoneLabel: string;
    phonePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    submitCreateText: string;
    submitEditText: string;
  };

  // 5. UploadModal (Subida de Fotografías)
  uploadModal: {
    title: string;
    subtitle: string;
    dropzoneTitle: string;
    dropzoneHint: string;
    titleInputLabel: string;
    titleInputPlaceholder: string;
    tagsInputLabel: string;
    tagsInputPlaceholder: string;
    submitButtonText: string;
  };

  // 6. StorageLimitModal (Ajuste de Cuota de Disco)
  storageLimitModal: {
    title: string;
    subtitle: string;
    presetsLabel: string;
    customLabel: string;
    submitButtonText: string;
    cancelButtonText: string;
  };

  // 7. FeedbackReplyModal (Respuesta a Feedback)
  feedbackReplyModal: {
    title: string;
    label: string;
    placeholder: string;
    submitButtonText: string;
    cancelButtonText: string;
  };

  // 8. UserProfileModal (Mi Perfil)
  userProfileModal: {
    title: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    phonePlaceholder: string;
    avatarLabel: string;
    submitButtonText: string;
    cancelButtonText: string;
  };
}

export interface StudioBrandingConfig {
  // Brand Identity
  studioName: string;
  studioTagline: string;
  studioBadgeText: string;
  logoType: 'icon' | 'image';
  logoIcon: BrandIconName;
  logoImageUrl: string;
  
  // Theme & Styling
  colorPreset: ColorPreset;
  customPrimaryColor: string;
  fontHeadingStyle: 'serif' | 'sans' | 'mono' | 'editorial';
  borderRadiusStyle: 'smooth' | 'modern' | 'minimal';
  
  // Public Portal Hero & Multimedia Background
  portalHeroBadge: string;
  portalHeroTitle: string;
  portalHeroHighlight: string;
  portalHeroSubtitle: string;
  portalHeroMediaType: 'image' | 'video' | 'none';
  portalHeroBgImage: string;
  portalHeroVideoUrl?: string;
  portalHeroOverlayColor: string;
  portalHeroOverlayOpacity: number; // 0 to 100
  portalHeroBlur?: number; // 0 to 20 px
  
  // Login Cards text
  adminCardTitle: string;
  adminCardBadge: string;
  adminCardDescription: string;
  clientCardTitle: string;
  clientCardBadge: string;
  clientCardDescription: string;
  
  // Watermark Settings
  watermarkEnabled: boolean;
  watermarkType?: 'text' | 'image';
  watermarkText: string;
  watermarkImageUrl?: string;
  watermarkOpacity: number; // 10 to 100
  watermarkPosition: 'bottom-right' | 'center' | 'bottom-left' | 'top-right' | 'diagonal';
  
  // Footer & Contact
  footerStudioName: string;
  footerTagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagramHandle: string;
  websiteUrl: string;
  copyrightYear: string;
  
  // Client Experience Flags
  allowClientDownloads: boolean;
  allowClientFeedback: boolean;
  showExifDataLightbox: boolean;

  // Modals & Popups Text Customization
  modalTexts?: ModalTextsConfig;
}

export type RetouchStatus = 'pending' | 'in_progress' | 'completed' | 'delivered';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'favorite' | 'upload' | 'feedback' | 'gallery' | 'download' | 'system';
  targetRole?: 'admin' | 'client' | 'all';
  targetUserId?: string; // specific user ID
  galleryId?: string;
  galleryTitle?: string;
  imageId?: string;
  imageUrl?: string;
  actorName?: string;
  actorAvatar?: string;
  timestamp: string;
  readBy: string[]; // user IDs who read it
  linkView?: string;
}

