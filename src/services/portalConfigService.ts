/**
 * @license
 * SiEpang - Public Portal Configuration Service
 * Provides canonical section ordering and section visibility for the public event portal.
 * Respects admin configuration, featureControlService, and persistence.
 */

export type PortalSectionKey =
  | 'hero'
  | 'announcements'
  | 'schedule'
  | 'leaderboard'
  | 'photo_gallery'
  | 'video_gallery'
  | 'qr_scanner'
  | 'visitor'
  | 'verification'
  | 'sponsors';

export interface PublicPortalConfig {
  section_order: PortalSectionKey[];
  section_visibility: Record<PortalSectionKey, boolean>;
  visitor_hours: string;
}

export const DEFAULT_PORTAL_SECTION_ORDER: PortalSectionKey[] = [
  'hero',
  'announcements',
  'schedule',
  'leaderboard',
  'photo_gallery',
  'video_gallery',
  'qr_scanner',
  'visitor',
  'verification',
  'sponsors',
];

export const DEFAULT_PORTAL_SECTION_VISIBILITY: Record<PortalSectionKey, boolean> = {
  hero: true,
  announcements: true,
  schedule: true,
  leaderboard: true,
  photo_gallery: true,
  video_gallery: true,
  qr_scanner: true,
  visitor: true,
  verification: true,
  sponsors: true,
};

export const DEFAULT_VISITOR_HOURS = '09:00 - 17:00 WIB';

class PortalConfigService {
  private config: PublicPortalConfig = {
    section_order: [...DEFAULT_PORTAL_SECTION_ORDER],
    section_visibility: { ...DEFAULT_PORTAL_SECTION_VISIBILITY },
    visitor_hours: DEFAULT_VISITOR_HOURS,
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('siepang_public_portal_config');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.section_order)) {
            // Filter to valid keys and append any missing ones
            const validKeys = parsed.section_order.filter((k: any) =>
              DEFAULT_PORTAL_SECTION_ORDER.includes(k)
            );
            const missing = DEFAULT_PORTAL_SECTION_ORDER.filter(k => !validKeys.includes(k));
            this.config.section_order = [...validKeys, ...missing];
          }
          if (parsed.section_visibility && typeof parsed.section_visibility === 'object') {
            this.config.section_visibility = {
              ...DEFAULT_PORTAL_SECTION_VISIBILITY,
              ...parsed.section_visibility,
            };
          }
          if (typeof parsed.visitor_hours === 'string' && parsed.visitor_hours.trim()) {
            this.config.visitor_hours = parsed.visitor_hours.trim();
          }
        }
      }
    } catch {}
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('siepang_public_portal_config', JSON.stringify(this.config));
      }
    } catch {}
  }

  public getConfig(): PublicPortalConfig {
    return {
      section_order: [...this.config.section_order],
      section_visibility: { ...this.config.section_visibility },
      visitor_hours: this.config.visitor_hours || DEFAULT_VISITOR_HOURS,
    };
  }

  public getVisitorHours(): string {
    return this.config.visitor_hours || DEFAULT_VISITOR_HOURS;
  }

  public setVisitorHours(hours: string): void {
    this.config.visitor_hours = hours.trim() || DEFAULT_VISITOR_HOURS;
    this.saveToStorage();
    this.notify();
  }

  public updateSectionOrder(newOrder: PortalSectionKey[]): void {
    const validKeys = newOrder.filter(k => DEFAULT_PORTAL_SECTION_ORDER.includes(k));
    const missing = DEFAULT_PORTAL_SECTION_ORDER.filter(k => !validKeys.includes(k));
    this.config.section_order = [...validKeys, ...missing];
    this.saveToStorage();
    this.notify();
  }

  public setSectionVisibility(key: PortalSectionKey, visible: boolean): void {
    this.config.section_visibility = {
      ...this.config.section_visibility,
      [key]: visible,
    };
    this.saveToStorage();
    this.notify();
  }

  public resetToDefault(): void {
    this.config = {
      section_order: [...DEFAULT_PORTAL_SECTION_ORDER],
      section_visibility: { ...DEFAULT_PORTAL_SECTION_VISIBILITY },
      visitor_hours: DEFAULT_VISITOR_HOURS,
    };
    this.saveToStorage();
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch {}
    });
  }
}

export const portalConfigService = new PortalConfigService();
