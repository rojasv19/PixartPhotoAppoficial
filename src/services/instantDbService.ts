import { db, tx, id, APP_ID } from '../lib/instant';
import { GalleryImage, GallerySession, User, AuditLogItem, FeedbackItem } from '../types';
import { INITIAL_USERS, INITIAL_GALLERIES, INITIAL_IMAGES, INITIAL_AUDIT_LOGS } from '../data/initialData';

export { APP_ID, db, id };

/**
 * Deterministically converts any string ID into a valid RFC 4122 UUID v4
 * for InstantDB compatibility.
 */
export function toUuid(input: string): string {
  if (!input) return '00000000-0000-4000-8000-000000000000';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    return input.toLowerCase();
  }
  let hash1 = 0x811c9dc5;
  let hash2 = 0x5b79a7c3;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ char, 0x01000193);
    hash2 = Math.imul(hash2 ^ (char + i), 0x01000193);
  }
  const h1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const h2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const combined = (h1 + h2 + h1 + h2).slice(0, 32);
  
  const p1 = combined.slice(0, 8);
  const p2 = combined.slice(8, 12);
  const p3 = '4' + combined.slice(13, 16);
  const p4 = '8' + combined.slice(17, 20);
  const p5 = combined.slice(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
}

/**
 * Checks if InstantDB needs initial seed data and populates it.
 */
export async function seedInitialDataIfEmpty(
  existingGalleriesCount: number,
  existingUsersCount: number
) {
  if (existingGalleriesCount > 0 && existingUsersCount > 0) {
    return false;
  }

  try {
    const transactions = [];

    // Seed Users
    for (const u of INITIAL_USERS) {
      const userUuid = toUuid(u.id);
      const assignedUuids = (u.assignedGalleryIds || []).map(gid => toUuid(gid));

      transactions.push(
        tx.users[userUuid].update({
          name: u.name,
          email: u.email,
          password: u.password || 'admin',
          role: u.role,
          avatar: u.avatar || '',
          phone: u.phone || '',
          company: u.company || '',
          assignedGalleryIds: assignedUuids,
          status: u.status || 'active',
          createdDate: u.createdDate || new Date().toISOString().split('T')[0],
          lastLogin: u.lastLogin || '',
          notes: u.notes || '',
          canDownloadHighRes: u.canDownloadHighRes ?? true,
          canLeaveFeedback: u.canLeaveFeedback ?? true,
          canSelectFavorites: u.canSelectFavorites ?? true,
        })
      );
    }

    // Seed Galleries
    for (const g of INITIAL_GALLERIES) {
      const galleryUuid = toUuid(g.id);
      const clientUuids = (g.clientIds || []).map(cid => toUuid(cid));
      const formattedFeedback = (g.feedbackList || []).map(fb => ({
        ...fb,
        id: toUuid(fb.id),
        galleryId: galleryUuid,
        clientId: toUuid(fb.clientId),
      }));

      transactions.push(
        tx.galleries[galleryUuid].update({
          title: g.title,
          slug: g.slug,
          subtitle: g.subtitle || '',
          clientIds: clientUuids,
          clientNames: g.clientNames || [],
          category: g.category,
          eventDate: g.eventDate,
          location: g.location,
          venueName: g.venueName || '',
          coverImage: g.coverImage,
          description: g.description,
          accessPin: g.accessPin,
          isPasswordProtected: g.isPasswordProtected ?? true,
          allowDownloadHighRes: g.allowDownloadHighRes ?? true,
          allowFeedback: g.allowFeedback ?? true,
          allowFavoritesSubmission: g.allowFavoritesSubmission ?? true,
          maxFavoritesSelection: g.maxFavoritesSelection || 45,
          status: g.status,
          viewsCount: g.viewsCount || 0,
          downloadsCount: g.downloadsCount || 0,
          favoritesSubmittedCount: g.favoritesSubmittedCount || 0,
          createdAt: g.createdAt,
          lastActivityAt: g.lastActivityAt,
          feedbackList: formattedFeedback,
        })
      );
    }

    // Seed Images
    for (const img of INITIAL_IMAGES) {
      const imageUuid = toUuid(img.id);
      const galleryUuid = toUuid(img.galleryId);
      const favUuids = (img.favoriteByUsers || []).map(uid => toUuid(uid));

      transactions.push(
        tx.images[imageUuid].update({
          galleryId: galleryUuid,
          title: img.title,
          url: img.url,
          highResUrl: img.highResUrl,
          originalFileName: img.originalFileName,
          fileSizeBytes: img.fileSizeBytes,
          compressedSizeBytes: img.compressedSizeBytes || Math.round(img.fileSizeBytes * 0.18),
          width: img.width,
          height: img.height,
          orientation: img.orientation,
          cameraModel: img.cameraModel || '',
          lens: img.lens || '',
          focalLength: img.focalLength || '',
          iso: img.iso || 100,
          shutterSpeed: img.shutterSpeed || '1/1000s',
          aperture: img.aperture || 'f/1.8',
          favoriteByUsers: favUuids,
          tags: img.tags || [],
          uploadedAt: img.uploadedAt,
          optimized: img.optimized,
          clientNote: img.clientNote || '',
        })
      );
    }

    // Seed Logs
    for (const log of INITIAL_AUDIT_LOGS) {
      const logUuid = toUuid(log.id);
      transactions.push(
        tx.logs[logUuid].update({
          timestamp: log.timestamp,
          actorName: log.actorName,
          actorRole: log.actorRole,
          action: log.action,
          details: log.details,
          galleryTitle: log.galleryTitle || '',
          iconType: log.iconType || 'security',
        })
      );
    }

    await db.transact(transactions);
    console.log('InstantDB successfully seeded with Pixart Photo data');
    return true;
  } catch (error) {
    console.error('Failed to seed InstantDB initial data:', error);
    return false;
  }
}

