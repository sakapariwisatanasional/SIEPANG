/**
 * @license
 * SiEpang - Canonical Profile Photo Service
 * Metadata -> ParticipantDocuments, image bytes -> customer Google Drive.
 */
import {
  ProfilePhotoRecord,
  ProfilePhotoStatus,
  PhotoEntityType,
  PhotoRequiredConfig,
  PhotoRequiredPolicy,
  PhotoReplacementPolicy,
} from '../types';
import { adminPersistenceService } from './adminPersistenceService';
import { apiTransport } from './apiTransport';

const DEFAULT_REQUIRED_CONFIG: PhotoRequiredConfig = {
  PARTICIPANT: 'REQUIRED',
  OFFICIAL: 'REQUIRED',
  COMMITTEE: 'OPTIONAL',
  JUDGE: 'REQUIRED',
};
const DEFAULT_REPLACEMENT_POLICY: PhotoReplacementPolicy = 'REQUIRE_REAPPROVAL';

export class ProfilePhotoService {
  private records: ProfilePhotoRecord[] = [];
  private requiredConfig: PhotoRequiredConfig = { ...DEFAULT_REQUIRED_CONFIG };
  private replacementPolicy: PhotoReplacementPolicy = DEFAULT_REPLACEMENT_POLICY;
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  private normalize(row: any): ProfilePhotoRecord {
    return {
      ...row,
      id: String(row.id || ''),
      entity_type: (row.entity_type || 'PARTICIPANT') as PhotoEntityType,
      entity_id: String(row.entity_id || row.participant_id || ''),
      entity_name: String(row.entity_name || ''),
      profile_photo_file_id: String(row.profile_photo_file_id || row.drive_file_id || ''),
      profile_photo_url: String(row.profile_photo_url || row.public_render_url || ''),
      thumbnail_url: String(row.thumbnail_url || row.public_render_url || ''),
      profile_photo_status: (row.profile_photo_status || row.verification_status || 'NOT_UPLOADED') as ProfilePhotoStatus,
      width: Number(row.width || 512),
      height: Number(row.height || 512),
      file_size_bytes: Number(row.file_size_bytes || 0),
      uploaded_at: row.uploaded_at || '',
      uploaded_by: row.uploaded_by || '',
      verified_at: row.verified_at || undefined,
      verified_by: row.verified_by || undefined,
      rejection_reason: row.rejection_reason || row.notes || undefined,
    } as ProfilePhotoRecord;
  }

  public async refreshFromBackend(): Promise<void> {
    const [rows, required, replacement] = await Promise.all([
      adminPersistenceService.list<any>('profilePhotos', { document_type: 'PROFILE_PHOTO' }),
      adminPersistenceService.getConfig<PhotoRequiredConfig>('PROFILE_PHOTO_REQUIRED_CONFIG'),
      adminPersistenceService.getConfig<PhotoReplacementPolicy>('PROFILE_PHOTO_REPLACEMENT_POLICY'),
    ]);
    this.records = rows.map(r => this.normalize(r));
    if (required) this.requiredConfig = { ...DEFAULT_REQUIRED_CONFIG, ...required };
    if (replacement) this.replacementPolicy = replacement;
    this.notify();
  }

  public getRequiredConfig(): PhotoRequiredConfig {
    return { ...this.requiredConfig };
  }

  public async setRequiredConfig(config: Partial<PhotoRequiredConfig>): Promise<void> {
    const next = { ...this.requiredConfig, ...config };
    await adminPersistenceService.setConfig('PROFILE_PHOTO_REQUIRED_CONFIG', next);
    this.requiredConfig = next;
    this.notify();
  }

  public isPhotoRequired(entityType: PhotoEntityType): boolean {
    return this.requiredConfig[entityType] === 'REQUIRED';
  }

  public getReplacementPolicy(): PhotoReplacementPolicy {
    return this.replacementPolicy;
  }

  public async setReplacementPolicy(policy: PhotoReplacementPolicy): Promise<void> {
    await adminPersistenceService.setConfig('PROFILE_PHOTO_REPLACEMENT_POLICY', policy);
    this.replacementPolicy = policy;
    this.notify();
  }

  public isSubmissionAllowed(entityType: PhotoEntityType, photoStatus?: ProfilePhotoStatus): boolean {
    if (!this.isPhotoRequired(entityType)) return true;
    return photoStatus === 'UPLOADED' || photoStatus === 'VALID';
  }

  public getPhotoByEntity(entityType: PhotoEntityType, entityId: string): ProfilePhotoRecord | undefined {
    return this.records.find(r => r.entity_type === entityType && r.entity_id === entityId);
  }

