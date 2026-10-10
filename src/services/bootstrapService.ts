/**
 * @license
 * SiEpang - First Bootstrap Service
 *
 * Production rules:
 * - GAS backend is the sole authority for bootstrap status/token validation.
 * - No browser-generated bootstrap token.
 * - No production mock/fake installation IDs.
 * - Vercel environment variable is optional, not required.
 * - Canonical GAS URL from src/config/backend.ts is the final fallback.
 */

import { SIEPANG_BACKEND_URL } from '../config/backend';
import { customerInstallationService } from './customerInstallationService';

export interface BootstrapStatus {
  installation_ready: boolean;
  backend_reachable: boolean;
}

export interface BootstrapData {
  installation_ready: boolean;
  installation_id: string;
  workspace_id: string;
  event_id: string;
  superadmin: {
    email: string;
    role: string;
    status: string;
  };
  otp_ready: boolean;
}

export interface BootstrapInitResult {
  success: boolean;
  data?: BootstrapData;
  error?: {
    code: string;
    message: string;
  };
}

class BootstrapService {
  private testToken: string | null = null;
  private isReady = false;

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      this.isReady = localStorage.getItem('siepang_bootstrap_ready') === 'true';
    } catch {
      this.isReady = false;
    }
  }

  /**
   * Resolution order:
   * 1. Optional Vite env override.
   * 2. Existing installation record.
   * 3. Canonical production GAS URL committed with the frontend.
   */
  public getBackendUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;

    if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }

    const record = customerInstallationService.getInstallationRecord();

    if (
      typeof record?.web_app_url === 'string' &&
      record.web_app_url.trim().length > 0
    ) {
      return record.web_app_url.trim();
    }

    return SIEPANG_BACKEND_URL.trim();
  }

  public isInstallationReady(): boolean {
    return this.isReady || customerInstallationService.isConfigured();
  }

  public setInstallationReady(ready: boolean): void {
    this.isReady = ready;

    try {
      if (ready) {
        localStorage.setItem('siepang_bootstrap_ready', 'true');
      } else {
        localStorage.removeItem('siepang_bootstrap_ready');
      }