// InstantDB Mutation Handlers
export async function createGalleryInDb(gallery: GallerySession) {
  const galleryUuid = toUuid(gallery.id);
  const clientUuids = (gallery.clientIds || []).map(cid => toUuid(cid));

  return db.transact([
    tx.galleries[galleryUuid].update({
      title: gallery.title,
      slug: gallery.slug,
      subtitle: gallery.subtitle || '',
      clientIds: clientUuids,
      clientNames: gallery.clientNames || [],
      category: gallery.category,
      eventDate: gallery.eventDate,
      location: gallery.location,
      venueName: gallery.venueName || '',
      coverImage: gallery.coverImage,
      description: gallery.description,
      accessPin: gallery.accessPin,
      isPasswordProtected: gallery.isPasswordProtected ?? true,
      allowDownloadHighRes: gallery.allowDownloadHighRes ?? true,
      allowFeedback: gallery.allowFeedback ?? true,
      allowFavoritesSubmission: gallery.allowFavoritesSubmission ?? true,
      maxFavoritesSelection: gallery.maxFavoritesSelection || 50,
      status: gallery.status,
      viewsCount: gallery.viewsCount || 0,
      downloadsCount: gallery.downloadsCount || 0,
      favoritesSubmittedCount: gallery.favoritesSubmittedCount || 0,
      createdAt: gallery.createdAt,
      lastActivityAt: gallery.lastActivityAt,
      feedbackList: gallery.feedbackList || [],
    })
  ]);
}

