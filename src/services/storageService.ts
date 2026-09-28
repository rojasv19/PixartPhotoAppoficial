import JSZip from 'jszip';
import { GalleryImage, GallerySession, ServerStorageStats, User, AuditLogItem, AppNotification } from '../types';
import { INITIAL_USERS, INITIAL_GALLERIES, INITIAL_IMAGES, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS } from '../data/initialData';
import { isSameId } from './instantDbService';

const STORAGE_KEYS = {
  USERS: 'somos_pixart_users_v5',
  GALLERIES: 'somos_pixart_galleries_v3',
  IMAGES: 'somos_pixart_images_v3',
  LOGS: 'somos_pixart_logs_v5',
  NOTIFICATIONS: 'somos_pixart_notifications_v5',
  CURRENT_USER: 'somos_pixart_auth_user_v5',
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

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError = 
      err?.name === 'QuotaExceededError' || 
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
      err?.code === 22 || 
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.warn(`[SafeStorage] LocalStorage quota exceeded while writing "${key}". Purgando caché no crítica para liberar memoria...`);
      // Evict non-critical heavy caches (images cache, old logs, branding cache)
      try {
        localStorage.removeItem(STORAGE_KEYS.IMAGES);
      } catch {}

      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        // If still full, purge logs and notifications
        try {
          localStorage.removeItem(STORAGE_KEYS.LOGS);
          localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
        } catch {}

        try {
          localStorage.setItem(key, value);
          return true;
        } catch (finalErr) {
          console.warn(`[SafeStorage] Could not write "${key}" to localStorage. Cloud sync and React state remain active.`, finalErr);
          return false;
        }
      }
    } else {
      console.warn(`[SafeStorage] Storage write error for "${key}":`, err);
      return false;
    }
  }
}

export function saveServerQuotaToStorage(quotaBytes: number) {
  safeSetItem(STORAGE_KEYS.SERVER_QUOTA, String(quotaBytes));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateGallerySize(galleryId: string, images: GalleryImage[], gallery?: GallerySession): { totalBytes: number; optimizedBytes: number; imageCount: number } {
  const galleryImages = images.filter(img => 
    isSameId(img.galleryId, galleryId) ||
    (gallery?.slug && isSameId(img.galleryId, gallery.slug)) ||
    ((gallery as any)?.originalLocalId && isSameId(img.galleryId, (gallery as any).originalLocalId)) ||
    (gallery?.title && img.galleryId?.trim().toLowerCase() === gallery.title.trim().toLowerCase())
  );
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
  const rawUsedBytes = images.reduce((acc, img) => acc + (img.fileSizeBytes || 0), 0);
  const totalGalleryPhotos = galleries.reduce((acc, g) => acc + (g.photoCount || 0), 0);
  const effectiveTotalImages = images.length > 0 ? images.length : totalGalleryPhotos;

  // If heavy photo payloads are currently being fetched, reflect storage based on photoCount (~3.2MB per photo)
  const totalUsedBytes = rawUsedBytes > 0 ? rawUsedBytes : effectiveTotalImages * 3200000;

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
    totalImagesCount: effectiveTotalImages,
    optimizedImagesCount: optimizedImages.length,
    potentialSavingsBytes: Math.round(potentialSavingsBytes),
  };
}

export interface WatermarkDownloadOptions {
  watermarkEnabled?: boolean;
  excludeWatermark?: boolean;
  watermarkType?: 'text' | 'image';
  watermarkText?: string;
  watermarkImageUrl?: string;
  watermarkPosition?: 'center' | 'repeated';
  watermarkOpacity?: number;
}

