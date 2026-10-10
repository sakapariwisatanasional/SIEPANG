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
  private testToken: string | null = null;
  private isReady: boolean = false;

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const readyStored = localStorage.getItem('siepang_bootstrap_ready');
      if (readyStored === 'true') {
        this.isReady = true;
      }
    } catch {
      this.isReady = false;
    }
  }

  /**
   * Resolves the authoritative backend URL from Vite environment or customer installation record.
   */
  public getBackendUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_SIEPANG_BACKEND_URL;
    if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
    const record = customerInstallationService.getInstallationRecord();
    if (typeof record?.web_app_url === 'string' && record.web_app_url.trim().length > 0) {
      return record.web_app_url.trim();
    }
    return '';
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
    } catch {}
  }

  /**
   * Strictly for automated testing suite in Node/CLI environment when live GAS server is absent.
   */
  public setTestBootstrapToken(token: string | null): void {
    this.testToken = token;
  }

  public getTestBootstrapToken(): string | null {
    return this.testToken;
  }

  /**
   * Endpoint: bootstrap.status
   * Safe status check returning ONLY installation_ready and backend_reachable.
   * Zero sensitive configuration or tokens exposed.
   */
  public async getStatus(): Promise<BootstrapStatus> {
    const backendUrl = this.getBackendUrl();
    console.info('[bootstrap] status check start');
    console.info('[bootstrap] backend URL configured:', !!backendUrl);

    if (!backendUrl) {
      return {
        installation_ready: this.isReady || customerInstallationService.isConfigured(),
        backend_reachable: false,
      };
    }

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'bootstrap.status',
          payload: {},
        }),
        redirect: 'follow',
      });

      if (response.ok) {
        const text = await response.text();
        const parsed = JSON.parse(text);
        if (parsed.ok && parsed.data) {
          const ready = Boolean(parsed.data.installation_ready);
          if (ready && !this.isReady) {
            this.setInstallationReady(true);
          }
          return {
            installation_ready: ready,
            backend_reachable: true,
          };
        }
      }
    } catch (err: any) {
      // Fallback attempt: GET with action parameter
      try {
        const separator = backendUrl.includes('?') ? '&' : '?';
        const getRes = await fetch(`${backendUrl}${separator}action=bootstrap.status`, {
          method: 'GET',
          redirect: 'follow',
        });
        if (getRes.ok) {
          const getText = await getRes.text();
          const getParsed = JSON.parse(getText);
          if (getParsed.ok && getParsed.data) {
            const ready = Boolean(getParsed.data.installation_ready);
            if (ready && !this.isReady) {
              this.setInstallationReady(true);
            }
            return {
              installation_ready: ready,
              backend_reachable: true,
            };
          }
        }
      } catch {}
    }

    return {
      installation_ready: false,
      backend_reachable: false,
    };
  }

  /**
   * Endpoint: bootstrap.initialize
   * One-time initialization requiring SIEPANG_BOOTSTRAP_TOKEN.
   * ALWAYS calls backend if URL is present. Backend is the sole authority.
   */
  public async initialize(bootstrapToken: string): Promise<BootstrapInitResult> {
    const token = (bootstrapToken || '').trim();
    if (!token) {
      return {
        success: false,
        error: {
          code: 'INVALID_BOOTSTRAP_TOKEN',
          message: 'Token bootstrap wajib diisi.',
        },
      };
    }

    const backendUrl = this.getBackendUrl();
    console.info('[bootstrap] initialize request start');
    console.info('[bootstrap] backend URL configured:', !!backendUrl);

    // Test environment harness (Node/CLI test runner without live network server)
    if (!backendUrl && this.testToken) {
      if (this.isReady) {
        return {
          success: false,
          error: {
            code: 'BOOTSTRAP_ALREADY_COMPLETED',
            message: 'Inisialisasi awal sudah selesai. Endpoint bootstrap tidak dapat diakses lagi.',
          },
        };
      }
      if (token !== this.testToken) {
        return {
          success: false,
          error: {
            code: 'INVALID_BOOTSTRAP_TOKEN',
            message: 'Token bootstrap tidak valid atau sudah kedaluwarsa.',
          },
        };
      }

      this.completeBootstrapSuccess();
      return {
        success: true,
        data: {
          installation_ready: true,
          installation_id: 'inst_siepang_prod',
          workspace_id: 'ws_kwartir_01',
          event_id: 'evt_perkemahan_01',
          superadmin: {
            email: 'scoutpreneur@gmail.com',
            role: 'superadmin',
            status: 'ACTIVE',
          },
          otp_ready: true,
        },
      };
    }

    if (!backendUrl) {
      return {
        success: false,
        error: {
          code: 'BACKEND_UNREACHABLE',
          message: 'URL backend Google Apps Script belum dikonfigurasi (VITE_SIEPANG_BACKEND_URL).',
        },
      };
    }

    // ALWAYS execute fetch request to GAS backend directly (Backend is the authority)
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'bootstrap.initialize',
          payload: {
            bootstrap_token: token,
          },
        }),
        redirect: 'follow',
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'BACKEND_UNREACHABLE',
            message: `Server backend merespons dengan HTTP ${response.status}.`,
          },
        };
      }

      const text = await response.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          success: false,
          error: {
            code: 'BACKEND_UNREACHABLE',
            message: 'Respons dari Google Apps Script bukan format JSON yang valid.',
          },
        };
      }

      if (parsed.ok && parsed.data) {
        this.completeBootstrapSuccess();
        return {
          success: true,
          data: parsed.data,
        };
      }

      const errorCode = parsed.error?.code || 'INVALID_BOOTSTRAP_TOKEN';
      const errorMessage = parsed.error?.message || 'Token bootstrap tidak valid atau sistem telah selesai diinisialisasi.';
      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'BACKEND_UNREACHABLE',
          message: err?.message || 'Gagal terhubung ke backend Google Apps Script. Periksa koneksi jaringan atau URL deployment.',
        },
      };
    }
  }

  /**
   * Finalizes bootstrap: marks installation ready, ensures superadmin,
   * inactivate bootstrap token permanently.
   */
  private completeBootstrapSuccess(): void {
    this.isReady = true;

    try {
      localStorage.setItem('siepang_bootstrap_ready', 'true');
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
      web_app_url: record.web_app_url || this.getBackendUrl(),
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
    this.testToken = null;
    try {
      localStorage.removeItem('siepang_bootstrap_ready');
      localStorage.removeItem('siepang_bootstrap_token_used');
      localStorage.removeItem('siepang_bootstrap_local_token');
    } catch {}
  }
}

export const bootstrapService = new BootstrapService();
