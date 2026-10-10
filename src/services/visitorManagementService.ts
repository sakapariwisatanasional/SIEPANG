/**
 * @license
 * SiEpang - Visitor / Camp Guest Management Service
 * Canonical Visitors / VisitorPasses / VisitorVisits / VisitorGates persistence.
 */
import {
  VisitorRegistration,
  VisitorGate,
  VisitorVisitLog,
  VisitorRulesConfig,
  VisitorCategory,
  VisitorStatus,
  VisitorAccessZone,
  PersonBeingVisited,
} from '../types';
import { eventService } from './eventService';
import { participantService } from './participantService';
import { adminPersistenceService } from './adminPersistenceService';
import { apiTransport } from './apiTransport';

export interface GateScanResult {
  success: boolean;
  action: 'CHECKED_IN' | 'CHECKED_OUT' | 'REJECTED';
  message: string;
  visitor?: VisitorRegistration;
  visitLog?: VisitorVisitLog;
  insideCampCount: number;
  errorCode?: 'NOT_FOUND' | 'NOT_APPROVED' | 'EXPIRED' | 'TOO_EARLY' |
    'OUTSIDE_VISITING_HOURS' | 'ALREADY_CHECKED_IN' | 'CHECKED_OUT' |
    'REVOKED' | 'QUOTA_EXCEEDED' | 'WRONG_EVENT' | 'ZONE_DISALLOWED';
}

const DEFAULT_RULES: VisitorRulesConfig = {
  visitingHours: [],
  dailyQuota: 500,
  approvalMode: 'REQUIRE_APPROVAL',
  entryTypeDefault: 'SINGLE_ENTRY',
  allowedZonesDefault: ['PUBLIC_AREA', 'VISITOR_AREA', 'MAIN_STAGE'],
  rulesAndGuidelines: [],
  prohibitedItems: [],
  parkingInfo: '',
} as VisitorRulesConfig;

class VisitorManagementService {
  private visitors: Map<string, VisitorRegistration> = new Map();
  private gates: Map<string, VisitorGate> = new Map();
  private visitLogs: VisitorVisitLog[] = [];
  private rules: VisitorRulesConfig = { ...DEFAULT_RULES };
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  private normalizeVisitor(r: any): VisitorRegistration {
    return {
      ...r,
      id: String(r.id || ''),
      registrationCode: String(r.registrationCode || r.registration_code || r.pass_code || ''),
      name: String(r.name || r.full_name || ''),
      phone: String(r.phone || ''),
      category: (r.category || 'PUBLIC') as VisitorCategory,
      identityType: r.identityType || r.identity_type || 'KTP',
      identityNumber: r.identityNumber || r.id_number || '',
      organization: r.organization || r.institution || '',
      personVisited: typeof r.person_visited_json === 'object' && r.person_visited_json
        ? r.person_visited_json
        : r.personVisited || { type: 'unit', targetName: '' },
      relationship: r.relationship || '',
      visitDate: r.visitDate || r.visit_date || '',
      expectedArrival: r.expectedArrival || r.expected_arrival || '',
      expectedDeparture: r.expectedDeparture || r.expected_departure || '',
      accompanyingPersonsCount: Number(r.accompanyingPersonsCount ?? r.accompanying_persons_count ?? 0),
      vehicleInfo: r.vehicleInfo || r.vehicle_info || '',
      purpose: r.purpose || '',
      emergencyContact: r.emergencyContact || r.emergency_contact || '',
      status: (r.status || 'PENDING') as VisitorStatus,
      approvalMode: r.approvalMode || r.approval_mode || this.rules.approvalMode,
      approvedBy: r.approvedBy || r.approved_by || undefined,
      approvedAt: r.approvedAt || r.approved_at || undefined,
      rejectionReason: r.rejectionReason || r.rejection_reason || undefined,
      revokedBy: r.revokedBy || r.revoked_by || undefined,
      revokedReason: r.revokedReason || r.revoked_reason || undefined,
      qrToken: r.qrToken || r.qr_token || '',
      entryType: r.entryType || r.entry_type || 'SINGLE_ENTRY',
      allowedZones: Array.isArray(r.allowed_zones_json)
        ? r.allowed_zones_json
        : Array.isArray(r.allowedZones) ? r.allowedZones : [],
      createdAt: r.createdAt || r.registered_at || r.created_at || '',
      currentVisitSession: r.currentVisitSession || undefined,
    } as VisitorRegistration;
  }

