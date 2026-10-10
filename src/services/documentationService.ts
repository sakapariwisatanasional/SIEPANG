/**
 * @license
 * SiEpang - Documentation Service
 * Canonical MediaPublications persistence.
 */
import {
  MediaItem,
  PhotoAlbum,
  MediaPublicationStatus,
  MediaAccessStatus,
  DownloadControlMode,
} from '../types';
import { mediaResolverService } from './mediaResolverService';
import { eventService } from './eventService';
import { adminPersistenceService } from './adminPersistenceService';

class DocumentationService {
  private albums: Map<string, PhotoAlbum> = new Map();
  private mediaItems: Map<string, MediaItem> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    const rows = await adminPersistenceService.list<any>('mediaPublications');
    this.albums.clear();
    this.mediaItems.clear();

    rows.forEach((r: any) => {
      if (String(r.media_type || '').toUpperCase() === 'ALBUM') {
        const album: PhotoAlbum = {
          ...r,
          album_id: String(r.album_id || r.id || ''),
          workspace_id: String(r.workspace_id || ''),
          event_id: String(r.event_id || ''),
          album_name: String(r.album_title || r.album_name || ''),
          description: String(r.description || ''),
          source_folder_url: String(r.source_folder_url || ''),
          cover_image_url: String(r.cover_image_url || ''),
          folder_access_status: (r.folder_access_status || r.sync_status || 'ACCESSIBLE') as MediaAccessStatus,
          photo_count: Number(r.photo_count || 0),
          display_order: Number(r.display_order || 0),
          publication_status: (r.publication_status || 'PUBLISHED') as MediaPublicationStatus,
          created_at: String(r.published_at || r.created_at || ''),
        } as PhotoAlbum;
        this.albums.set(album.album_id, album);
      } else {
        const item: MediaItem = {
          ...r,
          media_id: String(r.id || r.media_id || ''),
          event_id: String(r.event_id || ''),
          album_id: String(r.album_id || ''),
          media_type: (r.media_type || 'PHOTO') as any,
          provider: r.provider || r.source_provider || 'DIRECT_URL',
          source_type: r.source_type || r.source_provider || 'DIRECT_URL',
          source_url: r.source_url || r.media_url || '',
          provider_resource_id: r.provider_resource_id || r.drive_file_id || r.youtube_video_id || '',
          thumbnail_url: r.thumbnail_url || '',
          original_url: r.original_url || r.media_url || '',
          title: r.title || '',
          caption: r.caption || '',
          event_date: r.event_date || '',
          display_order: Number(r.display_order || 0),
          publication_status: (r.publication_status || 'PUBLISHED') as MediaPublicationStatus,
          metadata_status: r.metadata_status || r.sync_status || 'ACCESSIBLE',
          download_control: r.download_control || 'VIEW_ONLY',
          created_at: r.published_at || r.created_at || '',
        } as MediaItem;
        this.mediaItems.set(item.media_id, item);
      }
    });

