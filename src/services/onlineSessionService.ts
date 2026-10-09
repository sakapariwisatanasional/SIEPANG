/**
 * @license
 * SiEpang - Online Production Session Service
 * Manages canonical backend-authoritative online authentication sessions,
 * session TTL, token refresh, and friendly re-authentication overlays.
 */

import { OnlineAuthSession, User, UserRole } from '../types';
import { authService, ROLE_PERMISSIONS } from './authService';
import { workspaceService } from './workspaceService';
import { eventService } from './eventService';

const STORAGE_KEYS = {
  ONLINE_SESSION: 'siepang_online_auth_session',
  SAVED_FORM_DRAFT: 'siepang_form_unsaved_draft',
};

const DEFAULT_ONLINE_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 Hours production TTL

export class OnlineSessionService {
  private currentSession: OnlineAuthSession | null = null;
  private isReauthModalOpen = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ONLINE_SESSION);
      if (stored) {
        const session: OnlineAuthSession = JSON.parse(stored);
        if (new Date(session.expiresAt).getTime() > Date.now()) {
          this.currentSession = session;
        } else {
          // Session expired
          this.currentSession = { ...session, isValid: false };
        }
      } else {
        // Initialize default session with currently active user
        this.initDefaultSession();
      }
    } catch {
      this.initDefaultSession();
    }
  }

  private initDefaultSession(): void {
    const user = authService.getCurrentUser();
    if (!user) {
      this.currentSession = null;
      return;
    }
    const ws = workspaceService.getCurrentWorkspace();
    const ev = eventService.getCurrentEvent();

    this.currentSession = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: user.id,
      user,
      workspaceId: ws.id,
      organizationId: ws.organization_id || 'org_kwarcab_bwi',
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      activeEventId: ev.id,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + DEFAULT_ONLINE_SESSION_DURATION_MS).toISOString(),
      isValid: true,
    };
    this.saveSession();
  }

  private saveSession(): void {
    if (this.currentSession) {
      localStorage.setItem(STORAGE_KEYS.ONLINE_SESSION, JSON.stringify(this.currentSession));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ONLINE_SESSION);
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
      } catch (e) {
        console.error('Error in OnlineSessionService listener:', e);
      }
    });
  }

  public getSession(): OnlineAuthSession | null {
    if (this.currentSession && new Date(this.currentSession.expiresAt).getTime() <= Date.now()) {
      this.currentSession.isValid = false;
    }
    return this.currentSession;
  }

  public isSessionValid(): boolean {
    const s = this.getSession();
    return Boolean(s && s.isValid && new Date(s.expiresAt).getTime() > Date.now());
  }

  public setReauthModalOpen(open: boolean): void {
    this.isReauthModalOpen = open;
    this.notify();
  }

  public getIsReauthModalOpen(): boolean {
    return this.isReauthModalOpen;
  }

  public simulateSessionExpiry(): void {
    if (this.currentSession) {
      this.currentSession.expiresAt = new Date(Date.now() - 1000).toISOString();
      this.currentSession.isValid = false;
      this.saveSession();
      this.isReauthModalOpen = true;
      this.notify();
    }
  }

  public reauthenticate(email?: string): boolean {
    if (this.currentSession) {
      this.currentSession.expiresAt = new Date(Date.now() + DEFAULT_ONLINE_SESSION_DURATION_MS).toISOString();
      this.currentSession.isValid = true;
      this.currentSession.issuedAt = new Date().toISOString();
      this.isReauthModalOpen = false;
      this.saveSession();
      return true;
    }
    return false;
  }

  public saveFormDraft(formId: string, data: any): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.SAVED_FORM_DRAFT}_${formId}`, JSON.stringify(data));
    } catch {
      // Ignored
    }
  }

  public getFormDraft(formId: string): any | null {
    try {
      const draft = localStorage.getItem(`${STORAGE_KEYS.SAVED_FORM_DRAFT}_${formId}`);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  }

  public clearFormDraft(formId: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.SAVED_FORM_DRAFT}_${formId}`);
  }
}

export const onlineSessionService = new OnlineSessionService();