  public getPhotoById(id: string): ProfilePhotoRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  public getAllPhotos(filters?: {
    entity_type?: PhotoEntityType;
    status?: ProfilePhotoStatus;
    search?: string;
  }): ProfilePhotoRecord[] {
    let list = [...this.records];
    if (filters?.entity_type) list = list.filter(r => r.entity_type === filters.entity_type);
    if (filters?.status) list = list.filter(r => r.profile_photo_status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r =>
        r.entity_name.toLowerCase().includes(q) ||
        r.entity_id.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public async uploadPhoto(params: {
    entity_type: PhotoEntityType;
    entity_id: string;
    entity_name: string;
    data_url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    file_size_bytes?: number;
    uploader_name?: string;
  }): Promise<ProfilePhotoRecord> {
    const res = await apiTransport.send<{ record: any }>(
      'admin.profilePhoto.upload',
      {
        ...params,
        file_name: `${params.entity_type.toLowerCase()}_${params.entity_id}_${Date.now()}.webp`,
      },
      { timeoutMs: 60000 }
    );

    if (!res.ok || !res.data?.record) {
      throw new Error(res.error?.message || 'Foto profil gagal diunggah.');
    }

    const item = this.normalize(res.data.record);
    const idx = this.records.findIndex(r =>
      r.entity_type === item.entity_type && r.entity_id === item.entity_id
    );
    if (idx >= 0) this.records[idx] = item;
    else this.records.unshift(item);
    this.notify();
    return item;
  }

  public async approvePhoto(id: string, verifiedBy = 'Administrator'): Promise<ProfilePhotoRecord> {
    const current = this.getPhotoById(id);
    if (!current) throw new Error('Foto profil tidak ditemukan');

    const saved = await adminPersistenceService.upsert<any>('profilePhotos', {
      ...current,
      id,
      participant_id: current.entity_id,
      document_type: 'PROFILE_PHOTO',
      drive_file_id: (current as any).profile_photo_file_id || (current as any).drive_file_id || '',
      verification_status: 'VALID',
      profile_photo_status: 'VALID',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      notes: '',
    });

    const item = this.normalize(saved);
    this.records[this.records.findIndex(r => r.id === id)] = item;
    this.notify();
    return item;
  }

  public async rejectPhoto(id: string, reason: string, verifiedBy = 'Administrator'): Promise<ProfilePhotoRecord> {
    const current = this.getPhotoById(id);
    if (!current) throw new Error('Foto profil tidak ditemukan');

    const saved = await adminPersistenceService.upsert<any>('profilePhotos', {
      ...current,
      id,
      participant_id: current.entity_id,
      document_type: 'PROFILE_PHOTO',
      drive_file_id: (current as any).profile_photo_file_id || (current as any).drive_file_id || '',
      verification_status: 'REJECTED',
      profile_photo_status: 'REJECTED',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      rejection_reason: reason,
      notes: reason,
    });

    const item = this.normalize(saved);
    this.records[this.records.findIndex(r => r.id === id)] = item;
    this.notify();
    return item;
  }

  public async requestReupload(id: string, reason = 'Foto perlu diganti'): Promise<ProfilePhotoRecord> {
    const current = this.getPhotoById(id);
    if (!current) throw new Error('Foto profil tidak ditemukan');
    const saved = await adminPersistenceService.upsert<any>('profilePhotos', {
      ...current,
      id,
      participant_id: current.entity_id,
      document_type: 'PROFILE_PHOTO',
      verification_status: 'NEEDS_REPLACEMENT',
      profile_photo_status: 'NEEDS_REPLACEMENT',
      notes: reason,
      rejection_reason: reason,
    });
    const item = this.normalize(saved);
    this.records[this.records.findIndex(r => r.id === id)] = item;
    this.notify();
    return item;
  }

  public async deletePhoto(id: string): Promise<void> {
    await adminPersistenceService.archive('profilePhotos', id, {
      verification_status: 'ARCHIVED',
      profile_photo_status: 'NOT_UPLOADED',
    });
    this.records = this.records.filter(r => r.id !== id);
    this.notify();
  }

  public checkMissingPhotos(
    entities: Array<{ id: string; name: string; entity_type: PhotoEntityType }>
  ): Array<{ id: string; name: string; entity_type: PhotoEntityType }> {
    return entities.filter(entity =>
      this.isPhotoRequired(entity.entity_type) &&
      !this.records.some(r =>
        r.entity_type === entity.entity_type &&
        r.entity_id === entity.id &&
        ['UPLOADED', 'VALID'].includes(r.profile_photo_status)
      )
    );
  }

  public getPlaceholderUrl(_entityType?: PhotoEntityType): string {
    return '/icon-512.png';
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const profilePhotoService = new ProfilePhotoService();