  private visitorRecord(v: Partial<VisitorRegistration> & Record<string, any>): any {
    return {
      id: v.id || undefined,
      event_id: eventService.getCurrentEvent().id || undefined,
      full_name: v.name || v.full_name || '',
      phone: v.phone || '',
      institution: v.organization || v.institution || '',
      id_number: v.identityNumber || v.id_number || '',
      status: v.status || 'PENDING',
      registered_at: v.createdAt || v.registered_at || new Date().toISOString(),
      category: v.category || 'PUBLIC',
      identity_type: v.identityType || v.identity_type || '',
      person_visited_json: v.personVisited || v.person_visited_json || {},
      relationship: v.relationship || '',
      visit_date: v.visitDate || v.visit_date || '',
      expected_arrival: v.expectedArrival || v.expected_arrival || '',
      expected_departure: v.expectedDeparture || v.expected_departure || '',
      accompanying_persons_count: Number(v.accompanyingPersonsCount ?? v.accompanying_persons_count ?? 0),
      vehicle_info: v.vehicleInfo || v.vehicle_info || '',
      purpose: v.purpose || '',
      emergency_contact: v.emergencyContact || v.emergency_contact || '',
      approval_mode: v.approvalMode || v.approval_mode || '',
      approved_by: v.approvedBy || v.approved_by || '',
      approved_at: v.approvedAt || v.approved_at || '',
      rejection_reason: v.rejectionReason || v.rejection_reason || '',
      revoked_by: v.revokedBy || v.revoked_by || '',
      revoked_reason: v.revokedReason || v.revoked_reason || '',
      qr_token: v.qrToken || v.qr_token || '',
      entry_type: v.entryType || v.entry_type || '',
      allowed_zones_json: v.allowedZones || v.allowed_zones_json || [],
      current_visit_session: v.currentVisitSession || '',
      updated_at: new Date().toISOString(),
    };
  }

  public async refreshFromBackend(): Promise<void> {
    const [visitorRows, passRows, visitRows, gateRows, rules] = await Promise.all([
      adminPersistenceService.list<any>('visitors'),
      adminPersistenceService.list<any>('visitorPasses'),
      adminPersistenceService.list<any>('visitorVisits'),
      adminPersistenceService.list<any>('visitorGates'),
      adminPersistenceService.getConfig<VisitorRulesConfig>('VISITOR_RULES'),
    ]);

    const passByVisitor = new Map(passRows.map((p: any) => [String(p.visitor_id || ''), p]));
    this.visitors.clear();
    visitorRows.forEach((r: any) => {
      const pass: any = passByVisitor.get(String(r.id || '')) || {};
      const item = this.normalizeVisitor({
        ...r,
        registration_code: r.registration_code || pass.pass_code,
        qr_token: r.qr_token || pass.qr_token,
        entry_type: r.entry_type || pass.entry_type,
      });
      this.visitors.set(item.id, item);
    });

    this.visitLogs = visitRows.map((r: any) => ({
      ...r,
      visitLogId: String(r.id || ''),
      visitorId: String(r.visitor_id || ''),
      visitorName: String(r.visitor_name || ''),
      visitorCategory: r.visitor_category || 'PUBLIC',
      registrationCode: r.registration_code || '',
      eventId: r.event_id || '',
      gateId: r.gate_id || '',
      gateName: r.gate_name || '',
      checkinAt: r.action_type === 'CHECK_IN' ? r.timestamp : '',
      checkoutAt: r.action_type === 'CHECK_OUT' ? r.timestamp : undefined,
      verifiedBy: r.officer_user_id || '',
      deviceId: r.device_id || '',
      status: r.action_type === 'CHECK_OUT' ? 'CHECKED_OUT' : 'CHECKED_IN',
    })) as VisitorVisitLog[];

    this.gates.clear();
    gateRows.forEach((r: any) => {
      const gate = {
        ...r,
        id: String(r.id || ''),
        eventId: r.event_id || '',
        gateName: r.gate_name || '',
        location: r.gate_location || '',
        operatingHours: r.operating_hours || '',
        allowedCategories: Array.isArray(r.allowed_categories_json) ? r.allowed_categories_json : [],
        status: r.status || 'active',
      } as VisitorGate;
      this.gates.set(gate.id, gate);
    });

    if (rules) this.rules = { ...DEFAULT_RULES, ...rules };
    this.notify();
  }

