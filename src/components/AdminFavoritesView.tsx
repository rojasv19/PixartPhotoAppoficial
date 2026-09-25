import React, { useState, useMemo } from 'react';
import { 
  Heart, Download, Copy, Check, Filter, Search, Eye, Sparkles, 
  ExternalLink, Layers, CheckCircle2, Clock, Palette, ArrowRight,
  FolderDown, Sliders, RefreshCw, FileSpreadsheet, FileText, UserCheck, 
  Camera, MessageSquare, AlertCircle, Trash2, CheckCheck, Undo2, X, RotateCcw
} from 'lucide-react';
import { GallerySession, GalleryImage, User, StudioBrandingConfig, RetouchStatus } from '../types';
import { formatBytes, downloadSingleImage, downloadImagesAsZip } from '../services/storageService';
import { COLOR_PRESET_MAP } from '../services/brandingService';
import { WatermarkOverlay } from './WatermarkOverlay';

interface AdminFavoritesViewProps {
  galleries: GallerySession[];
  images: GalleryImage[];
  users: User[];
  onOpenGallery: (galleryId: string) => void;
  onUpdateImage?: (updatedImage: GalleryImage) => void;
  theme?: 'light' | 'dark';
  branding?: StudioBrandingConfig;
}

export const AdminFavoritesView: React.FC<AdminFavoritesViewProps> = ({
  galleries,
  images,
  users,
  onOpenGallery,
  onUpdateImage,
  theme = 'dark',
  branding,
}) => {
  const isDark = theme === 'dark';
  const colorTheme = branding ? COLOR_PRESET_MAP[branding.colorPreset] || COLOR_PRESET_MAP.blue : COLOR_PRESET_MAP.blue;

  // Search & Filter State (Default to 'pending' as requested)
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFilenames, setCopiedFilenames] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);

  // Modals & Feedback Toasts
  const [showBatchCompleteModal, setShowBatchCompleteModal] = useState<boolean>(false);
  const [showClearCompletedModal, setShowClearCompletedModal] = useState<boolean>(false);
  const [actionToast, setActionToast] = useState<{ message: string; undoAction?: () => void } | null>(null);

  // Local retouch status & notes overrides if onUpdateImage isn't persisted yet
  const [retouchOverrides, setRetouchOverrides] = useState<Record<string, { status: RetouchStatus; notes: string }>>({});

  // Collect all favorite items with enriched client and gallery metadata
  const favoriteEntries = useMemo(() => {
    const list: Array<{
      image: GalleryImage;
      gallery: GallerySession | undefined;
      clients: User[];
      retouchStatus: RetouchStatus;
      retouchNotes: string;
    }> = [];

    images.forEach(img => {
      const favUserIds = img.favoriteByUsers || [];
      if (favUserIds.length > 0) {
        const parentGallery = galleries.find(g => g.id === img.galleryId);
        const favoritedClients = users.filter(u => 
          favUserIds.includes(u.id) || favUserIds.some(fId => fId.toLowerCase() === u.id.toLowerCase())
        );

        // Retouch status
        const override = retouchOverrides[img.id];
        const status: RetouchStatus = override?.status || (img.tags?.includes('editado') ? 'completed' : img.tags?.includes('en_edicion') ? 'in_progress' : 'pending');
        const notes = override?.notes !== undefined ? override.notes : (img.clientNote || '');

        list.push({
          image: img,
          gallery: parentGallery,
          clients: favoritedClients.length > 0 ? favoritedClients : [
            {
              id: 'usr-client-generic',
              name: 'Cliente Asignado',
              email: 'cliente@galeria.com',
              role: 'client',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              status: 'active',
              createdDate: '2024-01-01',
              assignedGalleryIds: [img.galleryId],
            }
          ],
          retouchStatus: status,
          retouchNotes: notes,
        });
      }
    });

    return list;
  }, [images, galleries, users, retouchOverrides]);

  // Clients that have selected at least 1 favorite
  const clientsWithFavorites = useMemo(() => {
    const map = new Map<string, { user: User; count: number; galleryTitles: Set<string> }>();
    
    favoriteEntries.forEach(entry => {
      entry.clients.forEach(client => {
        const existing = map.get(client.id);
        if (existing) {
          existing.count += 1;
          if (entry.gallery) existing.galleryTitles.add(entry.gallery.title);
        } else {
          map.set(client.id, {
            user: client,
            count: 1,
            galleryTitles: new Set(entry.gallery ? [entry.gallery.title] : []),
          });
        }
      });
    });

    return Array.from(map.values());
  }, [favoriteEntries]);

  // Filtered favorite items
  const filteredFavorites = useMemo(() => {
    return favoriteEntries.filter(entry => {
      // Gallery filter
      if (selectedGalleryId !== 'all' && entry.image.galleryId !== selectedGalleryId) {
        return false;
      }

      // Client filter
      if (selectedClientId !== 'all') {
        const hasClient = entry.clients.some(c => c.id === selectedClientId);
        if (!hasClient) return false;
      }

      // Retouch status filter (Pending shows pending & in_progress; Completed shows completed & delivered)
      if (statusFilter === 'pending') {
        if (entry.retouchStatus !== 'pending' && entry.retouchStatus !== 'in_progress') {
          return false;
        }
      } else if (statusFilter === 'completed') {
        if (entry.retouchStatus !== 'completed' && entry.retouchStatus !== 'delivered') {
          return false;
        }
      } else if (statusFilter !== 'all') {
        if (entry.retouchStatus !== statusFilter) {
          return false;
        }
      }

      // Search query filter (filename, title, client name, gallery title, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = entry.image.title?.toLowerCase().includes(q);
        const matchFile = entry.image.originalFileName?.toLowerCase().includes(q);
        const matchGal = entry.gallery?.title?.toLowerCase().includes(q);
        const matchClient = entry.clients.some(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
        const matchNotes = entry.retouchNotes?.toLowerCase().includes(q);
        if (!matchTitle && !matchFile && !matchGal && !matchClient && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [favoriteEntries, selectedGalleryId, selectedClientId, statusFilter, searchQuery]);

  // Update Status Handler
  const handleUpdateStatus = (imageId: string, newStatus: RetouchStatus) => {
    setRetouchOverrides(prev => ({
      ...prev,
      [imageId]: {
        status: newStatus,
        notes: prev[imageId]?.notes || favoriteEntries.find(f => f.image.id === imageId)?.retouchNotes || '',
      }
    }));

    if (onUpdateImage) {
      const target = images.find(img => img.id === imageId);
      if (target) {
        const cleanTags = (target.tags || []).filter(t => t !== 'editado' && t !== 'en_edicion' && t !== 'pendiente');
        if (newStatus === 'completed') cleanTags.push('editado');
        if (newStatus === 'in_progress') cleanTags.push('en_edicion');
        onUpdateImage({
          ...target,
          tags: cleanTags,
        });
      }
    }
  };

  // Mark single image as ready (disappears from pending view)
  const handleMarkAsReady = (imageId: string) => {
    const prevStatus = favoriteEntries.find(f => f.image.id === imageId)?.retouchStatus || 'pending';
    handleUpdateStatus(imageId, 'completed');

    setActionToast({
      message: 'Fotografía marcada como lista y movida a "Completadas".',
      undoAction: () => {
        handleUpdateStatus(imageId, prevStatus);
        setActionToast(null);
      }
    });

    setTimeout(() => {
      setActionToast(prev => (prev?.message.includes('lista') ? null : prev));
    }, 4500);
  };

  // Remove single image from favorites
  const handleRemoveSingleFavorite = (imageId: string) => {
    const target = images.find(img => img.id === imageId);
    if (!target) return;

    if (onUpdateImage) {
      onUpdateImage({
        ...target,
        favoriteByUsers: [],
      });
      setActionToast({
        message: `Fotografía "${target.title}" retirada de la selección de favoritas.`
      });
      setTimeout(() => {
        setActionToast(prev => (prev?.message.includes('retirada') ? null : prev));
      }, 3500);
    }
  };

  // Batch mark all pending as completed
  const handleBatchMarkAllCompleted = () => {
    const pendingEntries = filteredFavorites.filter(
      e => e.retouchStatus === 'pending' || e.retouchStatus === 'in_progress'
    );
    if (pendingEntries.length === 0) {
      setShowBatchCompleteModal(false);
      return;
    }

    const newOverrides = { ...retouchOverrides };
    pendingEntries.forEach(entry => {
      newOverrides[entry.image.id] = {
        status: 'completed',
        notes: entry.retouchNotes || '',
      };
      if (onUpdateImage) {
        const target = images.find(img => img.id === entry.image.id);
        if (target) {
          const cleanTags = (target.tags || []).filter(
            t => t !== 'editado' && t !== 'en_edicion' && t !== 'pendiente'
          );
          cleanTags.push('editado');
          onUpdateImage({
            ...target,
            tags: cleanTags,
          });
        }
      }
    });

    setRetouchOverrides(newOverrides);
    setShowBatchCompleteModal(false);
    setActionToast({
      message: `¡Listo! Se marcaron ${pendingEntries.length} fotografías pendientes como listas.`
    });
    setTimeout(() => {
      setActionToast(prev => (prev?.message.includes('marcaron') ? null : prev));
    }, 4500);
  };

  // Batch clear all completed from favorites
  const handleClearAllCompleted = () => {
    const completedEntries = favoriteEntries.filter(
      e => e.retouchStatus === 'completed' || e.retouchStatus === 'delivered'
    );
    if (completedEntries.length === 0) {
      setShowClearCompletedModal(false);
      return;
    }

    completedEntries.forEach(entry => {
      if (onUpdateImage) {
        const target = images.find(img => img.id === entry.image.id);
        if (target) {
          onUpdateImage({
            ...target,
            favoriteByUsers: [],
          });
        }
      }
    });

    setShowClearCompletedModal(false);
    setActionToast({
      message: `Se limpiaron ${completedEntries.length} fotografías del historial de completadas.`
    });
    setTimeout(() => {
      setActionToast(prev => (prev?.message.includes('limpiaron') ? null : prev));
    }, 4500);
  };

  // Update Retouch Notes
  const handleUpdateNotes = (imageId: string, notes: string) => {
    setRetouchOverrides(prev => ({
      ...prev,
      [imageId]: {
        status: prev[imageId]?.status || favoriteEntries.find(f => f.image.id === imageId)?.retouchStatus || 'pending',
        notes,
      }
    }));

    if (onUpdateImage) {
      const target = images.find(img => img.id === imageId);
      if (target) {
        onUpdateImage({
          ...target,
          clientNote: notes,
        });
      }
    }
  };

  // Copy RAW Filenames for Lightroom / Capture One
  const handleCopyRawFilenames = () => {
    const filenames = filteredFavorites.map(f => f.image.originalFileName || `${f.image.title}.CR3`).join(', ');
    navigator.clipboard.writeText(filenames);
    setCopiedFilenames(true);
    setTimeout(() => setCopiedFilenames(false), 3000);
  };

  // Export Selection Sheet (.TXT file with formatted metadata)
  const handleExportSelectionText = () => {
    let content = `========================================================================\n`;
    content += `LUMINA STUDIO PRO — HOJA DE SELECCIÓN Y RETOQUE FINAL\n`;
    content += `Fecha de Exportación: ${new Date().toLocaleString('es-ES')}\n`;
    content += `Total de Fotografías Seleccionadas: ${filteredFavorites.length}\n`;
    content += `========================================================================\n\n`;

    filteredFavorites.forEach((entry, idx) => {
      content += `[FOTO ${idx + 1}] ${entry.image.title}\n`;
      content += `Archivo RAW: ${entry.image.originalFileName || 'N/A'}\n`;
      content += `Galería: ${entry.gallery?.title || 'Sin Galería'}\n`;
      content += `Cliente(s): ${entry.clients.map(c => c.name).join(', ')}\n`;
      content += `Estado de Edición: ${
        entry.retouchStatus === 'completed' ? 'Completado' : 
        entry.retouchStatus === 'in_progress' ? 'En Retoque' : 
        entry.retouchStatus === 'delivered' ? 'Entregado' : 'Pendiente'
      }\n`;
      if (entry.retouchNotes) {
        content += `Instrucciones de Retoque: ${entry.retouchNotes}\n`;
      }
      content += `Resolución: ${entry.image.width}x${entry.image.height} px | Tamaño: ${formatBytes(entry.image.fileSizeBytes)}\n`;
      content += `------------------------------------------------------------------------\n`;
    });

    content += `\nFILTRO LIGHTROOM (Pegar en Barra de Filtro de Metadatos):\n`;
    content += filteredFavorites.map(f => f.image.originalFileName?.replace(/\.[^.]+$/, '') || f.image.title).join(' ');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Seleccion_Retoque_PixartPhoto_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Batch Download Favorites ZIP
  const handleDownloadFavoritesZip = async () => {
    if (filteredFavorites.length === 0) return;
    setIsZipping(true);
    setZipProgress(10);
    const targetImages = filteredFavorites.map(f => f.image);
    
    try {
      await downloadImagesAsZip(
        targetImages, 
        selectedGalleryId !== 'all' 
          ? galleries.find(g => g.id === selectedGalleryId)?.title || 'Seleccion_Favoritas' 
          : 'Seleccion_Total_Clientes',
        (pct) => setZipProgress(pct)
      );
    } catch (err) {
      console.error('Error downloading zip:', err);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Statistics
  const pendingCount = favoriteEntries.filter(f => f.retouchStatus === 'pending' || f.retouchStatus === 'in_progress').length;
  const inProgressCount = favoriteEntries.filter(f => f.retouchStatus === 'in_progress').length;
  const completedCount = favoriteEntries.filter(f => f.retouchStatus === 'completed' || f.retouchStatus === 'delivered').length;
  const totalCount = favoriteEntries.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner & Summary */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <Heart className="w-3.5 h-3.5 fill-current" />
                Flujo de Selección de Clientes
              </span>
              <span className={`text-xs font-mono-code ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {favoriteEntries.length} fotos seleccionadas en total
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Selecciones de Clientes & Edición Final
            </h2>
            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Panel centralizado para revisar las fotografías que tus clientes han marcado como favoritas, inspeccionar sus notas de retoque, copiar los nombres RAW para Lightroom y gestionar los estados de postproducción.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              id="admin-copy-raw-filenames-btn"
              onClick={handleCopyRawFilenames}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                copiedFilenames
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Copiar nombres RAW separados por coma para filtrar en Lightroom"
            >
              {copiedFilenames ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-blue-400" />}
              <span>{copiedFilenames ? '¡Nombres RAW Copiados!' : 'Copiar Nombres RAW'}</span>
            </button>

            <button
              id="admin-export-selection-sheet-btn"
              onClick={handleExportSelectionText}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Exportar hoja de selección en formato texto con notas del cliente"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Exportar TXT / Hoja</span>
            </button>

            <button
              id="admin-download-all-favs-zip-btn"
              onClick={handleDownloadFavoritesZip}
              disabled={isZipping || filteredFavorites.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 ${colorTheme.twBg} ${colorTheme.twBgHover} ${colorTheme.twShadow}`}
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? `Comprimiendo (${zipProgress}%)...` : `Descargar ZIP (${filteredFavorites.length})`}</span>
            </button>
          </div>
        </div>

        {/* Workflow Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/60">
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#141618] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Total Seleccionadas</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            </div>
            <p className={`text-2xl font-bold font-mono-code ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {favoriteEntries.length}
            </p>
            <span className="text-[11px] text-slate-400">En {galleries.length} sesiones activas</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#141618] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span className="font-medium">Pendientes de Edición</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-bold font-mono-code text-amber-400">
              {pendingCount}
            </p>
            <span className="text-[11px] text-slate-400">Esperando procesado RAW</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#141618] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span className="font-medium">En Retoque</span>
              <Palette className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-bold font-mono-code text-blue-400">
              {inProgressCount}
            </p>
            <span className="text-[11px] text-slate-400">En Photoshop / Lightroom</span>
          </div>

          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#141618] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span className="font-medium">Listas / Entregadas</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-2xl font-bold font-mono-code text-emerald-400">
              {completedCount}
            </p>
            <span className="text-[11px] text-slate-400">Listas para álbum final</span>
          </div>
        </div>
      </div>

      {/* Client Summary Cards Row (Quick Filter by Client) */}
      {clientsWithFavorites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Clientes con Selección Activa ({clientsWithFavorites.length})
            </h3>
            {selectedClientId !== 'all' && (
              <button
                onClick={() => setSelectedClientId('all')}
                className="text-xs text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Ver todas las selecciones
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientsWithFavorites.map(({ user, count, galleryTitles }) => {
              const isSelected = selectedClientId === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedClientId(isSelected ? 'all' : user.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:scale-[1.01] ${
                    isSelected
                      ? `${colorTheme.twBadgeBg} ${colorTheme.twBadgeBorder} ring-2 ${colorTheme.twRing}`
                      : isDark ? 'bg-[#181A1D] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="truncate">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {Array.from(galleryTitles).join(', ') || 'Galería Principal'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-mono-code font-bold text-xs border border-rose-500/20">
                      {count} fotos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Toast Alert with Undo */}
      {actionToast && (
        <div 
          id="favorites-action-toast"
          className={`flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            isDark ? 'bg-stone-900 border-emerald-500/40 text-stone-100' : 'bg-white border-emerald-400 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium">{actionToast.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {actionToast.undoAction && (
              <button
                type="button"
                onClick={actionToast.undoAction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 cursor-pointer transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Deshacer</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Workflow Tabs: Pendientes (Default), Completadas, Todas + Batch Action Buttons */}
      <div className={`p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <button
            type="button"
            id="tab-favorites-pending"
            onClick={() => setStatusFilter('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
              statusFilter === 'pending' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-favorites-completed"
            onClick={() => setStatusFilter('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completadas</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
              statusFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
            }`}>
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-favorites-all"
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
              statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Tab-Specific Action Buttons */}
        <div className="flex items-center gap-2.5">
          {statusFilter === 'pending' && (
            <button
              type="button"
              id="admin-mark-all-ready-btn"
              disabled={pendingCount === 0}
              onClick={() => setShowBatchCompleteModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              title="Marcar todas las fotos pendientes como listas al mismo tiempo"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como listas ({pendingCount})</span>
            </button>
          )}

          {statusFilter === 'completed' && (
            <button
              type="button"
              id="admin-clear-completed-btn"
              disabled={completedCount === 0}
              onClick={() => setShowClearCompletedModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-xs cursor-pointer transition-all"
              title="Limpiar todas las fotos completadas de la selección de favoritas"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpiar todas las completadas ({completedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="admin-favorites-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por archivo RAW (ej. LUM_4021), título, cliente o notas..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Gallery Filter */}
          <select
            id="admin-fav-gallery-filter"
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border font-medium focus:outline-none cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todas las Galerías ({galleries.length})</option>
            {galleries.map(gal => (
              <option key={gal.id} value={gal.id}>{gal.title}</option>
            ))}
          </select>

          {/* Quick Clear Filters */}
          {(selectedGalleryId !== 'all' || selectedClientId !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => {
                setSelectedGalleryId('all');
                setSelectedClientId('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}

        </div>
      </div>

      {/* Empty State */}
      {filteredFavorites.length === 0 && (
        <div className={`text-center py-20 rounded-3xl border p-8 space-y-4 shadow-sm transition-colors ${
          isDark ? 'bg-[#181A1D] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            {statusFilter === 'pending' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Heart className="w-8 h-8" />}
          </div>
          <h3 className={`text-lg font-bold font-serif-display ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {statusFilter === 'pending' 
              ? (pendingCount === 0 ? '¡Todo al día! No tienes fotografías pendientes de retoque' : 'No hay fotografías pendientes con los filtros aplicados')
              : statusFilter === 'completed'
              ? (completedCount === 0 ? 'No hay fotografías en el historial de completadas' : 'No hay fotos completadas con los filtros aplicados')
              : 'No se encontraron fotografías favoritas'}
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {statusFilter === 'pending' && pendingCount === 0 && completedCount > 0 ? (
              <span>Todas las fotos seleccionadas por clientes han sido procesadas. Puedes consultarlas o descargarlas en la pestaña de completadas.</span>
            ) : statusFilter === 'completed' && completedCount === 0 && pendingCount > 0 ? (
              <span>Actualmente tienes {pendingCount} fotos en la bandeja de pendientes esperando ser marcadas como listas.</span>
            ) : (
              <span>Ajusta la búsqueda o selecciona otra galería para revisar las favoritas.</span>
            )}
          </p>
          {statusFilter === 'pending' && pendingCount === 0 && completedCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ver fotos completadas ({completedCount})</span>
            </button>
          )}
          {statusFilter === 'completed' && completedCount === 0 && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Ver fotos pendientes ({pendingCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Favorites List & Retouch Board */}
      {filteredFavorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFavorites.map((item) => {
            const { image, gallery, clients, retouchStatus, retouchNotes } = item;
            return (
              <div
                key={image.id}
                id={`favorite-card-${image.id}`}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col ${
                  isDark ? 'bg-[#181A1D] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Image Header with Direct Preview */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 group">
                  <img
                    src={image.url}
                    alt={image.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono-code text-blue-300 border border-blue-500/30">
                      {formatBytes(image.fileSizeBytes)} RAW
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono-code text-slate-300 border border-slate-700">
                      {image.width} × {image.height}
                    </span>
                  </div>

                  {/* Favorite Indicator */}
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>

                  {/* Hover Inspect & Download Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-white text-xs font-semibold border border-slate-700 shadow-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inspeccionar</span>
                    </button>

                    <button
                      onClick={() => downloadSingleImage(image, 'high-res', {
                        watermarkEnabled: gallery?.watermarkEnabled,
                        excludeWatermark: image.excludeWatermark,
                        watermarkType: gallery?.watermarkType,
                        watermarkText: gallery?.watermarkText,
                        watermarkImageUrl: gallery?.watermarkImageUrl,
                        watermarkPosition: gallery?.watermarkPosition,
                        watermarkOpacity: gallery?.watermarkOpacity,
                      })}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{image.excludeWatermark ? 'Descargar (Sin Marca)' : 'Descargar RAW'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Content & Retouching Controls */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  
                  {/* Photo Title & Gallery Link */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {image.title}
                        </h4>
                        <p className="text-xs font-mono-code text-blue-400 font-semibold mt-0.5">
                          {image.originalFileName || 'IMG_RAW_MASTER.CR3'}
                        </p>
                      </div>

                      {gallery && (
                        <button
                          onClick={() => onOpenGallery(gallery.id)}
                          className={`p-1.5 rounded-lg border text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ${
                            isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={`Ver galería "${gallery.title}"`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Gallery Title & Client Name */}
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[180px]" title={gallery?.title}>
                        📁 {gallery?.title || 'Sesión General'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {clients.map(c => (
                          <span 
                            key={c.id} 
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-300"
                            title={`Seleccionada por ${c.name}`}
                          >
                            <img
                              src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="truncate max-w-[90px]">{c.name.split(' ')[0]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Retouching Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Estado de Postproducción / Retoque:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(image.id, 'pending')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          retouchStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                            : isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ⏳ Pendiente
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(image.id, 'in_progress')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          retouchStatus === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                            : isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🎨 En Retoque
                      </button>

                      <button
                        onClick={() => handleMarkAsReady(image.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          retouchStatus === 'completed' || retouchStatus === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                            : isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Marcar como lista (se archiva y sale de la vista de pendientes)"
                      >
                        ✅ Listo
                      </button>
                    </div>
                  </div>

                  {/* Client / Retoucher Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Notas de Retoque & Edición:</span>
                      {retouchNotes && <span className="text-emerald-400 text-[10px]">Guardado</span>}
                    </label>
                    <input
                      type="text"
                      id={`retouch-notes-input-${image.id}`}
                      defaultValue={retouchNotes}
                      onBlur={(e) => handleUpdateNotes(image.id, e.target.value)}
                      placeholder="Ej: Corregir sombras, piel de novia, exportar 300dpi..."
                      className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(image.originalFileName || image.title);
                        }}
                        className="text-slate-400 hover:text-blue-400 flex items-center gap-1 font-mono-code text-[11px] cursor-pointer"
                        title="Copiar solo este nombre de archivo"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar RAW</span>
                      </button>

                      {/* Revert to Pending if already completed */}
                      {(retouchStatus === 'completed' || retouchStatus === 'delivered') && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateStatus(image.id, 'pending');
                            setActionToast({
                              message: `Fotografía "${image.title}" devuelta a la bandeja de pendientes.`,
                            });
                            setTimeout(() => setActionToast(null), 3500);
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer font-medium"
                          title="Devolver a pendientes para continuar editando"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>A Pendientes</span>
                        </button>
                      )}

                      {/* Remove single photo from favorites */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleFavorite(image.id)}
                        className="text-rose-400/80 hover:text-rose-400 flex items-center gap-1 text-[11px] cursor-pointer hover:underline transition-colors"
                        title="Eliminar de una en una de esta sección"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    </div>

                    <button
                      onClick={() => downloadSingleImage(image, 'high-res', {
                        watermarkEnabled: gallery?.watermarkEnabled,
                        excludeWatermark: image.excludeWatermark,
                        watermarkType: gallery?.watermarkType,
                        watermarkText: gallery?.watermarkText,
                        watermarkImageUrl: gallery?.watermarkImageUrl,
                        watermarkPosition: gallery?.watermarkPosition,
                        watermarkOpacity: gallery?.watermarkOpacity,
                      })}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{image.excludeWatermark ? 'Descargar (Sin Marca)' : 'Descargar Original'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-base">{previewImage.title}</h3>
                <p className="text-xs font-mono-code text-blue-400">{previewImage.originalFileName}</p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.highResUrl || previewImage.url}
                alt={previewImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] object-contain rounded-lg border border-slate-800"
              />
              {(() => {
                const parentGal = galleries.find(g => g.id === previewImage.galleryId);
                return parentGal?.watermarkEnabled ? (
                  <WatermarkOverlay
                    watermarkEnabled={parentGal.watermarkEnabled}
                    excludeWatermark={previewImage.excludeWatermark}
                    watermarkType={parentGal.watermarkType}
                    watermarkText={parentGal.watermarkText}
                    watermarkImageUrl={parentGal.watermarkImageUrl}
                    watermarkPosition={parentGal.watermarkPosition}
                    watermarkOpacity={parentGal.watermarkOpacity}
                  />
                ) : null;
              })()}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="font-mono-code">{previewImage.width} × {previewImage.height} px • {formatBytes(previewImage.fileSizeBytes)}</span>
              <button
                onClick={() => {
                  const parentGal = galleries.find(g => g.id === previewImage.galleryId);
                  downloadSingleImage(previewImage, 'high-res', {
                    watermarkEnabled: parentGal?.watermarkEnabled,
                    excludeWatermark: previewImage.excludeWatermark,
                    watermarkType: parentGal?.watermarkType,
                    watermarkText: parentGal?.watermarkText,
                    watermarkImageUrl: parentGal?.watermarkImageUrl,
                    watermarkPosition: parentGal?.watermarkPosition,
                    watermarkOpacity: parentGal?.watermarkOpacity,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{previewImage.excludeWatermark ? 'Descargar en Alta Resolución (Sin Marca)' : 'Descargar en Alta Resolución'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: BATCH MARK ALL AS COMPLETED CONFIRMATION */}
      {showBatchCompleteModal && (
        <div 
          id="batch-complete-confirm-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-display">
                  ¿Marcar todas las fotos como listas?
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Confirmación de procesado masivo
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
              isDark ? 'bg-stone-950/60 border-stone-800 text-stone-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <p>
                Se marcarán <strong className="text-emerald-400 font-bold">{pendingCount} fotografías</strong> pendientes como listas para la entrega.
              </p>
              <p className="text-[11px] text-stone-400">
                Saldrán automáticamente de la bandeja de pendientes y podrás consultarlas o descargarlas en cualquier momento desde la pestaña <strong>"Completadas"</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-batch-complete-btn"
                onClick={() => setShowBatchCompleteModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isDark ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-batch-complete-btn"
                onClick={handleBatchMarkAllCompleted}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Marcar Todas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLEAR ALL COMPLETED CONFIRMATION */}
      {showClearCompletedModal && (
        <div 
          id="clear-completed-confirm-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            className={`w-full max-w-md rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-display">
                  ¿Limpiar todas las completadas?
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Vaciar el historial de fotos finalizadas
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl text-xs space-y-2 border ${
              isDark ? 'bg-stone-950/60 border-stone-800 text-stone-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <p>
                Se desmarcarán y limpiarán <strong className="text-rose-400 font-bold">{completedCount} fotografías</strong> del historial de completadas.
              </p>
              <p className="text-[11px] text-stone-400">
                Esta acción limpia la bandeja para nuevos proyectos. Las fotos originales permanecerán seguras en sus respectivas galerías.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-clear-completed-btn"
                onClick={() => setShowClearCompletedModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isDark ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-clear-completed-btn"
                onClick={handleClearAllCompleted}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 cursor-pointer flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Limpiar Completadas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
