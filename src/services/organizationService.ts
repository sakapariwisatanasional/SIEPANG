/**
 * @license
 * SiEpang - Organization Service
 * Canonical Organizations sheet persistence.
 */
import { Organization, OrganizationLevel } from '../types';
import { workspaceService } from './workspaceService';
import { adminPersistenceService } from './adminPersistenceService';

export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  workspaceCount: number;
  activeEventsCount: number;
}

export class OrganizationService {
  private organizations: Organization[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error('OrganizationService listener error:', e); }
    });
  }

  public async refreshFromBackend(): Promise<void> {
    const rows = await adminPersistenceService.list<any>('organizations');
    this.organizations = rows.map((r: any) => ({
      ...r,
      organization_id: String(r.organization_id || ''),
      organization_code: String(r.organization_code || ''),
      organization_name: String(r.organization_name || ''),
      organization_level: r.organization_level,
      parent_organization_id: r.parent_organization_id || null,
      status: r.status || 'active',
    })) as Organization[];
    this.notify();
  }

  public listOrganizations(): Organization[] {
    return [...this.organizations];
  }

  public getOrganizationById(orgId: string): Organization | undefined {
    return this.organizations.find(o => o.organization_id === orgId);
  }

  public getChildren(orgId: string): Organization[] {
    return this.organizations.filter(o => o.parent_organization_id === orgId);
  }

  public getParent(orgId: string): Organization | undefined {
    const org = this.getOrganizationById(orgId);
    if (!org?.parent_organization_id) return undefined;
    return this.getOrganizationById(org.parent_organization_id);
  }

  public async createOrganization(data: Omit<Organization, 'organization_id'>): Promise<Organization> {
    const saved = await adminPersistenceService.upsert<any>('organizations', {
      ...data,
      organization_id: undefined,
      created_at: new Date().toISOString(),
    });
    const created = saved as Organization;
    this.organizations.push(created);
    this.notify();
    return created;
  }

  public async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    const current = this.getOrganizationById(orgId);
    if (!current) throw new Error('Organisasi tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('organizations', {
      ...current,
      ...updates,
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    });
    const updated = saved as Organization;
    const idx = this.organizations.findIndex(o => o.organization_id === orgId);
    if (idx >= 0) this.organizations[idx] = updated;
    this.notify();
    return updated;
  }

  public async toggleStatus(orgId: string): Promise<Organization> {
    const current = this.getOrganizationById(orgId);
    if (!current) throw new Error('Organisasi tidak ditemukan.');
    const currentStatus = String((current as any).status || 'active').toLowerCase();
    return this.updateOrganization(orgId, {
      status: currentStatus === 'active' ? 'inactive' : 'active',
    } as any);
  }

  public async deleteOrganization(orgId: string): Promise<void> {
    await adminPersistenceService.archive('organizations', orgId, { status: 'ARCHIVED' });
    this.organizations = this.organizations.filter(o => o.organization_id !== orgId);
    this.notify();
  }

  public getTree(): OrganizationTreeNode[] {
    const all = this.listOrganizations().filter(o => String((o as any).status || '').toUpperCase() !== 'ARCHIVED');
    const workspaces = workspaceService.getWorkspaces();

    const buildNode = (org: Organization): OrganizationTreeNode => {
      const childOrgs = all.filter(c => c.parent_organization_id === org.organization_id);
      const wsCount = workspaces.filter(w => w.organization_id === org.organization_id).length;
      return {
        ...org,
        children: childOrgs.map(buildNode),
        workspaceCount: wsCount,
        activeEventsCount: wsCount > 0 ? 1 : 0,
      };
    };

    return all.filter(o => !o.parent_organization_id).map(buildNode);
  }

  public searchOrganizations(query: string, levelFilter?: OrganizationLevel): Organization[] {
    let result = this.listOrganizations();
    if (levelFilter) result = result.filter(o => o.organization_level === levelFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        [
          o.organization_name,
          o.organization_code,
          (o as any).base_institution,
          (o as any).gudep_number,
        ].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
      );
    }
    return result;
  }
}

export const organizationService = new OrganizationService();
