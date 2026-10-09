/**
 * @license
 * SiEpang - Organization Service (Kwarnas -> Kwarda -> Kwarcab -> Kwarran -> Gudep)
 * Manages full organization hierarchy, child creation, workspace linking, and tree visualization.
 */

import { Organization, OrganizationLevel } from '../types';
import { spreadsheetRepository } from '../backend/repositories/spreadsheetRepository';
import { workspaceService } from './workspaceService';

export interface OrganizationTreeNode extends Organization {
  children: OrganizationTreeNode[];
  workspaceCount: number;
  activeEventsCount: number;
}

export class OrganizationService {
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error in OrganizationService listener:', e);
      }
    });
  }

  public listOrganizations(): Organization[] {
    return spreadsheetRepository.listOrganizations();
  }

  public getOrganizationById(orgId: string): Organization | undefined {
    return this.listOrganizations().find(o => o.organization_id === orgId);
  }

  public getChildren(orgId: string): Organization[] {
    return this.listOrganizations().filter(o => o.parent_organization_id === orgId);
  }

  public getParent(orgId: string): Organization | undefined {
    const org = this.getOrganizationById(orgId);
    if (!org || !org.parent_organization_id) return undefined;
    return this.getOrganizationById(org.parent_organization_id);
  }

  public createOrganization(data: Omit<Organization, 'organization_id'>): Organization {
    const created = spreadsheetRepository.createOrganization(data);
    this.notify();
    return created;
  }

  public updateOrganization(orgId: string, updates: Partial<Organization>): Organization {
    const updated = spreadsheetRepository.updateOrganization(orgId, updates);
    this.notify();
    return updated;
  }

  public toggleStatus(orgId: string): Organization {
    const updated = spreadsheetRepository.toggleOrganizationStatus(orgId);
    this.notify();
    return updated;
  }

  public deleteOrganization(orgId: string): void {
    spreadsheetRepository.deleteOrganization(orgId);
    this.notify();
  }

  public getTree(): OrganizationTreeNode[] {
    const all = this.listOrganizations();
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

    // Root nodes have parent_organization_id === null
    const roots = all.filter(o => !o.parent_organization_id);
    return roots.map(buildNode);
  }

  public searchOrganizations(query: string, levelFilter?: OrganizationLevel): Organization[] {
    let result = this.listOrganizations();
    if (levelFilter) {
      result = result.filter(o => o.organization_level === levelFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        o =>
          o.organization_name.toLowerCase().includes(q) ||
          o.organization_code.toLowerCase().includes(q) ||
          (o.base_institution && o.base_institution.toLowerCase().includes(q)) ||
          (o.gudep_number && o.gudep_number.toLowerCase().includes(q))
      );
    }
    return result;
  }
}

export const organizationService = new OrganizationService();