function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  position: 'center' | 'repeated',
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  const fontSize = Math.max(22, Math.round(width * 0.04));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (position === 'center') {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-0.25);

    // Dark stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = Math.max(3, fontSize * 0.12);
    ctx.strokeText(text, 0, 0);

    // White text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, 0, 0);

    const subFontSize = Math.max(11, Math.round(fontSize * 0.35));
    ctx.font = `bold ${subFontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('PROTEGIDO POR PIXART STUDIOS', 0, fontSize * 0.75);

    ctx.restore();
  } else {
    // Repeated diagonal pattern
    const stepX = Math.max(240, Math.round(width * 0.25));
    const stepY = Math.max(140, Math.round(height * 0.18));
    const repFontSize = Math.max(16, Math.round(width * 0.024));
    ctx.font = `bold ${repFontSize}px sans-serif`;

    const angle = -0.45;
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = Math.max(2, repFontSize * 0.1);
        ctx.strokeText(text, 0, 0);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

async function renderWatermarkedBlob(
  imageUrl: string,
  options: WatermarkDownloadOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        const opacity = options.watermarkOpacity ?? 0.45;
        const position = options.watermarkPosition || 'center';
        const type = options.watermarkType || 'text';

        if (type === 'image' && options.watermarkImageUrl) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          wmImg.onload = () => {
            ctx.save();
            ctx.globalAlpha = opacity;
            if (position === 'center') {
              const maxW = canvas.width * 0.45;
              const maxH = canvas.height * 0.45;
              const scale = Math.min(maxW / wmImg.width, maxH / wmImg.height);
              const w = wmImg.width * scale;
              const h = wmImg.height * scale;
              const x = (canvas.width - w) / 2;
              const y = (canvas.height - h) / 2;
              ctx.drawImage(wmImg, x, y, w, h);
            } else {
              const patternCanvas = document.createElement('canvas');
              const patternSize = Math.max(160, Math.round(canvas.width * 0.15));
              const aspect = wmImg.height / wmImg.width || 1;
              patternCanvas.width = patternSize;
              patternCanvas.height = patternSize * aspect + 60;
              const pCtx = patternCanvas.getContext('2d');
              if (pCtx) {
                pCtx.drawImage(wmImg, 20, 20, patternSize - 40, (patternSize - 40) * aspect);
                const pattern = ctx.createPattern(patternCanvas, 'repeat');
                if (pattern) {
                  ctx.fillStyle = pattern;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
              }
            }
            ctx.restore();
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', 0.95);
          };
          wmImg.onerror = () => {
            drawTextWatermark(ctx, canvas.width, canvas.height, options.watermarkText || 'SOMOS PIXART', position, opacity);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', 0.95);
          };
          wmImg.src = options.watermarkImageUrl;
        } else {
          const text = (options.watermarkText || 'SOMOS PIXART').trim();
          drawTextWatermark(ctx, canvas.width, canvas.height, text, position, opacity);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', 0.95);
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageUrl;
  });
}

// Download single image directly (burns watermark if enabled and not exempt)
export async function downloadSingleImage(
  image: GalleryImage,
  type: 'high-res' | 'web-res' = 'high-res',
  watermarkOptions?: WatermarkDownloadOptions
) {
  try {
    const targetUrl = type === 'high-res' ? image.highResUrl || image.url : image.url;
    const isWatermarkOn = !!watermarkOptions?.watermarkEnabled && !image.excludeWatermark && !watermarkOptions?.excludeWatermark;
    
    let blobUrl: string;

    if (isWatermarkOn) {
      try {
        const watermarkedBlob = await renderWatermarkedBlob(targetUrl, watermarkOptions);
        blobUrl = URL.createObjectURL(watermarkedBlob);
      } catch (wmError) {
        console.warn('Canvas watermarking fell back to direct fetch', wmError);
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }
    } else {
      const response = await fetch(targetUrl);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
    }
    
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
      const userMap = new Map<string, User>();
      
      const legacyDemoEmails = [
        'sofia.valenzuela@gmail.com',
        'valeria@hautemode.es',
        'comms@nexustech.io',
        'isabella@fontanadesign.com',
        'elena@somospixart.com',
      ];

      // Start with initial users (ensures Victor Rojas, Maurely Carmona, José Luis Nava, Roberto Zanetti)
      INITIAL_USERS.forEach(u => {
        if (!legacyDemoEmails.includes(u.email.toLowerCase())) {
          userMap.set(u.email.toLowerCase(), u);
        }
      });

      // Merge saved users (excluding legacy demo users)
      parsed.forEach(u => {
        if (!u.email) return;
        const email = u.email.toLowerCase();
        if (legacyDemoEmails.includes(email)) return;
        const existing = userMap.get(email);
        userMap.set(email, { ...(existing || {}), ...u });
      });

      // Always enforce latest admin credentials and details from INITIAL_USERS
      INITIAL_USERS.filter(u => u.role === 'admin').forEach(admin => {
        userMap.set(admin.email.toLowerCase(), {
          ...(userMap.get(admin.email.toLowerCase()) || {}),
          ...admin,
        });
      });

      return Array.from(userMap.values());
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_USERS;
}

export function saveUsersToStorage(users: User[]) {
  safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function loadGalleriesFromStorage(): GallerySession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GALLERIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const legacyDemoGalIds = ['gal-wedding-1', 'gal-editorial-2', 'gal-portrait-3', 'gal-corp-4'];
        const cleaned = parsed.filter(g => 
          g && 
          !legacyDemoGalIds.includes((g.id || '').toLowerCase()) &&
          !legacyDemoGalIds.includes((g.slug || '').toLowerCase())
        );
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_GALLERIES;
}

export function saveGalleriesToStorage(galleries: GallerySession[]) {
  safeSetItem(STORAGE_KEYS.GALLERIES, JSON.stringify(galleries));
}

export function loadImagesFromStorage(): GalleryImage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Notice: Error reading cached images from storage, falling back to initial data:', e);
  }
  return INITIAL_IMAGES;
}

export function saveImagesToStorage(images: GalleryImage[]) {
  try {
    // Try saving directly if payload is reasonable
    const directPayload = JSON.stringify(images);
    if (directPayload.length < 2500000) {
      if (safeSetItem(STORAGE_KEYS.IMAGES, directPayload)) {
        return;
      }
    }

    // If payload is larger than 2.5MB or safeSetItem hit a quota, sanitize heavy data URLs (> 200KB)
    const sanitizedImages = images.map(img => {
      if (img.url && img.url.startsWith('data:') && img.url.length > 200000) {
        return {
          ...img,
          url: '',
          highResUrl: '',
        };
      }
      return img;
    });

    safeSetItem(STORAGE_KEYS.IMAGES, JSON.stringify(sanitizedImages));
  } catch (err) {
    console.warn('Notice: browser localStorage quota reached; image cache skipped. In-memory state and cloud sync remain active.', err);
  }
}

export function resetAppStorageCache() {
  try {
    localStorage.removeItem(STORAGE_KEYS.IMAGES);
    localStorage.removeItem(STORAGE_KEYS.GALLERIES);
  } catch (e) {
    console.error(e);
  }
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
  // Cap logs to the most recent 40 items in localStorage to save quota
  safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 40)));
}

export function loadNotificationsFromStorage(): AppNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Discard any phantom demo notifications or orphan entries
        return parsed.filter(n => {
          if (!n || typeof n !== 'object') return false;
          const gid = (n.galleryId || '').toLowerCase();
          if (['gal-wedding-1', 'gal-editorial-2', 'gal-portrait-3', 'gal-corp-4'].includes(gid)) {
            return false;
          }
          return true;
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotificationsToStorage(notifications: AppNotification[]) {
  // Cap notifications to latest 25 items in localStorage
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 25)));
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
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {}
  }
}

/**
 * Proactively cleans up stale or oversized caches from localStorage
 * so normal operations and branding settings have plenty of space.
 */
export function cleanupStaleStorage() {
  try {
    const imagesCache = localStorage.getItem(STORAGE_KEYS.IMAGES);
    if (imagesCache && imagesCache.length > 500000) {
      // Images cache is larger than 500KB; purge it so it doesn't starve quota
      localStorage.removeItem(STORAGE_KEYS.IMAGES);
      console.log('[SafeStorage] Proactively purged heavy image cache from localStorage to keep app fast and stable.');
    }
    // Clean up phantom demo notifications
    const notifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (notifs) {
      try {
        const parsed = JSON.parse(notifs);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(n => {
            const gid = (n.galleryId || '').toLowerCase();
            return !['gal-wedding-1', 'gal-editorial-2', 'gal-portrait-3', 'gal-corp-4'].includes(gid);
          });
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // Clean up legacy demo galleries from localStorage
    const storedGals = localStorage.getItem(STORAGE_KEYS.GALLERIES);
    if (storedGals) {
      try {
        const parsed = JSON.parse(storedGals);
        if (Array.isArray(parsed)) {
          const legacyDemoGalIds = ['gal-wedding-1', 'gal-editorial-2', 'gal-portrait-3', 'gal-corp-4'];
          const cleaned = parsed.filter(g => 
            g && 
            !legacyDemoGalIds.includes((g.id || '').toLowerCase()) && 
            !legacyDemoGalIds.includes((g.slug || '').toLowerCase())
          );
          localStorage.setItem(STORAGE_KEYS.GALLERIES, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // Clean up legacy demo users from localStorage
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          const legacyDemoEmails = [
            'sofia.valenzuela@gmail.com',
            'valeria@hautemode.es',
            'comms@nexustech.io',
            'isabella@fontanadesign.com',
            'elena@somospixart.com',
          ];
          const cleaned = parsed.filter(u => u && !legacyDemoEmails.includes((u.email || '').toLowerCase()));
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
        }
      } catch {}
    }
  } catch (e) {
    console.warn('[SafeStorage] Cleanup check notice:', e);
  }
}