  public getVisitors(): VisitorRegistration[] {
    return Array.from(this.visitors.values());
  }

  public getVisitorById(id: string): VisitorRegistration | undefined {
    return this.visitors.get(id);
  }

  public getVisitorByCode(code: string): VisitorRegistration | undefined {
    const q = code.trim().toLowerCase();
    return this.getVisitors().find(v => v.registrationCode?.toLowerCase() === q);
  }

  public getVisitorByToken(token: string): VisitorRegistration | undefined {
    return this.getVisitors().find(v => v.qrToken === token);
  }

  public getGates(): VisitorGate[] {
    return Array.from(this.gates.values());
  }

  public getVisitLogs(): VisitorVisitLog[] {
    return [...this.visitLogs];
  }

  public getRules(): VisitorRulesConfig {
    return { ...this.rules };
  }

  public getInsideCampCount(): number {
    return this.getVisitors().filter(v => v.status === 'CHECKED_IN').length;
  }

  public getOverdueVisitors(): VisitorRegistration[] {
    return this.getVisitors().filter(v => v.status === 'CHECKED_IN');
  }

  public getVisitorMetrics() {
    const all = this.getVisitors();
    return {
      total: all.length,
      pending: all.filter(v => v.status === 'PENDING').length,
      approved: all.filter(v => v.status === 'APPROVED').length,
      inside: this.getInsideCampCount(),
      rejected: all.filter(v => v.status === 'REJECTED').length,
      revoked: all.filter(v => v.status === 'REVOKED').length,
    };
  }

  public searchPersonToVisit(query: string): PersonBeingVisited[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return participantService.getParticipants()
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        String(p.contingentName || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(p => ({
        type: 'participant',
        targetId: p.id,
        targetName: p.name,
        targetDetail: `Peserta · ${p.contingentName}`,
      } as PersonBeingVisited));
  }

  public async registerVisitor(
    data: {
      name: string;
      phone: string;
      category: VisitorCategory;
      identityType: 'KTP' | 'SIM' | 'Kartu Pegawai' | 'Paspor' | 'Lainnya';
      identityNumber?: string;
      organization?: string;
      personVisited: PersonBeingVisited;
      relationship: string;
      visitDate: string;
      expectedArrival: string;
      expectedDeparture: string;
      accompanyingPersonsCount?: number;
      vehicleInfo?: string;
      purpose: string;
      emergencyContact?: string;
      entryType?: 'SINGLE_ENTRY' | 'MULTIPLE_ENTRY';
      allowedZones?: VisitorAccessZone[];
    },
    registeredByAdmin?: string
  ): Promise<VisitorRegistration> {
    // Public-safe backend action also works for the admin form and avoids browser-only IDs.
    const res = await apiTransport.send<{ visitor: any }>(
      'public.visitors.register',
      {
        full_name: data.name,
        phone: data.phone,
        category: data.category,
        id_number: data.identityNumber || '',
        institution: data.organization || '',
        personVisited: data.personVisited,
        relationship: data.relationship,
        visitDate: data.visitDate,
        expectedArrival: data.expectedArrival,
        expectedDeparture: data.expectedDeparture,
        accompanyingPersonsCount: data.accompanyingPersonsCount || 0,
        vehicleInfo: data.vehicleInfo || '',
        purpose: data.purpose,
        emergencyContact: data.emergencyContact || '',
        entryType: data.entryType || this.rules.entryTypeDefault,
        allowedZones: data.allowedZones || this.rules.allowedZonesDefault,
      },
      { skipAuth: true }
    );
    if (!res.ok || !res.data?.visitor) {
      throw new Error(res.error?.message || 'Pendaftaran pengunjung gagal.');
    }

    let visitor = this.normalizeVisitor(res.data.visitor);
    if (registeredByAdmin || data.category === 'VIP' || data.category === 'VVIP' || this.rules.approvalMode === 'AUTO_APPROVED') {
      visitor = await this.approveVisitor(visitor.id, registeredByAdmin || 'Admin');
    } else {
      this.visitors.set(visitor.id, visitor);
      this.notify();
    }
    return visitor;
  }

  public async approveVisitor(id: string, approverName: string): Promise<VisitorRegistration> {
    const current = this.visitors.get(id) || this.normalizeVisitor((await adminPersistenceService.list<any>('visitors', { id }))[0] || {});
    if (!current.id) throw new Error('Data pengunjung tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('visitors', this.visitorRecord({
      ...current,
      status: 'APPROVED',
      approvedBy: approverName,
      approvedAt: new Date().toISOString(),
      rejectionReason: undefined,
    } as any));
    const item = this.normalizeVisitor(saved);
    this.visitors.set(id, item);

