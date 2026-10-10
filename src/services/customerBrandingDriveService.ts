/**
 * @license
 * SiEpang - Customer Branding Drive Service
 * Canonical BrandingAssets + FeatureConfigs persistence.
 */
import {
  CustomerDriveFolderStructure,
  CustomerBrandingAsset,
  BrandingAssetType,
  BrandingValidationResult,
  BrandingHealthReport,
} from '../types';
import { mediaResolverService } from './mediaResolverService';
import { adminPersistenceService } from './adminPersistenceService';

const EMPTY_DRIVE_STRUCTURE: CustomerDriveFolderStructure = {
  root_drive_folder_id: '',
  database_folder_id: '',
  branding_folder_id: '',
  app_logo_folder_id: '',
  favicon_folder_id: '',
  event_logo_folder_id: '',
  hero_folder_id: '',
  documents_folder_id: '',
  certificates_folder_id: '',
  id_cards_folder_id: '',
  backup_folder_id: '',
  assets_folder_id: '',
};

class CustomerBrandingDriveService {
  private folderStructure: CustomerDriveFolderStructure = { ...EMPTY_DRIVE_STRUCTURE };
  private assets: CustomerBrandingAsset[] = [];
  private brandingVersion = 1;
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    const [rows, folders, version] = await Promise.all([
      adminPersistenceService.list<any>('brandingAssets'),
      adminPersistenceService.getConfig<CustomerDriveFolderStructure>('CUSTOMER_DRIVE_FOLDER_STRUCTURE'),
      adminPersistenceService.getConfig<number>('BRANDING_VERSION'),
    ]);

    this.assets = rows.map((r: any) => ({
      ...r,
      branding_asset_id: String(r.asset_id || r.branding_asset_id || ''),
      workspace_id: String(r.workspace_id || ''),
      event_id: String(r.event_id || ''),
      asset_type: r.asset_type,
      drive_file_id: String(r.drive_file_id || ''),
      file_name: String(r.file_name || ''),
      mime_type: String(r.mime_type || ''),
      public_render_url: String(r.public_render_url || ''),
      status: r.status || 'ARCHIVED',
      version: Number(r.version || 1),
      priority: Number(r.priority || 0),
      dimensions: typeof r.dimensions === 'object' ? r.dimensions : undefined,
      file_size_bytes: Number(r.file_size_bytes || 0),
      created_at: r.created_at || '',
      created_by: r.created_by || '',
    })) as CustomerBrandingAsset[];