    this.notify();
  }

  public getAlbums(filterStatus?: MediaPublicationStatus): PhotoAlbum[] {
    let list = Array.from(this.albums.values());
    if (filterStatus) list = list.filter(a => a.publication_status === filterStatus);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public getAlbumById(id: string): PhotoAlbum | undefined {
    return this.albums.get(id);
  }

  private albumRecord(album: Partial<PhotoAlbum> & Record<string, any>): any {
    return {
      id: album.album_id || album.id || undefined,
      album_id: album.album_id || album.id || undefined,
      album_title: album.album_name || album.album_title || '',
      media_type: 'ALBUM',
      source_provider: 'GOOGLE_DRIVE',
      drive_folder_id: album.drive_folder_id || '',
      media_url: album.source_folder_url || '',
      source_folder_url: album.source_folder_url || '',
      cover_image_url: album.cover_image_url || '',
      description: album.description || '',
      publication_status: album.publication_status || 'PUBLISHED',
      sync_status: album.folder_access_status || 'ACCESSIBLE',
      folder_access_status: album.folder_access_status || 'ACCESSIBLE',
      photo_count: Number(album.photo_count || 0),
      display_order: Number(album.display_order || 0),
      published_at: album.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async createAlbum(data: {
    album_name: string;
    description?: string;
    source_folder_url?: string;
    cover_image_url?: string;
    publication_status?: MediaPublicationStatus;
    createdBy?: string;
  }): Promise<PhotoAlbum> {
    let accessStatus: MediaAccessStatus = 'ACCESSIBLE';
    let folderId = '';
    if (data.source_folder_url) {
      const val = mediaResolverService.validateDriveFolder(data.source_folder_url);
      accessStatus = val.status;
      folderId = val.resolvedFolderId || '';
    }

    const saved = await adminPersistenceService.upsert<any>('mediaPublications', this.albumRecord({
      album_name: data.album_name.trim(),
      description: data.description?.trim(),
      source_folder_url: data.source_folder_url?.trim(),
      cover_image_url: data.cover_image_url || '',
      folder_access_status: accessStatus,
      drive_folder_id: folderId,
      photo_count: 0,
      display_order: this.albums.size + 1,
      publication_status: data.publication_status || 'PUBLISHED',
      created_at: new Date().toISOString(),
    } as any));

    const album: PhotoAlbum = {
      ...saved,
      album_id: saved.album_id || saved.id,
      album_name: saved.album_title || data.album_name,
      description: saved.description || '',
      source_folder_url: saved.source_folder_url || '',
      cover_image_url: saved.cover_image_url || '',
      folder_access_status: saved.folder_access_status || accessStatus,
      photo_count: Number(saved.photo_count || 0),
      display_order: Number(saved.display_order || this.albums.size + 1),
      publication_status: saved.publication_status || 'PUBLISHED',
      created_at: saved.published_at || new Date().toISOString(),
    } as PhotoAlbum;

    this.albums.set(album.album_id, album);
    this.notify();
    return album;
  }

  public async syncAlbumDriveFolder(albumId: string, _syncedBy?: string): Promise<{
    addedCount: number;
    updatedCount: number;
    totalCount: number;
    accessStatus: MediaAccessStatus;
    message: string;
  }> {
    const album = this.albums.get(albumId);
    if (!album) throw new Error('Album tidak ditemukan.');
    if (!album.source_folder_url) throw new Error('Album belum memiliki folder Google Drive.');

    const validation = mediaResolverService.validateDriveFolder(album.source_folder_url);
    if (validation.status !== 'ACCESSIBLE') {
      await this.updateAlbum(albumId, { folder_access_status: validation.status });
      return {
        addedCount: 0, updatedCount: 0, totalCount: album.photo_count,
        accessStatus: validation.status,
        message: 'Folder tidak dapat diakses.',
      };
    }

    const resolved = mediaResolverService.resolveDriveFolderPhotos(
      validation.resolvedFolderId || albumId,
      album.source_folder_url
    );

    let addedCount = 0;
    let updatedCount = 0;
    for (const photo of resolved) {
      const existing = Array.from(this.mediaItems.values()).find(m =>
        m.album_id === albumId && m.provider_resource_id === photo.provider_resource_id
      );
      if (existing) {
        await this.updateMedia(existing.media_id, {
          source_url: photo.source_url,
          thumbnail_url: photo.thumbnail_url,
          title: photo.title,
          caption: photo.caption,
          event_date: photo.event_date,
          metadata_status: 'ACCESSIBLE',
        } as any);
        updatedCount++;
      } else {
        await this.addPhoto({
          album_id: albumId,
          source_url: photo.source_url,
          title: photo.title || 'Foto Dokumentasi',
          caption: photo.caption,
          event_date: photo.event_date,
        });
        addedCount++;
      }
    }

    const totalCount = this.getMediaItems({ type: 'PHOTO', albumId }).length;
    await this.updateAlbum(albumId, {
      photo_count: totalCount,
      folder_access_status: 'ACCESSIBLE',
      cover_image_url: album.cover_image_url || resolved[0]?.thumbnail_url || '',
    } as any);

    return {
      addedCount, updatedCount, totalCount,
      accessStatus: 'ACCESSIBLE',
      message: `Sinkronisasi berhasil: ${addedCount} foto baru, ${updatedCount} diperbarui. Total ${totalCount}.`,
    };
  }

  public async updateAlbum(id: string, updates: Partial<PhotoAlbum>): Promise<PhotoAlbum> {
    const current = this.albums.get(id);
    if (!current) throw new Error('Album tidak ditemukan.');
    if (updates.source_folder_url && updates.source_folder_url !== current.source_folder_url) {
      updates.folder_access_status = mediaResolverService.validateDriveFolder(updates.source_folder_url).status;
    }
    const saved = await adminPersistenceService.upsert<any>(
      'mediaPublications',
      this.albumRecord({ ...current, ...updates, album_id: id } as any)
    );
    const next = { ...current, ...updates, ...saved, album_id: id } as PhotoAlbum;
    this.albums.set(id, next);
    this.notify();
    return next;
  }

  public async deleteAlbum(id: string): Promise<boolean> {
    if (!this.albums.has(id)) return false;
    await adminPersistenceService.archive('mediaPublications', id, { publication_status: 'ARCHIVED' });
    for (const item of this.getMediaItems({ albumId: id })) {
      await this.deleteMedia(item.media_id);
    }
    this.albums.delete(id);
    this.notify();
    return true;
  }

  public getMediaItems(options?: {
    type?: 'PHOTO' | 'VIDEO';
    albumId?: string;
    publicationStatus?: MediaPublicationStatus;
  }): MediaItem[] {
    let list = Array.from(this.mediaItems.values());
    if (options?.type) list = list.filter(m => m.media_type === options.type);
    if (options?.albumId) list = list.filter(m => m.album_id === options.albumId);
    if (options?.publicationStatus) list = list.filter(m => m.publication_status === options.publicationStatus);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public getMediaById(id: string): MediaItem | undefined {
    return this.mediaItems.get(id);
  }

  private mediaRecord(item: Partial<MediaItem> & Record<string, any>): any {
    return {
      id: item.media_id || item.id || undefined,
      album_id: item.album_id || '',
      album_title: this.albums.get(item.album_id || '')?.album_name || '',
      media_type: item.media_type || 'PHOTO',
      source_provider: item.provider || item.source_type || 'DIRECT_URL',
      drive_folder_id: item.drive_folder_id || '',
      drive_file_id: item.provider === 'GOOGLE_DRIVE' ? item.provider_resource_id || '' : '',
      youtube_video_id: item.provider === 'YOUTUBE' ? item.provider_resource_id || '' : '',
      media_url: item.source_url || item.original_url || '',
      publication_status: item.publication_status || 'PUBLISHED',
      sync_status: item.metadata_status || 'ACCESSIBLE',
      published_at: item.created_at || new Date().toISOString(),
      provider: item.provider || '',
      source_type: item.source_type || '',
      source_url: item.source_url || '',
      provider_resource_id: item.provider_resource_id || '',
      thumbnail_url: item.thumbnail_url || '',
      original_url: item.original_url || '',
      title: item.title || '',
      caption: item.caption || '',
      event_date: item.event_date || '',
      display_order: Number(item.display_order || 0),
      metadata_status: item.metadata_status || 'ACCESSIBLE',
      download_control: item.download_control || 'VIEW_ONLY',
      duration: item.duration || '',
      can_embed: Boolean(item.can_embed),
      embed_url: item.embed_url || '',
      views_count: Number(item.views_count || 0),
      plays_count: Number(item.plays_count || 0),
      updated_at: new Date().toISOString(),
    };
  }

  private recordToMedia(r: any): MediaItem {
    return {
      ...r,
      media_id: r.id,
      provider: r.provider || r.source_provider || 'DIRECT_URL',
      source_type: r.source_type || r.source_provider || 'DIRECT_URL',
      source_url: r.source_url || r.media_url || '',
      publication_status: r.publication_status || 'PUBLISHED',
      metadata_status: r.metadata_status || r.sync_status || 'ACCESSIBLE',
      display_order: Number(r.display_order || 0),
    } as MediaItem;
  }

  public async addPhoto(data: {
    album_id: string;
    source_url: string;
    title: string;
    caption?: string;
    event_date?: string;
    thumbnail_override?: string;
    download_control?: DownloadControlMode;
    publication_status?: MediaPublicationStatus;
    createdBy?: string;
  }): Promise<MediaItem> {
    const resolution = mediaResolverService.resolveSource(data.source_url);
    const saved = await adminPersistenceService.upsert<any>('mediaPublications', this.mediaRecord({
      album_id: data.album_id,
      media_type: 'PHOTO',
      provider: resolution.provider,
      source_type: resolution.sourceType,
      source_url: data.source_url,
      provider_resource_id: resolution.providerResourceId,
      thumbnail_url: data.thumbnail_override || resolution.thumbnailUrl,
      original_url: data.source_url,
      title: data.title.trim(),
      caption: data.caption?.trim(),
      event_date: data.event_date || new Date().toISOString().slice(0, 10),
      display_order: this.mediaItems.size + 1,
      publication_status: data.publication_status || 'PUBLISHED',
      metadata_status: resolution.accessStatus,
      download_control: data.download_control || 'ALLOW_ORIGINAL_LINK',
      created_at: new Date().toISOString(),
    } as any));
    const item = this.recordToMedia(saved);
    this.mediaItems.set(item.media_id, item);
    this.notify();
    return item;
  }

  public async addVideo(data: {
    source_url: string;
    title: string;
    description?: string;
    event_date?: string;
    thumbnail_override?: string;
    duration?: string;
    publication_status?: MediaPublicationStatus;
    createdBy?: string;
  }): Promise<MediaItem> {
    const resolution = mediaResolverService.resolveSource(data.source_url);
    const saved = await adminPersistenceService.upsert<any>('mediaPublications', this.mediaRecord({
      media_type: 'VIDEO',
      provider: resolution.provider,
      source_type: resolution.sourceType,
      source_url: data.source_url,
      provider_resource_id: resolution.providerResourceId,
      thumbnail_url: data.thumbnail_override || resolution.thumbnailUrl,
      original_url: data.source_url,
      title: data.title.trim(),
      caption: data.description?.trim(),
      event_date: data.event_date || new Date().toISOString().slice(0, 10),
      display_order: this.mediaItems.size + 1,
      publication_status: data.publication_status || 'PUBLISHED',
      metadata_status: resolution.accessStatus,
      download_control: 'VIEW_ONLY',
      duration: data.duration || '03:00',
      can_embed: resolution.canEmbed,
      embed_url: resolution.embedUrl,
      created_at: new Date().toISOString(),
    } as any));
    const item = this.recordToMedia(saved);
    this.mediaItems.set(item.media_id, item);
    this.notify();
    return item;
  }

  public async updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const current = this.mediaItems.get(id);
    if (!current) throw new Error('Item media tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('mediaPublications', this.mediaRecord({
      ...current, ...updates, media_id: id
    } as any));
    const next = this.recordToMedia(saved);
    this.mediaItems.set(id, next);
    this.notify();
    return next;
  }

  public async deleteMedia(id: string): Promise<boolean> {
    const current = this.mediaItems.get(id);
    if (!current) return false;
    await adminPersistenceService.archive('mediaPublications', id, { publication_status: 'ARCHIVED' });
    this.mediaItems.delete(id);
    this.notify();
    return true;
  }

  public refreshMediaMetadata(mediaId?: string): { refreshedCount: number; brokenCount: number } {
    const list = mediaId
      ? [this.mediaItems.get(mediaId)].filter(Boolean) as MediaItem[]
      : Array.from(this.mediaItems.values());
    let broken = 0;
    list.forEach(item => {
      const resolution = mediaResolverService.resolveSource(item.source_url);
      item.metadata_status = resolution.accessStatus;
      if (resolution.accessStatus !== 'ACCESSIBLE') broken++;
      if (resolution.thumbnailUrl) item.thumbnail_url = resolution.thumbnailUrl;
      if (resolution.embedUrl) {
        item.embed_url = resolution.embedUrl;
        item.can_embed = resolution.canEmbed;
      }
    });
    this.notify();
    return { refreshedCount: list.length, brokenCount: broken };
  }

  public recordMediaInteraction(id: string, type: 'VIEW' | 'PLAY'): void {
    const item = this.mediaItems.get(id);
    if (!item) return;
    if (type === 'VIEW') item.views_count = (item.views_count || 0) + 1;
    if (type === 'PLAY') item.plays_count = (item.plays_count || 0) + 1;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const documentationService = new DocumentationService();
