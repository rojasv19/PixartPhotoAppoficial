import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { PublicClientPortal } from './components/PublicClientPortal';
import { GalleryView } from './components/GalleryView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { 
  GallerySession, GalleryImage, User, FeedbackItem, AuditLogItem, ServerStorageStats, StudioBrandingConfig, AppNotification 
} from './types';
import { 
  loadUsersFromStorage, saveUsersToStorage,
  loadGalleriesFromStorage, saveGalleriesToStorage,
  loadImagesFromStorage, saveImagesToStorage,
  loadLogsFromStorage, saveLogsToStorage,
  loadNotificationsFromStorage, saveNotificationsToStorage,
  loadStoredAuthUser, saveStoredAuthUser,
  loadServerQuotaFromStorage, saveServerQuotaToStorage,
  calculateServerStats,
  formatBytes
} from './services/storageService';
import {
  loadBrandingFromStorage,
  saveBrandingToStorage,
  updateDocumentFaviconAndTitle,
  COLOR_PRESET_MAP
} from './services/brandingService';
import {
  db,
  id,
  APP_ID,
  toUuid,
  seedInitialDataIfEmpty,
  createGalleryInDb,
  updateGalleryInDb,
  deleteGalleryInDb,
  createUserInDb,
  updateUserInDb,
  deleteUserInDb,
  uploadImageToDb,
  deleteImageFromDb,
  toggleImageFavoriteInDb,
  updateImageInDb,
  addFeedbackToDb,
  replyFeedbackInDb,
  batchOptimizeImagesInDb,
  addAuditLogInDb
} from './services/instantDbService';

