/**
 * @license
 * SiEpang - Emergency Offline Credential Service
 * Implements strict offline credential provisioning, device binding, rate limiting,
 * lockout protection, and restricted session generation with RBAC snapshots.
 *
 * NOTE: This is NOT an authentication bypass. It temporarily replaces online identity
 * verification while strictly maintaining RBAC authorization, workspace isolation,
 * event isolation, and device binding.
 */

import {
  OfflineCredential,
  OfflineEmergencySession,
  SecurityEventRecord,
} from '../offline/types';
import { UserRole } from '../types';
import { ROLE_PERMISSIONS } from './authService';
import { hashCredentialPin, generateSalt } from '../utils/cryptoSecurity';

const STORAGE_KEYS = {
  CREDENTIALS: 'siepang_offline_credentials',
  ACTIVE_SESSION: 'siepang_emergency_session',
  SECURITY_EVENTS: 'siepang_security_events',
};

const DEFAULT_SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 Hours TTL
const DEFAULT_CREDENTIAL_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days validity
const DEFAULT_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes lockout

export class OfflineCredentialService {
  private credentials: OfflineCredential[] = [];
  private activeSession: OfflineEmergencySession | null = null;
  private securityEvents: SecurityEventRecord[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const creds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (creds) {
        this.credentials = JSON.parse(creds);
      }
      const sess = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (sess) {
        const parsed: OfflineEmergencySession = JSON.parse(sess);
        // Check session expiry
        if (new Date(parsed.expires_at).getTime() > Date.now()) {
          this.activeSession = parsed;
        } else {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
          this.activeSession = null;
        }
      }
      const evts = localStorage.getItem(STORAGE_KEYS.SECURITY_EVENTS);
      if (evts) {
        this.securityEvents = JSON.parse(evts);
      }
    } catch (e) {
      console.warn('Failed to load offline credentials state:', e);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(this.credentials));
      if (this.activeSession) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(this.activeSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
      localStorage.setItem(STORAGE_KEYS.SECURITY_EVENTS, JSON.stringify(this.securityEvents));
    } catch (e) {
      console.warn('Failed to save offline credentials state:', e);
    }
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
      } catch (err) {
        console.error('Error in OfflineCredentialService listener:', err);
      }
    });
  }



  /**
   * PROVISIONING: Issues a new emergency offline credential while the device is trusted and online.
   * Enforces device binding, salt generation, and slow password hashing.
   */
  public async provisionOfflineCredential(params: {
    userId: string;
    userName: string;
    role: UserRole;
    workspaceId: string;
    eventId: string;
    deviceId: string;
    rawPin: string;
    lifetimeDays?: number;
    maxAttempts?: number;
  }): Promise<{ success: boolean; credential?: OfflineCredential; message: string }> {
    if (!params.rawPin || params.rawPin.length < 4) {
      return { success: false, message: 'PIN Darurat minimal 4 digit angka.' };
    }

    const salt = generateSalt(16);
    const credentialHash = await hashCredentialPin(params.rawPin, salt);
    const lifetime = (params.lifetimeDays || 7) * 24 * 60 * 60 * 1000;

    // Remove existing credential for same user + device + workspace if any
    this.credentials = this.credentials.filter(
      c => !(c.user_id === params.userId && c.device_id === params.deviceId && c.workspace_id === params.workspaceId)
    );

    const credential: OfflineCredential = {
      credential_id: `cred_${params.userId}_${Date.now()}`,
      user_id: params.userId,
      user_name: params.userName,
      workspace_id: params.workspaceId,
      event_id: params.eventId,
      device_id: params.deviceId,
      role_id: params.role,
      permission_snapshot_version: 1,
      permission_snapshot: ROLE_PERMISSIONS[params.role] || [],
      credential_hash: credentialHash,
      salt,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + lifetime).toISOString(),
      max_attempts: params.maxAttempts || 5,
      failed_attempts: 0,
      locked_until: null,
      status: 'active',
    };

    this.credentials.push(credential);

    this.recordSecurityEvent({
      event_type: 'credential_issued',
      severity: 'info',
      details: `Kredensial Darurat diterbitkan untuk '${params.userName}' (${params.role}) pada perangkat '${params.deviceId}'.`,
      actor_id: params.userId,
      device_id: params.deviceId,
      workspace_id: params.workspaceId,
    });

    this.saveState();
    return { success: true, credential, message: 'Kredensial Darurat Offline berhasil diterbitkan dan terikat ke perangkat.' };
  }

  /**
   * VALIDATION & LOGIN: Authenticates user in Emergency Offline Credential Mode
   * Enforces:
   * 1. Known user identity
   * 2. Registered device match (Device Binding)
   * 3. Workspace membership
   * 4. Event membership
   * 5. Credential status & Expiry
   * 6. Brute-force rate limiting & Lockout
   * 7. Salted Hash Comparison
   */
  public async verifyEmergencyOfflineCredential(params: {
    userId: string;
    rawPin: string;
    deviceId: string;
    workspaceId: string;
    eventId: string;
  }): Promise<{
    success: boolean;
    session?: OfflineEmergencySession;
    message: string;
    lockedUntil?: string | null;
    remainingAttempts?: number;
  }> {
    const cred = this.credentials.find(
      c => c.user_id === params.userId && c.workspace_id === params.workspaceId
    );

    if (!cred) {
      this.recordSecurityEvent({
        event_type: 'failed_pin_attempt',
        severity: 'warning',
        details: `Upaya login darurat ditolak: Pengguna '${params.userId}' tidak terdaftar pada workspace '${params.workspaceId}'.`,
        actor_id: params.userId,
        device_id: params.deviceId,
        workspace_id: params.workspaceId,
      });
      return { success: false, message: 'Pengguna tidak memiliki kredensial darurat pada workspace ini.' };
    }

    // 1. Device Binding Check
    if (cred.device_id !== params.deviceId) {
      this.recordSecurityEvent({
        event_type: 'failed_pin_attempt',
        severity: 'critical',
        details: `PELANGGARAN DEVICE BINDING: Kredensial pengguna '${cred.user_name}' terikat pada '${cred.device_id}', bukan '${params.deviceId}'.`,
        actor_id: params.userId,
        device_id: params.deviceId,
        workspace_id: params.workspaceId,
      });
      return {
        success: false,
        message: 'Pelanggaran Device Binding: Kredensial ini hanya sah digunakan pada perangkat terdaftarnya.',
      };
    }

    // 2. Event Check
    if (cred.event_id !== params.eventId) {
      return {
        success: false,
        message: 'Kredensial tidak berlaku untuk event yang sedang aktif.',
      };
    }

    // 3. Status & Revocation Check
    if (cred.status === 'revoked') {
      this.recordSecurityEvent({
        event_type: 'credential_revoked',
        severity: 'critical',
        details: `Upaya login dengan kredensial yang telah dicabut: '${cred.user_name}'.`,
        actor_id: params.userId,
        device_id: params.deviceId,
        workspace_id: params.workspaceId,
      });
      return {
        success: false,
        message: 'Kredensial darurat ini telah dicabut oleh Administrator.',
      };
    }

    // 4. Expiry Check
    if (new Date(cred.expires_at).getTime() <= Date.now()) {
      cred.status = 'expired';
      this.saveState();
      return {
        success: false,
        message: 'Kredensial darurat telah kedaluwarsa. Sambungkan ke jaringan untuk memperbarui.',
      };
    }

    // 5. Lockout Check
    if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
      const remainingMin = Math.ceil((new Date(cred.locked_until).getTime() - Date.now()) / 60000);
      return {
        success: false,
        lockedUntil: cred.locked_until,
        message: `Kredensial terkunci sementara karena salah PIN berkali-kali. Coba lagi dalam ${remainingMin} menit atau hubungi Admin.`,
      };
    }

    // If lockout window passed, reset attempts
    if (cred.locked_until && new Date(cred.locked_until).getTime() <= Date.now()) {
      cred.locked_until = null;
      cred.failed_attempts = 0;
      cred.status = 'active';
    }

    // 6. Verify Hashed PIN
    const computedHash = await hashCredentialPin(params.rawPin, cred.salt);
    if (computedHash !== cred.credential_hash) {
      cred.failed_attempts += 1;
      const remainingAttempts = Math.max(0, cred.max_attempts - cred.failed_attempts);

      if (cred.failed_attempts >= cred.max_attempts) {
        cred.locked_until = new Date(Date.now() + DEFAULT_LOCKOUT_DURATION_MS).toISOString();
        cred.status = 'locked';

        this.recordSecurityEvent({
          event_type: 'credential_locked',
          severity: 'critical',
          details: `Kredensial '${cred.user_name}' TERKUNCI setelah ${cred.failed_attempts} kali percobaan PIN salah.`,
          actor_id: params.userId,
          device_id: params.deviceId,
          workspace_id: params.workspaceId,
        });

        this.saveState();
        return {
          success: false,
          lockedUntil: cred.locked_until,
          remainingAttempts: 0,
          message: `PIN salah 5 kali. Kredensial telah TERKUNCI selama 15 menit.`,
        };
      }

      this.recordSecurityEvent({
        event_type: 'failed_pin_attempt',
        severity: 'warning',
        details: `Percobaan PIN darurat gagal untuk '${cred.user_name}' (${cred.failed_attempts}/${cred.max_attempts}).`,
        actor_id: params.userId,
        device_id: params.deviceId,
        workspace_id: params.workspaceId,
      });

      this.saveState();
      return {
        success: false,
        remainingAttempts,
        message: `PIN darurat salah. Sisa kesempatan: ${remainingAttempts} kali.`,
      };
    }

    // Success: Reset failed attempts
    cred.failed_attempts = 0;
    cred.locked_until = null;

    // 7. Create restricted offline session with 4h TTL
    const session: OfflineEmergencySession = {
      token: `emerg_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: cred.user_id,
      user_name: cred.user_name,
      device_id: cred.device_id,
      workspace_id: cred.workspace_id,
      event_id: cred.event_id,
      role_id: cred.role_id,
      permission_snapshot: [...cred.permission_snapshot],
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + DEFAULT_SESSION_DURATION_MS).toISOString(),
      authentication_mode: 'OFFLINE_EMERGENCY',
    };

    this.activeSession = session;

    this.recordSecurityEvent({
      event_type: 'privileged_override',
      severity: 'info',
      details: `Sesi Darurat Offline aktif: '${cred.user_name}' (${cred.role_id}) pada perangkat '${params.deviceId}'.`,
      actor_id: cred.user_id,
      device_id: params.deviceId,
      workspace_id: params.workspaceId,
    });

    this.saveState();

    return {
      success: true,
      session,
      message: `Akses Darurat Offline Aktif sebagai ${cred.user_name} (${cred.role_id.toUpperCase()}). Sesi berlaku 4 jam.`,
    };
  }

  /**
   * Resets lockout for an emergency credential (Admin action)
   */
  public resetCredentialLockout(credentialId: string): boolean {
    const cred = this.credentials.find(c => c.credential_id === credentialId);
    if (!cred) return false;

    cred.failed_attempts = 0;
    cred.locked_until = null;
    if (cred.status === 'locked') {
      cred.status = 'active';
    }
    this.recordSecurityEvent({
      event_type: 'privileged_override',
      severity: 'info',
      details: `Admin membuka kunci kredensial darurat '${cred.user_name}'.`,
      actor_id: 'admin',
      device_id: cred.device_id,
      workspace_id: cred.workspace_id,
    });
    this.saveState();
    return true;
  }

  /**
   * Revokes an emergency credential
   */
  public revokeCredential(credentialId: string): boolean {
    const cred = this.credentials.find(c => c.credential_id === credentialId);
    if (!cred) return false;

    cred.status = 'revoked';
    if (this.activeSession?.user_id === cred.user_id) {
      this.activeSession = null;
    }
    this.recordSecurityEvent({
      event_type: 'credential_revoked',
      severity: 'critical',
      details: `Kredensial darurat untuk '${cred.user_name}' telah dicabut secara permanen.`,
      actor_id: 'admin',
      device_id: cred.device_id,
      workspace_id: cred.workspace_id,
    });
    this.saveState();
    return true;
  }

  public getActiveSession(): OfflineEmergencySession | null {
    if (this.activeSession) {
      if (new Date(this.activeSession.expires_at).getTime() <= Date.now()) {
        this.activeSession = null;
        this.saveState();
        return null;
      }
    }
    return this.activeSession;
  }

  public clearSession(): void {
    this.activeSession = null;
    this.saveState();
  }

  public getCredentials(): OfflineCredential[] {
    return [...this.credentials];
  }

  public getSecurityEvents(): SecurityEventRecord[] {
    return [...this.securityEvents];
  }

  public recordSecurityEvent(event: Omit<SecurityEventRecord, 'id' | 'timestamp' | 'synced_to_cloud'>): void {
    const record: SecurityEventRecord = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      synced_to_cloud: false,
      ...event,
    };
    this.securityEvents.unshift(record);
    // Keep max 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(0, 100);
    }
    this.saveState();
  }
}

export const offlineCredentialService = new OfflineCredentialService();