export async function updateGalleryInDb(gallery: GallerySession) {
  const galleryUuid = toUuid(gallery.id);
  const clientUuids = (gallery.clientIds || []).map(cid => toUuid(cid));

  return db.transact([
    tx.galleries[galleryUuid].update({
      title: gallery.title,
      slug: gallery.slug,
      subtitle: gallery.subtitle || '',
      clientIds: clientUuids,
      clientNames: gallery.clientNames || [],
      category: gallery.category,
      eventDate: gallery.eventDate,
      location: gallery.location,
      venueName: gallery.venueName || '',
      coverImage: gallery.coverImage,
      description: gallery.description,
      accessPin: gallery.accessPin,
      isPasswordProtected: gallery.isPasswordProtected,
      allowDownloadHighRes: gallery.allowDownloadHighRes,
      allowFeedback: gallery.allowFeedback,
      allowFavoritesSubmission: gallery.allowFavoritesSubmission,
      maxFavoritesSelection: gallery.maxFavoritesSelection,
      status: gallery.status,
      viewsCount: gallery.viewsCount,
      downloadsCount: gallery.downloadsCount,
      favoritesSubmittedCount: gallery.favoritesSubmittedCount,
      createdAt: gallery.createdAt,
      lastActivityAt: gallery.lastActivityAt,
      feedbackList: gallery.feedbackList || [],
    })
  ]);
}

export async function deleteGalleryInDb(galleryId: string, relatedImageIds: string[] = []) {
  const galleryUuid = toUuid(galleryId);
  const mutations = [tx.galleries[galleryUuid].delete()];
  for (const imgId of relatedImageIds) {
    mutations.push(tx.images[toUuid(imgId)].delete());
  }
  return db.transact(mutations);
}

export async function createUserInDb(user: User) {
  const userUuid = toUuid(user.id);
  const assignedUuids = (user.assignedGalleryIds || []).map(gid => toUuid(gid));

  return db.transact([
    tx.users[userUuid].update({
      name: user.name,
      email: user.email,
      password: user.password || 'admin',
      role: user.role,
      avatar: user.avatar || '',
      phone: user.phone || '',
      company: user.company || '',
      assignedGalleryIds: assignedUuids,
      status: user.status,
      createdDate: user.createdDate,
      lastLogin: user.lastLogin || '',
      notes: user.notes || '',
      canDownloadHighRes: user.canDownloadHighRes ?? true,
      canLeaveFeedback: user.canLeaveFeedback ?? true,
      canSelectFavorites: user.canSelectFavorites ?? true,
    })
  ]);
}

export async function updateUserInDb(user: User) {
  const userUuid = toUuid(user.id);
  const assignedUuids = (user.assignedGalleryIds || []).map(gid => toUuid(gid));

  return db.transact([
    tx.users[userUuid].update({
      name: user.name,
      email: user.email,
      password: user.password || 'admin',
      role: user.role,
      avatar: user.avatar || '',
      phone: user.phone || '',
      company: user.company || '',
      assignedGalleryIds: assignedUuids,
      status: user.status,
      createdDate: user.createdDate,
      lastLogin: user.lastLogin || '',
      notes: user.notes || '',
      canDownloadHighRes: user.canDownloadHighRes,
      canLeaveFeedback: user.canLeaveFeedback,
      canSelectFavorites: user.canSelectFavorites,
    })
  ]);
}

export async function deleteUserInDb(userId: string) {
  return db.transact([tx.users[toUuid(userId)].delete()]);
}

export async function uploadImageToDb(image: GalleryImage) {
  const imageUuid = toUuid(image.id);
  const galleryUuid = toUuid(image.galleryId);
  const favUuids = (image.favoriteByUsers || []).map(uid => toUuid(uid));

  return db.transact([
    tx.images[imageUuid].update({
      galleryId: galleryUuid,
      title: image.title,
      url: image.url,
      highResUrl: image.highResUrl,
      originalFileName: image.originalFileName,
      fileSizeBytes: image.fileSizeBytes,
      compressedSizeBytes: image.compressedSizeBytes || Math.round(image.fileSizeBytes * 0.18),
      width: image.width,
      height: image.height,
      orientation: image.orientation,
      cameraModel: image.cameraModel || '',
      lens: image.lens || '',
      focalLength: image.focalLength || '',
      iso: image.iso || 100,
      shutterSpeed: image.shutterSpeed || '1/1000s',
      aperture: image.aperture || 'f/1.8',
      favoriteByUsers: favUuids,
      tags: image.tags || [],
      uploadedAt: image.uploadedAt,
      optimized: image.optimized,
      clientNote: image.clientNote || '',
    })
  ]);
}

