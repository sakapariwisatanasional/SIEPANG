/**
 * @license
 * SiEpang - Single-Installation Workspace Service
 * 1 Instalasi = 1 Penyelenggara / Workspace.
 * Authoritative workspace identity hydrated from public.current.
 * Zero workspace switchers, zero multi-workspace selection in UI.
 */

import { Workspace, AuditLog, PublicCurrentResponse } from '../types';
import { brandingService } from './brandingService';
import { apiTransport } from './apiTransport';
import { customerInstallationService } from './customerInstallationService';

export const EMPTY_WORKSPACE: Workspace = {
  id: '',
  code: 'UNCONFIGURED',
  name: 'Belum Dikonfigurasi',
  organization: 'Kwartir Gerakan Pramuka',
  region: '',
  city: '',
  province: '',
  activeEventId: '',
  status: 'provisioning',
  schemaVersion: 'v1.9',
  databaseStatus: 'error',
  driveStatus: 'error',
  branding: {
    primaryColor: '#833AB4',
    secondaryColor: '#E1306C',
    accentColor: '#FCAF45',
    backgroundColor: '#F7F7F8',
    surfaceColor: '#FFFFFF',
    logoUrl: '',
    bannerUrl: '',
    organizationName: 'Kwartir Gerakan Pramuka',
    eventShortName: 'SiEpang',
  },
  infrastructure: {
    spreadsheetId: '',
    spreadsheetUrl: '',
    driveRootFolderId: '',
    driveFolders: {
      branding: '',
      idCardTemplates: '',
      idCardGenerated: '',
      certificatesTemplates: '',
      certificatesGenerated: '',
      submissions: '',
    },
    apiEndpoint: '',
    offlineSyncEnabled: true,
    autoBackupInterval: 'DAILY',
  },
  events: [],
  createdAt: '',
  adminName: '',
  adminEmail: '',
};

class WorkspaceService {
  private currentWorkspace: Workspace = { ...EMPTY_WORKSPACE };
  private auditLogs: AuditLog[] = [];
  private listeners: Set<(ws: Workspace[]) => void> = new Set();
  private isLoading = false;

  constructor() {
    this.hydrateFromInstallation();
  }

  public subscribe(cb: (ws: Workspace[]) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const list = [this.currentWorkspace];
    this.listeners.forEach(cb => cb(list));
  }

  private hydrateFromInstallation(): void {
    const record = customerInstallationService.getInstallationRecord();
    if (record && record.workspace_id) {
      this.currentWorkspace = {
        ...this.currentWorkspace,
        id: record.workspace_id,
        name: record.organization_name || this.currentWorkspace.name,
        organization: record.organization_name || this.currentWorkspace.organization,
        activeEventId: record.active_event_id || this.currentWorkspace.activeEventId,
      };
    }
  }

  /**
   * Loads the authoritative installation workspace via public.current
   */
  public async loadInstallationWorkspace(): Promise<Workspace> {
    if (this.isLoading) return this.currentWorkspace;
    this.isLoading = true;

    try {
      const res = await apiTransport.send<PublicCurrentResponse>('public.current');
      if (res.ok && res.data?.workspace) {
        const rawWs = res.data.workspace;
        this.currentWorkspace = {
          ...this.currentWorkspace,
          id: rawWs.id || this.currentWorkspace.id,
          name: rawWs.name || this.currentWorkspace.name,
          organization: rawWs.organization || rawWs.name || this.currentWorkspace.organization,
          activeEventId: res.data.event?.id || this.currentWorkspace.activeEventId,
        };

        brandingService.applyBranding({
          organizationName: this.currentWorkspace.organization,
        });

        this.notify();
      }
    } catch {
      // Fallback: retain local authoritative installation workspace
    } finally {
      this.isLoading = false;
    }

    return this.currentWorkspace;
  }

  /**
   * Returns the single authoritative workspace for this installation
   */
  public getCurrentWorkspace(): Workspace {
    return this.currentWorkspace;
  }

  /**
   * Sets the installation workspace authoritatively
   */
  public setInstallationWorkspace(ws: Workspace): void {
    this.currentWorkspace = { ...ws };
    brandingService.applyBranding(ws.branding);
    this.notify();
  }

  /**
   * Backward compatibility: returns single workspace list
   */
  public getWorkspaces(): Workspace[] {
    return [this.currentWorkspace];
  }

  /**
   * Backward compatibility helper (single-tenant installation retains authoritative workspace)
   */
  public setWorkspace(_id: string): void {
    // Single installation = 1 workspace. Retains authoritative installation workspace.
    this.notify();
  }

  /**
   * Backward compatibility helper
   */
  public setActiveEvent(_eventId: string): void {
    // Single installation = 1 event. Retains authoritative installation event.
    this.notify();
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }
}

export const workspaceService = new WorkspaceService();
