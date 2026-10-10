/**
 * @license
 * SiEpang - Banner & Sponsor Service
 * Canonical Banners / Sponsors / SponsorSettings persistence.
 */
import {
  BannerItem,
  SponsorItem,
  BannerType,
  BannerPreset,
  BannerFitMode,
  BannerDisplayLocation,
  BannerPriority,
  MediaPublicationStatus,
  SponsorTier,
  BannerRotatorConfig,
  SponsorCarouselConfig,
} from '../types';
import { mediaResolverService } from './mediaResolverService';
import { eventService } from './eventService';
import { workspaceService } from './workspaceService';
import { adminPersistenceService } from './adminPersistenceService';

class BannerSponsorService {
  private banners: Map<string, BannerItem> = new Map();
  private sponsors: Map<string, SponsorItem> = new Map();
  private rotatorConfig: BannerRotatorConfig = {
    mode: 'AUTO_ROTATE',
    rotationIntervalSeconds: 6,
    showNavigationDots: true,
    enableMobileSwipe: true,
    pauseOnHover: true,
  };
  private carouselConfig: SponsorCarouselConfig = {
    enabled: true,
    direction: 'RIGHT_TO_LEFT',
    carousel_duration_seconds: 30,
    pauseOnHover: true,
    pauseOnTouch: true,
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public async refreshFromBackend(): Promise<void> {
    const [bannerRows, sponsorRows, settingsRows, rotator] = await Promise.all([
      adminPersistenceService.list<any>('banners'),
      adminPersistenceService.list<any>('sponsors'),
      adminPersistenceService.list<any>('sponsorSettings'),
      adminPersistenceService.getConfig<BannerRotatorConfig>('BANNER_ROTATOR_CONFIG'),
    ]);

    this.banners.clear();
    bannerRows.forEach((r: any) => {
      const id = String(r.banner_id || r.id || '');
      if (!id) return;
      this.banners.set(id, {
        ...r,
        banner_id: id,
        workspace_id: r.workspace_id || workspaceService.getCurrentWorkspace().id || '',
        event_id: r.event_id || eventService.getCurrentEvent().id || '',
        banner_type: r.banner_type || 'HERO',
        title: r.title || '',
        image_url: r.image_url || '',
        display_order: Number(r.display_order || 0),
        publication_status: r.publication_status || r.status || 'PUBLISHED',
        priority: r.priority || 'NORMAL',
        impressions_count: Number(r.impressions_count || 0),
        clicks_count: Number(r.clicks_count || 0),
      } as BannerItem);
    });

    this.sponsors.clear();
    sponsorRows.forEach((r: any) => {
      const id = String(r.sponsor_id || '');
      if (!id) return;
      this.sponsors.set(id, {
        ...r,
        sponsor_id: id,
        sponsor_name: r.sponsor_name || 'Mitra Sponsor',
        sponsor_tier: r.sponsor_tier || 'PARTNER',
        logo_url: r.logo_url || '',
        display_order: Number(r.display_order || 0),
        status: r.status || 'ACTIVE',
        publication_status: r.publication_status || (r.status === 'INACTIVE' ? 'ARCHIVED' : 'PUBLISHED'),
      } as SponsorItem);
    });

    if (settingsRows[0]) {
      const s: any = settingsRows[0];
      this.carouselConfig = {
        ...this.carouselConfig,
        enabled: Boolean(s.carousel_enabled),
        direction: s.direction || this.carouselConfig.direction,
        carousel_duration_seconds: Number(s.carousel_duration_seconds || 30),
        pauseOnHover: Boolean(s.pause_on_hover),
        pauseOnTouch: Boolean(s.pause_on_touch ?? true),
      };
    }
    if (rotator) this.rotatorConfig = { ...this.rotatorConfig, ...rotator };
    this.notify();
  }

  public getBanners(options?: {
    location?: BannerDisplayLocation;
    type?: BannerType;
    status?: MediaPublicationStatus;
    onlyActiveNow?: boolean;
  }): BannerItem[] {
    let list = Array.from(this.banners.values());
    if (options?.location) list = list.filter(b => b.display_location === options.location);
    if (options?.type) list = list.filter(b => b.banner_type === options.type);
    if (options?.status) list = list.filter(b => b.publication_status === options.status);
    if (options?.onlyActiveNow) {
      const now = new Date().toISOString();
      list = list.filter(b =>
        b.publication_status === 'PUBLISHED' &&
        (!b.publish_start || b.publish_start <= now) &&
        (!b.publish_end || b.publish_end >= now)
      );
    }
    const pMap: Record<BannerPriority, number> = { URGENT: 1, IMPORTANT: 2, NORMAL: 3 };
    return list.sort((a, b) =>
      (pMap[a.priority] - pMap[b.priority]) || (a.display_order - b.display_order)
    );
  }

  public getBannerById(id: string): BannerItem | undefined {
    return this.banners.get(id);
  }

  private bannerToRecord(b: Partial<BannerItem> & Record<string, any>): any {
    return {
      id: b.banner_id || b.id || undefined,
      event_id: b.event_id || eventService.getCurrentEvent().id || '',
      banner_type: b.banner_type || 'HERO',
      title: b.title || '',
      image_url: b.image_url || '',
      target_url: b.target_url || '',
      display_order: Number(b.display_order || 0),
      status: b.publication_status || b.status || 'PUBLISHED',
      subtitle: b.subtitle || '',
      source_type: b.source_type || '',
      desktop_preset: b.desktop_preset || 'BILLBOARD',
      mobile_preset: b.mobile_preset || 'LARGE_MOBILE_BANNER',
      mobile_image_url: b.mobile_image_url || '',
      fit_mode: b.fit_mode || 'COVER',
      focal_x: Number(b.focal_x ?? 50),
      focal_y: Number(b.focal_y ?? 50),
      target_type: b.target_type || 'NONE',
      cta_label: b.cta_label || '',
      display_location: b.display_location || 'PUBLIC_HOME_TOP',
      priority: b.priority || 'NORMAL',
      publish_start: b.publish_start || '',
      publish_end: b.publish_end || '',
      publication_status: b.publication_status || 'PUBLISHED',
      click_tracking_enabled: Boolean(b.click_tracking_enabled ?? true),
      impressions_count: Number(b.impressions_count || 0),
      clicks_count: Number(b.clicks_count || 0),
      created_at: b.created_at || new Date().toISOString(),
      created_by: b.created_by || '',
      updated_at: new Date().toISOString(),
    };
  }

  private recordToBanner(r: any): BannerItem {
    return {
      ...r,
      banner_id: r.id || r.banner_id,
      publication_status: r.publication_status || r.status || 'PUBLISHED',
      display_order: Number(r.display_order || 0),
      priority: r.priority || 'NORMAL',
    } as BannerItem;
  }

  public async createBanner(data: {
    banner_type: BannerType;
    title: string;
    subtitle?: string;
    image_url: string;
    desktop_preset?: BannerPreset;
    mobile_preset?: BannerPreset;
    mobile_image_url?: string;
    fit_mode?: BannerFitMode;
    focal_x?: number;
    focal_y?: number;
    target_type?: 'NONE' | 'INTERNAL_ROUTE' | 'EXTERNAL_URL';
    target_url?: string;
    cta_label?: string;
    display_location?: BannerDisplayLocation;
    priority?: BannerPriority;
    publish_start?: string;
    publish_end?: string;
    publication_status?: MediaPublicationStatus;
    createdBy?: string;
  }): Promise<BannerItem> {
    const resolution = mediaResolverService.resolveSource(data.image_url);
    const candidate: any = {
      ...data,
      workspace_id: workspaceService.getCurrentWorkspace().id || '',
      event_id: eventService.getCurrentEvent().id || '',
      image_url: resolution.thumbnailUrl || data.image_url,
      source_type: resolution.sourceType,
      display_order: this.banners.size + 1,
      publication_status: data.publication_status || 'PUBLISHED',
      click_tracking_enabled: true,
      impressions_count: 0,
      clicks_count: 0,
      created_at: new Date().toISOString(),
      created_by: data.createdBy || 'Event Admin',
    };
    const saved = await adminPersistenceService.upsert<any>('banners', this.bannerToRecord(candidate));
    const item = this.recordToBanner(saved);
    this.banners.set(item.banner_id, item);
    this.notify();
    return item;
  }

  public async updateBanner(id: string, updates: Partial<BannerItem>, updatedBy?: string): Promise<BannerItem> {
    const current = this.banners.get(id);
    if (!current) throw new Error('Banner tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>(
      'banners',
      this.bannerToRecord({ ...current, ...updates, banner_id: id, updated_by: updatedBy || 'Admin' } as any)
    );
    const item = this.recordToBanner(saved);
    this.banners.set(id, item);
    this.notify();
    return item;
  }

  public async deleteBanner(id: string): Promise<boolean> {
    const ok = await adminPersistenceService.archive('banners', id, {
      publication_status: 'ARCHIVED',
      status: 'ARCHIVED',
    });
    if (ok) this.banners.delete(id);
    this.notify();
    return Boolean(ok);
  }

  public recordBannerImpression(id: string): void {
    const b = this.banners.get(id);
    if (!b?.click_tracking_enabled) return;
    b.impressions_count = (b.impressions_count || 0) + 1;
  }

  public recordBannerClick(id: string): void {
    const b = this.banners.get(id);
    if (!b?.click_tracking_enabled) return;
    b.clicks_count = (b.clicks_count || 0) + 1;
    this.notify();
  }

  public getSponsors(filterStatus?: MediaPublicationStatus): SponsorItem[] {
    let list = Array.from(this.sponsors.values());
    if (filterStatus) list = list.filter(s => s.publication_status === filterStatus);
    return list.sort((a, b) => a.display_order - b.display_order);
  }

  public getSponsorById(id: string): SponsorItem | undefined {
    return this.sponsors.get(id);
  }

  private sponsorToRecord(s: Partial<SponsorItem> & Record<string, any>): any {
    return {
      sponsor_id: s.sponsor_id || undefined,
      workspace_id: s.workspace_id || workspaceService.getCurrentWorkspace().id || '',
      event_id: s.event_id || eventService.getCurrentEvent().id || '',
      logo_url: s.logo_url || '',
      target_url: s.target_url || s.website_url || '',
      display_order: Number(s.display_order || 0),
      status: s.status || 'ACTIVE',
      created_at: s.created_at || new Date().toISOString(),
      created_by: s.created_by || '',
      updated_at: new Date().toISOString(),
      updated_by: s.updated_by || '',
      sponsor_name: s.sponsor_name || 'Mitra Sponsor',
      sponsor_tier: s.sponsor_tier || 'PARTNER',
      website_url: s.website_url || s.target_url || '',
      banner_id: s.banner_id || '',
      publication_status: s.publication_status || 'PUBLISHED',
    };
  }

  private recordToSponsor(r: any): SponsorItem {
    return {
      ...r,
      sponsor_id: r.sponsor_id,
      publication_status: r.publication_status || (r.status === 'INACTIVE' ? 'ARCHIVED' : 'PUBLISHED'),
      display_order: Number(r.display_order || 0),
    } as SponsorItem;
  }

  public async createSponsor(data: {
    sponsor_name?: string;
    sponsor_tier?: SponsorTier;
    logo_url: string;
    target_url?: string;
    website_url?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    banner_id?: string;
    publication_status?: MediaPublicationStatus;
    createdBy?: string;
  }): Promise<SponsorItem> {
    const saved = await adminPersistenceService.upsert<any>('sponsors', this.sponsorToRecord({
      ...data,
      display_order: this.sponsors.size + 1,
      created_by: data.createdBy || 'Admin',
      publication_status: data.publication_status || 'PUBLISHED',
    } as any));
    const item = this.recordToSponsor(saved);
    this.sponsors.set(item.sponsor_id, item);
    this.notify();
    return item;
  }

  public async updateSponsor(id: string, updates: Partial<SponsorItem>, updatedBy?: string): Promise<SponsorItem> {
    const current = this.sponsors.get(id);
    if (!current) throw new Error('Sponsor tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('sponsors', this.sponsorToRecord({
      ...current,
      ...updates,
      sponsor_id: id,
      updated_by: updatedBy || 'Admin',
    } as any));
    const item = this.recordToSponsor(saved);
    this.sponsors.set(id, item);
    this.notify();
    return item;
  }

  public async deleteSponsor(id: string): Promise<boolean> {
    await adminPersistenceService.archive('sponsors', id, {
      status: 'ARCHIVED',
      publication_status: 'ARCHIVED',
    });
    this.sponsors.delete(id);
    this.notify();
    return true;
  }

  public async reorderSponsor(id: string, direction: 'UP' | 'DOWN'): Promise<boolean> {
    const list = this.getSponsors();
    const index = list.findIndex(s => s.sponsor_id === id);
    if (index < 0) return false;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return false;

    const current = list[index];
    const target = list[targetIdx];
    const currentOrder = current.display_order;
    const targetOrder = target.display_order;

    const [savedCurrent, savedTarget] = await Promise.all([
      this.updateSponsor(current.sponsor_id, { display_order: targetOrder }),
      this.updateSponsor(target.sponsor_id, { display_order: currentOrder }),
    ]);
    this.sponsors.set(savedCurrent.sponsor_id, savedCurrent);
    this.sponsors.set(savedTarget.sponsor_id, savedTarget);
    this.notify();
    return true;
  }

  public async toggleSponsorStatus(id: string, updatedBy?: string): Promise<SponsorItem> {
    const sponsor = this.sponsors.get(id);
    if (!sponsor) throw new Error('Sponsor tidak ditemukan.');
    const next = sponsor.publication_status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    return this.updateSponsor(id, {
      publication_status: next,
      status: next === 'PUBLISHED' ? 'ACTIVE' : 'INACTIVE',
    }, updatedBy);
  }

  public getCarouselConfig(): SponsorCarouselConfig {
    return { ...this.carouselConfig };
  }

  public async updateCarouselConfig(updates: Partial<SponsorCarouselConfig>): Promise<SponsorCarouselConfig> {
    const next = { ...this.carouselConfig, ...updates };
    await adminPersistenceService.upsert<any>('sponsorSettings', {
      event_id: eventService.getCurrentEvent().id || '',
      carousel_enabled: next.enabled,
      direction: next.direction,
      carousel_duration_seconds: next.carousel_duration_seconds,
      pause_on_hover: next.pauseOnHover,
      pause_on_touch: next.pauseOnTouch,
      updated_at: new Date().toISOString(),
    });
    this.carouselConfig = next;
    this.notify();
    return { ...next };
  }

  public getRotatorConfig(): BannerRotatorConfig {
    return { ...this.rotatorConfig };
  }

  public async updateRotatorConfig(updates: Partial<BannerRotatorConfig>): Promise<BannerRotatorConfig> {
    const next = { ...this.rotatorConfig, ...updates };
    await adminPersistenceService.setConfig('BANNER_ROTATOR_CONFIG', next);
    this.rotatorConfig = next;
    this.notify();
    return { ...next };
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }
}

export const bannerSponsorService = new BannerSponsorService();