export async function updateImageInDb(image: GalleryImage) {
  const imageUuid = toUuid(image.id);
  const galleryUuid = toUuid(image.galleryId);
  const favUuids = (image.favoriteByUsers || []).map(uid => toUuid(uid));

  return db.transact([
    tx.images[imageUuid].update({
      galleryId: galleryUuid,
      title: image.title,
      url: image.url,
      highResUrl: image.highResUrl,
      originalFileName: image.originalFileName,
      fileSizeBytes: image.fileSizeBytes,
      compressedSizeBytes: image.compressedSizeBytes || Math.round(image.fileSizeBytes * 0.18),
      width: image.width,
      height: image.height,
      orientation: image.orientation,
      cameraModel: image.cameraModel || '',
      lens: image.lens || '',
      focalLength: image.focalLength || '',
      iso: image.iso || 100,
      shutterSpeed: image.shutterSpeed || '1/1000s',
      aperture: image.aperture || 'f/1.8',
      favoriteByUsers: favUuids,
      tags: image.tags || [],
      uploadedAt: image.uploadedAt,
      optimized: image.optimized,
      clientNote: image.clientNote || '',
    })
  ]);
}

export async function deleteImageFromDb(imageId: string) {
  return db.transact([tx.images[toUuid(imageId)].delete()]);
}

export async function toggleImageFavoriteInDb(
  imageId: string, 
  userId: string, 
  currentFavorites: string[]
) {
  const imageUuid = toUuid(imageId);
  const userUuid = toUuid(userId);
  const currentFavUuids = currentFavorites.map(u => toUuid(u));
  const isFav = currentFavUuids.includes(userUuid);
  const updatedFavorites = isFav 
    ? currentFavUuids.filter(uid => uid !== userUuid) 
    : [...currentFavUuids, userUuid];

  return db.transact([
    tx.images[imageUuid].update({
      favoriteByUsers: updatedFavorites,
    })
  ]);
}

export async function addFeedbackToDb(
  galleryId: string,
  newFeedback: FeedbackItem,
  currentFeedbackList: FeedbackItem[],
  favoriteCountAtTime?: number
) {
  const galleryUuid = toUuid(galleryId);
  const updatedList = [newFeedback, ...(currentFeedbackList || [])];
  return db.transact([
    tx.galleries[galleryUuid].update({
      feedbackList: updatedList,
      favoritesSubmittedCount: favoriteCountAtTime !== undefined ? favoriteCountAtTime : undefined,
      lastActivityAt: new Date().toISOString().split('T')[0],
    })
  ]);
}

export async function replyFeedbackInDb(
  galleryId: string,
  feedbackId: string,
  replyText: string,
  currentFeedbackList: FeedbackItem[]
) {
  const galleryUuid = toUuid(galleryId);
  const updatedList = (currentFeedbackList || []).map(f => {
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

  return db.transact([
    tx.galleries[galleryUuid].update({
      feedbackList: updatedList,
      lastActivityAt: new Date().toISOString().split('T')[0],
    })
  ]);
}

export async function batchOptimizeImagesInDb(images: GalleryImage[]) {
  const mutations = images.map(img => 
    tx.images[toUuid(img.id)].update({
      optimized: true,
      compressedSizeBytes: Math.round(img.fileSizeBytes * 0.18),
    })
  );
  return db.transact(mutations);
}

export async function addAuditLogInDb(log: AuditLogItem) {
  const logUuid = toUuid(log.id);
  return db.transact([
    tx.logs[logUuid].update({
      timestamp: log.timestamp,
      actorName: log.actorName,
      actorRole: log.actorRole,
      action: log.action,
      details: log.details,
      galleryTitle: log.galleryTitle || '',
      iconType: log.iconType || 'upload',
    })
  ]);
}
