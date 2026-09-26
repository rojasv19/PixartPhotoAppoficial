import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, ImageIcon, Users, HardDrive, ShieldCheck, Plus, 
  Trash2, Edit3, Key, Check, Eye, Download, MessageSquare, Star, 
  Sparkles, Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, 
  Upload, Sliders, Calendar, MapPin, Lock, FileText, Activity, Shield, RefreshCw, X, Camera, Palette, Heart, Save
} from 'lucide-react';
import { GallerySession, GalleryImage, User, FeedbackItem, AuditLogItem, ServerStorageStats, StudioBrandingConfig, TypographyStyle } from '../types';
import { formatBytes, calculateServerStats, downloadSingleImage } from '../services/storageService';
import { COLOR_PRESET_MAP, DEFAULT_MODAL_TEXTS } from '../services/brandingService';
import { DEFAULT_PROFILE_AVATAR } from '../data/photographyAvatars';
import { AdminBrandingSettings } from './AdminBrandingSettings';
import { AdminFavoritesView } from './AdminFavoritesView';
import { WatermarkOverlay } from './WatermarkOverlay';
import { TypographyControl } from './TypographyControl';
import { extractExifFromFile } from '../services/exifService';
import { ImagePositionPicker, getImagePositionStyle, getImagePositionLabel } from './ImagePositionPicker';

interface AdminDashboardProps {
  initialTab?: 'overview' | 'galleries' | 'favorites' | 'clients' | 'storage' | 'permissions' | 'branding';
  galleries: GallerySession[];
  images: GalleryImage[];
  users: User[];
  logs: AuditLogItem[];
  storageStats: ServerStorageStats;
  branding: StudioBrandingConfig;
  onSaveBranding: (updated: StudioBrandingConfig) => void;
  onPreviewPortal?: () => void;
  onOpenGallery: (galleryId: string) => void;
  onCreateGallery: (newGallery: Omit<GallerySession, 'id' | 'createdAt' | 'lastActivityAt' | 'viewsCount' | 'downloadsCount' | 'favoritesSubmittedCount' | 'feedbackList'>) => void;
  onUpdateGallery: (updatedGallery: GallerySession) => void;
  onDeleteGallery: (galleryId: string) => void;
  onCreateUser: (newUser: Omit<User, 'id' | 'createdDate'>) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onUploadImage: (galleryId: string, imageFile: { 
    title: string; 
    url: string; 
    highResUrl: string; 
    originalFileName: string; 
    fileSizeBytes: number; 
    width: number; 
    height: number; 
    tags: string[];
    cameraModel?: string;
    lens?: string;
    focalLength?: string;
    iso?: number;
    shutterSpeed?: string;
    aperture?: string;
  }) => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteAllImagesInGallery?: (galleryId: string) => void;
  onUpdateImage?: (updatedImage: GalleryImage) => void;
  onBatchUpdateImagePosition?: (galleryId: string, position: string) => void;
  onBatchOptimizeImages: () => void;
  onReplyFeedback: (galleryId: string, feedbackId: string, replyText: string) => void;
  onUpdateServerQuota?: (newQuotaBytes: number) => void;
  theme?: 'light' | 'dark';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'overview',
  galleries,
  images,
  users,
  logs,
  storageStats,
  branding,
  onSaveBranding,
  onPreviewPortal,
  onOpenGallery,
  onCreateGallery,
  onUpdateGallery,
  onDeleteGallery,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onUploadImage,
  onDeleteImage,
  onDeleteAllImagesInGallery,
  onBatchOptimizeImages,
  onReplyFeedback,
  onUpdateImage,
  onBatchUpdateImagePosition,
  onUpdateServerQuota,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
  const modalTexts: any = branding?.modalTexts || DEFAULT_MODAL_TEXTS;
  const galleryModalTexts: any = modalTexts.galleryModal || DEFAULT_MODAL_TEXTS.galleryModal;
  const userModalTexts: any = modalTexts.userModal || DEFAULT_MODAL_TEXTS.userModal;
  const uploadModalTexts: any = modalTexts.uploadModal || DEFAULT_MODAL_TEXTS.uploadModal;
  const storageLimitModalTexts: any = modalTexts.storageLimitModal || DEFAULT_MODAL_TEXTS.storageLimitModal;
  const feedbackReplyModalTexts: any = modalTexts.feedbackReplyModal || DEFAULT_MODAL_TEXTS.feedbackReplyModal;

  const [activeTab, setActiveTab] = useState<'overview' | 'galleries' | 'favorites' | 'clients' | 'storage' | 'permissions' | 'branding'>(initialTab);

  // Calculate favorite images count
  const totalFavoritesCount = React.useMemo(() => {
    return images.filter(img => (img.favoriteByUsers || []).length > 0).length;
  }, [images]);


  // Synchronize activeTab when initialTab prop updates from Navbar
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals state
  const [showNewGalleryModal, setShowNewGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GallerySession | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [uploadGalleryId, setUploadGalleryId] = useState<string | null>(null);
  const [replyingFeedback, setReplyingFeedback] = useState<{ galleryId: string; feedbackId: string; clientName: string } | null>(null);
  const [feedbackReplyText, setFeedbackReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStorageLimitModal, setShowStorageLimitModal] = useState(false);
  const [customLimitValue, setCustomLimitValue] = useState<number>(() => {
    const quotaGB = storageStats.totalCapacityBytes / (1024 * 1024 * 1024);
    return quotaGB >= 1 ? Number(quotaGB.toFixed(2)) : Number((storageStats.totalCapacityBytes / (1024 * 1024)).toFixed(0));
  });
  const [customLimitUnit, setCustomLimitUnit] = useState<'MB' | 'GB' | 'TB'>(() => {
    return storageStats.totalCapacityBytes >= 1024 * 1024 * 1024 ? 'GB' : 'MB';
  });

  // Keep custom limit state in sync with storageStats
  React.useEffect(() => {
    if (storageStats?.totalCapacityBytes) {
      if (storageStats.totalCapacityBytes >= 1024 * 1024 * 1024 * 1024) {
        setCustomLimitValue(Number((storageStats.totalCapacityBytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)));
        setCustomLimitUnit('TB');
      } else if (storageStats.totalCapacityBytes >= 1024 * 1024 * 1024) {
        setCustomLimitValue(Number((storageStats.totalCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)));
        setCustomLimitUnit('GB');
      } else {
        setCustomLimitValue(Number((storageStats.totalCapacityBytes / (1024 * 1024)).toFixed(0)));
        setCustomLimitUnit('MB');
      }
    }
  }, [storageStats.totalCapacityBytes]);

  // New Gallery Form State
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryTitleTypography, setGalleryTitleTypography] = useState<TypographyStyle>({});
  const [gallerySubtitle, setGallerySubtitle] = useState('');
  const [gallerySubtitleTypography, setGallerySubtitleTypography] = useState<TypographyStyle>({});
  const [galleryCategory, setGalleryCategory] = useState<GallerySession['category']>('boda');
  const [galleryDate, setGalleryDate] = useState(new Date().toISOString().split('T')[0]);
  const [galleryLocation, setGalleryLocation] = useState('');
  const [galleryVenue, setGalleryVenue] = useState('');
  const [galleryCover, setGalleryCover] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80');
  const [galleryCoverPosition, setGalleryCoverPosition] = useState('center');
  const [galleryPin, setGalleryPin] = useState(String(Math.floor(1000 + Math.random() * 9000)));
  const [gallerySelectedClients, setGallerySelectedClients] = useState<string[]>([]);
  const [galleryClientLimits, setGalleryClientLimits] = useState<Record<string, number>>({});
  const [galleryAllowDownload, setGalleryAllowDownload] = useState(true);
  const [galleryAllowFeedback, setGalleryAllowFeedback] = useState(true);
  const [galleryAllowFavorites, setGalleryAllowFavorites] = useState(true);
  const [galleryMaxFavs, setGalleryMaxFavs] = useState(50);
  const [galleryWatermarkEnabled, setGalleryWatermarkEnabled] = useState(false);
  const [galleryWatermarkType, setGalleryWatermarkType] = useState<'text' | 'image'>('text');
  const [galleryWatermarkText, setGalleryWatermarkText] = useState('SOMOS PIXART');
  const [galleryWatermarkImageUrl, setGalleryWatermarkImageUrl] = useState('');
  const [galleryWatermarkPosition, setGalleryWatermarkPosition] = useState<'center' | 'repeated'>('center');
  const [galleryWatermarkOpacity, setGalleryWatermarkOpacity] = useState(0.35);

  // New Client Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('cliente123');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');
  const [clientRole, setClientRole] = useState<User['role']>('client');
  const [clientAssignedGalleries, setClientAssignedGalleries] = useState<string[]>([]);
  const [clientNotes, setClientNotes] = useState('');

