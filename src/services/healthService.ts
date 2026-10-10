/**
 * @license
 * SiEpang - Health & Incident Service
 * GAS-authoritative / canonical Spreadsheet persistence.
 */
import { HealthIncident, OperationalIncident } from '../types';
import { adminPersistenceService } from './adminPersistenceService';

class HealthService {
  private healthIncidents: HealthIncident[] = [];
  private operationalIncidents: OperationalIncident[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  public async refreshFromBackend(): Promise<void> {
    const [health, incidents] = await Promise.all([
      adminPersistenceService.list<any>('healthRecords'),
      adminPersistenceService.list<any>('incidents'),
    ]);

    this.healthIncidents = health.map((r: any) => ({
      ...r,
      id: String(r.id || ''),
      participantId: r.participantId || r.participant_id || '',
      participantName: r.participantName || r.patient_name || '',
      contingentName: r.contingentName || r.contingent_name || '',
      bloodType: r.bloodType || r.blood_type || '',
      allergies: r.allergies || r.known_allergies || '',
      symptoms: r.symptoms || '',
      diagnosis: r.diagnosis || r.medical_diagnosis || '',
      treatment: r.treatment || r.treatment_given || '',
      medication: r.medication || r.medication_administered || '',
      referredToHospital: Boolean(r.referredToHospital ?? r.hospital_referral),
      treatedBy: r.treatedBy || r.treated_by || '',
      reportedAt: r.reportedAt || r.treated_at || '',
      status: r.status || 'dirawat',
    })) as HealthIncident[];

    this.operationalIncidents = incidents.map((r: any) => ({
      ...r,
      id: String(r.id || ''),
      type: r.type || r.incident_type || '',
      severity: r.severity || 'LOW',
      reportedBy: r.reportedBy || r.reported_by || '',
      description: r.description || '',
      location: r.location || '',
      actionTaken: r.actionTaken || r.action_taken || '',
      securityFollowup: r.securityFollowup || r.security_followup || '',
      status: r.status || 'terbuka',
      reportedAt: r.reportedAt || r.created_at || '',
      resolvedAt: r.resolvedAt || r.resolved_at || '',
    })) as OperationalIncident[];

    this.notify();
  }

  public getHealthIncidents(): HealthIncident[] {
    return [...this.healthIncidents];
  }

  public getOperationalIncidents(): OperationalIncident[] {
    return [...this.operationalIncidents];
  }

  public async recordHealthIncident(
    incident: Omit<HealthIncident, 'id' | 'status'> & { id?: string; status?: HealthIncident['status'] }
  ): Promise<HealthIncident> {
    const payload: any = {
      id: incident.id || undefined,
      participant_id: (incident as any).participantId || '',
      patient_name: (incident as any).participantName || (incident as any).patientName || '',
      contingent_name: (incident as any).contingentName || '',
      blood_type: (incident as any).bloodType || '',
      known_allergies: (incident as any).allergies || '',
      vital_signs: (incident as any).vitalSigns || '',
      symptoms: (incident as any).symptoms || '',
      medical_diagnosis: (incident as any).diagnosis || '',
      treatment_given: (incident as any).treatment || '',
      medication_administered: (incident as any).medication || '',
      hospital_referral: Boolean((incident as any).referredToHospital),
      treated_by: (incident as any).treatedBy || '',
      treated_at: new Date().toISOString(),
      status: incident.status || 'dirawat',
      reported_at: (incident as any).reportedAt || new Date().toISOString(),
    };

    const saved = await adminPersistenceService.upsert<any>('healthRecords', payload);
    const item: HealthIncident = {
      ...(incident as any),
      id: saved.id,
      status: saved.status || payload.status,
      reportedAt: saved.reported_at || saved.treated_at || (incident as any).reportedAt || 'Baru saja',
    } as HealthIncident;

    this.healthIncidents.unshift(item);
    this.notify();
    return item;
  }

  public async recordOperationalIncident(
    incident: Omit<OperationalIncident, 'id' | 'status'> & { id?: string; status?: OperationalIncident['status'] }
  ): Promise<OperationalIncident> {
    const payload: any = {
      id: incident.id || undefined,
      incident_type: (incident as any).type || (incident as any).incidentType || '',
      severity: (incident as any).severity || 'LOW',
      reported_by: (incident as any).reportedBy || '',
      description: (incident as any).description || '',
      location: (incident as any).location || '',
      action_taken: (incident as any).actionTaken || '',
      security_followup: (incident as any).securityFollowup || '',
      status: incident.status || 'terbuka',
      reported_at: (incident as any).reportedAt || new Date().toISOString(),
      resolved_at: (incident as any).resolvedAt || '',
    };

    const saved = await adminPersistenceService.upsert<any>('incidents', payload);
    const item = { ...(incident as any), id: saved.id, status: saved.status || payload.status } as OperationalIncident;
    this.operationalIncidents.unshift(item);
    this.notify();
    return item;
  }

  public async updateHealthStatus(id: string, status: HealthIncident['status']): Promise<void> {
    const current = this.healthIncidents.find(h => h.id === id);
    if (!current) throw new Error('Rekam kesehatan tidak ditemukan.');
    await adminPersistenceService.upsert('healthRecords', { id, status, updated_at: new Date().toISOString() });
    current.status = status;
    this.notify();
  }

  public async updateOperationalStatus(id: string, status: OperationalIncident['status']): Promise<void> {
    const current = this.operationalIncidents.find(o => o.id === id);
    if (!current) throw new Error('Insiden tidak ditemukan.');
    await adminPersistenceService.upsert('incidents', {
      id,
      status,
      resolved_at: String(status).toLowerCase().includes('selesai') ? new Date().toISOString() : '',
    });
    current.status = status;
    this.notify();
  }
}

export const healthService = new HealthService();
