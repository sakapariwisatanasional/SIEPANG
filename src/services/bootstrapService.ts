/**
 * SiEpang - First Bootstrap Service (Production Hardened)
 * Remote GAS is the ONLY authority for first bootstrap.
 * No local bootstrap token, no local success fallback, no demo IDs.
 */

import { apiTransport } from './apiTransport';
import { customerInstallationService } from './customerInstallationService';

export interface BootstrapStatus {
  installation_ready: boolean;
  backend_reachable: boolean;
}

export interface BootstrapInitResult {
  success: boolean;
  data?: {
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
  };
  error?: {
    code: string;
    message: string;
  };
}

class BootstrapService {
  private isReady = false;

  constructor() {
    try {
      this.isReady = localStorage.getItem('siepang_bootstrap_ready') === 'true';
    } catch {
      this.isReady = false;
    }
  }

  public isInstallationReady(): boolean {
    return this.isReady;
  }

  private setInstallationReady(ready: boolean): void {
    this.isReady = ready;
    try {
      if (ready) localStorage.setItem('siepang_bootstrap_ready', 'true');
      else localStorage.removeItem('siepang_bootstrap_ready');
    } catch {}
  }

  private getBackendUrl(): string {
    const envUrl = String((import.meta as any).env?.VITE_SIEPANG_BACKEND_URL || '').trim();
    const record = customerInstallationService.getInstallationRecord();
    return envUrl || String(record.web_app_url || '').trim();
  }

  /**
   * Public, safe, remote status check.
   * Never fabricates backend_reachable=true merely because a URL exists.
   */
  public async getStatus(): Promise<BootstrapStatus> {
    const backendUrl = this.getBackendUrl();
    if (!backendUrl) {
      return { installation_ready: false, backend_reachable: false };
    }

    try {
      const res = await apiTransport.send<BootstrapStatus>(
        'bootstrap.status',
        {},
        { skipAuth: true, timeoutMs: 8000 },
      );

      if (!res.ok || !res.data) {
        return { installation_ready: false, backend_reachable: false };
      }

      const ready = Boolean(res.data.installation_ready);
      this.setInstallationReady(ready);

      return {
        installation_ready: ready,
        backend_reachable: true,
      };
    } catch {
      return { installation_ready: false, backend_reachable: false };
    }
  }

  /**
   * Remote-only first bootstrap.
   * The token is verified ONLY by GAS Script Properties.
   */
  public async initialize(bootstrapToken: string): Promise<BootstrapInitResult> {
    const token = String(bootstrapToken || '').trim();

    if (!token) {
      return {
        success: false,
        error: { code: 'INVALID_BOOTSTRAP_TOKEN', message: 'Token bootstrap wajib diisi.' },
      };
    }

    const backendUrl = this.getBackendUrl();
    if (!backendUrl) {
      return {
        success: false,
        error: {
          code: 'BACKEND_UNREACHABLE',
          message: 'Backend SiEpang belum terhubung. Periksa konfigurasi deployment administrator.',
        },
      };
    }

    try {
      const res = await apiTransport.send<BootstrapInitResult['data']>(
        'bootstrap.initialize',
        { bootstrap_token: token },
        { skipAuth: true, timeoutMs: 30000 },
      );

      if (!res.ok || !res.data) {
        return {
          success: false,
          error: {
            code: res.error?.code || 'BOOTSTRAP_FAILED',
            message: res.error?.message || 'Gagal melakukan inisialisasi awal.',
          },
        };
      }

      this.setInstallationReady(Boolean(res.data.installation_ready));

      // Cache only authoritative IDs returned by GAS after successful bootstrap.
      const current = customerInstallationService.getInstallationRecord();
      customerInstallationService.updateInstallationRecord({
        ...current,
        installation_id: res.data.installation_id,
        workspace_id: res.data.workspace_id,
        active_event_id: res.data.event_id,
        installation_status: 'READY',
        bootstrap_superadmin_email: res.data.superadmin?.email || '',
        bootstrap_superadmin_status: res.data.superadmin?.status || 'ACTIVE',
      });

      return { success: true, data: res.data };
    } catch {
      // IMPORTANT: Never fall back to a browser-generated token.
      return {
        success: false,
        error: {
          code: 'BACKEND_UNREACHABLE',
          message: 'Backend SiEpang tidak dapat dijangkau. Inisialisasi belum dijalankan.',
        },
      };
    }
  }

  /** Test helper only. No production token emulation. */
  public resetForTest(): void {
    this.setInstallationReady(false);
  }
}

export const bootstrapService = new BootstrapService();
