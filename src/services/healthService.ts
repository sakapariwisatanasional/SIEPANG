/**
 * @license
 * SiEpang - Health & Incident Management Service
 * Manages medical records, triage, health incidents, and operational buper reports.
 * Consumes ApiClient / ApiTransport to persist to customer Spreadsheet.
 */

import { HealthIncident, OperationalIncident } from '../types';
import { apiClient } from './apiClient';

class HealthService {
  private healthIncidents: HealthIncident[] = [];
  private operationalIncidents: OperationalIncident[] = [];
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  public getHealthIncidents(): HealthIncident[] {
    return [...this.healthIncidents];
  }

  public getOperationalIncidents(): OperationalIncident[] {
    return [...this.operationalIncidents];
  }

  public async recordHealthIncident(incident: Omit<HealthIncident, 'id' | 'status'> & { id?: string; status?: HealthIncident['status'] }): Promise<HealthIncident> {
    const newRecord: HealthIncident = {
      ...incident,
      id: incident.id || `hlt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportedAt: incident.reportedAt || 'Baru saja',
      status: incident.status || 'dirawat',
    };

    this.healthIncidents.unshift(newRecord);
    this.notify();

    try {
      await apiClient.request('health/record', { data: newRecord });
    } catch (e) {
      console.warn('Error syncing health record:', e);
    }

    return newRecord;
  }

  public async recordOperationalIncident(incident: Omit<OperationalIncident, 'id' | 'status'> & { id?: string; status?: OperationalIncident['status'] }): Promise<OperationalIncident> {
    const newRecord: OperationalIncident = {
      ...incident,
      id: incident.id || `ops_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reportedAt: incident.reportedAt || 'Baru saja',
      status: incident.status || 'terbuka',
    };

    this.operationalIncidents.unshift(newRecord);
    this.notify();

    try {
      await apiClient.request('incidents/record', { data: newRecord });
    } catch (e) {
      console.warn('Error syncing operational incident:', e);
    }

    return newRecord;
  }

  public async updateHealthStatus(id: string, status: HealthIncident['status']): Promise<void> {
    const item = this.healthIncidents.find(h => h.id === id);
    if (item) {
      item.status = status;
      this.notify();
      try {
        await apiClient.request('health/updateStatus', { data: { id, status } });
      } catch (e) {
        console.warn('Error updating health status:', e);
      }
    }
  }

  public async updateOperationalStatus(id: string, status: OperationalIncident['status']): Promise<void> {
    const item = this.operationalIncidents.find(o => o.id === id);
    if (item) {
      item.status = status;
      this.notify();
      try {
        await apiClient.request('incidents/updateStatus', { data: { id, status } });
      } catch (e) {
        console.warn('Error updating incident status:', e);
      }
    }
  }
}

export const healthService = new HealthService();