  // Refs for Device File Uploads
  const galleryCoverInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);
  const clientAvatarInputRef = useRef<HTMLInputElement>(null);
  const photoUploadInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setGalleryCover(event.target.result as string);
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
        setGalleryWatermarkImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClientAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setClientAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectSessionCoverUpload = (galleryId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const targetGallery = galleries.find(g => g.id === galleryId);
        if (targetGallery) {
          onUpdateGallery({
            ...targetGallery,
            coverImage: event.target.result as string
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDirectGalleryCoverPositionChange = (galleryId: string, position: string) => {
    const targetGallery = galleries.find(g => g.id === galleryId);
    if (targetGallery) {
      onUpdateGallery({
        ...targetGallery,
        coverImagePosition: position,
      });
    }
  };

  // Multiple Real File Upload State
  const [pendingUploadFiles, setPendingUploadFiles] = useState<Array<{
    id: string;
    name: string;
    title: string;
    fileSizeBytes: number;
    sizeFormatted: string;
    previewUrl: string;
    width: number;
    height: number;
    cameraModel?: string;
    lens?: string;
    focalLength?: string;
    iso?: number;
    shutterSpeed?: string;
    aperture?: string;
  }>>([]);
  const [isDragOverUpload, setIsDragOverUpload] = useState<boolean>(false);
  const [isProcessingUploads, setIsProcessingUploads] = useState<boolean>(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState<boolean>(false);

  // Client Deletion Confirmation Modal State
  const [clientToDelete, setClientToDelete] = useState<User | null>(null);

  // Photo Deletion & Filter States
  const [galleryToEmptyPhotos, setGalleryToEmptyPhotos] = useState<GallerySession | null>(null);
  const [photoFilterGalleryId, setPhotoFilterGalleryId] = useState<string>('all');
  const [adminPhotoToDelete, setAdminPhotoToDelete] = useState<GalleryImage | null>(null);

  const filteredInspectorImages = useMemo(() => {
    if (photoFilterGalleryId === 'all') return images;
    return images.filter(i => i.galleryId === photoFilterGalleryId);
  }, [images, photoFilterGalleryId]);

  // Storage Stats Summary
  const usedPercentage = Math.min(100, (storageStats.usedBytes / storageStats.totalCapacityBytes) * 100);
  const totalDownloads = galleries.reduce((acc, g) => acc + (g.downloadsCount || 0), 0);
  const totalViews = galleries.reduce((acc, g) => acc + (g.viewsCount || 0), 0);
  const totalFeedbackCount = galleries.reduce((acc, g) => acc + (g.feedbackList?.length || 0), 0);

  // Filter clients
  const clientUsers = users.filter(u => u.role === 'client');

  // Submit New Gallery
  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle.trim()) return;

    const assignedNames = users
      .filter(u => gallerySelectedClients.includes(u.id))
      .map(u => u.name);

    const isWatermarkOn = galleryWatermarkEnabled;
    const effectiveAllowDownload = isWatermarkOn ? false : galleryAllowDownload;

    if (editingGallery) {
      onUpdateGallery({
        ...editingGallery,
        title: galleryTitle,
        titleTypography: galleryTitleTypography,
        subtitle: gallerySubtitle,
        subtitleTypography: gallerySubtitleTypography,
        category: galleryCategory,
        eventDate: galleryDate,
        location: galleryLocation,
        venueName: galleryVenue,
        coverImage: galleryCover,
        coverImagePosition: galleryCoverPosition,
        accessPin: galleryPin,
        clientIds: gallerySelectedClients,
        clientNames: assignedNames,
        allowDownloadHighRes: effectiveAllowDownload,
        allowFeedback: galleryAllowFeedback,
        allowFavoritesSubmission: galleryAllowFavorites,
        watermarkEnabled: isWatermarkOn,
        watermarkType: galleryWatermarkType,
        watermarkText: galleryWatermarkText,
        watermarkImageUrl: galleryWatermarkImageUrl,
        watermarkPosition: galleryWatermarkPosition,
        watermarkOpacity: galleryWatermarkOpacity,
        maxFavoritesSelection: galleryMaxFavs,
        clientPhotoLimits: galleryClientLimits,
      });
      setEditingGallery(null);
    } else {
      onCreateGallery({
        title: galleryTitle,
        titleTypography: galleryTitleTypography,
        slug: galleryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        subtitle: gallerySubtitle,
        subtitleTypography: gallerySubtitleTypography,
        clientIds: gallerySelectedClients,
        clientNames: assignedNames,
        category: galleryCategory,
        eventDate: galleryDate,
        location: galleryLocation,
        venueName: galleryVenue,
        coverImage: galleryCover,
        coverImagePosition: galleryCoverPosition,
        description: `Sesión profesional realizada en ${galleryLocation} el ${galleryDate}.`,
        accessPin: galleryPin,
        isPasswordProtected: true,
        allowDownloadHighRes: effectiveAllowDownload,
        allowFeedback: galleryAllowFeedback,
        allowFavoritesSubmission: galleryAllowFavorites,
        watermarkEnabled: isWatermarkOn,
        watermarkType: galleryWatermarkType,
        watermarkText: galleryWatermarkText,
        watermarkImageUrl: galleryWatermarkImageUrl,
        watermarkPosition: galleryWatermarkPosition,
        watermarkOpacity: galleryWatermarkOpacity,
        maxFavoritesSelection: galleryMaxFavs,
        clientPhotoLimits: galleryClientLimits,
        status: 'published',
      });
    }

    setShowNewGalleryModal(false);
    resetGalleryForm();
  };

  const resetGalleryForm = () => {
    setGalleryTitle('');
    setGalleryTitleTypography({});
    setGallerySubtitle('');
    setGallerySubtitleTypography({});
    setGalleryCategory('boda');
    setGalleryDate(new Date().toISOString().split('T')[0]);
    setGalleryLocation('');
    setGalleryVenue('');
    setGalleryCover('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80');
    setGalleryCoverPosition('center');
    setGalleryPin(String(Math.floor(1000 + Math.random() * 9000)));
    setGallerySelectedClients([]);
    setGalleryClientLimits({});
    setGalleryAllowDownload(true);
    setGalleryAllowFeedback(true);
    setGalleryAllowFavorites(true);
    setGalleryMaxFavs(50);
    setGalleryWatermarkEnabled(false);
    setGalleryWatermarkType('text');
    setGalleryWatermarkText('SOMOS PIXART');
    setGalleryWatermarkImageUrl('');
    setGalleryWatermarkPosition('center');
    setGalleryWatermarkOpacity(0.35);
  };

  const openEditGalleryModal = (gal: GallerySession) => {
    setEditingGallery(gal);
    setGalleryTitle(gal.title);
    setGalleryTitleTypography(gal.titleTypography || {});
    setGallerySubtitle(gal.subtitle || '');
    setGallerySubtitleTypography(gal.subtitleTypography || {});
    setGalleryCategory(gal.category);
    setGalleryDate(gal.eventDate);
    setGalleryLocation(gal.location);
    setGalleryVenue(gal.venueName || '');
    setGalleryCover(gal.coverImage);
    setGalleryCoverPosition(gal.coverImagePosition || 'center');
    setGalleryPin(gal.accessPin);
    setGallerySelectedClients(gal.clientIds || []);
    setGalleryClientLimits(gal.clientPhotoLimits || {});
    setGalleryAllowDownload(gal.allowDownloadHighRes ?? true);
    setGalleryAllowFeedback(gal.allowFeedback ?? true);
    setGalleryAllowFavorites(gal.allowFavoritesSubmission ?? true);
    setGalleryMaxFavs(gal.maxFavoritesSelection || 50);
    setGalleryWatermarkEnabled(gal.watermarkEnabled ?? false);
    setGalleryWatermarkType(gal.watermarkType || 'text');
    setGalleryWatermarkText(gal.watermarkText || 'SOMOS PIXART');
    setGalleryWatermarkImageUrl(gal.watermarkImageUrl || '');
    setGalleryWatermarkPosition(gal.watermarkPosition || 'center');
    setGalleryWatermarkOpacity(gal.watermarkOpacity ?? 0.35);
    setShowNewGalleryModal(true);
  };

  // Submit New Client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: clientName,
        email: clientEmail,
        password: clientPassword || editingUser.password,
        phone: clientPhone,
        company: clientCompany,
        avatar: clientAvatar || editingUser.avatar,
        role: clientRole,
        assignedGalleryIds: clientAssignedGalleries,
        notes: clientNotes,
      });
      setEditingUser(null);
    } else {
      onCreateUser({
        name: clientName,
        email: clientEmail,
        password: clientPassword,
        role: clientRole,
        phone: clientPhone,
        company: clientCompany,
        avatar: clientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        assignedGalleryIds: clientAssignedGalleries,
        status: 'active',
        lastLogin: 'Nunca',
        notes: clientNotes,
      });
    }

    setShowNewClientModal(false);
    resetClientForm();
  };

  const resetClientForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPassword('demo23');
    setClientPhone('');
    setClientCompany('');
    setClientAvatar('');
    setClientRole('client');
    setClientAssignedGalleries([]);
    setClientNotes('');
  };

  const openEditClientModal = (user: User) => {
    setEditingUser(user);
    setClientName(user.name);
    setClientEmail(user.email);
    setClientPassword(user.password || '');
    setClientPhone(user.phone || '');
    setClientCompany(user.company || '');
    setClientAvatar(user.avatar || '');
    setClientRole(user.role);
    setClientAssignedGalleries(user.assignedGalleryIds || []);
    setClientNotes(user.notes || '');
    setShowNewClientModal(true);
  };

  // Helper to generate a lightweight web thumbnail and extract exact native dimensions
  const processImageFile = (file: File): Promise<{
    thumbnailUrl: string;
    width: number;
    height: number;
  }> => {
    return new Promise((resolve) => {
      const isRawCameraFormat = /\.(cr3|cr2|arw|nef|nrw|dng|raw|rw2|orf)$/i.test(file.name);
      if (isRawCameraFormat) {
        // High-end camera RAW formats cannot be decoded directly by HTML Image()
        // Provide standard editorial preview, while keeping exact RAW file size and original metadata
        resolve({
          thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
          width: 6720,
          height: 4480,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fullDataUrl = (e.target?.result as string) || '';
        const img = new Image();
        img.onload = () => {
          const naturalW = img.naturalWidth || img.width || 4000;
          const naturalH = img.naturalHeight || img.height || 3000;

          // Downscale preview thumbnail to max 1280px to keep storage tiny (< 100KB per photo)
          const maxDimension = 1280;
          let targetW = naturalW;
          let targetH = naturalH;
          if (targetW > maxDimension || targetH > maxDimension) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDimension) / targetW);
              targetW = maxDimension;
            } else {
              targetW = Math.round((targetW * maxDimension) / targetH);
              targetH = maxDimension;
            }
          }

          try {
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, targetW, targetH);
              const compressed = canvas.toDataURL('image/jpeg', 0.8);
              resolve({
                thumbnailUrl: compressed,
                width: naturalW,
                height: naturalH,
              });
              return;
            }
          } catch (canvasErr) {
            console.warn('Canvas thumbnail compression failed:', canvasErr);
          }

          resolve({
            thumbnailUrl: fullDataUrl.length < 250000 ? fullDataUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
            width: naturalW,
            height: naturalH,
          });
        };

        img.onerror = () => {
          resolve({
            thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
            width: 6000,
            height: 4000,
          });
        };

        img.src = fullDataUrl;
      };

      reader.onerror = () => {
        resolve({
          thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
          width: 6000,
          height: 4000,
        });
      };

      reader.readAsDataURL(file);
    });
  };

  // Process Multiple Files For Upload
  const processFilesForUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|tiff?|cr3|arw|nef|raw|dng)$/i.test(f.name));
    if (fileList.length === 0) return;

    setIsProcessingUploads(true);

    try {
      const results = await Promise.all(
        fileList.map(async (file) => {
          const [processed, exif] = await Promise.all([
            processImageFile(file),
            extractExifFromFile(file)
          ]);
          const originalName = file.name;
          const title = originalName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          return {
            id: `upl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: originalName,
            title: title || 'Fotografía',
            fileSizeBytes: file.size,
            sizeFormatted: formatBytes(file.size),
            previewUrl: processed.thumbnailUrl,
            width: exif.width || processed.width,
            height: exif.height || processed.height,
            cameraModel: exif.cameraModel,
            lens: exif.lens,
            focalLength: exif.focalLength,
            iso: exif.iso,
            shutterSpeed: exif.shutterSpeed,
            aperture: exif.aperture,
          };
        })
      );

      setPendingUploadFiles(prev => [...prev, ...results]);
    } catch (err) {
      console.error('Error processing upload files:', err);
    } finally {
      setIsProcessingUploads(false);
    }
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearPendingFiles = () => {
    setPendingUploadFiles([]);
  };

  // Submit Multiple Real Images Upload Safely
  const handleUploadImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadGalleryId || pendingUploadFiles.length === 0 || isSubmittingBatch) return;

    setIsSubmittingBatch(true);
    const targetGalId = uploadGalleryId;
    const items = [...pendingUploadFiles];

    try {
      items.forEach(item => {
        onUploadImage(targetGalId, {
          title: item.title,
          url: item.previewUrl,
          highResUrl: item.previewUrl,
          originalFileName: item.name,
          fileSizeBytes: item.fileSizeBytes,
          width: item.width,
          height: item.height,
          tags: ['RAW', 'Alta Resolución'],
          cameraModel: item.cameraModel,
          lens: item.lens,
          focalLength: item.focalLength,
          iso: item.iso,
          shutterSpeed: item.shutterSpeed,
          aperture: item.aperture,
        });
      });
    } catch (err) {
      console.error('Error submitting batch images:', err);
    }

    setIsSubmittingBatch(false);
    setUploadGalleryId(null);
    setPendingUploadFiles([]);
  };

  // Submit Feedback Reply
  const handleSendFeedbackReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingFeedback || !feedbackReplyText.trim()) return;

    onReplyFeedback(replyingFeedback.galleryId, replyingFeedback.feedbackId, feedbackReplyText.trim());
    setReplyingFeedback(null);
    setFeedbackReplyText('');
  };

  return (
    <div className={`min-h-screen pb-20 transition-colors ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Top Admin Sub-Navigation Header */}
      <div className={`border-b sticky top-16 z-30 backdrop-blur-md transition-colors ${
        isDark ? 'border-stone-800 bg-stone-900/90' : 'border-slate-200 bg-white/95 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
          
          {/* Top Quick Actions & Title Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${colorTheme.twText}`}>
                Panel de Control Profesional
              </span>
              <span className={isDark ? 'text-stone-600' : 'text-slate-300'}>•</span>
              <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                {branding.studioName}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="admin-create-gallery-top-btn"
                onClick={() => {
                  setEditingGallery(null);
                  resetGalleryForm();
                  setShowNewGalleryModal(true);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Sesión</span>
              </button>

              <button
                id="admin-add-client-top-btn"
                onClick={() => {
                  setEditingUser(null);
                  resetClientForm();
                  setShowNewClientModal(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Users className={`w-3.5 h-3.5 ${colorTheme.twText}`} />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* 2-Row Navigation Cards Grid: 4 Top Row, 3 Bottom Row */}
          <div className="space-y-2">
            
            {/* ROW 1: 4 Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
              
              {/* Card 1: Métricas & Resumen */}
              <button
                id="admin-tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-stone-800 text-amber-400' : 'bg-white text-slate-700 shadow-xs'
                }`}>
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">Métricas & Resumen</div>
                  <div className={`text-[10px] truncate ${activeTab === 'overview' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Visión del estudio
                  </div>
                </div>
              </button>

              {/* Card 2: Galerías & Sesiones */}
              <button
                id="admin-tab-galleries"
                onClick={() => setActiveTab('galleries')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'galleries'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'galleries'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white text-indigo-600 shadow-xs'
                }`}>
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">Galerías & Sesiones</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-code font-bold ${
                      activeTab === 'galleries' ? 'bg-white/20 text-white' : isDark ? 'bg-stone-800 text-indigo-400' : 'bg-slate-200 text-indigo-700'
                    }`}>
                      {galleries.length}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${activeTab === 'galleries' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Álbumes y fotografías
                  </div>
                </div>
              </button>

              {/* Card 3: Selección Favoritas */}
              <button
                id="admin-tab-favorites"
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-rose-600 text-white shadow-md border-transparent shadow-rose-600/30'
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'favorites'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-white text-rose-600 shadow-xs'
                }`}>
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">Selección Favoritas</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-code font-bold ${
                      activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-500'
                    }`}>
                      {totalFavoritesCount}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${activeTab === 'favorites' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Retoque y entrega final
                  </div>
                </div>
              </button>

              {/* Card 4: Clientes & Permisos */}
              <button
                id="admin-tab-clients"
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'clients'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'clients'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white text-emerald-600 shadow-xs'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">Clientes & Permisos</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-code font-bold ${
                      activeTab === 'clients' ? 'bg-white/20 text-white' : isDark ? 'bg-stone-800 text-emerald-400' : 'bg-slate-200 text-emerald-700'
                    }`}>
                      {clientUsers.length}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${activeTab === 'clients' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Accesos, PINs y descargas
                  </div>
                </div>
              </button>
            </div>

            {/* ROW 2: 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              
              {/* Card 5: Almacenamiento Servidor */}
              <button
                id="admin-tab-storage"
                onClick={() => setActiveTab('storage')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'storage'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'storage'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-white text-amber-600 shadow-xs'
                }`}>
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">Almacenamiento</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-code font-bold ${
                      activeTab === 'storage' ? 'bg-white/20 text-white' : isDark ? 'bg-stone-800 text-amber-400' : 'bg-slate-200 text-amber-700'
                    }`}>
                      {formatBytes(storageStats.usedBytes)}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate ${activeTab === 'storage' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Cuota y optimización WebP
                  </div>
                </div>
              </button>

              {/* Card 6: Seguridad & Auditoría */}
              <button
                id="admin-tab-permissions"
                onClick={() => setActiveTab('permissions')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'permissions'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'permissions'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-white text-cyan-600 shadow-xs'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">Seguridad & Auditoría</div>
                  <div className={`text-[10px] truncate ${activeTab === 'permissions' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Logs y accesos en vivo
                  </div>
                </div>
              </button>

              {/* Card 7: Personalización & Marca */}
              <button
                id="admin-tab-branding"
                onClick={() => setActiveTab('branding')}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeTab === 'branding'
                    ? `${colorTheme.twBg} text-white shadow-md border-transparent ${colorTheme.twShadow}`
                    : isDark 
                      ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 text-stone-200 hover:bg-stone-800/80' 
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'branding'
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-white text-purple-600 shadow-xs'
                }`}>
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">Personalización & Marca</div>
                  <div className={`text-[10px] truncate ${activeTab === 'branding' ? 'text-white/80' : isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Paleta, logos y diseño
                  </div>
                </div>
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* TAB 1: OVERVIEW & METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Storage */}
              <div 
                id="admin-overview-card-storage"
                onClick={() => setActiveTab('storage')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  isDark 
                    ? 'bg-stone-900 border-stone-800 hover:border-stone-700 shadow-lg' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Almacenamiento Usado
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-amber-500/10 text-amber-400' : `${colorTheme.twBadgeBg} ${colorTheme.twText} border ${colorTheme.twBadgeBorder}`
                  }`}>
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold font-mono-code ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                    {formatBytes(storageStats.usedBytes)}
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    de {formatBytes(storageStats.totalCapacityBytes)} asignados ({usedPercentage.toFixed(2)}%)
                  </p>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-stone-950' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full ${colorTheme.twBg}`}
                    style={{ width: `${Math.max(5, usedPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Total Photos */}
              <div 
                id="admin-overview-card-photos"
                onClick={() => setActiveTab('galleries')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  isDark 
                    ? 'bg-stone-900 border-stone-800 hover:border-stone-700 shadow-lg' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Fotografías en Servidor
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold font-mono-code ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                    {images.length} fotos
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Distribuidas en {galleries.length} sesiones activas
                  </p>
                </div>
                <div className={`text-[11px] flex items-center gap-1 font-medium ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  <span>Archivos RAW y 4K disponibles</span>
                </div>
              </div>

              {/* Card 3: Client Downloads */}
              <div 
                id="admin-overview-card-downloads"
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-900 border-stone-800 shadow-lg' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Descargas de Clientes
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    <Download className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold font-mono-code ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                    {totalDownloads} archivos
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    {totalViews} visualizaciones totales registradas
                  </p>
                </div>
                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Descarga directa de ZIP y RAW activa
                </div>
              </div>

              {/* Card 4: Feedback & Reviews */}
              <div 
                id="admin-overview-card-reviews"
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-900 border-stone-800 shadow-lg' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Feedback & Calificaciones
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`text-2xl font-bold font-mono-code ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                    5.0 ★ <span className={`text-xs font-normal ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>({totalFeedbackCount} reseñas)</span>
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    100% satisfacción en entregas
                  </p>
                </div>
                <div className={`text-[11px] flex items-center gap-1 font-medium ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>Sin solicitudes de retoque pendientes</span>
                </div>
              </div>

            </div>

            {/* Middle Grid: Storage by Category & Recent Client Feedback Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Storage by category visual breakdown */}
              <div className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 space-y-6 ${
                isDark ? 'bg-stone-900 border-stone-800 shadow-xl' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className={`flex items-center justify-between border-b pb-4 ${
                  isDark ? 'border-stone-800' : 'border-slate-100'
                }`}>
                  <div>
                    <h3 className={`text-base font-bold font-serif-display ${
                      isDark ? 'text-stone-100' : 'text-slate-900'
                    }`}>
                      Espacio por Categoría de Evento
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                      Distribución del disco en el servidor
                    </p>
                  </div>
                  <HardDrive className={`w-4 h-4 ${colorTheme.twText}`} />
                </div>

                <div className="space-y-4">
                  {['boda', 'editorial', 'retrato', 'corporativo'].map((cat) => {
                    const catGalleries = galleries.filter(g => g.category === cat);
                    const catImages = images.filter(img => catGalleries.some(g => g.id === img.galleryId));
                    const catBytes = catImages.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
                    const catPercent = storageStats.usedBytes > 0 ? (catBytes / storageStats.usedBytes) * 100 : 0;

                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`capitalize font-medium flex items-center gap-2 ${
                            isDark ? 'text-stone-200' : 'text-slate-700'
                          }`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              cat === 'boda' ? 'bg-amber-400' : cat === 'editorial' ? 'bg-indigo-400' : cat === 'retrato' ? 'bg-rose-400' : 'bg-emerald-400'
                            }`} />
                            {cat} ({catGalleries.length} sesiones, {catImages.length} fotos)
                          </span>
                          <span className={`font-mono-code font-semibold ${
                            isDark ? 'text-stone-300' : 'text-slate-800'
                          }`}>{formatBytes(catBytes)}</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                          isDark ? 'bg-stone-950' : 'bg-slate-100'
                        }`}>
                          <div 
                            className={`h-full rounded-full ${
                              cat === 'boda' ? 'bg-amber-500' : cat === 'editorial' ? 'bg-indigo-500' : cat === 'retrato' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(4, catPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Storage quota status callout */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-xs">
                    <p className={`font-medium ${isDark ? 'text-stone-200' : 'text-slate-700'}`}>
                      Límite de Disco Actual:
                    </p>
                    <p className={`font-mono-code text-xs font-bold ${
                      isDark ? 'text-amber-400' : colorTheme.twText
                    }`}>{formatBytes(storageStats.totalCapacityBytes)} ({usedPercentage.toFixed(1)}% en uso)</p>
                  </div>
                  <button
                    id="overview-manage-storage-btn"
                    onClick={() => setActiveTab('storage')}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' 
                        : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder} hover:opacity-90`
                    }`}
                  >
                    Ver Almacenamiento
                  </button>
                </div>
              </div>

              {/* Recent Feedback Feed with Quick Reply */}
              <div className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 space-y-6 ${
                isDark ? 'bg-stone-900 border-stone-800 shadow-xl' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className={`flex items-center justify-between border-b pb-4 ${
                  isDark ? 'border-stone-800' : 'border-slate-100'
                }`}>
                  <div>
                    <h3 className={`text-base font-bold font-serif-display ${
                      isDark ? 'text-stone-100' : 'text-slate-900'
                    }`}>
                      Bandeja de Impresiones & Feedback
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                      Comentarios recientes de clientes
                    </p>
                  </div>
                  <MessageSquare className={`w-4 h-4 ${colorTheme.twText}`} />
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {galleries.flatMap(g => (g.feedbackList || []).map(f => ({ ...f, galleryTitle: g.title }))).slice(0, 4).map((fb) => (
                    <div key={fb.id} className={`p-4 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-slate-900'}`}>
                          {fb.clientName}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: fb.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className={`text-[11px] font-mono-code ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                        {fb.galleryTitle}
                      </p>
                      <p className={`text-xs italic ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                        "{fb.message}"
                      </p>

                      {fb.photographerReply ? (
                        <div className={`text-[11px] p-2.5 rounded-xl border ${
                          isDark 
                            ? 'text-amber-300 bg-stone-900 border-amber-500/20' 
                            : 'text-amber-900 bg-amber-50/80 border-amber-200'
                        }`}>
                          <strong>Respuesta enviada:</strong> {fb.photographerReply}
                        </div>
                      ) : (
                        <button
                          id={`reply-fb-btn-${fb.id}`}
                          onClick={() => setReplyingFeedback({ galleryId: fb.galleryId, feedbackId: fb.id, clientName: fb.clientName })}
                          className={`text-[11px] font-medium flex items-center gap-1 mt-2 cursor-pointer ${
                            isDark ? 'text-amber-400 hover:text-amber-300' : `${colorTheme.twText} hover:underline`
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Responder al cliente...</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB: FAVORITES & RETOUCHING BOARD */}
        {activeTab === 'favorites' && (
          <AdminFavoritesView
            galleries={galleries}
            images={images}
            users={users}
            onOpenGallery={onOpenGallery}
            onUpdateImage={onUpdateImage}
            theme={theme}
            branding={branding}
          />
        )}

        {/* TAB 2: GALLERIES & SESSIONS MANAGEMENT */}
        {activeTab === 'galleries' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className={`text-xl font-bold font-serif-display ${
                  isDark ? 'text-stone-100' : 'text-slate-900'
                }`}>
                  Gestión de Sesiones & Galerías Fotográficas
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Controla fechas, ubicaciones, espacio en disco, contraseñas PIN y asignación de clientes.
                </p>
              </div>

              <button
                id="create-new-session-modal-btn"
                onClick={() => {
                  setEditingGallery(null);
                  resetGalleryForm();
                  setShowNewGalleryModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Sesión</span>
              </button>
            </div>

            {/* Sessions Table / List */}
            <div className={`rounded-3xl border overflow-hidden shadow-xl ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b uppercase tracking-wider text-[10px] ${
                    isDark ? 'bg-stone-950/80 border-stone-800 text-stone-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <tr>
                      <th className="px-6 py-4">Sesión / Proyecto</th>
                      <th className="px-6 py-4">Fecha & Ubicación</th>
                      <th className="px-6 py-4">Cliente Asignado</th>
                      <th className="px-6 py-4">Fotos & Espacio</th>
                      <th className="px-6 py-4">PIN Acceso</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDark ? 'divide-stone-800/60' : 'divide-slate-200'
                  }`}>
                    {galleries.map((gal) => {
                      const galImages = images.filter(i => i.galleryId === gal.id);
                      const sizeBytes = galImages.reduce((acc, i) => acc + (i.fileSizeBytes || 0), 0);

                      return (
                        <tr key={gal.id} className={`transition-colors ${
                          isDark ? 'hover:bg-stone-800/30' : 'hover:bg-slate-50'
                        }`}>
                          
                          {/* Title & Cover */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group/cover w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-700/60 shadow-xs">
                                <img 
                                  src={gal.coverImage} 
                                  alt={gal.title} 
                                  className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform"
                                  style={{
                                    objectPosition: getImagePositionStyle(gal.coverImagePosition),
                                  }}
                                />
                                <label 
                                  title="Cambiar portada desde dispositivo"
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"
                                >
                                  <Camera className="w-4 h-4 text-amber-300" />
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleDirectSessionCoverUpload(gal.id, file);
                                    }}
                                  />
                                </label>
                              </div>
                              <div>
                                <h4 
                                  className={`font-semibold transition-colors cursor-pointer ${
                                    isDark ? 'text-stone-100 hover:text-amber-300' : 'text-slate-900 hover:underline'
                                  }`} 
                                  onClick={() => onOpenGallery(gal.id)}
                                >
                                  {gal.title}
                                </h4>
                                <span className={`inline-block uppercase text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border mt-1 ${
                                  isDark 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                    : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder}`
                                }`}>
                                  {gal.category}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Date & Location */}
                          <td className="px-6 py-4 space-y-1">
                            <div className={`flex items-center gap-1.5 font-medium ${
                              isDark ? 'text-stone-300' : 'text-slate-700'
                            }`}>
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{gal.eventDate}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 text-[11px] ${
                              isDark ? 'text-stone-400' : 'text-slate-500'
                            }`}>
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[160px]">{gal.location}</span>
                            </div>
                          </td>

                          {/* Assigned Client */}
                          <td className="px-6 py-4">
                            <span className={`font-medium ${isDark ? 'text-stone-200' : 'text-slate-800'}`}>
                              {gal.clientNames?.join(', ') || 'Sin cliente asignado'}
                            </span>
                          </td>

                          {/* Photos and Size */}
                          <td className="px-6 py-4 space-y-1">
                            <div className={`font-mono-code font-bold ${
                              isDark ? 'text-amber-300' : colorTheme.twText
                            }`}>
                              {formatBytes(sizeBytes)}
                            </div>
                            <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                              {galImages.length} archivos RAW/JPEG
                            </div>
                          </td>

                          {/* PIN */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg font-mono-code font-bold border text-xs ${
                              isDark 
                                ? 'bg-stone-950 text-amber-300 border-stone-800' 
                                : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder}`
                            }`}>
                              {gal.accessPin}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Framing tool for cover + batch apply option */}
                              <ImagePositionPicker
                                value={gal.coverImagePosition || 'center'}
                                onChange={(pos) => handleDirectGalleryCoverPositionChange(gal.id, pos)}
                                onApplyToAll={onBatchUpdateImagePosition ? (pos) => onBatchUpdateImagePosition(gal.id, pos) : undefined}
                                previewImageUrl={gal.coverImage}
                                compact={true}
                                label="Encuadre"
                                theme={theme}
                              />

                              {/* Open client view */}
                              <button
                                id={`view-gal-btn-${gal.id}`}
                                onClick={() => onOpenGallery(gal.id)}
                                title="Ver Galería de Alta Resolución"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Upload photos to this session */}
                              <button
                                id={`upload-photo-to-gal-btn-${gal.id}`}
                                onClick={() => {
                                  setUploadGalleryId(gal.id);
                                  setPendingUploadFiles([]);
                                }}
                                title="Subir Fotografías a esta Sesión"
                                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30' 
                                    : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder} hover:opacity-80`
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Gallery */}
                              <button
                                id={`edit-gal-btn-${gal.id}`}
                                onClick={() => openEditGalleryModal(gal)}
                                title="Editar Detalles y Permisos"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Empty Photos in this Session */}
                              {galImages.length > 0 && onDeleteAllImagesInGallery && (
                                <button
                                  id={`empty-photos-gal-btn-${gal.id}`}
                                  onClick={() => setGalleryToEmptyPhotos(gal)}
                                  title={`Vaciar todas las fotos (${galImages.length}) de esta sesión`}
                                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                    isDark 
                                      ? 'bg-stone-800 hover:bg-amber-950/80 text-stone-400 hover:text-amber-400' 
                                      : 'bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Gallery */}
                              <button
                                id={`delete-gal-btn-${gal.id}`}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar la sesión "${gal.title}" y sus fotos del servidor?`)) {
                                    onDeleteGallery(gal.id);
                                  }
                                }}
                                title="Eliminar Galería Completa"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-stone-800 hover:bg-rose-950/80 text-stone-400 hover:text-rose-400' 
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CLIENTS & PERMISSIONS MANAGEMENT */}
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className={`text-xl font-bold font-serif-display ${
                  isDark ? 'text-stone-100' : 'text-slate-900'
                }`}>
                  Gestión de Clientes & Permisos de Acceso
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Asigna galerías privadas individualmente, credenciales de acceso y permisos de descarga o feedback.
                </p>
              </div>

              <button
                id="create-client-btn"
                onClick={() => {
                  setEditingUser(null);
                  resetClientForm();
                  setShowNewClientModal(true);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Cliente</span>
              </button>
            </div>

            {/* Clients Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientUsers.map((client) => {
                const assignedGals = galleries.filter(g => client.assignedGalleryIds?.includes(g.id));

                return (
                  <div 
                    key={client.id} 
                    id={`client-card-${client.id}`}
                    className={`p-6 rounded-3xl border transition-all shadow-md flex flex-col justify-between space-y-4 ${
                      isDark 
                        ? 'bg-stone-900 border-stone-800 hover:border-stone-700' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Avatar & Name */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {client.avatar ? (
                            <img 
                              src={client.avatar} 
                              alt={client.name} 
                              className={`w-12 h-12 rounded-2xl object-cover border ${
                                isDark ? 'border-amber-500/40' : 'border-slate-300'
                              }`}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base text-white ${colorTheme.twBg}`}>
                              {client.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className={`font-bold text-sm ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                              {client.name}
                            </h4>
                            <p className={`text-xs font-mono-code ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                              {client.email}
                            </p>
                            {client.company && (
                              <p className={`text-[11px] font-medium ${isDark ? 'text-amber-400/80' : colorTheme.twText}`}>
                                {client.company}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {client.status}
                        </span>
                      </div>

                      {/* Credentials info */}
                      <div className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                        isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`flex items-center justify-between ${isDark ? 'text-stone-400' : 'text-slate-600'}`}>
                          <span className="flex items-center gap-1.5">
                            <Key className={`w-3 h-3 ${colorTheme.twText}`} />
                            Contraseña / Acceso:
                          </span>
                          <span className={`font-mono-code font-bold ${isDark ? 'text-stone-200' : 'text-slate-900'}`}>
                            {client.password || '••••••••'}
                          </span>
                        </div>
                        {client.phone && (
                          <div className={`flex items-center justify-between ${isDark ? 'text-stone-400' : 'text-slate-600'}`}>
                            <span>Teléfono:</span>
                            <span className={`font-mono-code ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                              {client.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Galleries */}
                      <div className="space-y-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                          isDark ? 'text-stone-400' : 'text-slate-500'
                        }`}>
                          Galerías Asignadas ({assignedGals.length}):
                        </span>
                        {assignedGals.length === 0 ? (
                          <p className={`text-[11px] italic ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                            Sin galerías asignadas
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {assignedGals.map(g => (
                              <div key={g.id} className={`text-xs px-2.5 py-1 rounded-lg border flex items-center justify-between ${
                                isDark 
                                  ? 'text-stone-200 bg-stone-950 border-stone-800' 
                                  : 'text-slate-700 bg-slate-50 border-slate-200'
                              }`}>
                                <span className="truncate max-w-[180px]">{g.title}</span>
                                <span className={`text-[10px] font-mono-code font-bold ${
                                  isDark ? 'text-amber-400' : colorTheme.twText
                                }`}>PIN {g.accessPin}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className={`pt-2 border-t flex items-center justify-between ${
                      isDark ? 'border-stone-800/80' : 'border-slate-100'
                    }`}>
                      <button
                        id={`edit-client-btn-${client.id}`}
                        onClick={() => openEditClientModal(client)}
                        className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                          isDark ? 'text-amber-400 hover:text-amber-300' : `${colorTheme.twText} hover:underline`
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Permisos</span>
                      </button>

                      <button
                        id={`delete-client-btn-${client.id}`}
                        onClick={() => setClientToDelete(client)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-stone-500 hover:text-rose-400 hover:bg-stone-800' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 4: SERVER STORAGE & CAPACITY CONTROL */}
        {activeTab === 'storage' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Header with Server Quota & Storage Management */}
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xl ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}>
              
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6 ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${
                    isDark ? 'text-amber-400' : 'text-blue-600'
                  }`}>
                    Almacenamiento del Servidor Pixart Photo
                  </span>
                  <h3 className={`text-2xl font-bold font-serif-display mt-1 ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                  }`}>
                    Control de Capacidad & Archivos de Alta Resolución
                  </h3>
                  <p className={`text-xs mt-1 max-w-xl ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Supervisa el peso exacto de cada toma RAW/JPEG en el servidor. Puedes ajustar el límite de almacenamiento disponible para el estudio fotográfico.
                  </p>
                </div>

                <button
                  id="header-edit-storage-limit-btn"
                  onClick={() => setShowStorageLimitModal(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all shadow-sm cursor-pointer ${
                    isDark 
                      ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700 hover:border-amber-400/40' 
                      : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder} hover:shadow-md`
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Límite de Disco</span>
                </button>
              </div>

              {/* Disk Space Meter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Espacio Utilizado:
                  </span>
                  <p className={`text-2xl font-bold font-mono-code ${
                    isDark ? 'text-amber-300' : 'text-blue-600'
                  }`}>
                    {formatBytes(storageStats.usedBytes)}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    {storageStats.totalImagesCount} archivos fotográficos almacenados
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 relative group ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                      Capacidad Total del Servidor:
                    </span>
                    <button
                      onClick={() => setShowStorageLimitModal(true)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isDark ? 'text-stone-400 hover:text-amber-300 hover:bg-stone-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'
                      }`}
                      title="Editar capacidad"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className={`text-2xl font-bold font-mono-code ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                  }`}>
                    {formatBytes(storageStats.totalCapacityBytes)}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Cuota configurable SSD</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Estado de Fotografías:
                  </span>
                  <p className="text-2xl font-bold font-mono-code text-emerald-600 dark:text-emerald-300">
                    {storageStats.totalImagesCount} fotos
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Resolución nativa y RAW preservados
                  </p>
                </div>
              </div>

              {/* Progress Bar with Small Edit Limit Button */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code">
                  <div className="flex items-center gap-2">
                    <span className={isDark ? 'text-stone-300' : 'text-slate-700'}>
                      Uso Actual del Disco: {usedPercentage.toFixed(2)}%
                    </span>
                    <button
                      id="edit-storage-limit-btn"
                      onClick={() => setShowStorageLimitModal(true)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-sans font-semibold transition-all shadow-xs cursor-pointer ${
                        isDark 
                          ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700 hover:border-amber-400' 
                          : 'bg-white hover:bg-slate-100 text-blue-700 border-slate-300 hover:border-blue-400'
                      }`}
                      title="Editar límite de almacenamiento del servidor"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Límite</span>
                    </button>
                  </div>
                  <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-blue-600'}`}>
                    {formatBytes(storageStats.usedBytes)} / {formatBytes(storageStats.totalCapacityBytes)}
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden border ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400"
                    style={{ width: `${Math.min(100, Math.max(4, usedPercentage))}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Detailed Photo File Size Inspector Table */}
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xl ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className={`text-lg font-bold font-serif-display ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                  }`}>
                    Inspector de Archivos & Tamaños Individuales
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Desglose detallado del peso en bytes, resolución y cámara de cada toma subida al servidor.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>Sesión:</span>
                    <select
                      value={photoFilterGalleryId}
                      onChange={(e) => setPhotoFilterGalleryId(e.target.value)}
                      className={`text-xs rounded-xl px-3 py-1.5 border font-sans cursor-pointer ${
                        isDark ? 'bg-stone-950 border-stone-700 text-stone-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="all">Todas las sesiones ({images.length} fotos)</option>
                      {galleries.map(g => {
                        const count = images.filter(i => i.galleryId === g.id).length;
                        return (
                          <option key={g.id} value={g.id}>
                            {g.title} ({count} fotos)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Batch alignment for selected session */}
                  {photoFilterGalleryId !== 'all' && onBatchUpdateImagePosition && (
                    <ImagePositionPicker
                      value={filteredInspectorImages[0]?.imagePosition || 'center'}
                      onChange={(pos) => onBatchUpdateImagePosition(photoFilterGalleryId, pos)}
                      label="Encuadre de esta sesión"
                      compact={false}
                      theme={theme}
                    />
                  )}

                  {/* Batch delete photos button */}
                  {filteredInspectorImages.length > 0 && onDeleteAllImagesInGallery && (
                    <button
                      type="button"
                      onClick={() => {
                        if (photoFilterGalleryId !== 'all') {
                          const targetGal = galleries.find(g => g.id === photoFilterGalleryId);
                          if (targetGal) setGalleryToEmptyPhotos(targetGal);
                        } else {
                          if (confirm(`¿Eliminar permanentemente TODAS las fotografías del servidor (${images.length} fotos)?`)) {
                            galleries.forEach(g => onDeleteAllImagesInGallery(g.id));
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer transition-colors"
                      title="Eliminar fotos seleccionadas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {photoFilterGalleryId !== 'all' 
                          ? `Vaciar fotos de esta sesión (${filteredInspectorImages.length})` 
                          : `Eliminar todas las fotos (${images.length})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b uppercase tracking-wider text-[10px] ${
                    isDark ? 'bg-stone-950/80 border-stone-800 text-stone-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <tr>
                      <th className="px-4 py-3">Miniatura / Nombre</th>
                      <th className="px-4 py-3">Galería / Proyecto</th>
                      <th className="px-4 py-3">Tamaño RAW</th>
                      <th className="px-4 py-3">Resolución</th>
                      <th className="px-4 py-3">Cámara & Sensor</th>
                      <th className="px-4 py-3">Estado Servidor</th>
                      <th className="px-4 py-3">Protección / Marca de Agua</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono-code text-[11px] ${
                    isDark ? 'divide-stone-800/60' : 'divide-slate-200'
                  }`}>
                    {filteredInspectorImages.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`text-center py-8 font-sans ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                          No hay fotografías cargadas en esta sesión.
                        </td>
                      </tr>
                    ) : (
                      filteredInspectorImages.map((img) => {
                        const parentGal = galleries.find(g => g.id === img.galleryId);

                        return (
                          <tr key={img.id} className={`transition-colors ${
                            isDark ? 'hover:bg-stone-800/40' : 'hover:bg-slate-50'
                          }`}>
                          
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={img.url} 
                                alt={img.title} 
                                className={`w-10 h-10 rounded-lg object-cover border ${
                                  isDark ? 'border-stone-700/60' : 'border-slate-200'
                                }`}
                                style={{
                                  objectPosition: getImagePositionStyle(img.imagePosition),
                                }}
                              />
                              <div className="font-sans">
                                <p className={`font-semibold truncate max-w-[180px] ${
                                  isDark ? 'text-stone-200' : 'text-slate-900'
                                }`}>{img.title}</p>
                                <p className={`text-[10px] font-mono-code ${
                                  isDark ? 'text-stone-400' : 'text-slate-500'
                                }`}>{img.originalFileName}</p>
                              </div>
                            </div>
                          </td>

                          <td className={`px-4 py-3 font-sans ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {parentGal?.title || 'Sesión Pixart Photo'}
                          </td>

                          <td className={`px-4 py-3 font-bold ${
                            isDark ? 'text-amber-300' : 'text-blue-600'
                          }`}>
                            {formatBytes(img.fileSizeBytes)}
                          </td>

                          <td className={`px-4 py-3 ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {img.width} × {img.height} px
                          </td>

                          <td className={`px-4 py-3 font-sans ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                            {img.cameraModel || 'No disponible / Web'}
                          </td>

                          <td className="px-4 py-3 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              img.optimized 
                                ? isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {img.optimized ? 'Optimizado WebP' : 'RAW Pesado'}
                            </span>
                          </td>

                          {/* Watermark Protection & Exemption Toggle */}
                          <td className="px-4 py-3 font-sans">
                            {parentGal?.watermarkEnabled ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                                  img.excludeWatermark
                                    ? isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isDark ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-violet-50 text-violet-700 border-violet-200'
                                }`}>
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {img.excludeWatermark ? 'Sin Marca (Descargable)' : 'Con Marca de Agua'}
                                </span>
                                {onUpdateImage && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateImage({ ...img, excludeWatermark: !img.excludeWatermark })}
                                    className={`text-[10px] underline cursor-pointer hover:opacity-80 font-medium ${
                                      img.excludeWatermark
                                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                                        : isDark ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}
                                    title={img.excludeWatermark ? 'Reactivar marca de agua en esta foto' : 'Quitar marca de agua y habilitar su descarga directa'}
                                  >
                                    {img.excludeWatermark ? 'Reactivar marca' : 'Quitar marca de agua'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className={`text-[10px] italic ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                                Galería sin marcas
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {onUpdateImage && (
                                <ImagePositionPicker
                                  value={img.imagePosition || 'center'}
                                  onChange={(newPos) => {
                                    onUpdateImage({
                                      ...img,
                                      imagePosition: newPos,
                                    });
                                  }}
                                  onApplyToAll={onBatchUpdateImagePosition ? (pos) => onBatchUpdateImagePosition(img.galleryId, pos) : undefined}
                                  previewImageUrl={img.url}
                                  label="Alinear"
                                  theme={theme}
                                  compact
                                />
                              )}

                              {/* Direct download if photo is exempt or gallery allows download */}
                              {(img.excludeWatermark || (!parentGal?.watermarkEnabled && parentGal?.allowDownloadHighRes)) && (
                                <button
                                  type="button"
                                  onClick={() => downloadSingleImage(img, 'high-res', {
                                    watermarkEnabled: parentGal?.watermarkEnabled,
                                    excludeWatermark: img.excludeWatermark,
                                    watermarkType: parentGal?.watermarkType,
                                    watermarkText: parentGal?.watermarkText,
                                    watermarkImageUrl: parentGal?.watermarkImageUrl,
                                    watermarkPosition: parentGal?.watermarkPosition,
                                    watermarkOpacity: parentGal?.watermarkOpacity,
                                  })}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    img.excludeWatermark
                                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                                      : isDark ? 'text-stone-400 hover:text-amber-300 hover:bg-stone-800' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                                  }`}
                                  title="Descargar archivo en alta resolución"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                id={`delete-image-btn-${img.id}`}
                                onClick={() => setAdminPhotoToDelete(img)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'text-stone-400 hover:text-rose-400 hover:bg-stone-800' 
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Eliminar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM PERMISSIONS & AUDIT LOG */}
        {activeTab === 'permissions' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Roles Matrix */}
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xl ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h3 className={`text-xl font-bold font-serif-display ${
                  isDark ? 'text-stone-100' : 'text-slate-900'
                }`}>
                  Matriz de Permisos & Seguridad del Sistema
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Nivel de acceso por rol dentro de la plataforma Pixart Photo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Role 1: Admin */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'text-amber-400' : 'text-amber-800'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrador</span>
                  </div>
                  <ul className={`space-y-1.5 text-xs ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      Control total de almacenamiento
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      Crear / Editar / Eliminar clientes
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      Asignar PIN y contraseñas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      Descarga y auditoría total
                    </li>
                  </ul>
                </div>

                {/* Role 2: Lead Photographer */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-indigo-50/50 border-indigo-200'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'text-indigo-400' : 'text-indigo-700'
                  }`}>
                    <Camera className="w-4 h-4" />
                    <span>Fotógrafo Principal</span>
                  </div>
                  <ul className={`space-y-1.5 text-xs ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Subida de fotos RAW / JPEGs
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Responder feedback de clientes
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Ver selección de favoritas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      Optimizar almacenamiento
                    </li>
                  </ul>
                </div>

                {/* Role 3: Assistant */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'text-stone-300' : 'text-slate-700'
                  }`}>
                    <Sliders className="w-4 h-4" />
                    <span>Asistente de Retoque</span>
                  </div>
                  <ul className={`space-y-1.5 text-xs ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      Visualización de sesiones
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      Descarga para edición
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      Revisión de solicitudes
                    </li>
                  </ul>
                </div>

                {/* Role 4: Client */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'text-rose-400' : 'text-rose-700'
                  }`}>
                    <Users className="w-4 h-4" />
                    <span>Cliente (Galería Privada)</span>
                  </div>
                  <ul className={`space-y-1.5 text-xs ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                      Acceso exclusivo con PIN/Password
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                      Selección de fotos favoritas
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                      Descarga individual y ZIP
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                      Envío de comentarios y feedback
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Audit Log Stream */}
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xl ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <div>
                  <h4 className={`text-lg font-bold font-serif-display ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                  }`}>
                    Registro de Auditoría & Actividad en Tiempo Real
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Historial de accesos, descargas, subidas de fotos y cambios de permisos.
                  </p>
                </div>
                <Activity className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                    isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-stone-200' : 'text-slate-900'}`}>
                          {log.action}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isDark 
                            ? 'bg-stone-800 text-amber-400 border-stone-700' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {log.actorName} ({log.actorRole})
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>{log.details}</p>
                      {log.galleryTitle && (
                        <p className={`text-[10px] font-mono-code ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                          {log.galleryTitle}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono-code whitespace-nowrap ${
                      isDark ? 'text-stone-500' : 'text-slate-400'
                    }`}>
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: BRANDING & DESIGN CONFIGURATION */}
        {activeTab === 'branding' && (
          <AdminBrandingSettings
            branding={branding}
            onSaveBranding={onSaveBranding}
            onPreviewPortal={onPreviewPortal}
            theme={theme}
          />
        )}

      </div>

      {/* MODAL: NEW / EDIT GALLERY (90vw x 90vh with fixed header & footer and scrollable body) */}
      {showNewGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
          <div 
            id="new-gallery-modal-dialog"
            className={`w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col border rounded-3xl shadow-2xl overflow-hidden ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Fixed Header */}
            <div className={`px-6 sm:px-8 py-4 sm:py-5 border-b shrink-0 flex items-center justify-between ${
              isDark ? 'border-stone-800 bg-stone-900/90' : 'border-slate-100 bg-white/90'
            }`}>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className={`text-xl font-bold font-serif-display ${
                    isDark ? 'text-stone-100' : 'text-slate-900'
                  }`}>
                    {editingGallery 
                      ? (galleryModalTexts.titleEdit || 'Editar Sesión Fotográfica') 
                      : (galleryModalTexts.titleNew || 'Configurar Nueva Sesión Fotográfica')}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    editingGallery ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {editingGallery ? 'Edición' : 'Nueva'}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Configura los detalles del evento, encuadre de la portada, asignación de clientes y protección de marca.
                </p>
              </div>
              <button 
                id="close-gallery-modal-btn"
                onClick={() => setShowNewGalleryModal(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveGallery} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
                
                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* LEFT COLUMN: Session Information & Permissions */}
                  <div className="space-y-6">
                    
                    {/* Basic Info Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <h4 className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-amber-400' : colorTheme.twText}`}>
                        Información Principal de la Sesión
                      </h4>

                      {/* Title */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {galleryModalTexts.titleLabel || 'Título del Evento / Sesión:'}
                          </label>
                          <TypographyControl
                            label="Tipografía del Título"
                            value={galleryTitleTypography}
                            onChange={setGalleryTitleTypography}
                            sampleText={galleryTitle || 'Camila & David — Boda'}
                            theme={theme}
                          />
                        </div>
                        <input
                          id="input-gallery-title"
                          type="text"
                          required
                          value={galleryTitle}
                          onChange={(e) => setGalleryTitle(e.target.value)}
                          placeholder={galleryModalTexts.titlePlaceholder || 'Ej. Camila & David — Boda en Hacienda Real'}
                          className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                            isDark 
                              ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Subtitle */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            Subtítulo o Frase de la Sesión:
                          </label>
                          <TypographyControl
                            label="Tipografía del Subtítulo"
                            value={gallerySubtitleTypography}
                            onChange={setGallerySubtitleTypography}
                            sampleText={gallerySubtitle || 'Celebración inolvidable bajo el atardecer'}
                            theme={theme}
                          />
                        </div>
                        <input
                          id="input-gallery-subtitle"
                          type="text"
                          value={gallerySubtitle}
                          onChange={(e) => setGallerySubtitle(e.target.value)}
                          placeholder="Ej. Celebración inolvidable bajo la luz del atardecer"
                          className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                            isDark 
                              ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Category & Date Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {galleryModalTexts.categoryLabel || 'Categoría de Fotografía:'}
                          </label>
                          <select
                            id="select-gallery-category"
                            value={galleryCategory}
                            onChange={(e) => setGalleryCategory(e.target.value as any)}
                            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                              isDark 
                                ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                                : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                            }`}
                          >
                            <option value="boda">💍 Boda / Enlace Nupcial</option>
                            <option value="editorial">✨ Moda Editorial & Alta Costura</option>
                            <option value="retrato">👤 Retrato de Autor & Personal Branding</option>
                            <option value="corporativo">🏢 Corporativo & Eventos de Empresa</option>
                            <option value="arquitectura">🏛️ Arquitectura & Espacios</option>
                            <option value="familia">👶 Familia & Maternidad</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {galleryModalTexts.dateLabel || 'Fecha del Evento:'}
                          </label>
                          <input
                            id="input-gallery-date"
                            type="date"
                            required
                            value={galleryDate}
                            onChange={(e) => setGalleryDate(e.target.value)}
                            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                              isDark 
                                ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                                : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Location & PIN Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {galleryModalTexts.locationLabel || 'Ciudad / Región:'}
                          </label>
                          <input
                            id="input-gallery-location"
                            type="text"
                            required
                            value={galleryLocation}
                            onChange={(e) => setGalleryLocation(e.target.value)}
                            placeholder={galleryModalTexts.locationPlaceholder || 'Ej. Madrid / Palacio de Cristal'}
                            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                              isDark 
                                ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                            {galleryModalTexts.pinLabel || 'PIN de Acceso Privado (4 dígitos):'}
                          </label>
                          <input
                            id="input-gallery-pin"
                            type="text"
                            maxLength={8}
                            required
                            value={galleryPin}
                            onChange={(e) => setGalleryPin(e.target.value)}
                            placeholder={galleryModalTexts.pinPlaceholder || '2024'}
                            className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono-code font-bold focus:outline-none focus:ring-2 ${
                              isDark 
                                ? 'bg-stone-950 border-stone-700 text-amber-300 focus:ring-amber-400' 
                                : 'bg-white border-slate-300 text-blue-600 focus:ring-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Permissions Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-amber-400' : colorTheme.twText}`}>
                          Permisos para Clientes en esta Sesión
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                          Habilitar funciones interactivas
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Favorites */}
                        <label className={`flex items-center justify-between text-xs cursor-pointer p-2.5 rounded-xl border ${
                          isDark ? 'bg-stone-900/50 border-stone-800 text-stone-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold block">Selección y Envío de Fotos Favoritas</span>
                            <span className={`text-[10px] block ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                              Permite al cliente marcar fotos con corazón y enviar su lista final.
                            </span>
                          </div>
                          <input
                            id="toggle-gallery-favorites"
                            type="checkbox"
                            checked={galleryAllowFavorites}
                            onChange={(e) => setGalleryAllowFavorites(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                        </label>

                        {/* Feedback */}
                        <label className={`flex items-center justify-between text-xs cursor-pointer p-2.5 rounded-xl border ${
                          isDark ? 'bg-stone-900/50 border-stone-800 text-stone-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold block">Dejar Feedback & Solicitudes de Retoque</span>
                            <span className={`text-[10px] block ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                              Permite calificar la sesión y redactar solicitudes de ajuste.
                            </span>
                          </div>
                          <input
                            id="toggle-gallery-feedback"
                            type="checkbox"
                            checked={galleryAllowFeedback}
                            onChange={(e) => setGalleryAllowFeedback(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                        </label>

                        {/* Direct Download */}
                        <label className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                          galleryWatermarkEnabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                        } ${isDark ? 'bg-stone-900/50 border-stone-800 text-stone-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold block">Descarga Directa de Alta Resolución (RAW/4K)</span>
                            {galleryWatermarkEnabled ? (
                              <span className="text-[10px] text-amber-400 font-semibold block">
                                🔒 Bloqueado: restringido mientras la marca de agua esté activa.
                              </span>
                            ) : (
                              <span className={`text-[10px] block ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                                Permite la descarga directa de archivos originales en alta calidad.
                              </span>
                            )}
                          </div>
                          <input
                            id="toggle-gallery-download"
                            type="checkbox"
                            disabled={galleryWatermarkEnabled}
                            checked={!galleryWatermarkEnabled && galleryAllowDownload}
                            onChange={(e) => setGalleryAllowDownload(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                          />
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Cover Photo, Clients & Watermark */}
                  <div className="space-y-6">

                    {/* Cover Image & Framing Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-amber-400' : colorTheme.twText}`}>
                          Fotografía de Portada & Encuadre
                        </span>
                        <ImagePositionPicker
                          value={galleryCoverPosition}
                          onChange={setGalleryCoverPosition}
                          previewImageUrl={galleryCover}
                          label="Encuadre"
                          theme={theme}
                        />
                      </div>

                      {/* Live Cover Preview Container */}
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-700 shadow-md bg-black">
                        {galleryCover ? (
                          <img 
                            src={galleryCover} 
                            alt="Portada Preview" 
                            className="w-full h-full object-cover transition-all duration-300"
                            style={{
                              objectPosition: getImagePositionStyle(galleryCoverPosition),
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                            <ImageIcon className="w-8 h-8 opacity-40" />
                            <span className="text-xs">Sin fotografía de portada seleccionada</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[10px] text-white/90 border border-white/20 font-mono-code">
                          Encuadre: {getImagePositionLabel(galleryCoverPosition)}
                        </div>
                      </div>

                      {/* Upload and URL controls */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={galleryCoverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            id="upload-cover-device-btn"
                            onClick={() => galleryCoverInputRef.current?.click()}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Subir Portada desde tu Dispositivo</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className={`text-[11px] font-medium block ${isDark ? 'text-stone-400' : 'text-slate-600'}`}>
                            O escribe la URL directa:
                          </label>
                          <input
                            id="input-gallery-cover"
                            type="url"
                            value={galleryCover}
                            onChange={(e) => setGalleryCover(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                              isDark 
                                ? 'bg-stone-900 border-stone-700 text-stone-100 focus:ring-amber-400' 
                                : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Client Assignment & Limits Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-amber-400' : colorTheme.twText}`}>
                          Clientes Asignados & Límite de Fotos
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>Límite base:</span>
                          <input
                            id="input-gallery-max-favs"
                            type="number"
                            min="1"
                            max="1000"
                            value={galleryMaxFavs}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setGalleryMaxFavs(val);
                            }}
                            className={`w-14 border rounded-lg px-2 py-0.5 text-xs font-mono-code font-bold text-center ${
                              isDark ? 'bg-stone-900 border-stone-700 text-rose-400' : 'bg-white border-slate-300 text-rose-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className={`space-y-2 p-3 rounded-xl border max-h-44 overflow-y-auto ${
                        isDark ? 'bg-stone-900/60 border-stone-800' : 'bg-white border-slate-200'
                      }`}>
                        {clientUsers.length === 0 ? (
                          <div className={`text-center py-4 text-xs ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                            No hay clientes registrados aún. Puedes agregar uno desde el botón "Nuevo Cliente".
                          </div>
                        ) : (
                          clientUsers.map((client) => {
                            const isChecked = gallerySelectedClients.includes(client.id);
                            const customLimit = galleryClientLimits[client.id] ?? galleryMaxFavs;
                            
                            return (
                              <div 
                                key={client.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                                  isChecked 
                                    ? isDark 
                                      ? 'bg-stone-900 border-amber-500/40 shadow-xs' 
                                      : 'bg-white border-blue-500/40 shadow-xs ring-1 ring-blue-500/10'
                                    : isDark 
                                      ? 'bg-stone-900/40 border-stone-800/80 opacity-70' 
                                      : 'bg-white/60 border-slate-200/80 opacity-70'
                                }`}
                              >
                                <label className="flex items-center gap-3 text-xs cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setGallerySelectedClients([...gallerySelectedClients, client.id]);
                                        if (!galleryClientLimits[client.id]) {
                                          setGalleryClientLimits(prev => ({ ...prev, [client.id]: galleryMaxFavs }));
                                        }
                                      } else {
                                        setGallerySelectedClients(gallerySelectedClients.filter(id => id !== client.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                                  />
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={client.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                                      alt={client.name}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-700" 
                                    />
                                    <div>
                                      <span className={`font-semibold ${isDark ? 'text-stone-200' : 'text-slate-800'}`}>
                                        {client.name}
                                      </span>
                                      <span className={`block text-[10px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                                        {client.email}
                                      </span>
                                    </div>
                                  </div>
                                </label>

                                {isChecked && (
                                  <div className="flex items-center gap-1.5 pl-7 sm:pl-0 text-xs">
                                    <span className={`text-[10px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>Límite:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="1000"
                                      value={customLimit}
                                      onChange={(e) => {
                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                        setGalleryClientLimits(prev => ({ ...prev, [client.id]: val }));
                                      }}
                                      className={`w-14 border rounded-lg px-2 py-0.5 text-xs font-mono-code font-bold text-center ${
                                        isDark ? 'bg-stone-950 border-stone-700 text-amber-400' : 'bg-slate-50 border-slate-300 text-blue-700'
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Watermark Protection Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                      isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                          Protección y Marca de Agua
                        </span>
                        <input
                          id="toggle-gallery-watermark-enabled"
                          type="checkbox"
                          checked={galleryWatermarkEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setGalleryWatermarkEnabled(checked);
                            if (checked) {
                              setGalleryAllowDownload(false);
                            }
                          }}
                          className="w-5 h-5 rounded text-violet-500 focus:ring-violet-400 cursor-pointer"
                        />
                      </div>

                      {galleryWatermarkEnabled && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              id="watermark-type-text-btn"
                              onClick={() => setGalleryWatermarkType('text')}
                              className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                galleryWatermarkType === 'text'
                                  ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                                  : isDark ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              ✍️ Texto Personalizado
                            </button>
                            <button
                              type="button"
                              id="watermark-type-image-btn"
                              onClick={() => setGalleryWatermarkType('image')}
                              className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                galleryWatermarkType === 'image'
                                  ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                                  : isDark ? 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              🖼️ Imagen / Logo
                            </button>
                          </div>

                          {galleryWatermarkType === 'text' ? (
                            <input
                              id="input-watermark-text"
                              type="text"
                              value={galleryWatermarkText}
                              onChange={(e) => setGalleryWatermarkText(e.target.value)}
                              placeholder="Ej. SOMOS PIXART • PROHIBIDA SU REPRODUCCIÓN"
                              className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                                isDark 
                                  ? 'bg-stone-900 border-stone-700 text-stone-100 focus:ring-violet-400' 
                                  : 'bg-white border-slate-300 text-slate-900 focus:ring-violet-500'
                              }`}
                            />
                          ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <input
                                ref={watermarkImageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleWatermarkFileUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                id="upload-watermark-logo-btn"
                                onClick={() => watermarkImageInputRef.current?.click()}
                                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Subir Logo</span>
                              </button>
                              <input
                                id="input-watermark-image-url"
                                type="url"
                                value={galleryWatermarkImageUrl}
                                onChange={(e) => setGalleryWatermarkImageUrl(e.target.value)}
                                placeholder="URL del logo PNG..."
                                className={`flex-1 w-full border rounded-xl px-3 py-1.5 text-xs ${
                                  isDark ? 'bg-stone-900 border-stone-700 text-stone-100' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          )}

                          {/* Position radios */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                              galleryWatermarkPosition === 'center'
                                ? 'bg-violet-500/10 border-violet-500 text-violet-300'
                                : isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white border-slate-200 text-slate-600'
                            }`}>
                              <input
                                type="radio"
                                name="watermarkPosition"
                                checked={galleryWatermarkPosition === 'center'}
                                onChange={() => setGalleryWatermarkPosition('center')}
                                className="text-violet-500"
                              />
                              <span>Centro Único</span>
                            </label>

                            <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${
                              galleryWatermarkPosition === 'repeated'
                                ? 'bg-violet-500/10 border-violet-500 text-violet-300'
                                : isDark ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-white border-slate-200 text-slate-600'
                            }`}>
                              <input
                                type="radio"
                                name="watermarkPosition"
                                checked={galleryWatermarkPosition === 'repeated'}
                                onChange={() => setGalleryWatermarkPosition('repeated')}
                                className="text-violet-500"
                              />
                              <span>Mosaico Repetido</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* Fixed Footer */}
              <div className={`px-6 sm:px-8 py-4 border-t shrink-0 flex items-center justify-between sm:justify-end gap-3 ${
                isDark ? 'border-stone-800 bg-stone-950/90' : 'border-slate-100 bg-slate-50'
              }`}>
                <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'} hidden sm:inline mr-auto`}>
                  {editingGallery ? `Editando sesión "${galleryTitle || 'Sin título'}"` : 'Crea la sesión para comenzar a subir fotografías'}
                </span>
                <button
                  type="button"
                  id="cancel-gallery-btn"
                  onClick={() => setShowNewGalleryModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border ${
                    isDark ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="save-gallery-submit-btn"
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer text-white flex items-center gap-2 ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingGallery ? 'Guardar Cambios' : 'Crear Galería'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW / EDIT CLIENT */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div 
            id="new-client-modal-dialog"
            className={`w-full max-w-lg border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-stone-800' : 'border-slate-100'
            }`}>
              <div>
                <h3 className={`text-xl font-bold font-serif-display ${
                  isDark ? 'text-stone-100' : 'text-slate-900'
                }`}>
                  {editingUser 
                    ? (userModalTexts.titleEdit || 'Editar Permisos del Cliente') 
                    : (userModalTexts.titleNew || 'Registrar Nuevo Cliente')}
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>Configura accesos y permisos individuales a galerías.</p>
              </div>
              <button 
                id="close-client-modal-btn"
                onClick={() => setShowNewClientModal(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                  {userModalTexts.nameLabel || 'Nombre Completo del Cliente:'}
                </label>
                <input
                  id="input-client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={userModalTexts.namePlaceholder || 'Ej. Valeria Mendoza o Sofía Valenzuela'}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                  }`}
                />
              </div>

              {/* Avatar section with Device Upload */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold block ${isDark ? 'text-stone-200' : 'text-slate-800'}`}>
                    Fotografía de Perfil / Avatar:
                  </span>
                  {clientAvatar && clientAvatar !== DEFAULT_PROFILE_AVATAR && (
                    <button
                      type="button"
                      onClick={() => setClientAvatar(DEFAULT_PROFILE_AVATAR)}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                    >
                      Restablecer predeterminado
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={clientAvatar || DEFAULT_PROFILE_AVATAR} 
                      alt="Avatar Preview" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
                      onError={() => setClientAvatar('')}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={clientAvatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleClientAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="upload-client-avatar-device-btn"
                      onClick={() => clientAvatarInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Foto de Perfil desde tu Dispositivo</span>
                    </button>

                    <input
                      type="url"
                      value={clientAvatar}
                      onChange={(e) => setClientAvatar(e.target.value)}
                      placeholder="O escribe URL de foto (https://...)"
                      className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                        isDark ? 'bg-stone-900 border-stone-700 text-stone-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    {userModalTexts.emailLabel || 'Correo Electrónico:'}
                  </label>
                  <input
                    id="input-client-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder={userModalTexts.emailPlaceholder || 'cliente@email.com'}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    {userModalTexts.passwordLabel || 'Contraseña de Acceso:'}
                  </label>
                  <input
                    id="input-client-password"
                    type="text"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder={userModalTexts.passwordPlaceholder || 'cliente123'}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono-code focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    {userModalTexts.phoneLabel || 'Teléfono / WhatsApp:'}
                  </label>
                  <input
                    id="input-client-phone"
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={userModalTexts.phonePlaceholder || '+34 600 000 000'}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    {userModalTexts.companyLabel || 'Empresa / Categoría:'}
                  </label>
                  <input
                    id="input-client-company"
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder={userModalTexts.companyPlaceholder || 'Ej. Boda Privada o Editorial'}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Assign to Galleries */}
              <div className="space-y-1">
                <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Asignar Acceso a Galerías:</label>
                <div className={`space-y-1.5 p-3 rounded-xl border max-h-36 overflow-y-auto ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  {galleries.map((g) => {
                    const isChecked = clientAssignedGalleries.includes(g.id);
                    return (
                      <label key={g.id} className={`flex items-center justify-between text-xs cursor-pointer ${
                        isDark ? 'text-stone-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                      }`}>
                        <span className="truncate max-w-[240px]">{g.title}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setClientAssignedGalleries([...clientAssignedGalleries, g.id]);
                            } else {
                              setClientAssignedGalleries(clientAssignedGalleries.filter(id => id !== g.id));
                            }
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  id="cancel-client-btn"
                  onClick={() => setShowNewClientModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="save-client-submit-btn"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  {editingUser ? 'Guardar Permisos' : (userModalTexts.saveButtonText || 'Crear Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD IMAGES TO GALLERY (MULTI-FILE & REAL METADATA) */}
      {uploadGalleryId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverUpload(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverUpload(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOverUpload(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processFilesForUpload(e.dataTransfer.files);
            }
          }}
        >
          <div 
            id="upload-image-modal-dialog"
            className={`w-full max-w-2xl border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-stone-800' : 'border-slate-100'
            }`}>
              <div>
                <h3 className={`text-xl font-bold font-serif-display ${
                  isDark ? 'text-stone-100' : 'text-slate-900'
                }`}>
                  Subir Fotografías a la Galería
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Sesión: <strong className={isDark ? 'text-amber-400' : colorTheme.twText}>
                    {galleries.find(g => g.id === uploadGalleryId)?.title || 'Galería Seleccionada'}
                  </strong> • Los metadatos de peso, nombre y resolución se detectan automáticamente.
                </p>
              </div>
              <button 
                id="close-upload-modal-btn"
                onClick={() => {
                  setUploadGalleryId(null);
                  setPendingUploadFiles([]);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadImageSubmit} className="space-y-5">
              
              {/* File upload drag-and-drop area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center relative group transition-all cursor-pointer ${
                  isDragOverUpload
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : isDark 
                      ? 'border-stone-700 hover:border-amber-400/80 bg-stone-950/60' 
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50/70'
                }`}
                onClick={() => photoUploadInputRef.current?.click()}
              >
                <input
                  ref={photoUploadInputRef}
                  type="file"
                  multiple
                  accept="image/*,.cr3,.arw,.nef,.raw,.dng,.tiff,.tif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processFilesForUpload(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                
                <Upload className={`w-10 h-10 mx-auto mb-3 transition-transform group-hover:scale-110 ${
                  isDragOverUpload 
                    ? 'text-amber-400 animate-bounce' 
                    : isDark ? 'text-amber-400' : colorTheme.twText
                }`} />
                
                <p className={`text-sm font-bold ${isDark ? 'text-stone-100' : 'text-slate-900'}`}>
                  {isDragOverUpload ? '¡Suelta tus fotografías aquí!' : 'Arrastra y suelta tus fotografías aquí o haz clic para seleccionarlas'}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Puedes seleccionar varias fotografías al mismo tiempo.
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      photoUploadInputRef.current?.click();
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar fotos desde tu dispositivo</span>
                  </button>
                </div>
                
                <p className={`text-[11px] mt-3 ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                  Formatos compatibles: RAW, CR3, ARW, NEF, TIFF, PNG, JPEG de alta resolución
                </p>
              </div>

              {/* Real Metadata Inspector & Queue of Selected Photos */}
              {pendingUploadFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                        Fotografías Listas para Subir ({pendingUploadFiles.length})
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isDark ? 'bg-stone-800 text-stone-300 border border-stone-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        Total: {formatBytes(pendingUploadFiles.reduce((acc, f) => acc + f.fileSizeBytes, 0))}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearPendingFiles}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                  </div>

                  {/* Scrollable list of pending photos with actual metadata */}
                  <div className={`max-h-72 overflow-y-auto space-y-2 pr-1 rounded-2xl p-2 border ${
                    isDark ? 'bg-stone-950/70 border-stone-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {pendingUploadFiles.map((item, idx) => (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                          isDark ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Thumbnail & Filename */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-700/60 bg-black">
                            <img 
                              src={item.previewUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-center text-stone-300 truncate px-0.5">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className={`font-mono text-xs font-bold truncate ${isDark ? 'text-stone-100' : 'text-slate-900'}`} title={item.name}>
                              {item.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {/* Real Weight Badge */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isDark ? 'bg-stone-800/80 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                <HardDrive className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{item.sizeFormatted}</span>
                              </span>

                              {/* Real Resolution Badge */}
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isDark ? 'bg-stone-800/80 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                <Camera className="w-3 h-3 text-blue-400 shrink-0" />
                                <span>{item.width} × {item.height} px</span>
                              </span>

                              {/* Real Camera Detected Badge */}
                              {item.cameraModel ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  <span>📷 {item.cameraModel}</span>
                                </span>
                              ) : null}

                              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                                {item.name.split('.').pop() || 'IMG'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove from queue button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isDark ? 'text-stone-400 hover:text-rose-300 hover:bg-rose-500/20' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Quitar de la lista"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessingUploads && (
                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando y calculando resolución de las fotografías...</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <div className="text-xs text-stone-400">
                  {pendingUploadFiles.length > 0 ? (
                    <span>
                      {pendingUploadFiles.length} {pendingUploadFiles.length === 1 ? 'fotografía seleccionada' : 'fotografías seleccionadas'}
                    </span>
                  ) : (
                    <span>Selecciona al menos una foto para comenzar</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    id="cancel-upload-btn"
                    onClick={() => {
                      setUploadGalleryId(null);
                      setPendingUploadFiles([]);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs cursor-pointer ${
                      isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    id="submit-upload-btn"
                    disabled={pendingUploadFiles.length === 0 || isProcessingUploads || isSubmittingBatch}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                  >
                    {isSubmittingBatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Subiendo fotografías al servidor...</span>
                      </>
                    ) : pendingUploadFiles.length === 0 ? (
                      'Selecciona Fotografías'
                    ) : pendingUploadFiles.length === 1 ? (
                      `Subir 1 Fotografía al Servidor (${formatBytes(pendingUploadFiles[0].fileSizeBytes)})`
                    ) : (
                      `Subir ${pendingUploadFiles.length} Fotografías al Servidor (${formatBytes(pendingUploadFiles.reduce((acc, f) => acc + f.fileSizeBytes, 0))})`
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO CLIENT FEEDBACK */}
      {replyingFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl space-y-4 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-stone-800' : 'border-slate-100'
            }`}>
              <h3 className={`text-base font-bold font-serif-display ${
                isDark ? 'text-stone-100' : 'text-slate-900'
              }`}>
                {feedbackReplyModalTexts.title || `Responder a ${replyingFeedback.clientName}`}
              </h3>
              <button 
                onClick={() => setReplyingFeedback(null)}
                className={`transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-stone-100' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendFeedbackReply} className="space-y-3">
              <textarea
                required
                rows={4}
                value={feedbackReplyText}
                onChange={(e) => setFeedbackReplyText(e.target.value)}
                placeholder={feedbackReplyModalTexts.replyPlaceholder || 'Escribe la respuesta del estudio para el cliente...'}
                className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                }`}
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingFeedback(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                >
                  {feedbackReplyModalTexts.sendButtonText || 'Enviar Respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STORAGE CAPACITY LIMIT */}
      {showStorageLimitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-stone-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif-display">
                    {storageLimitModalTexts.title || 'Límite de Almacenamiento'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    {storageLimitModalTexts.subtitle || 'Ajusta la cuota de disco disponible del servidor'}
                  </p>
                </div>
              </div>
              <button
                id="close-storage-limit-modal"
                onClick={() => setShowStorageLimitModal(false)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-stone-700 text-stone-400 hover:text-white hover:bg-stone-800' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                {storageLimitModalTexts.presetLabel || 'Seleccionar Cuota Rápida:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '500 MB', bytes: 500 * 1024 * 1024 },
                  { label: '1 GB (Defecto)', bytes: 1 * 1024 * 1024 * 1024 },
                  { label: '2 GB', bytes: 2 * 1024 * 1024 * 1024 },
                  { label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 },
                  { label: '10 GB', bytes: 10 * 1024 * 1024 * 1024 },
                  { label: '50 GB', bytes: 50 * 1024 * 1024 * 1024 },
                ].map(preset => {
                  const isPresetActive = 
                    (customLimitUnit === 'GB' && customLimitValue === preset.bytes / (1024 * 1024 * 1024)) ||
                    (customLimitUnit === 'MB' && customLimitValue === preset.bytes / (1024 * 1024));

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (preset.bytes >= 1024 * 1024 * 1024) {
                          setCustomLimitValue(preset.bytes / (1024 * 1024 * 1024));
                          setCustomLimitUnit('GB');
                        } else {
                          setCustomLimitValue(preset.bytes / (1024 * 1024));
                          setCustomLimitUnit('MB');
                        }
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isPresetActive
                          ? `${colorTheme.twBg} text-white border-transparent shadow-sm`
                          : isDark
                            ? 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Value Input */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                {storageLimitModalTexts.customLabel || 'O Especificar Cantidad Personalizada:'}
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-storage-limit-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={customLimitValue}
                  onChange={(e) => setCustomLimitValue(parseFloat(e.target.value) || 1)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-mono-code font-bold outline-none transition-colors ${
                    isDark 
                      ? 'bg-stone-950 border-stone-800 focus:border-amber-500 text-white' 
                      : 'bg-white border-slate-300 focus:border-blue-500 text-slate-900'
                  }`}
                />
                <select
                  value={customLimitUnit}
                  onChange={(e) => setCustomLimitUnit(e.target.value as 'MB' | 'GB' | 'TB')}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-stone-950 border-stone-800 text-stone-200 focus:border-amber-500' 
                      : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                >
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                  <option value="TB">TB</option>
                </select>
              </div>
            </div>

            {/* Status Preview */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Uso actual de disco:</span>
                <span className="font-mono-code font-bold text-amber-500">{formatBytes(storageStats.usedBytes)}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Nuevo límite configurado:</span>
                <span className="font-mono-code font-bold text-emerald-500">
                  {formatBytes(
                    customLimitUnit === 'TB' ? customLimitValue * 1024 * 1024 * 1024 * 1024 :
                    customLimitUnit === 'GB' ? customLimitValue * 1024 * 1024 * 1024 :
                    customLimitValue * 1024 * 1024
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStorageLimitModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isDark ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="save-storage-limit-btn"
                onClick={() => {
                  const bytes = Math.round(
                    customLimitUnit === 'TB' ? customLimitValue * 1024 * 1024 * 1024 * 1024 :
                    customLimitUnit === 'GB' ? customLimitValue * 1024 * 1024 * 1024 :
                    customLimitValue * 1024 * 1024
                  );
                  if (onUpdateServerQuota) {
                    onUpdateServerQuota(bytes);
                  }
                  setShowStorageLimitModal(false);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${colorTheme.twBg}`}
              >
                {storageLimitModalTexts.saveButtonText || 'Guardar Límite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Photos in a Gallery */}
      {galleryToEmptyPhotos && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-6 ${
            isDark ? 'bg-stone-900 border-rose-500/30 text-stone-100' : 'bg-white border-rose-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-500 shadow-md shadow-rose-500/10">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-rose-500">¿Vaciar fotografías de la sesión?</h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                  Se eliminarán permanentemente todas las fotografías cargadas en <strong>{galleryToEmptyPhotos.title}</strong> y se liberará su espacio de almacenamiento.
                </p>
              </div>
            </div>

            {/* Details */}
            {(() => {
              const galImgs = images.filter(i => i.galleryId === galleryToEmptyPhotos.id);
              const totalBytes = galImgs.reduce((acc, i) => acc + (i.fileSizeBytes || 0), 0);
              return (
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Sesión:</span>
                    <span className="font-semibold">{galleryToEmptyPhotos.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Fotos a eliminar:</span>
                    <span className="font-bold font-mono-code text-rose-500">{galImgs.length} fotografías</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Espacio a liberar:</span>
                    <span className="font-bold font-mono-code">{formatBytes(totalBytes)}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800/60">
              <button
                type="button"
                onClick={() => setGalleryToEmptyPhotos(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'text-stone-300 hover:bg-stone-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAllImagesInGallery) {
                    onDeleteAllImagesInGallery(galleryToEmptyPhotos.id);
                  }
                  setGalleryToEmptyPhotos(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar y Vaciar Fotos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Photo from Inspector */}
      {adminPhotoToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-5 ${
            isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">¿Eliminar esta fotografía?</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Se eliminará permanentemente del servidor y se liberará espacio en disco.
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-700/50 bg-black">
                <img 
                  src={adminPhotoToDelete.url} 
                  alt={adminPhotoToDelete.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-semibold truncate">{adminPhotoToDelete.title}</p>
                <p className={`text-[11px] font-mono-code truncate ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  {adminPhotoToDelete.originalFileName}
                </p>
                <p className={`text-[10px] font-mono-code mt-0.5 ${isDark ? 'text-amber-300' : 'text-blue-600'}`}>
                  {formatBytes(adminPhotoToDelete.fileSizeBytes)} • {adminPhotoToDelete.width} × {adminPhotoToDelete.height} px
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800/60">
              <button
                type="button"
                onClick={() => setAdminPhotoToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'text-stone-300 hover:bg-stone-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteImage(adminPhotoToDelete.id);
                  setAdminPhotoToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Client Account */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
          <div className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-5 ${
            isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar cliente permanentemente?
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Se revocará su acceso privado y no podrá ingresar a sus sesiones ni enviar selecciones de favoritas.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
              isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Nombre:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{clientToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Email de acceso:</span>
                <span className="font-mono-code font-semibold text-slate-800 dark:text-stone-200">{clientToDelete.email}</span>
              </div>
              {clientToDelete.assignedGalleryIds && clientToDelete.assignedGalleryIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-stone-400' : 'text-slate-500'}>Galerías asignadas:</span>
                  <span className="font-semibold text-amber-500">{clientToDelete.assignedGalleryIds.length} sesión(es)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-stone-800">
              <button
                type="button"
                id="cancel-delete-client-modal-btn"
                onClick={() => setClientToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-client-modal-btn"
                onClick={() => {
                  onDeleteUser(clientToDelete.id);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
