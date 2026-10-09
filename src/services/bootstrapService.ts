/**
 * @license
 * SiEpang - First Bootstrap Service
 * Manages one-time setup secret verification, initial installation context,
 * initial superadmin provisioning, and bootstrap lifecycle separate from normal auth/OTP.
 * Strictly adheres to Zero Deadlock:
 * 1. First Bootstrap does not require login or OTP.
 * 2. Uses one-time SIEPANG_BOOTSTRAP_TOKEN.
 * 3. Once installation_ready = true, bootstrap.initialize rejects subsequent requests.
 */

import { apiTransport } from './apiTransport';
import { customerInstallationService } from './customerInstallationService';
import { userManagementService } from './userManagementService';

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
  private localToken: string | null = null;
  private tokenUsed: boolean = false;
  private isReady: boolean = false;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const readyStored = localStorage.getItem('siepang_bootstrap_ready');
      if (readyStored === 'true') {
        this.isReady = true;
      } else {
        // Also check if customerInstallationService already configured
        this.isReady = customerInstallationService.isConfigured();
      }

      this.tokenUsed = localStorage.getItem('siepang_bootstrap_token_used') === 'true';
      this.localToken = localStorage.getItem('siepang_bootstrap_local_token');
      if (!this.localToken && !this.tokenUsed && !this.isReady) {
        // Generate an ephemeral one-time secret for local testing
        this.localToken = 'boot_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('siepang_bootstrap_local_token', this.localToken);
      }
    } catch {
      this.isReady = false;
    }
  }

  public isInstallationReady(): boolean {
    return this.isReady || customerInstallationService.isConfigured();
  }

  public setInstallationReady(ready: boolean): void {
    this.isReady = ready;
    try {
      localStorage.setItem('siepang_bootstrap_ready', ready ? 'true' : 'false');
    } catch {}
  }

  /**
   * For test suite: set or reset the local bootstrap token
   */
  public setTestBootstrapToken(token: string | null): void {
    this.localToken = token;
    this.tokenUsed = false;
    try {
      if (token) {
        localStorage.setItem('siepang_bootstrap_local_token', token);
        localStorage.removeItem('siepang_bootstrap_token_used');
      } else {
        localStorage.removeItem('siepang_bootstrap_local_token');
      }
    } catch {}
  }

  public getTestBootstrapToken(): string | null {
    return this.tokenUsed ? null : this.localToken;
  }

  /**
   * Endpoint: bootstrap.status
   * Safe status check returning ONLY installation_ready and backend_reachable.
   * Zero sensitive configuration or tokens exposed.
   */
  public async getStatus(): Promise<BootstrapStatus> {
    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;
    const record = customerInstallationService.getInstallationRecord();
    const hasBackendUrl = !!(envUrl?.trim() || record.web_app_url?.trim());

    if (hasBackendUrl) {
      try {
        const res = await apiTransport.send<BootstrapStatus>('bootstrap.status', {}, {
          skipAuth: true,
          timeoutMs: 8000,
        });

        if (res.ok && res.data) {
          const ready = Boolean(res.data.installation_ready);
          if (ready && !this.isReady) {
            this.setInstallationReady(true);
          }
          return {
            installation_ready: ready,
            backend_reachable: true,
          };
        }
      } catch {
        // Fall through to local state check
      }
    }

    return {
      installation_ready: this.isInstallationReady(),
      backend_reachable: hasBackendUrl,
    };
  }

  /**
   * Endpoint: bootstrap.initialize
   * One-time initialization requiring SIEPANG_BOOTSTRAP_TOKEN.
   * Once completed, subsequent calls are rejected.
   */
  public async initialize(bootstrapToken: string): Promise<BootstrapInitResult> {
    const token = (bootstrapToken || '').trim();

    // 1. If already initialized, reject immediately (Requirement 4)
    if (this.isInstallationReady()) {
      return {
        success: false,
        error: {
          code: 'BOOTSTRAP_ALREADY_COMPLETED',
          message: 'Inisialisasi awal sudah selesai. Endpoint bootstrap tidak dapat diakses lagi.',
        },
      };
    }

    if (!token) {
      return {
        success: false,
        error: {
          code: 'INVALID_BOOTSTRAP_TOKEN',
          message: 'Token bootstrap wajib diisi.',
        },
      };
    }

    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;
    const record = customerInstallationService.getInstallationRecord();
    const hasBackendUrl = !!(envUrl?.trim() || record.web_app_url?.trim());

    // 2. Try remote Google Apps Script backend if configured
    if (hasBackendUrl) {
      try {
        const res = await apiTransport.send('bootstrap.initialize', {
          bootstrap_token: token,
          installation_id: record.installation_id || 'inst_siepang_prod',
          workspace_id: record.workspace_id || 'ws_kwartir_01',
          event_id: record.active_event_id || 'evt_perkemahan_01',
        }, {
          skipAuth: true,
        });

        if (res.ok && res.data) {
          this.completeBootstrapSuccess();
          return {
            success: true,
            data: res.data,
          };
        } else if (res.error) {
          return {
            success: false,
            error: {
              code: res.error.code || 'BOOTSTRAP_FAILED',
              message: res.error.message || 'Gagal melakukan inisialisasi awal.',
            },
          };
        }
      } catch (err: any) {
        // If remote fails with network error, proceed to evaluate local token if available
      }
    }

    // 3. Local verification (for dev, test suite, or local installation)
    if (this.tokenUsed || !this.localToken || token !== this.localToken) {
      return {
        success: false,
        error: {
          code: 'INVALID_BOOTSTRAP_TOKEN',
          message: 'Token bootstrap tidak valid atau sudah kedaluwarsa.',
        },
      };
    }

    // Token matched! Execute bootstrap locally
    this.completeBootstrapSuccess();

    return {
      success: true,
      data: {
        installation_ready: true,
        installation_id: record.installation_id || 'inst_siepang_local',
        workspace_id: record.workspace_id || 'ws_kwartir_01',
        event_id: record.active_event_id || 'evt_perkemahan_01',
        superadmin: {
          email: 'scoutpreneur@gmail.com',
          role: 'superadmin',
          status: 'ACTIVE',
        },
        otp_ready: true,
      },
    };
  }

  /**
   * Finalizes bootstrap: marks installation ready, ensures superadmin,
   * inactivate bootstrap token permanently.
   */
  private completeBootstrapSuccess(): void {
    this.isReady = true;
    this.tokenUsed = true;
    this.localToken = null;

    try {
      localStorage.setItem('siepang_bootstrap_ready', 'true');
      localStorage.setItem('siepang_bootstrap_token_used', 'true');
      localStorage.removeItem('siepang_bootstrap_local_token');
    } catch {}

    // Ensure Initial Superadmin scoutpreneur@gmail.com (Requirement 5)
    userManagementService.ensureBootstrapSuperadmin();

    // Mark installation record configured & superadmin ACTIVE
    const record = customerInstallationService.getInstallationRecord();
    customerInstallationService.updateInstallationRecord({
      installation_id: record.installation_id || 'inst_siepang_prod',
      workspace_id: record.workspace_id || 'ws_kwartir_01',
      active_event_id: record.active_event_id || 'evt_perkemahan_01',
      web_app_url: record.web_app_url || '',
      installation_status: 'READY',
      bootstrap_superadmin_email: 'scoutpreneur@gmail.com',
      bootstrap_superadmin_status: 'ACTIVE',
    });
  }

  /**
   * Resets bootstrap state (strictly for automated testing)
   */
  public resetForTest(): void {
    this.isReady = false;
    this.tokenUsed = false;
    this.localToken = null;
    try {
      localStorage.removeItem('siepang_bootstrap_ready');
      localStorage.removeItem('siepang_bootstrap_token_used');
      localStorage.removeItem('siepang_bootstrap_local_token');
    } catch {}
  }
}

export const bootstrapService = new BootstrapService();
