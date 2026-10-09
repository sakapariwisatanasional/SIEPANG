/**
 * @license
 * SiEpang - Dynamic Theme & Branding Service
 * Updates runtime CSS variables without hardcoded styles.
 */

import { BrandingConfig } from '../types';

export type AppearanceMode = 'system' | 'light' | 'dark';

export const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#833AB4',     // Instagram-inspired Purple
  secondaryColor: '#C13584',   // Instagram-inspired Magenta
  accentColor: '#F77737',      // Instagram-inspired Orange
  backgroundColor: '#F7F7F8',  // Light-first clean background
  surfaceColor: '#FFFFFF',     // Clean white surface
  logoUrl: '',
  bannerUrl: '',
  organizationName: '',
  eventShortName: '',
};

class BrandingService {
  private currentBranding: BrandingConfig = { ...DEFAULT_BRANDING };
  // Light-first constitution (Req 225): Fresh installation always defaults to light
  private appearanceMode: AppearanceMode = (localStorage.getItem('siepang_appearance_mode') as AppearanceMode) || 'light';
  private listeners: Set<(mode: AppearanceMode, resolved: 'light' | 'dark') => void> = new Set();

  constructor() {
    this.initAppearance();
  }

  private initAppearance(): void {
    if (typeof window === 'undefined') return;

    this.applyResolvedTheme();

    // Listen to system OS preference changes ONLY if user explicitly chose 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.appearanceMode === 'system') {
        this.applyResolvedTheme();
      }
    });
  }

  public getAppearance(): AppearanceMode {
    return this.appearanceMode;
  }

  public getResolvedTheme(): 'light' | 'dark' {
    if (this.appearanceMode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
    // Default to 'light' unless explicitly set to 'dark'
    return this.appearanceMode === 'dark' ? 'dark' : 'light';
  }

  public setAppearance(mode: AppearanceMode): void {
    this.appearanceMode = mode;
    localStorage.setItem('siepang_appearance_mode', mode);
    this.applyResolvedTheme();
    this.notify();
  }

  private applyResolvedTheme(): void {
    const resolved = this.getResolvedTheme();
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }

  public subscribe(cb: (mode: AppearanceMode, resolved: 'light' | 'dark') => void): () => void {
    this.listeners.add(cb);
    cb(this.appearanceMode, this.getResolvedTheme());
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const resolved = this.getResolvedTheme();
    this.listeners.forEach(cb => cb(this.appearanceMode, resolved));
  }

  public applyBranding(branding: Partial<BrandingConfig>): void {
    this.currentBranding = { ...this.currentBranding, ...branding };
    const root = document.documentElement;

    if (this.currentBranding.primaryColor) {
      root.style.setProperty('--primary', this.currentBranding.primaryColor);
    }
    if (this.currentBranding.secondaryColor) {
      root.style.setProperty('--secondary', this.currentBranding.secondaryColor);
    }
    if (this.currentBranding.accentColor) {
      root.style.setProperty('--accent', this.currentBranding.accentColor);
    }
    if (this.currentBranding.backgroundColor) {
      root.style.setProperty('--bg-base', this.currentBranding.backgroundColor);
    }
    if (this.currentBranding.surfaceColor) {
      root.style.setProperty('--bg-surface', this.currentBranding.surfaceColor);
    }

    // Update document title if short name available
    if (this.currentBranding.eventShortName) {
      document.title = `${this.currentBranding.eventShortName} | SiEpang`;
    }
  }

  public getBranding(): BrandingConfig {
    return this.currentBranding;
  }
}

export const brandingService = new BrandingService();