export default function App() {
  // Query InstantDB in real-time
  const { isLoading: isDbLoading, error: dbError, data: dbData } = db.useQuery({
    galleries: {},
    images: {},
    users: {},
    logs: {},
  });

  // Local state cache / fallbacks
  const [localUsers, setLocalUsers] = useState<User[]>(() => loadUsersFromStorage());
  const [localGalleries, setLocalGalleries] = useState<GallerySession[]>(() => loadGalleriesFromStorage());
  const [localImages, setLocalImages] = useState<GalleryImage[]>(() => loadImagesFromStorage());
  const [localLogs, setLocalLogs] = useState<AuditLogItem[]>(() => loadLogsFromStorage());
  const [hasSeeded, setHasSeeded] = useState(false);

  // Sync / Seed initial data to InstantDB on first mount if remote is empty
  useEffect(() => {
    if (!isDbLoading && dbData && !hasSeeded) {
      const remoteGalleriesCount = dbData.galleries?.length || 0;
      const remoteUsersCount = dbData.users?.length || 0;

      if (remoteGalleriesCount === 0 && remoteUsersCount === 0) {
        seedInitialDataIfEmpty(0, 0)
          .then(() => setHasSeeded(true))
          .catch((err) => {
            console.error('Seeding error:', err);
            setHasSeeded(true);
          });
      } else {
        setHasSeeded(true);
      }
    }
  }, [isDbLoading, dbData, hasSeeded]);

  // Merge InstantDB data with local fallbacks
  const users: User[] = useMemo(() => {
    if (dbData?.users && dbData.users.length > 0) {
      return (dbData.users as unknown as User[]).map(u => ({
        ...u,
        assignedGalleryIds: Array.isArray(u.assignedGalleryIds) ? u.assignedGalleryIds : [],
      }));
    }
    return localUsers;
  }, [dbData?.users, localUsers]);

  const galleries: GallerySession[] = useMemo(() => {
    if (dbData?.galleries && dbData.galleries.length > 0) {
      return (dbData.galleries as unknown as GallerySession[]).map(g => ({
        ...g,
        clientIds: Array.isArray(g.clientIds) ? g.clientIds : [],
        clientNames: Array.isArray(g.clientNames) ? g.clientNames : [],
        feedbackList: Array.isArray(g.feedbackList) ? g.feedbackList : [],
      }));
    }
    return localGalleries;
  }, [dbData?.galleries, localGalleries]);

  const images: GalleryImage[] = useMemo(() => {
    if (dbData?.images && dbData.images.length > 0) {
      return (dbData.images as unknown as GalleryImage[]).map(img => ({
        ...img,
        favoriteByUsers: Array.isArray(img.favoriteByUsers) ? img.favoriteByUsers : [],
        tags: Array.isArray(img.tags) ? img.tags : [],
      }));
    }
    return localImages;
  }, [dbData?.images, localImages]);

  const logs: AuditLogItem[] = useMemo(() => {
    if (dbData?.logs && dbData.logs.length > 0) {
      return (dbData.logs as unknown as AuditLogItem[]).sort((a, b) => 
        (b.id || '').localeCompare(a.id || '')
      );
    }
    return localLogs;
  }, [dbData?.logs, localLogs]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = loadStoredAuthUser();
    return saved || null;
  });

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'admin' | 'client' | 'pin'>('admin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // App Notifications System
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotificationsFromStorage());

  useEffect(() => {
    saveNotificationsToStorage(notifications);
  }, [notifications]);

  const handleMarkNotificationAsRead = (notificationId: string) => {
    const userId = currentUser?.id || 'guest';
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        const readBy = Array.isArray(n.readBy) ? n.readBy : [];
        if (!readBy.includes(userId)) {
          return { ...n, readBy: [...readBy, userId] };
        }
      }
      return n;
    }));
  };

  const handleMarkAllNotificationsAsRead = () => {
    const userId = currentUser?.id || 'guest';
    setNotifications(prev => prev.map(n => {
      const readBy = Array.isArray(n.readBy) ? n.readBy : [];
      return readBy.includes(userId) ? n : { ...n, readBy: [...readBy, userId] };
    }));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleAddNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'readBy'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: id(),
      timestamp: 'Ahora mismo',
      readBy: [],
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Studio Branding & Customization State
  const [branding, setBranding] = useState<StudioBrandingConfig>(() => loadBrandingFromStorage());

  useEffect(() => {
    updateDocumentFaviconAndTitle(branding);
  }, [branding]);

  const handleSaveBranding = (updated: StudioBrandingConfig) => {
    setBranding(updated);
    saveBrandingToStorage(updated);
    addAuditLog(
      'Configuración de Marca Actualizada',
      `Se actualizaron los parámetros visuales (Logo: ${updated.logoType}, Color: ${updated.colorPreset}, Nombre: ${updated.studioName})`
    );
  };

  // Theme Management (Light / Dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lumina_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('lumina_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync state changes to localStorage as backup
  useEffect(() => {
    if (users.length > 0) {
      saveUsersToStorage(users);
    }
  }, [users]);

  useEffect(() => {
    if (galleries.length > 0) {
      saveGalleriesToStorage(galleries);
    }
  }, [galleries]);

  useEffect(() => {
    if (images.length > 0) {
      saveImagesToStorage(images);
    }
  }, [images]);

  useEffect(() => {
    if (logs.length > 0) {
      saveLogsToStorage(logs);
    }
  }, [logs]);

  useEffect(() => {
    saveStoredAuthUser(currentUser);
  }, [currentUser]);

  const [serverQuotaBytes, setServerQuotaBytes] = useState<number>(() => loadServerQuotaFromStorage());

  const handleUpdateServerQuota = (newQuotaBytes: number) => {
    setServerQuotaBytes(newQuotaBytes);
    saveServerQuotaToStorage(newQuotaBytes);
    addAuditLog(
      'Límite de Disco Actualizado',
      `Se ajustó la capacidad total del servidor a ${formatBytes(newQuotaBytes)}.`
    );
  };

  // Compute server storage stats
  const serverStats: ServerStorageStats = useMemo(
    () => calculateServerStats(galleries, images, serverQuotaBytes), 
    [galleries, images, serverQuotaBytes]
  );

  // Add Log Helper
  const addAuditLog = (action: string, details: string, galleryTitle?: string, actor?: { name: string; role: string }) => {
    const newLog: AuditLogItem = {
      id: id(),
      timestamp: new Date().toLocaleString('es-ES', { 
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
      }),
      actorName: actor?.name || currentUser?.name || 'Sistema',
      actorRole: actor?.role || (currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'photographer' ? 'Fotógrafo' : 'Cliente'),
      action,
      details,
      galleryTitle,
      iconType: 'security',
    };
    setLocalLogs(prev => [newLog, ...prev]);
    addAuditLogInDb(newLog).catch(err => console.error('InstantDB audit log error:', err));
  };

  // Auth Handlers
  const handleLogin = (emailOrUser: string, pass: string, targetRole?: 'admin' | 'client'): boolean => {
    const input = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Authenticate by user's email or username with their corresponding password
    const found = users.find(u => 
      (u.email.toLowerCase() === input || u.name.toLowerCase() === input) &&
      u.password === cleanPass
    );

    if (found) {
      setCurrentUser(found);
      addAuditLog('Inicio de Sesión', `Usuario ${found.name} (${found.email}) accedió a la plataforma.`, undefined, { name: found.name, role: found.role });
      if (found.role === 'admin' || found.role === 'photographer') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
      return true;
    }
    return false;
  };

  const handlePinSubmit = (pin: string): boolean => {
    const matchedGallery = galleries.find(g => g.accessPin === pin.trim());
    if (matchedGallery) {
      setSelectedGalleryId(matchedGallery.id);
      setCurrentView('gallery');
      addAuditLog('Acceso por PIN', `Acceso directo autorizado a la galería "${matchedGallery.title}" usando PIN de seguridad.`, matchedGallery.title);
      return true;
    }
    return false;
  };

  const handleQuickSwitchUser = (mode: 'admin' | 'client-wedding' | 'client-editorial' | 'client-nexus') => {
    let targetUser: User | undefined;
    if (mode === 'admin') {
      targetUser = users.find(u => u.role === 'admin');
      if (targetUser) {
        setCurrentUser(targetUser);
        setCurrentView('admin');
      }
    } else if (mode === 'client-wedding') {
      targetUser = users.find(u => u.email === 'sofia.valenzuela@gmail.com');
      if (targetUser) {
        setCurrentUser(targetUser);
        const weddingGal = galleries.find(g => g.slug === 'sofia-mateo-boda' || g.category === 'boda') || galleries[0];
        if (weddingGal) setSelectedGalleryId(weddingGal.id);
        setCurrentView('gallery');
      }
    } else if (mode === 'client-editorial') {
      targetUser = users.find(u => u.email === 'valeria@hautemode.es');
      if (targetUser) {
        setCurrentUser(targetUser);
        const edGal = galleries.find(g => g.slug === 'valeria-mendoza-haute-mode' || g.category === 'editorial') || galleries[0];
        if (edGal) setSelectedGalleryId(edGal.id);
        setCurrentView('gallery');
      }
    } else if (mode === 'client-nexus') {
      targetUser = users.find(u => u.email === 'comms@nexustech.io');
      if (targetUser) {
        setCurrentUser(targetUser);
        const corpGal = galleries.find(g => g.category === 'eventos') || galleries[0];
        if (corpGal) setSelectedGalleryId(corpGal.id);
        setCurrentView('gallery');
      }
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('Cierre de Sesión', `Usuario ${currentUser.name} cerró su sesión.`, undefined);
    }
    setCurrentUser(null);
    setCurrentView('home');
  };

  // Gallery Navigation
  const handleOpenGallery = (galleryId: string) => {
    setSelectedGalleryId(galleryId);
    setCurrentView('gallery');
    const gal = galleries.find(g => g.id === galleryId || toUuid(g.id) === toUuid(galleryId));
    if (gal) {
      // Increment views count in local and InstantDB
      const updatedGal: GallerySession = { ...gal, viewsCount: (gal.viewsCount || 0) + 1 };
      setLocalGalleries(prev => prev.map(g => g.id === gal.id ? updatedGal : g));
      updateGalleryInDb(updatedGal).catch(err => console.error('InstantDB gallery view count update error:', err));
      addAuditLog('Visualización de Galería', `Apertura de la galería de alta resolución "${gal.title}".`, gal.title);
    }
  };

  // Photo Interactions
  const handleToggleFavorite = (imageId: string) => {
    const userId = currentUser?.id || 'usr-guest';
    const targetImage = images.find(img => img.id === imageId || toUuid(img.id) === toUuid(imageId));
    if (!targetImage) return;

    const currentFavs = targetImage.favoriteByUsers || [];
    const isFav = currentFavs.includes(userId) || currentFavs.includes(toUuid(userId));
    const userUuid = toUuid(userId);
    const updatedUsersList = isFav
      ? currentFavs.filter(id => id !== userId && id !== userUuid)
      : [...currentFavs, userUuid];

    setLocalImages(prev => prev.map(img => img.id === targetImage.id ? { ...img, favoriteByUsers: updatedUsersList } : img));
    toggleImageFavoriteInDb(targetImage.id, userId, currentFavs).catch(err => console.error('InstantDB toggle favorite error:', err));

    addAuditLog(
      isFav ? 'Favorito Eliminado' : 'Favorito Agregado',
      `${isFav ? 'Desmarcó' : 'Marcó'} como favorita la foto "${targetImage.title}".`,
      undefined
    );

    // Create a real-time notification for Admin when a client favorites an image
    if (!isFav) {
      const parentGal = galleries.find(g => g.id === targetImage.galleryId || toUuid(g.id) === toUuid(targetImage.galleryId));
      handleAddNotification({
        title: 'Foto Marcada como Favorita',
        message: `${currentUser?.name || 'Un cliente'} ha marcado "${targetImage.title}" como favorita para la selección final.`,
        type: 'favorite',
        targetRole: 'admin',
        galleryId: parentGal?.id,
        galleryTitle: parentGal?.title,
        imageId: targetImage.id,
        imageUrl: targetImage.url,
        actorName: currentUser?.name || 'Cliente',
        actorAvatar: currentUser?.avatar,
        linkView: 'admin-favorites',
      });
    }
  };

  // Update Image metadata / retouch notes
  const handleUpdateImage = (updatedImage: GalleryImage) => {
    setLocalImages(prev => prev.map(img => (img.id === updatedImage.id || toUuid(img.id) === toUuid(updatedImage.id)) ? updatedImage : img));
    updateImageInDb(updatedImage).catch(err => console.error('Error updating image in DB:', err));
    addAuditLog('Foto Actualizada', `Se actualizaron notas o estado de retoque para "${updatedImage.title}".`);
  };

  // Feedback Submission
  const handleAddFeedback = (galleryId: string, feedbackData: Omit<FeedbackItem, 'id' | 'createdAt'>) => {
    const newFeedback: FeedbackItem = {
      ...feedbackData,
      id: id(),
      createdAt: new Date().toLocaleString('es-ES', { 
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
      }),
    };

    const parentGal = galleries.find(g => g.id === galleryId || toUuid(g.id) === toUuid(galleryId));
    const existingFeedback = parentGal?.feedbackList || [];
    const updatedList = [newFeedback, ...existingFeedback];

    setLocalGalleries(prev => prev.map(g => {
      if (g.id === parentGal?.id) {
        return {
          ...g,
          feedbackList: updatedList,
          favoritesSubmittedCount: feedbackData.favoriteCountAtTime || g.favoritesSubmittedCount,
          lastActivityAt: new Date().toISOString().split('T')[0],
        };
      }
      return g;
    }));

    if (parentGal) {
      addFeedbackToDb(parentGal.id, newFeedback, existingFeedback, feedbackData.favoriteCountAtTime)
        .catch(err => console.error('InstantDB add feedback error:', err));

      addAuditLog('Nuevo Feedback Recibido', `Cliente ${feedbackData.clientName} envió una calificación de ${feedbackData.rating} estrellas: "${feedbackData.message.slice(0, 60)}..."`, parentGal.title);

      // Notification for admin
      handleAddNotification({
        title: 'Selección & Feedback Enviado',
        message: `${feedbackData.clientName} ha enviado ${feedbackData.favoriteCountAtTime || 0} fotos favoritas y comentarios para la sesión "${parentGal.title}".`,
        type: 'feedback',
        targetRole: 'admin',
        galleryId: parentGal.id,
        galleryTitle: parentGal.title,
        actorName: feedbackData.clientName,
        actorAvatar: feedbackData.clientAvatar,
        linkView: 'admin-favorites',
      });
    }
  };

  // Reply to Client Feedback
  const handleReplyFeedback = (galleryId: string, feedbackId: string, replyText: string) => {
    const parentGal = galleries.find(g => g.id === galleryId || toUuid(g.id) === toUuid(galleryId));
    const currentList = parentGal?.feedbackList || [];

    setLocalGalleries(prev => prev.map(g => {
      if (g.id === parentGal?.id) {
        const updatedList = (g.feedbackList || []).map(f => {
          if (f.id === feedbackId || toUuid(f.id) === toUuid(feedbackId)) {
            return {
              ...f,
              photographerReply: replyText,
              repliedAt: new Date().toLocaleString('es-ES', { 
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
              }),
              status: 'reviewed' as const,
            };
          }
          return f;
        });
        return { ...g, feedbackList: updatedList };
      }
      return g;
    }));

    if (parentGal) {
      replyFeedbackInDb(parentGal.id, feedbackId, replyText, currentList)
        .catch(err => console.error('InstantDB reply feedback error:', err));
    }

    addAuditLog('Respuesta de Feedback', `Se envió respuesta del estudio al cliente.`, undefined);
  };

  // CRUD Operations: Galleries
  const handleCreateGallery = (newGalleryData: Omit<GallerySession, 'id' | 'createdAt' | 'lastActivityAt' | 'viewsCount' | 'downloadsCount' | 'favoritesSubmittedCount' | 'feedbackList'>) => {
    const newId = id();
    const newGallery: GallerySession = {
      ...newGalleryData,
      id: newId,
      viewsCount: 0,
      downloadsCount: 0,
      favoritesSubmittedCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastActivityAt: new Date().toISOString().split('T')[0],
      feedbackList: [],
    };

    setLocalGalleries(prev => [newGallery, ...prev]);
    createGalleryInDb(newGallery).catch(err => console.error('InstantDB create gallery error:', err));
    
    // Also assign gallery to selected clients
    if (newGallery.clientIds && newGallery.clientIds.length > 0) {
      setLocalUsers(prevUsers => prevUsers.map(u => {
        if (newGallery.clientIds.includes(u.id) || newGallery.clientIds.includes(toUuid(u.id))) {
          const currentAssigned = u.assignedGalleryIds || [];
          const updatedUser: User = {
            ...u,
            assignedGalleryIds: currentAssigned.includes(newId) ? currentAssigned : [...currentAssigned, newId]
          };
          updateUserInDb(updatedUser).catch(err => console.error('InstantDB assign client error:', err));
          return updatedUser;
        }
        return u;
      }));
    }

    addAuditLog('Sesión Creada', `Creó la nueva sesión fotográfica "${newGallery.title}" con PIN ${newGallery.accessPin}.`, newGallery.title);
  };

  const handleUpdateGallery = (updatedGallery: GallerySession) => {
    setLocalGalleries(prev => prev.map(g => (g.id === updatedGallery.id || toUuid(g.id) === toUuid(updatedGallery.id)) ? updatedGallery : g));
    updateGalleryInDb(updatedGallery).catch(err => console.error('InstantDB update gallery error:', err));
    addAuditLog('Sesión Actualizada', `Modificó detalles y permisos de la sesión "${updatedGallery.title}".`, updatedGallery.title);
  };

  const handleDeleteGallery = (galleryId: string) => {
    const gal = galleries.find(g => g.id === galleryId || toUuid(g.id) === toUuid(galleryId));
    const targetId = gal?.id || galleryId;
    const relatedImgs = images.filter(img => img.galleryId === targetId || toUuid(img.galleryId) === toUuid(targetId)).map(i => i.id);

    setLocalGalleries(prev => prev.filter(g => g.id !== targetId && toUuid(g.id) !== toUuid(targetId)));
    setLocalImages(prev => prev.filter(img => img.galleryId !== targetId && toUuid(img.galleryId) !== toUuid(targetId)));

    deleteGalleryInDb(targetId, relatedImgs).catch(err => console.error('InstantDB delete gallery error:', err));
    addAuditLog('Sesión Eliminada', `Eliminó la sesión "${gal?.title}" y liberó su espacio en disco.`, gal?.title);
  };

  // CRUD Operations: Users/Clients
  const handleCreateUser = (newUserData: Omit<User, 'id' | 'createdDate'>) => {
    const newUser: User = {
      ...newUserData,
      id: id(),
      createdDate: new Date().toISOString().split('T')[0],
    };
    setLocalUsers(prev => [...prev, newUser]);
    createUserInDb(newUser).catch(err => console.error('InstantDB create user error:', err));
    addAuditLog('Cliente Registrado', `Registró al nuevo cliente ${newUser.name} (${newUser.email}).`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setLocalUsers(prev => prev.map(u => (u.id === updatedUser.id || toUuid(u.id) === toUuid(updatedUser.id)) ? updatedUser : u));
    if (currentUser?.id === updatedUser.id || toUuid(currentUser?.id || '') === toUuid(updatedUser.id)) {
      setCurrentUser(updatedUser);
    }
    updateUserInDb(updatedUser).catch(err => console.error('InstantDB update user error:', err));
    addAuditLog('Permisos Actualizados', `Actualizó permisos y galerías asignadas de ${updatedUser.name}.`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId || toUuid(u.id) === toUuid(userId));
    const targetId = targetUser?.id || userId;
    setLocalUsers(prev => prev.filter(u => u.id !== targetId && toUuid(u.id) !== toUuid(targetId)));
    deleteUserInDb(targetId).catch(err => console.error('InstantDB delete user error:', err));
    addAuditLog('Cliente Eliminado', `Eliminó el acceso del cliente ${targetUser?.name}.`);
  };

  // User Registration from Modal or Forms
  const handleRegisterUser = (newUserData: Omit<User, 'id' | 'createdDate'>) => {
    const newId = id();
    const newUser: User = {
      ...newUserData,
      id: newId,
      createdDate: new Date().toISOString().split('T')[0],
    };

    setLocalUsers(prev => [...prev, newUser]);
    createUserInDb(newUser).catch(err => console.error('InstantDB create user error:', err));
    setCurrentUser(newUser);

    addAuditLog('Usuario Registrado', `Nueva cuenta creada para ${newUser.name} (${newUser.email}) con rol ${newUser.role}.`, undefined, { name: newUser.name, role: newUser.role });

    if (newUser.role === 'admin' || newUser.role === 'photographer') {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
  };
  const handleUploadImage = (galleryId: string, imageFile: { title: string; url: string; highResUrl: string; originalFileName: string; fileSizeBytes: number; width: number; height: number; tags: string[] }) => {
    const parentGal = galleries.find(g => g.id === galleryId || toUuid(g.id) === toUuid(galleryId));
    const targetGalleryId = parentGal?.id || galleryId;

    const newImage: GalleryImage = {
      ...imageFile,
      id: id(),
      galleryId: targetGalleryId,
      orientation: imageFile.width >= imageFile.height ? 'landscape' : 'portrait',
      cameraModel: 'Canon EOS R5 Master',
      lens: 'RF 50mm f/1.2L USM',
      focalLength: '50mm',
      iso: 100,
      shutterSpeed: '1/1000s',
      aperture: 'f/1.4',
      favoriteByUsers: [],
      uploadedAt: new Date().toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      optimized: false,
    };

    setLocalImages(prev => [newImage, ...prev]);
    uploadImageToDb(newImage).catch(err => console.error('InstantDB upload image error:', err));

    addAuditLog('Carga de Fotografía', `Subió la foto "${newImage.title}" (${(newImage.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB) a la galería.`, parentGal?.title);

    // Notification for clients/users
    handleAddNotification({
      title: 'Nuevas Fotos Disponibles',
      message: `Se ha añadido la fotografía "${newImage.title}" a la sesión "${parentGal?.title || 'Galería'}".`,
      type: 'upload',
      targetRole: 'client',
      galleryId: parentGal?.id,
      galleryTitle: parentGal?.title,
      imageId: newImage.id,
      imageUrl: newImage.url,
      actorName: currentUser?.name || 'Estudio Lumina',
      actorAvatar: currentUser?.avatar,
      linkView: 'gallery',
    });
  };

  const handleDeleteImage = (imageId: string) => {
    const targetImg = images.find(i => i.id === imageId || toUuid(i.id) === toUuid(imageId));
    const targetId = targetImg?.id || imageId;
    setLocalImages(prev => prev.filter(img => img.id !== targetId && toUuid(img.id) !== toUuid(targetId)));
    deleteImageFromDb(targetId).catch(err => console.error('InstantDB delete image error:', err));
    addAuditLog('Foto Eliminada', `Eliminó la imagen "${targetImg?.title}" y liberó espacio en el servidor.`);
  };

  // Batch Image Optimizer (WebP smart compression simulation)
  const handleBatchOptimizeImages = () => {
    const updatedImages = images.map(img => ({
      ...img,
      optimized: true,
      compressedSizeBytes: Math.round(img.fileSizeBytes * 0.18),
    }));
    setLocalImages(updatedImages);
    batchOptimizeImagesInDb(images).catch(err => console.error('InstantDB batch optimize error:', err));
    addAuditLog('Optimización de Almacenamiento', `Ejecutó optimización WebP en lote reduciendo el consumo de disco del servidor.`);
  };

  // Current active gallery for single gallery view
  const activeGallery = galleries.find(g => g.id === selectedGalleryId || toUuid(g.id) === toUuid(selectedGalleryId || '')) || galleries[0];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0F1012] text-slate-100' : 'bg-[#F8F9FA] text-slate-800'
    }`}>
      
      {/* Top Main Navigation Bar with InstantDB Status & Theme Switch */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view, targetId) => {
          if (view === 'pin-access') {
            setAuthModalInitialTab('pin');
            setIsAuthModalOpen(true);
          } else if (view === 'gallery' && targetId) {
            setSelectedGalleryId(targetId);
            setCurrentView('gallery');
          } else {
            setCurrentView(view);
          }
        }}
        onLoginClick={(roleHint) => {
          setAuthModalInitialTab(roleHint || 'admin');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        storageStats={serverStats}
        isDbConnected={!dbError}
        theme={theme}
        onToggleTheme={toggleTheme}
        branding={branding}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onClearNotifications={handleClearNotifications}
      />

      {/* Quick Dashboard Return Floating Button for Admin when browsing client views */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'photographer') && currentView !== 'admin' && !currentView.startsWith('admin-') && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom duration-300">
          <button
            id="floating-return-admin-dashboard-btn"
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-xs shadow-2xl border hover:scale-105 transition-all cursor-pointer ${COLOR_PRESET_MAP[branding.colorPreset]?.twBg || 'bg-blue-600'} ${COLOR_PRESET_MAP[branding.colorPreset]?.twBgHover || 'hover:bg-blue-500'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            <span>Panel de Gestión Studio</span>
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* VIEW 1: Public Client Portal & Home (Simplified 2 Options) */}
        {currentView === 'home' && (
          <PublicClientPortal
            currentUser={currentUser}
            galleries={galleries}
            images={images}
            onOpenGallery={handleOpenGallery}
            onLogin={handleLogin}
            onPinSubmit={handlePinSubmit}
            onOpenAuthModal={(tab) => {
              setAuthModalInitialTab(tab || 'admin');
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onNavigateAdmin={() => setCurrentView('admin')}
            theme={theme}
            branding={branding}
          />
        )}

        {/* VIEW 2: High-Resolution Gallery View */}
        {currentView === 'gallery' && activeGallery && (
          <GalleryView
            gallery={activeGallery}
            images={images}
            currentUser={currentUser}
            onBack={() => setCurrentView('home')}
            onToggleFavorite={handleToggleFavorite}
            onAddFeedback={handleAddFeedback}
            onUpdateGallery={handleUpdateGallery}
            onRequestLogin={() => {
              setAuthModalInitialTab('client');
              setIsAuthModalOpen(true);
            }}
            theme={theme}
            branding={branding}
          />
        )}

        {/* VIEW 3: Admin & Photography Studio Management Dashboard */}
        {(currentView === 'admin' || currentView.startsWith('admin-')) && (
          <AdminDashboard
            initialTab={
              currentView === 'admin-favorites' ? 'favorites' :
              currentView === 'admin-galleries' ? 'galleries' :
              currentView === 'admin-clients' ? 'clients' :
              currentView === 'admin-storage' ? 'storage' :
              currentView === 'admin-branding' ? 'branding' :
              currentView === 'admin-permissions' ? 'permissions' :
              'overview'
            }
            galleries={galleries}
            images={images}
            users={users}
            logs={logs}
            storageStats={serverStats}
            branding={branding}
            onSaveBranding={handleSaveBranding}
            onPreviewPortal={() => setCurrentView('home')}
            onOpenGallery={handleOpenGallery}
            onCreateGallery={handleCreateGallery}
            onUpdateGallery={handleUpdateGallery}
            onDeleteGallery={handleDeleteGallery}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onUploadImage={handleUploadImage}
            onDeleteImage={handleDeleteImage}
            onBatchOptimizeImages={handleBatchOptimizeImages}
            onReplyFeedback={handleReplyFeedback}
            onUpdateImage={handleUpdateImage}
            onUpdateServerQuota={handleUpdateServerQuota}
            theme={theme}
          />
        )}

      </main>

      {/* Global Studio Footer */}
      <footer className={`border-t py-6 text-xs transition-colors ${
        theme === 'dark' ? 'border-slate-800 bg-[#141618] text-slate-400' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {branding.studioName}
            </span>
            <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>
              — {branding.footerCopyrightText || 'Plataforma de Galerías Privadas & Almacenamiento Profesional'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className={`flex items-center gap-1.5 font-mono-code px-2 py-0.5 rounded border ${
              theme === 'dark' ? 'text-slate-300 bg-slate-900 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              InstantDB: {APP_ID.slice(0, 8)}...
            </span>
            <span>Cuota: <strong className={`font-mono-code ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{formatBytes(serverStats.usedBytes)} / {formatBytes(serverStats.totalCapacityBytes)}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              InstantDB Cloud Synced
            </span>
          </div>
        </div>
      </footer>

      {/* Global Authentication & PIN Access Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onPinSubmit={handlePinSubmit}
        galleries={galleries}
        initialMode={authModalInitialTab}
        theme={theme}
        branding={branding}
      />

      {/* Global User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSaveUser={handleUpdateUser}
        theme={theme}
        branding={branding}
      />

    </div>
  );
}
