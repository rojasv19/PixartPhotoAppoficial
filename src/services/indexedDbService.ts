import { GalleryImage } from '../types';

const DB_NAME = 'SomosPixartDB';
const DB_VERSION = 1;
const STORE_NAME = 'gallery_images';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and returns a singleton instance of the native IndexedDB database.
 * IndexedDB provides multi-gigabyte client storage without the 5MB localStorage limit.
 */
export function getIndexedDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('galleryId', 'galleryId', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        store.createIndex('isFinalSelection', 'isFinalSelection', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open database:', (event.target as IDBOpenDBRequest).error);
      dbInitPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
}

/**
 * Retrieves all stored images from IndexedDB.
 */
export async function getAllImagesFromIndexedDb(): Promise<GalleryImage[]> {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as GalleryImage[]) || []);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Error fetching all images:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] getAllImagesFromIndexedDb failed:', err);
    return [];
  }
}

/**
 * Retrieves all images belonging to a specific gallery.
 */
export async function getImagesByGalleryFromIndexedDb(galleryId: string): Promise<GalleryImage[]> {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('galleryId');
      const request = index.getAll(galleryId);

      request.onsuccess = () => {
        resolve((request.result as GalleryImage[]) || []);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Error fetching images for gallery ${galleryId}:`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`[IndexedDB] getImagesByGalleryFromIndexedDb failed for ${galleryId}:`, err);
    return [];
  }
}

/**
 * Saves or updates a batch of images into IndexedDB in a single transaction.
 * Designed to handle 700+ images smoothly without freezing the UI.
 */
export async function saveImagesBatchToIndexedDb(images: GalleryImage[]): Promise<void> {
  if (!images || images.length === 0) return;
  try {
    const db = await getIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('[IndexedDB] Transaction error during batch save:', transaction.error);
        reject(transaction.error);
      };

      for (const img of images) {
        if (img && img.id) {
          if (img.url && img.url.trim() !== '') {
            store.put(img);
          } else {
            // Incoming image has empty URL: check if IndexedDB already has the image with a valid URL
            const getReq = store.get(img.id);
            getReq.onsuccess = () => {
              const existing = getReq.result as GalleryImage | undefined;
              store.put({
                ...existing,
                ...img,
                url: existing?.url || img.url || '',
                highResUrl: existing?.highResUrl || img.highResUrl || existing?.url || '',
              });
            };
          }
        }
      }
    });
  } catch (err) {
    console.error('[IndexedDB] saveImagesBatchToIndexedDb failed:', err);
  }
}

/**
 * Saves or updates a single image in IndexedDB.
 */
export async function saveImageToIndexedDb(image: GalleryImage): Promise<void> {
  return saveImagesBatchToIndexedDb([image]);
}

/**
 * Deletes a batch of image IDs from IndexedDB.
 */
export async function deleteImagesBatchFromIndexedDb(imageIds: string[]): Promise<void> {
  if (!imageIds || imageIds.length === 0) return;
  try {
    const db = await getIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        console.error('[IndexedDB] Transaction error during batch delete:', transaction.error);
        reject(transaction.error);
      };

      for (const id of imageIds) {
        store.delete(id);
      }
    });
  } catch (err) {
    console.error('[IndexedDB] deleteImagesBatchFromIndexedDb failed:', err);
  }
}

/**
 * Deletes all images belonging to a specific gallery from IndexedDB.
 */
export async function clearGalleryImagesFromIndexedDb(galleryId: string): Promise<void> {
  try {
    const existing = await getImagesByGalleryFromIndexedDb(galleryId);
    if (existing.length > 0) {
      await deleteImagesBatchFromIndexedDb(existing.map(i => i.id));
    }
  } catch (err) {
    console.error(`[IndexedDB] clearGalleryImagesFromIndexedDb failed for ${galleryId}:`, err);
  }
}

/**
 * Clears the entire images store (e.g. for development or total reset).
 */
export async function clearAllImagesFromIndexedDb(): Promise<void> {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] clearAllImagesFromIndexedDb failed:', err);
  }
}