    if (folders) this.folderStructure = { ...EMPTY_DRIVE_STRUCTURE, ...folders };
    if (version) this.brandingVersion = Number(version) || 1;
    this.applyFaviconToHead();
    this.notify();
  }

  public getFolderStructure(): CustomerDriveFolderStructure {
    return { ...this.folderStructure };
  }

  public async updateFolderStructure(
    updates: Partial<CustomerDriveFolderStructure>
  ): Promise<CustomerDriveFolderStructure> {
    const next = { ...this.folderStructure, ...updates };
    await adminPersistenceService.setConfig('CUSTOMER_DRIVE_FOLDER_STRUCTURE', next);
    this.folderStructure = next;
    this.notify();
    return { ...next };
  }

  public getBrandingAssets(workspaceId?: string, assetType?: BrandingAssetType): CustomerBrandingAsset[] {
    return this.assets.filter(a =>
      (!workspaceId || a.workspace_id === workspaceId) &&
      (!assetType || a.asset_type === assetType)
    );
  }

  public getActiveAsset(assetType: BrandingAssetType, workspaceId?: string): CustomerBrandingAsset | null {
    const list = this.getBrandingAssets(workspaceId, assetType);
    return list.find(a => a.status === 'ACTIVE') || null;
  }

  public async setActiveAsset(assetId: string, workspaceId?: string): Promise<CustomerBrandingAsset | null> {
    const target = this.assets.find(a => a.branding_asset_id === assetId);
    if (!target) return null;

    const sameType = this.assets.filter(a =>
      a.asset_type === target.asset_type &&
      (!workspaceId || a.workspace_id === target.workspace_id)
    );

    for (const asset of sameType) {
      const status = asset.branding_asset_id === assetId ? 'ACTIVE' : 'ARCHIVED';
      const saved = await adminPersistenceService.upsert<any>('brandingAssets', {
        asset_id: asset.branding_asset_id,
        workspace_id: asset.workspace_id,
        event_id: (asset as any).event_id || '',
        asset_type: asset.asset_type,
        drive_file_id: asset.drive_file_id || '',
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        public_render_url: asset.public_render_url,
        status,
        version: asset.version || 1,
        priority: (asset as any).priority || 0,
        created_at: asset.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      asset.status = saved.status || status;
    }

    this.brandingVersion += 1;
    await adminPersistenceService.setConfig('BRANDING_VERSION', this.brandingVersion);
    this.applyFaviconToHead();
    this.notify();
    return this.assets.find(a => a.branding_asset_id === assetId) || null;
  }

  public async uploadBrandingAsset(payload: {
    workspace_id: string;
    asset_type: BrandingAssetType;
    file_name: string;
    mime_type: string;
    public_render_url: string;
    drive_file_id?: string;
    dimensions?: { width: number; height: number };
    file_size_bytes?: number;
    created_by?: string;
  }): Promise<CustomerBrandingAsset> {
    const current = this.assets.filter(a =>
      a.asset_type === payload.asset_type &&
      a.workspace_id === payload.workspace_id &&
      a.status === 'ACTIVE'
    );
    for (const asset of current) {
      await adminPersistenceService.upsert<any>('brandingAssets', {
        asset_id: asset.branding_asset_id,
        workspace_id: asset.workspace_id,
        asset_type: asset.asset_type,
        drive_file_id: asset.drive_file_id || '',
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        public_render_url: asset.public_render_url,
        status: 'ARCHIVED',
        version: asset.version || 1,
        created_at: asset.created_at || '',
      });
      asset.status = 'ARCHIVED';
    }

    const version = this.assets.filter(a => a.asset_type === payload.asset_type).length + 1;
    const saved = await adminPersistenceService.upsert<any>('brandingAssets', {
      workspace_id: payload.workspace_id,
      asset_type: payload.asset_type,
      drive_file_id: payload.drive_file_id || '',
      file_name: payload.file_name,
      mime_type: payload.mime_type,
      public_render_url: payload.public_render_url,
      status: 'ACTIVE',
      version,
      priority: 100,
      dimensions: payload.dimensions || undefined,
      file_size_bytes: payload.file_size_bytes || 0,
      created_at: new Date().toISOString(),
      created_by: payload.created_by || 'Admin Branding',
    });

    const item: CustomerBrandingAsset = {
      ...saved,
      branding_asset_id: saved.asset_id,
      dimensions: saved.dimensions || payload.dimensions,
    } as CustomerBrandingAsset;

    this.assets.unshift(item);
    this.brandingVersion += 1;
    await adminPersistenceService.setConfig('BRANDING_VERSION', this.brandingVersion);
    this.applyFaviconToHead();
    this.notify();
    return item;
  }

  public async restoreDefaultAsset(assetType: BrandingAssetType, workspaceId?: string): Promise<void> {
    const targets = this.assets.filter(a =>
      a.asset_type === assetType &&
      (!workspaceId || a.workspace_id === workspaceId) &&
      a.status === 'ACTIVE'
    );
    for (const asset of targets) {
      await adminPersistenceService.upsert<any>('brandingAssets', {
        asset_id: asset.branding_asset_id,
        workspace_id: asset.workspace_id,
        asset_type: asset.asset_type,
        drive_file_id: asset.drive_file_id || '',
        file_name: asset.file_name,
        mime_type: asset.mime_type,
        public_render_url: asset.public_render_url,
        status: 'ARCHIVED',
        version: asset.version || 1,
        created_at: asset.created_at || '',
      });
      asset.status = 'ARCHIVED';
    }
    this.brandingVersion += 1;
    await adminPersistenceService.setConfig('BRANDING_VERSION', this.brandingVersion);
    this.applyFaviconToHead();
    this.notify();
  }

  public async validateBrandingFile(
    fileUrl: string,
    assetType: BrandingAssetType
  ): Promise<BrandingValidationResult> {
    if (!fileUrl?.trim()) return { valid: false, state: 'INVALID_URL', message: 'URL gambar tidak boleh kosong.' };
    const trimmed = fileUrl.trim();
    if (!/^https?:\/\//.test(trimmed) && !trimmed.startsWith('data:image/')) {
      return { valid: false, state: 'INVALID_URL', message: 'Format URL tidak valid.' };
    }

    const resolved = mediaResolverService.resolveMedia(trimmed);
    if (resolved.accessStatus !== 'ACCESSIBLE') {
      return {
        valid: false,
        state: resolved.accessStatus as any,
        message: resolved.errorMessage || 'Logo tidak dapat dimuat.',
      };
    }

    return new Promise(resolve => {
      if (typeof window === 'undefined') {
        resolve({ valid: true, state: 'ACCESSIBLE', message: 'Gambar berhasil diverifikasi.' });
        return;
      }
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const warnings: string[] = [];
        if (assetType === 'FAVICON' && (width / Math.max(1, height) < .85 || width / Math.max(1, height) > 1.15)) {
          warnings.push('Favicon disarankan berasio 1:1.');
        }
        resolve({
          valid: true,
          state: 'ACCESSIBLE',
          message: warnings.length ? warnings.join(' ') : 'Gambar valid dan siap digunakan.',
          warnings: warnings.length ? warnings : undefined,
          dimensions: { width, height },
          aspectRatio: width / Math.max(1, height),
        });
      };
      img.onerror = () => resolve({ valid: false, state: 'BROKEN_SOURCE', message: 'Logo tidak dapat dimuat.' });
      img.src = resolved.previewUrl || resolved.thumbnailUrl || trimmed;
    });
  }

  public getBrandingHealth(workspaceId?: string): BrandingHealthReport {
    const appLogo = this.getActiveAsset('APP_LOGO', workspaceId);
    const favicon = this.getActiveAsset('FAVICON', workspaceId);
    const driveFolder = this.folderStructure.branding_folder_id;
    const logoOk = Boolean(appLogo?.public_render_url);
    const faviconOk = Boolean(favicon?.public_render_url);
    const driveOk = Boolean(driveFolder);
    return {
      status: logoOk && faviconOk && driveOk ? 'HEALTHY' : logoOk || faviconOk ? 'WARNING' : 'ERROR',
      appLogo: {
        ok: logoOk,
        message: logoOk ? 'App Logo aktif & dapat diakses' : '! Logo tidak dapat diakses',
        url: appLogo?.public_render_url,
        fileId: appLogo?.drive_file_id,
        version: appLogo?.version,
      },
      favicon: {
        ok: faviconOk,
        message: faviconOk ? 'Favicon aktif' : '! Favicon belum dikonfigurasi',
        url: favicon?.public_render_url,
        fileId: favicon?.drive_file_id,
        version: favicon?.version,
      },
      driveAccess: {
        ok: driveOk,
        message: driveOk ? 'Folder customer Drive terkonfigurasi' : '! Folder Branding belum dikonfigurasi',
        folderId: driveFolder,
      },
    };
  }

  public getEffectiveBranding(eventLogoUrl?: string, workspaceLogoUrl?: string) {
    const activeLogo = this.getActiveAsset('APP_LOGO');
    const activeFavicon = this.getActiveAsset('FAVICON');
    let appLogoUrl = '/icon.svg';
    let source: 'event' | 'workspace' | 'installation' | 'default' = 'default';
    if (eventLogoUrl?.trim()) { appLogoUrl = eventLogoUrl; source = 'event'; }
    else if (workspaceLogoUrl?.trim()) { appLogoUrl = workspaceLogoUrl; source = 'workspace'; }
    else if (activeLogo?.public_render_url) { appLogoUrl = activeLogo.public_render_url; source = 'installation'; }
    return {
      appLogoUrl,
      faviconUrl: activeFavicon?.public_render_url || '/icon.svg',
      source,
      version: this.brandingVersion,
    };
  }

  public applyFaviconToHead() {
    if (typeof document === 'undefined') return;
    const active = this.getActiveAsset('FAVICON');
    if (!active?.public_render_url) return;
    const url = `${active.public_render_url}?v=${this.brandingVersion}`;
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = url;
    let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = url;
  }

  public getBrandingVersion(): number {
    return this.brandingVersion;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => {
      try { cb(); } catch (err) { console.error('Branding listener error:', err); }
    });
  }
}

export const customerBrandingDriveService = new CustomerBrandingDriveService();
