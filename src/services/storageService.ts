import JSZip from 'jszip';
import { GalleryImage, GallerySession, ServerStorageStats, User, AuditLogItem, AppNotification } from '../types';
import { INITIAL_USERS, INITIAL_GALLERIES, INITIAL_IMAGES, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'somos_pixart_users_v3',
  GALLERIES: 'somos_pixart_galleries_v3',
  IMAGES: 'somos_pixart_images_v3',
  LOGS: 'somos_pixart_logs_v3',
  NOTIFICATIONS: 'somos_pixart_notifications_v3',
  CURRENT_USER: 'somos_pixart_auth_user_v3',
  SERVER_QUOTA: 'somos_pixart_server_quota_v3',
};

export const DEFAULT_SERVER_QUOTA_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB (1,073,741,824 bytes)
export const SERVER_QUOTA_BYTES = DEFAULT_SERVER_QUOTA_BYTES;

export function loadServerQuotaFromStorage(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVER_QUOTA);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_SERVER_QUOTA_BYTES;
}

export function saveServerQuotaToStorage(quotaBytes: number) {
  localStorage.setItem(STORAGE_KEYS.SERVER_QUOTA, String(quotaBytes));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateGallerySize(galleryId: string, images: GalleryImage[]): { totalBytes: number; optimizedBytes: number; imageCount: number } {
  const galleryImages = images.filter(img => img.galleryId === galleryId);
  const totalBytes = galleryImages.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
  const optimizedBytes = galleryImages.reduce((acc, img) => acc + (img.optimized ? (img.compressedSizeBytes || img.fileSizeBytes * 0.18) : img.fileSizeBytes), 0);
  return {
    totalBytes,
    optimizedBytes,
    imageCount: galleryImages.length,
  };
}

export function calculateServerStats(
  galleries: GallerySession[], 
  images: GalleryImage[],
  customQuotaBytes?: number
): ServerStorageStats {
  const totalCapacity = customQuotaBytes && customQuotaBytes > 0 ? customQuotaBytes : loadServerQuotaFromStorage();
  const totalUsedBytes = images.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
  const optimizedImages = images.filter(img => img.optimized);
  const unoptimizedImages = images.filter(img => !img.optimized);

  const potentialSavingsBytes = unoptimizedImages.reduce((acc, img) => {
    const estimatedSaved = img.fileSizeBytes * 0.78; // 78% reduction on average for WebP/AVIF smart compression
    return acc + estimatedSaved;
  }, 0);

  return {
    totalCapacityBytes: totalCapacity,
    usedBytes: totalUsedBytes,
    galleriesCount: galleries.length,
    totalImagesCount: images.length,
    optimizedImagesCount: optimizedImages.length,
    potentialSavingsBytes: Math.round(potentialSavingsBytes),
  };
}

// Download single image directly
export async function downloadSingleImage(image: GalleryImage, type: 'high-res' | 'web-res' = 'high-res') {
  try {
    const targetUrl = type === 'high-res' ? image.highResUrl || image.url : image.url;
    
    // Fetch blob
    const response = await fetch(targetUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    const cleanName = image.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${image.originalFileName || `${cleanName}_${type}.jpg`}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.warn('Direct fetch failed, falling back to simple link download', error);
    const link = document.createElement('a');
    link.href = type === 'high-res' ? image.highResUrl || image.url : image.url;
    link.target = '_blank';
    link.download = image.originalFileName || `${image.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}

// Batch download images as a ZIP bundle
export async function downloadImagesAsZip(
  images: GalleryImage[],
  galleryTitle: string,
  onProgress?: (percent: number, currentFileName: string) => void
): Promise<boolean> {
  const zip = new JSZip();
  const folderName = `PixartPhoto_${galleryTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const imgFolder = zip.folder(folderName) || zip;

  let loadedCount = 0;
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const fileName = `${String(i + 1).padStart(3, '0')}_${img.originalFileName || `${img.title.replace(/[^a-z0-9]/gi, '_')}.jpg`}`;
    
    if (onProgress) {
      onProgress(Math.round(((i) / total) * 100), img.title);
    }

    try {
      const response = await fetch(img.highResUrl || img.url);
      const blob = await response.blob();
      imgFolder.file(fileName, blob);
      loadedCount++;
    } catch (e) {
      console.error(`Failed to fetch image ${img.title} for zip`, e);
    }
  }

  if (onProgress) {
    onProgress(95, 'Generando archivo comprimido ZIP...');
  }

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress && metadata.percent) {
      onProgress(Math.min(99, Math.round(95 + (metadata.percent * 0.04))), 'Comprimiendo álbum...');
    }
  });

  const blobUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${folderName}_AltaResolucion.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);

  if (onProgress) {
    onProgress(100, '¡Descarga completada con éxito!');
  }

  return true;
}

// Local Storage Loaders & Savers
export function loadUsersFromStorage(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (data) {
      const parsed: User[] = JSON.parse(data);
      // Migrate any legacy demo23 password to the user's defined password
      return parsed.map(u => {
        if (u.password === 'demo23') {
          const init = INITIAL_USERS.find(iu => iu.id === u.id || iu.email.toLowerCase() === u.email.toLowerCase());
          if (init) return { ...u, password: init.password };
        }
        return u;
      });
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_USERS;
}

export function saveUsersToStorage(users: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function loadGalleriesFromStorage(): GallerySession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GALLERIES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_GALLERIES;
}

export function saveGalleriesToStorage(galleries: GallerySession[]) {
  localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
}

export function loadImagesFromStorage(): GalleryImage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_IMAGES;
}

export function saveImagesToStorage(images: GalleryImage[]) {
  localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
}

export function loadLogsFromStorage(): AuditLogItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_AUDIT_LOGS;
}

export function saveLogsToStorage(logs: AuditLogItem[]) {
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function loadNotificationsFromStorage(): AppNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotificationsToStorage(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export function loadStoredAuthUser(): User | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveStoredAuthUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}
