import { init, tx, id, i } from '@instantdb/react';
import { GalleryImage, GallerySession, User, AuditLogItem } from '../types';

export const APP_ID = 'a95fc02f-2926-48be-9e26-47f7a720b1bd';

const _schema = i.schema({
  entities: {
    galleries: i.entity({
      title: i.string(),
      slug: i.string(),
      subtitle: i.string().optional(),
      category: i.string(),
      eventDate: i.string(),
      location: i.string(),
      venueName: i.string().optional(),
      coverImage: i.string(),
      description: i.string(),
      accessPin: i.string(),
      isPasswordProtected: i.boolean().optional(),
      allowDownloadHighRes: i.boolean().optional(),
      allowFeedback: i.boolean().optional(),
      allowFavoritesSubmission: i.boolean().optional(),
      maxFavoritesSelection: i.number().optional(),
      status: i.string(),
      viewsCount: i.number().optional(),
      downloadsCount: i.number().optional(),
      favoritesSubmittedCount: i.number().optional(),
      createdAt: i.string(),
      lastActivityAt: i.string(),
      clientIds: i.json<string[]>().optional(),
      clientNames: i.json<string[]>().optional(),
      feedbackList: i.json<any[]>().optional(),
    }),
    images: i.entity({
      galleryId: i.string(),
      title: i.string(),
      url: i.string(),
      highResUrl: i.string(),
      originalFileName: i.string(),
      fileSizeBytes: i.number(),
      compressedSizeBytes: i.number().optional(),
      width: i.number(),
      height: i.number(),
      orientation: i.string(),
      cameraModel: i.string().optional(),
      lens: i.string().optional(),
      focalLength: i.string().optional(),
      iso: i.number().optional(),
      shutterSpeed: i.string().optional(),
      aperture: i.string().optional(),
      favoriteByUsers: i.json<string[]>().optional(),
      tags: i.json<string[]>().optional(),
      uploadedAt: i.string(),
      optimized: i.boolean(),
      clientNote: i.string().optional(),
    }),
    users: i.entity({
      name: i.string(),
      email: i.string(),
      password: i.string().optional(),
      role: i.string(),
      avatar: i.string().optional(),
      phone: i.string().optional(),
      company: i.string().optional(),
      assignedGalleryIds: i.json<string[]>().optional(),
      status: i.string(),
      createdDate: i.string(),
      lastLogin: i.string().optional(),
      notes: i.string().optional(),
      canDownloadHighRes: i.boolean().optional(),
      canLeaveFeedback: i.boolean().optional(),
      canSelectFavorites: i.boolean().optional(),
    }),
    logs: i.entity({
      timestamp: i.string(),
      actorName: i.string(),
      actorRole: i.string(),
      action: i.string(),
      details: i.string(),
      galleryTitle: i.string().optional(),
      iconType: i.string().optional(),
    }),
  },
});

type AppSchema = typeof _schema;

export const db = init<AppSchema>({ appId: APP_ID, schema: _schema });
export { tx, id };
