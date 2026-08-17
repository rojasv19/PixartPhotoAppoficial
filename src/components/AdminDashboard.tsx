import React, { useState, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, ImageIcon, Users, HardDrive, ShieldCheck, Plus, 
  Trash2, Edit3, Key, Check, Eye, Download, MessageSquare, Star, 
  Sparkles, Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, 
  Upload, Sliders, Calendar, MapPin, Lock, FileText, Activity, Shield, RefreshCw, X, Camera, Palette, Heart
} from 'lucide-react';
import { GallerySession, GalleryImage, User, FeedbackItem, AuditLogItem, ServerStorageStats, StudioBrandingConfig } from '../types';
import { formatBytes, calculateServerStats } from '../services/storageService';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { PHOTOGRAPHY_AVATAR_PRESETS } from '../data/photographyAvatars';
import { AdminBrandingSettings } from './AdminBrandingSettings';
import { AdminFavoritesView } from './AdminFavoritesView';

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
  onUploadImage: (galleryId: string, imageFile: { title: string; url: string; highResUrl: string; originalFileName: string; fileSizeBytes: number; width: number; height: number; tags: string[] }) => void;
  onDeleteImage: (imageId: string) => void;
  onUpdateImage?: (updatedImage: GalleryImage) => void;
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
  onBatchOptimizeImages,
  onReplyFeedback,
  onUpdateImage,
  onUpdateServerQuota,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;
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
  const [gallerySubtitle, setGallerySubtitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<GallerySession['category']>('boda');
  const [galleryDate, setGalleryDate] = useState(new Date().toISOString().split('T')[0]);
  const [galleryLocation, setGalleryLocation] = useState('');
  const [galleryVenue, setGalleryVenue] = useState('');
  const [galleryCover, setGalleryCover] = useState('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80');
  const [galleryPin, setGalleryPin] = useState(String(Math.floor(1000 + Math.random() * 9000)));
  const [gallerySelectedClients, setGallerySelectedClients] = useState<string[]>([]);
  const [galleryClientLimits, setGalleryClientLimits] = useState<Record<string, number>>({});
  const [galleryAllowDownload, setGalleryAllowDownload] = useState(true);
  const [galleryAllowFeedback, setGalleryAllowFeedback] = useState(true);
  const [galleryMaxFavs, setGalleryMaxFavs] = useState(50);

  // New Client Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('cliente123');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');
  const [clientRole, setClientRole] = useState<User['role']>('client');
  const [clientAssignedGalleries, setClientAssignedGalleries] = useState<string[]>([]);
  const [clientCanDownload, setClientCanDownload] = useState(true);
  const [clientCanFeedback, setClientCanFeedback] = useState(true);
  const [clientCanFav, setClientCanFav] = useState(true);
  const [clientNotes, setClientNotes] = useState('');

  // Refs for Device File Uploads
  const galleryCoverInputRef = useRef<HTMLInputElement>(null);
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

  // Upload Form Simulation State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('RAW, Alta Resolución, Editorial');
  const [uploadFileSizeMb, setUploadFileSizeMb] = useState<number>(24.5);
  const [uploadWidth, setUploadWidth] = useState<number>(6720);
  const [uploadHeight, setUploadHeight] = useState<number>(4480);
  const [uploadImageUrl, setUploadImageUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85');

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

    if (editingGallery) {
      onUpdateGallery({
        ...editingGallery,
        title: galleryTitle,
        subtitle: gallerySubtitle,
        category: galleryCategory,
        eventDate: galleryDate,
        location: galleryLocation,
        venueName: galleryVenue,
        coverImage: galleryCover,
        accessPin: galleryPin,
        clientIds: gallerySelectedClients,
        clientNames: assignedNames,
        allowDownloadHighRes: galleryAllowDownload,
        allowFeedback: galleryAllowFeedback,
        maxFavoritesSelection: galleryMaxFavs,
        clientPhotoLimits: galleryClientLimits,
      });
      setEditingGallery(null);
    } else {
      onCreateGallery({
        title: galleryTitle,
        slug: galleryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        subtitle: gallerySubtitle,
        clientIds: gallerySelectedClients,
        clientNames: assignedNames,
        category: galleryCategory,
        eventDate: galleryDate,
        location: galleryLocation,
        venueName: galleryVenue,
        coverImage: galleryCover,
        description: `Sesión profesional realizada en ${galleryLocation} el ${galleryDate}.`,
        accessPin: galleryPin,
        isPasswordProtected: true,
        allowDownloadHighRes: galleryAllowDownload,
        allowFeedback: galleryAllowFeedback,
        allowFavoritesSubmission: true,
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
    setGallerySubtitle('');
    setGalleryCategory('boda');
    setGalleryDate(new Date().toISOString().split('T')[0]);
    setGalleryLocation('');
    setGalleryVenue('');
    setGalleryCover('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80');
    setGalleryPin(String(Math.floor(1000 + Math.random() * 9000)));
    setGallerySelectedClients([]);
    setGalleryClientLimits({});
    setGalleryMaxFavs(50);
  };

  const openEditGalleryModal = (gal: GallerySession) => {
    setEditingGallery(gal);
    setGalleryTitle(gal.title);
    setGallerySubtitle(gal.subtitle || '');
    setGalleryCategory(gal.category);
    setGalleryDate(gal.eventDate);
    setGalleryLocation(gal.location);
    setGalleryVenue(gal.venueName || '');
    setGalleryCover(gal.coverImage);
    setGalleryPin(gal.accessPin);
    setGallerySelectedClients(gal.clientIds || []);
    setGalleryClientLimits(gal.clientPhotoLimits || {});
    setGalleryAllowDownload(gal.allowDownloadHighRes);
    setGalleryAllowFeedback(gal.allowFeedback);
    setGalleryMaxFavs(gal.maxFavoritesSelection || 50);
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
        canDownloadHighRes: clientCanDownload,
        canLeaveFeedback: clientCanFeedback,
        canSelectFavorites: clientCanFav,
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
        canDownloadHighRes: clientCanDownload,
        canLeaveFeedback: clientCanFeedback,
        canSelectFavorites: clientCanFav,
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
    setClientCanDownload(user.canDownloadHighRes ?? true);
    setClientCanFeedback(user.canLeaveFeedback ?? true);
    setClientCanFav(user.canSelectFavorites ?? true);
    setClientNotes(user.notes || '');
    setShowNewClientModal(true);
  };

  // Submit Image Upload
  const handleUploadImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadGalleryId || !uploadTitle.trim()) return;

    const fileSizeBytes = Math.round(uploadFileSizeMb * 1024 * 1024);
    const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);

    onUploadImage(uploadGalleryId, {
      title: uploadTitle,
      url: uploadImageUrl,
      highResUrl: uploadImageUrl,
      originalFileName: `LUM_${Math.floor(1000 + Math.random() * 9000)}_RAW.CR3`,
      fileSizeBytes,
      width: uploadWidth,
      height: uploadHeight,
      tags: tagsArray,
    });

    setUploadGalleryId(null);
    setUploadTitle('');
  };

  // Handle Real File Selection for Upload
  const handleRealFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setUploadFileSizeMb(parseFloat((file.size / (1024 * 1024)).toFixed(2)));

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadImageUrl(event.target.result as string);
        // compute dimensions
        const img = new Image();
        img.onload = () => {
          setUploadWidth(img.width || 4000);
          setUploadHeight(img.height || 3000);
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
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
                                  setUploadTitle(`Foto ${gal.title.split(' ')[0]}`);
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

                              {/* Delete Gallery */}
                              <button
                                id={`delete-gal-btn-${gal.id}`}
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar la sesión "${gal.title}" y sus fotos del servidor?`)) {
                                    onDeleteGallery(gal.id);
                                  }
                                }}
                                title="Eliminar Galería"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-stone-800 hover:bg-rose-950/80 text-stone-400 hover:text-rose-400' 
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

                      {/* Permissions badges */}
                      <div className="space-y-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                          isDark ? 'text-stone-400' : 'text-slate-500'
                        }`}>
                          Permisos Otorgados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            client.canDownloadHighRes !== false 
                              ? isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : `${colorTheme.twBadgeBg} ${colorTheme.twText} ${colorTheme.twBadgeBorder}`
                              : isDark ? 'bg-stone-800 text-stone-500 border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            <Download className="w-2.5 h-2.5" />
                            Descarga RAW
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            client.canSelectFavorites !== false 
                              ? isDark ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                              : isDark ? 'bg-stone-800 text-stone-500 border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            <Star className="w-2.5 h-2.5" />
                            Favoritas
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            client.canLeaveFeedback !== false 
                              ? isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDark ? 'bg-stone-800 text-stone-500 border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            <MessageSquare className="w-2.5 h-2.5" />
                            Feedback
                          </span>
                        </div>
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
                        onClick={() => {
                          if (confirm(`¿Deseas eliminar al cliente ${client.name}?`)) {
                            onDeleteUser(client.id);
                          }
                        }}
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
                    Almacenamiento del Servidor Lumina
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

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Total: <strong className={isDark ? 'text-stone-200' : 'text-slate-800'}>{images.length} fotos</strong>
                  </span>
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
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono-code text-[11px] ${
                    isDark ? 'divide-stone-800/60' : 'divide-slate-200'
                  }`}>
                    {images.map((img) => {
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
                            {parentGal?.title || 'Sesión Lumina'}
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
                            {img.cameraModel || 'Canon EOS R5'}
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

                          <td className="px-4 py-3 text-right font-sans">
                            <button
                              id={`delete-image-btn-${img.id}`}
                              onClick={() => {
                                if (confirm(`¿Eliminar la foto "${img.title}" del servidor?`)) {
                                  onDeleteImage(img.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark 
                                  ? 'text-stone-400 hover:text-rose-400 hover:bg-stone-800' 
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                  Nivel de acceso por rol dentro de la plataforma Lumina Studio.
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

      {/* MODAL: NEW / EDIT GALLERY */}
      {showNewGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div 
            id="new-gallery-modal-dialog"
            className={`w-full max-w-2xl border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 ${
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
                  {editingGallery ? 'Editar Sesión Fotográfica' : 'Configurar Nueva Sesión Fotográfica'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Ingresa los detalles del evento, fecha, ubicación y credenciales.
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

            <form onSubmit={handleSaveGallery} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    Título del Evento / Sesión:
                  </label>
                  <input
                    id="input-gallery-title"
                    type="text"
                    required
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="Ej. Camila & David — Boda en Hacienda Real"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    Categoría de Fotografía:
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

                {/* Event Date */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    Fecha del Evento:
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

                {/* Location */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    Ciudad / Región:
                  </label>
                  <input
                    id="input-gallery-location"
                    type="text"
                    required
                    value={galleryLocation}
                    onChange={(e) => setGalleryLocation(e.target.value)}
                    placeholder="Ej. Madrid / Palacio de Cristal"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                    PIN de Acceso Privado (4 dígitos):
                  </label>
                  <input
                    id="input-gallery-pin"
                    type="text"
                    maxLength={8}
                    required
                    value={galleryPin}
                    onChange={(e) => setGalleryPin(e.target.value)}
                    placeholder="2024"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono-code font-bold focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-amber-300 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-blue-600 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {/* Cover Image with Device Upload & Presets */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                      Fotografía de Portada de la Sesión:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Visible en la tarjeta del portal y cabecera
                    </span>
                  </div>

                  {/* Device Upload Zone */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-stone-950/80 border-stone-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Thumbnail Preview */}
                      <div className="relative group shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-slate-700 shadow-md bg-black">
                        {galleryCover ? (
                          <img 
                            src={galleryCover} 
                            alt="Portada Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Device upload button and presets */}
                      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
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
                        <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                          Formatos recomendados: JPEG de alta resolución, PNG, WebP o RAW exportado.
                        </p>
                      </div>
                    </div>

                    {/* Direct URL input */}
                    <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1">
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

                {/* Global Photo Limits */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                      Límite General de Selección de Favoritas (fotos):
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Número base de fotos permitidas para selección
                    </span>
                  </div>
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
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono-code font-bold focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-rose-400 focus:ring-rose-500' 
                        : 'bg-white border-slate-300 text-rose-600 focus:ring-rose-500'
                    }`}
                  />
                </div>

                {/* Assign to Client & Custom Limits */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                      Asignar a Cliente(s) y Límites Personalizados de Fotos:
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Establece cuántas fotos puede elegir cada cliente
                    </span>
                  </div>

                  <div className={`space-y-2 p-3 rounded-2xl border max-h-56 overflow-y-auto ${
                    isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
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
                            {/* Client Info & Checkbox */}
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

                            {/* Custom Limit per Client (Visible when assigned) */}
                            {isChecked && (
                              <div className="flex items-center gap-2 pl-7 sm:pl-0">
                                <span className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-slate-600'}`}>
                                  Límite personalizado:
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={customLimit}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      setGalleryClientLimits(prev => ({
                                        ...prev,
                                        [client.id]: val
                                      }));
                                    }}
                                    className={`w-16 border rounded-lg px-2 py-1 text-xs font-mono-code font-bold text-center focus:outline-none focus:ring-2 ${
                                      isDark 
                                        ? 'bg-stone-950 border-stone-700 text-amber-400 focus:ring-amber-400' 
                                        : 'bg-slate-50 border-slate-300 text-blue-700 focus:ring-blue-500'
                                    }`}
                                  />
                                  <span className={`text-[10px] ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>fotos</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  id="cancel-gallery-btn"
                  onClick={() => setShowNewGalleryModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="save-gallery-submit-btn"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  {editingGallery ? 'Guardar Cambios' : 'Crear Galería'}
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
                  {editingUser ? 'Editar Permisos del Cliente' : 'Registrar Nuevo Cliente'}
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
                <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Nombre Completo del Cliente:</label>
                <input
                  id="input-client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Valeria Mendoza o Sofía Valenzuela"
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
                    Fotografía de Perfil / Avatar del Cliente:
                  </span>
                  {clientAvatar && (
                    <button
                      type="button"
                      onClick={() => setClientAvatar('')}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {clientAvatar ? (
                      <img 
                        src={clientAvatar} 
                        alt="Avatar Preview" 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white ${colorTheme.twBg} shadow-md`}>
                        {clientName ? clientName.charAt(0).toUpperCase() : <Users className="w-6 h-6" />}
                      </div>
                    )}
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
                      className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Foto de Perfil desde tu Dispositivo</span>
                    </button>

                    <input
                      type="url"
                      value={clientAvatar}
                      onChange={(e) => setClientAvatar(e.target.value)}
                      placeholder="O escribe URL de foto https://..."
                      className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                        isDark ? 'bg-stone-900 border-stone-700 text-stone-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Photography & Video Presets Quick Row */}
                <div className="space-y-1.5 pt-1">
                  <span className={`text-[11px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    O elige un avatar temático de fotografía & video:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {PHOTOGRAPHY_AVATAR_PRESETS.map((preset) => {
                      const isSelected = clientAvatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setClientAvatar(preset.url)}
                          title={`${preset.name} (${preset.categoryLabel})`}
                          className={`relative w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? `${colorTheme.twBorder} ring-2 ${colorTheme.twRing} scale-110`
                              : isDark ? 'border-stone-800 hover:border-stone-600 opacity-80 hover:opacity-100' : 'border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Correo Electrónico:</label>
                  <input
                    id="input-client-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Contraseña de Acceso:</label>
                  <input
                    id="input-client-password"
                    type="text"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    placeholder="cliente123"
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
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Teléfono / WhatsApp:</label>
                  <input
                    id="input-client-phone"
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Empresa / Categoría:</label>
                  <input
                    id="input-client-company"
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Ej. Boda Privada o Editorial"
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Individual Permission Toggles */}
              <div className={`space-y-2 p-4 rounded-2xl border ${
                isDark ? 'bg-stone-950 border-stone-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${
                  isDark ? 'text-amber-400' : colorTheme.twText
                }`}>
                  Permisos Específicos para este Cliente:
                </span>
                
                <label className={`flex items-center justify-between text-xs cursor-pointer ${
                  isDark ? 'text-stone-300' : 'text-slate-700'
                }`}>
                  <span>Permitir Descarga Directa de Alta Resolución (RAW/4K)</span>
                  <input
                    id="toggle-client-download"
                    type="checkbox"
                    checked={clientCanDownload}
                    onChange={(e) => setClientCanDownload(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                </label>

                <label className={`flex items-center justify-between text-xs cursor-pointer ${
                  isDark ? 'text-stone-300' : 'text-slate-700'
                }`}>
                  <span>Permitir Selección y Envío de Fotos Favoritas</span>
                  <input
                    id="toggle-client-favorites"
                    type="checkbox"
                    checked={clientCanFav}
                    onChange={(e) => setClientCanFav(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                </label>

                <label className={`flex items-center justify-between text-xs cursor-pointer ${
                  isDark ? 'text-stone-300' : 'text-slate-700'
                }`}>
                  <span>Permitir Dejar Feedback y Solicitudes de Retoque</span>
                  <input
                    id="toggle-client-feedback"
                    type="checkbox"
                    checked={clientCanFeedback}
                    onChange={(e) => setClientCanFeedback(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                </label>
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
                  {editingUser ? 'Guardar Permisos' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD IMAGES TO GALLERY */}
      {uploadGalleryId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div 
            id="upload-image-modal-dialog"
            className={`w-full max-w-lg border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${
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
                  Carga de Fotografías de Alta Resolución
                </h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Sube archivos con cálculo automático de tamaño y dimensiones.
                </p>
              </div>
              <button 
                id="close-upload-modal-btn"
                onClick={() => setUploadGalleryId(null)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-stone-100 hover:bg-stone-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadImageSubmit} className="space-y-4">
              
              {/* File upload drag area */}
              <div className={`border-2 border-dashed rounded-2xl p-5 text-center relative group transition-colors ${
                isDark 
                  ? 'border-stone-700 hover:border-amber-400 bg-stone-950/50' 
                  : 'border-slate-300 hover:border-slate-500 bg-slate-50/50'
              }`}>
                <input
                  ref={photoUploadInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRealFileSelect}
                  className="hidden"
                />
                
                {uploadImageUrl ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-full max-w-[200px] h-32 rounded-xl overflow-hidden border border-slate-700 shadow-md bg-black">
                      <img 
                        src={uploadImageUrl} 
                        alt="Preview upload" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoUploadInputRef.current?.click()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer transition-all ${colorTheme.twBg} ${colorTheme.twBgHover}`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>Seleccionar otra foto desde tu dispositivo</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => photoUploadInputRef.current?.click()}
                    className="cursor-pointer py-3"
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform ${
                      isDark ? 'text-amber-400' : colorTheme.twText
                    }`} />
                    <p className={`text-xs font-semibold ${isDark ? 'text-stone-200' : 'text-slate-800'}`}>
                      Haz clic para seleccionar o arrastra una fotografía desde tu equipo
                    </p>
                    <button
                      type="button"
                      className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${colorTheme.twBg}`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Subir Fotografía desde tu Dispositivo</span>
                    </button>
                  </div>
                )}
                
                <p className={`text-[11px] mt-2 ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                  Formatos compatibles: RAW, CR3, ARW, NEF, TIFF, JPEG de alta resolución
                </p>
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Título de la Fotografía:</label>
                <input
                  id="input-upload-title"
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Ej. Retrato al Atardecer"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Tamaño RAW en MB:</label>
                  <input
                    id="input-upload-filesize"
                    type="number"
                    step="0.1"
                    value={uploadFileSizeMb}
                    onChange={(e) => setUploadFileSizeMb(parseFloat(e.target.value))}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono-code focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-stone-950 border-stone-700 text-stone-100 focus:ring-amber-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-xs font-medium block ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>Resolución (px):</label>
                  <div className="flex gap-1 text-xs font-mono-code">
                    <input
                      type="number"
                      value={uploadWidth}
                      onChange={(e) => setUploadWidth(parseInt(e.target.value))}
                      className={`w-1/2 border rounded-xl px-2 py-2 ${
                        isDark ? 'bg-stone-950 border-stone-700 text-stone-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={`self-center ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>×</span>
                    <input
                      type="number"
                      value={uploadHeight}
                      onChange={(e) => setUploadHeight(parseInt(e.target.value))}
                      className={`w-1/2 border rounded-xl px-2 py-2 ${
                        isDark ? 'bg-stone-950 border-stone-700 text-stone-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-stone-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  id="cancel-upload-btn"
                  onClick={() => setUploadGalleryId(null)}
                  className={`px-4 py-2 rounded-xl text-xs cursor-pointer ${
                    isDark ? 'text-stone-400 hover:text-stone-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="submit-upload-btn"
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer text-white ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
                >
                  Subir Fotografía al Servidor
                </button>
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
                Responder a {replyingFeedback.clientName}
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
                placeholder="Escribe la respuesta del estudio para el cliente..."
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
                  Enviar Respuesta
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
                    Límite de Almacenamiento
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                    Ajusta la cuota de disco disponible del servidor
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
                Seleccionar Cuota Rápida:
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
                O Especificar Cantidad Personalizada:
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
                Guardar Límite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