    const passes = await adminPersistenceService.list<any>('visitorPasses', { visitor_id: id });
    if (passes[0]) {
      await adminPersistenceService.upsert<any>('visitorPasses', { ...passes[0], status: 'ACTIVE' });
    }
    this.notify();
    return item;
  }

  public async rejectVisitor(id: string, rejectorName: string, reason: string): Promise<VisitorRegistration> {
    const current = this.visitors.get(id);
    if (!current) throw new Error('Data pengunjung tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('visitors', this.visitorRecord({
      ...current,
      status: 'REJECTED',
      rejectionReason: reason,
      rejected_by: rejectorName,
    } as any));
    const item = this.normalizeVisitor(saved);
    this.visitors.set(id, item);
    this.notify();
    return item;
  }

  public async revokeVisitor(id: string, revokedBy: string, reason: string): Promise<VisitorRegistration> {
    const current = this.visitors.get(id);
    if (!current) throw new Error('Data pengunjung tidak ditemukan.');
    const saved = await adminPersistenceService.upsert<any>('visitors', this.visitorRecord({
      ...current,
      status: 'REVOKED',
      revokedBy,
      revokedReason: reason,
    } as any));
    const item = this.normalizeVisitor(saved);
    this.visitors.set(id, item);
    const passes = await adminPersistenceService.list<any>('visitorPasses', { visitor_id: id });
    for (const pass of passes) {
      await adminPersistenceService.upsert<any>('visitorPasses', { ...pass, status: 'REVOKED' });
    }
    this.notify();
    return item;
  }

  public async processGateScan(
    qrTokenOrCode: string,
    gateId: string,
    officerName: string,
    options?: { overrideHours?: boolean; overrideReason?: string; forceCheckout?: boolean }
  ): Promise<GateScanResult> {
    const visitor = this.getVisitorByToken(qrTokenOrCode.trim()) || this.getVisitorByCode(qrTokenOrCode.trim());
    if (!visitor) {
      return { success: false, action: 'REJECTED', errorCode: 'NOT_FOUND', message: 'Visitor Pass tidak ditemukan.', insideCampCount: this.getInsideCampCount() };
    }
    if (visitor.status === 'REVOKED' || visitor.status === 'REJECTED' || visitor.status === 'PENDING') {
      return { success: false, action: 'REJECTED', errorCode: 'NOT_APPROVED', message: 'Visitor Pass belum diizinkan masuk.', visitor, insideCampCount: this.getInsideCampCount() };
    }

    const gate = this.gates.get(gateId) || this.getGates()[0];
    if (!gate) throw new Error('Gerbang belum dikonfigurasi.');

    const checkingOut = visitor.status === 'CHECKED_IN' || options?.forceCheckout;
    const actionType = checkingOut ? 'CHECK_OUT' : 'CHECK_IN';
    const visitSaved = await adminPersistenceService.upsert<any>('visitorVisits', {
      pass_id: '',
      visitor_id: visitor.id,
      event_id: eventService.getCurrentEvent().id || '',
      gate_id: gate.id,
      gate_name: gate.gateName,
      action_type: actionType,
      timestamp: new Date().toISOString(),
      officer_user_id: officerName,
      notes: options?.overrideReason || '',
    });

    const nextStatus = checkingOut ? 'CHECKED_OUT' : 'CHECKED_IN';
    const savedVisitor = await adminPersistenceService.upsert<any>('visitors', this.visitorRecord({
      ...visitor,
      status: nextStatus,
      currentVisitSession: checkingOut ? undefined : {
        visitLogId: visitSaved.id,
        gateId: gate.id,
        gateName: gate.gateName,
        checkinAt: visitSaved.timestamp,
      },
    } as any));

    const updated = this.normalizeVisitor(savedVisitor);
    this.visitors.set(visitor.id, updated);

    const log = {
      visitLogId: visitSaved.id,
      visitorId: visitor.id,
      visitorName: visitor.name,
      visitorCategory: visitor.category,
      registrationCode: visitor.registrationCode,
      eventId: eventService.getCurrentEvent().id || '',
      gateId: gate.id,
      gateName: gate.gateName,
      checkinAt: checkingOut ? '' : visitSaved.timestamp,
      checkoutAt: checkingOut ? visitSaved.timestamp : undefined,
      verifiedBy: officerName,
      deviceId: 'GATE_TERMINAL_MOBILE',
      status: nextStatus,
    } as VisitorVisitLog;
    this.visitLogs.unshift(log);
    this.notify();

    return {
      success: true,
      action: checkingOut ? 'CHECKED_OUT' : 'CHECKED_IN',
      message: checkingOut ? 'Check-out berhasil.' : 'Check-in berhasil.',
      visitor: updated,
      visitLog: log,
      insideCampCount: this.getInsideCampCount(),
    };
  }

  public async updateRules(updated: Partial<VisitorRulesConfig>, _adminName: string): Promise<VisitorRulesConfig> {
    const next = { ...this.rules, ...updated };
    await adminPersistenceService.setConfig('VISITOR_RULES', next);
    this.rules = next;
    this.notify();
    return { ...next };
  }

  public async addGate(gate: Omit<VisitorGate, 'id'>, _adminName: string): Promise<VisitorGate> {
    const saved = await adminPersistenceService.upsert<any>('visitorGates', {
      event_id: eventService.getCurrentEvent().id || '',
      gate_name: (gate as any).gateName || '',
      gate_location: (gate as any).location || '',
      status: (gate as any).status || 'active',
      operating_hours: (gate as any).operatingHours || '',
      allowed_categories_json: (gate as any).allowedCategories || [],
    });
    const item = {
      ...gate,
      id: saved.id,
      eventId: saved.event_id,
      gateName: saved.gate_name,
      location: saved.gate_location,
    } as VisitorGate;
    this.gates.set(item.id, item);
    this.notify();
    return item;
  }

  public async updateGate(id: string, updates: Partial<VisitorGate>): Promise<VisitorGate> {
    const gate = this.gates.get(id);
    if (!gate) throw new Error('Gerbang tidak ditemukan.');
    const next = { ...gate, ...updates } as VisitorGate;
    const saved = await adminPersistenceService.upsert<any>('visitorGates', {
      id,
      event_id: eventService.getCurrentEvent().id || '',
      gate_name: (next as any).gateName || '',
      gate_location: (next as any).location || '',
      status: (next as any).status || 'active',
      operating_hours: (next as any).operatingHours || '',
      allowed_categories_json: (next as any).allowedCategories || [],
    });
    const item = { ...next, ...saved, id, gateName: saved.gate_name || (next as any).gateName } as VisitorGate;
    this.gates.set(id, item);
    this.notify();
    return item;
  }

  public async deleteGate(id: string): Promise<void> {
    await adminPersistenceService.archive('visitorGates', id, { status: 'ARCHIVED' });
    this.gates.delete(id);
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const visitorManagementService = new VisitorManagementService();
