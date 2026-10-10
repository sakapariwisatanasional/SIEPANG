/**
 * @license
 * SiEpang - Participant & Contingent Service
 * GAS-authoritative / canonical Spreadsheet persistence.
 *
 * UI state is updated only after the backend returns a confirmed record.
 */
import { Participant, Contingent, ParticipantStatus } from '../types';
import { eventService } from './eventService';
import { adminPersistenceService } from './adminPersistenceService';

class ParticipantService {
  private participants: Participant[] = [];
  private contingents: Contingent[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  private normalizeParticipant(row: any): Participant {
    const statusRaw = String(row.status || row.verification_status || 'submitted').toLowerCase();
    const status = (
      ['submitted','verified','approved','revision','rejected'].includes(statusRaw)
        ? statusRaw
        : 'submitted'
    ) as ParticipantStatus;

    return {
      ...row,
      id: String(row.id || ''),
      code: String(row.code || row.pramuka_id || row.participant_code || row.id || ''),
      name: String(row.name || row.full_name || ''),
      gender: row.gender || 'M',
      role: row.role || row.scout_level || 'Penggalang',
      contingentId: String(row.contingentId || row.contingent_id || ''),
      contingentName: String(row.contingentName || row.contingent_name || ''),
      subCamp: String(row.subCamp || row.subcamp || ''),
      tentNumber: String(row.tentNumber || row.lot_number || ''),
      photoUrl: String(row.photoUrl || row.photo_url || ''),
      status,
      checkedIn: Boolean(row.checkedIn ?? row.checked_in),
      checkInTime: row.checkInTime || row.checked_in_at || undefined,
      xp: Number(row.xp ?? row.points ?? 0),
      level: Number(row.level || Math.floor(Number(row.points || 0) / 200) + 1),
      rank: Number(row.rank || 0),
      attendanceCount: Number(row.attendanceCount || row.attendance_count || 0),
      badges: Array.isArray(row.badges)
        ? row.badges
        : typeof row.badges_json === 'string'
          ? (() => { try { return JSON.parse(row.badges_json); } catch { return []; } })()
          : [],
      membershipNumber: String(row.membershipNumber || row.pramuka_id || ''),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      revisionReason: row.revisionReason || row.revision_reason || undefined,
      statusHistory: Array.isArray(row.statusHistory)
        ? row.statusHistory
        : Array.isArray(row.status_history)
          ? row.status_history
          : [],
    } as unknown as Participant;
  }

  private normalizeContingent(row: any): Contingent {
    const id = String(row.id || row.contingent_id || '');
    const name = String(row.name || row.contingent_name || 'Kontingen');
    return {
      ...row,
      id,
      contingent_id: id,
      name,
      contingent_name: name,
      region: String(row.region || ''),
      leaderName: String(row.leaderName || row.leader_name || row.leader || ''),
      leader: String(row.leader || row.leader_name || row.leaderName || ''),
      leaderPhone: String(row.leaderPhone || row.leader_phone || row.contact || ''),
      contact: String(row.contact || row.leader_phone || row.leaderPhone || ''),
      participantCount: Number(row.participantCount ?? row.participant_count ?? 0),
      participant_count: Number(row.participant_count ?? row.participantCount ?? 0),
      quota: Number(row.quota || 0),
      maleCount: Number(row.maleCount || row.male_count || 0),
      femaleCount: Number(row.femaleCount || row.female_count || 0),
      advisorCount: Number(row.advisorCount || row.advisor_count || 0),
      verifiedCount: Number(row.verifiedCount || row.verified_count || 0),
      checkedInCount: Number(row.checkedInCount ?? row.checked_in_count ?? 0),
      campZone: String(row.campZone || row.camp_zone || ''),
      subCamp: String(row.subCamp || row.sub_camp || row.campsite_assignment || ''),
      campsite_assignment: String(row.campsite_assignment || row.subCamp || ''),
      verification_status: String(row.verification_status || 'VERIFIED'),
      totalXp: Number(row.totalXp || row.total_xp || 0),
      organization_id: String(row.organization_id || ''),
      contingent_level: String(row.contingent_level || 'KWARRAN'),
    } as unknown as Contingent;
  }

  private participantToRecord(p: Partial<Participant> & Record<string, any>): Record<string, any> {
    return {
      id: p.id || undefined,
      event_id: eventService.getCurrentEvent().id || undefined,
      contingent_id: p.contingentId || p.contingent_id || '',
      name: p.name || '',
      pramuka_id: p.membershipNumber || p.pramuka_id || p.code || '',
      gender: p.gender || '',
      subcamp: p.subCamp || p.subcamp || '',
      lot_number: p.tentNumber || p.lot_number || '',
      checked_in: Boolean(p.checkedIn ?? p.checked_in),
      checked_in_at: p.checkInTime || p.checked_in_at || '',
      points: Number(p.xp ?? p.points ?? 0),
      rank: Number(p.rank || 0),
      code: p.code || '',
      role: p.role || '',
      contingent_name: p.contingentName || p.contingent_name || '',
      photo_url: p.photoUrl || p.photo_url || '',
      status: p.status || 'submitted',
      email: p.email || '',
      phone: p.phone || '',
      revision_reason: p.revisionReason || p.revision_reason || '',
      status_history: p.statusHistory || p.status_history || [],
      attendance_count: Number(p.attendanceCount || p.attendance_count || 0),
      badges_json: p.badges || [],
      updated_at: new Date().toISOString(),
    };
  }

  private contingentToRecord(c: Partial<Contingent> & Record<string, any>): Record<string, any> {
    return {
      id: c.id || c.contingent_id || undefined,
      event_id: eventService.getCurrentEvent().id || undefined,
      name: c.name || c.contingent_name || '',
      region: c.region || '',
      leader_name: c.leaderName || c.leader || c.leader_name || '',
      leader_phone: c.leaderPhone || c.contact || c.leader_phone || '',
      camp_zone: c.campZone || c.camp_zone || '',
      participant_count: Number(c.participantCount ?? c.participant_count ?? 0),
      checked_in_count: Number(c.checkedInCount ?? c.checked_in_count ?? 0),
      quota: Number(c.quota || 0),
      male_count: Number(c.maleCount || c.male_count || 0),
      female_count: Number(c.femaleCount || c.female_count || 0),
      advisor_count: Number(c.advisorCount || c.advisor_count || 0),
      verified_count: Number(c.verifiedCount || c.verified_count || 0),
      sub_camp: c.subCamp || c.sub_camp || '',
      campsite_assignment: c.campsite_assignment || '',
      verification_status: c.verification_status || 'VERIFIED',
      total_xp: Number(c.totalXp || c.total_xp || 0),
      organization_id: c.organization_id || '',
      contingent_level: c.contingent_level || 'KWARRAN',
      updated_at: new Date().toISOString(),
    };
  }

  public async refreshFromBackend(): Promise<void> {
    const [participants, contingents] = await Promise.all([
      adminPersistenceService.list<any>('participants'),
      adminPersistenceService.list<any>('contingents'),
    ]);
    this.participants = participants.map(row => this.normalizeParticipant(row));
    this.contingents = contingents.map(row => this.normalizeContingent(row));
    this.notify();
  }

  public getParticipants(filters?: {
    search?: string;
    contingentId?: string;
    status?: ParticipantStatus | 'all';
    checkedIn?: boolean;
  }): Participant[] {
    let result = [...this.participants];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        [p.name, p.code, p.contingentName].filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      );
    }
    if (filters?.contingentId && filters.contingentId !== 'all') {
      result = result.filter(p => p.contingentId === filters.contingentId);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.checkedIn !== undefined) {
      result = result.filter(p => p.checkedIn === filters.checkedIn);
    }
    return result;
  }

  public getParticipantByCode(code: string): Participant | undefined {
    const q = code.toLowerCase().trim();
    return this.participants.find(p =>
      String(p.code || '').toLowerCase() === q ||
      String(p.id || '').toLowerCase() === q ||
      String(p.membershipNumber || '').toLowerCase() === q
    );
  }

  public getContingents(): Contingent[] {
    return [...this.contingents];
  }

  public getContingentById(id: string): Contingent | undefined {
    return this.contingents.find(c => c.id === id || c.contingent_id === id);
  }

  public async createContingent(data: Partial<Contingent>): Promise<Contingent> {
    const saved = await adminPersistenceService.upsert<any>(
      'contingents',
      this.contingentToRecord(data as any)
    );
    const item = this.normalizeContingent(saved);
    this.contingents.push(item);
    this.notify();
    return item;
  }

  public async updateContingent(id: string, updates: Partial<Contingent>): Promise<Contingent> {
    const current = this.getContingentById(id);
    if (!current) throw new Error(`Kontingen '${id}' tidak ditemukan`);
    const saved = await adminPersistenceService.upsert<any>(
      'contingents',
      this.contingentToRecord({ ...current, ...updates, id } as any)
    );
    const item = this.normalizeContingent(saved);
    const idx = this.contingents.findIndex(c => c.id === id || c.contingent_id === id);
    if (idx >= 0) this.contingents[idx] = item;
    this.notify();
    return item;
  }

  private async setParticipantStatus(
    participantId: string,
    next: ParticipantStatus,
    actor: string,
    reason?: string
  ): Promise<Participant> {
    const current = this.participants.find(p => p.id === participantId);
    if (!current) throw new Error('Peserta tidak ditemukan');

    const history = [...(current.statusHistory || [])];
    history.unshift({
      participant_id: participantId,
      previous_status: current.status,
      new_status: next,
      changed_by: actor,
      reason,
      timestamp: new Date().toLocaleString('id-ID'),
    } as any);

    const candidate = {
      ...current,
      status: next,
      revisionReason: next === 'revision' || next === 'rejected' ? reason : undefined,
      statusHistory: history,
    };

    const saved = await adminPersistenceService.upsert<any>(
      'participants',
      this.participantToRecord(candidate as any)
    );
    const item = this.normalizeParticipant(saved);
    const idx = this.participants.findIndex(p => p.id === participantId);
    if (idx >= 0) this.participants[idx] = item;
    this.notify();
    return item;
  }

  public verifyParticipant(participantId: string, verifiedBy: string): Promise<Participant> {
    return this.setParticipantStatus(participantId, 'verified' as ParticipantStatus, verifiedBy, 'Dokumen peserta telah diverifikasi.');
  }

  public approveParticipant(participantId: string, approvedBy: string): Promise<Participant> {
    return this.setParticipantStatus(participantId, 'approved' as ParticipantStatus, approvedBy, 'Persetujuan akhir kepesertaan.');
  }

  public requestRevision(participantId: string, reason: string, officerName: string): Promise<Participant> {
    return this.setParticipantStatus(participantId, 'revision' as ParticipantStatus, officerName, reason);
  }

  public rejectParticipant(participantId: string, reason: string, officerName: string): Promise<Participant> {
    return this.setParticipantStatus(participantId, 'rejected' as ParticipantStatus, officerName, reason);
  }

  public getStatusHistory(participantId: string) {
    return this.participants.find(p => p.id === participantId)?.statusHistory || [];
  }

  public detectDuplicates(candidate: Partial<Participant>): {
    isDuplicate: boolean;
    reason?: string;
    matchedParticipant?: Participant;
  } {
    const membership = candidate.membershipNumber?.trim();
    if (membership) {
      const match = this.participants.find(p =>
        p.id !== candidate.id && p.membershipNumber?.trim() === membership
      );
      if (match) return { isDuplicate: true, reason: `Nomor KTA/NTA '${membership}' sudah digunakan oleh ${match.name}`, matchedParticipant: match };
    }

    if (candidate.name && candidate.contingentName) {
      const name = candidate.name.trim().toLowerCase();
      const contingent = candidate.contingentName.trim().toLowerCase();
      const match = this.participants.find(p =>
        p.id !== candidate.id &&
        p.name.trim().toLowerCase() === name &&
        p.contingentName.trim().toLowerCase() === contingent
      );
      if (match) return { isDuplicate: true, reason: `Nama '${candidate.name}' sudah terdaftar dalam kontingen ${candidate.contingentName}`, matchedParticipant: match };
    }

    if (candidate.email) {
      const email = candidate.email.trim().toLowerCase();
      const match = this.participants.find(p =>
        p.id !== candidate.id && p.email?.trim().toLowerCase() === email
      );
      if (match) return { isDuplicate: true, reason: `Email '${candidate.email}' sudah terdaftar pada ${match.name}`, matchedParticipant: match };
    }

    return { isDuplicate: false };
  }

  public async importParticipants(rows: any[], importedBy: string): Promise<{
    accepted: number;
    needsReview: number;
    rejected: number;
    duplicatesCount: number;
    importedList: Participant[];
  }> {
    let accepted = 0;
    let needsReview = 0;
    let rejected = 0;
    let duplicatesCount = 0;
    const importedList: Participant[] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const name = row.name || row.Nama || row['Nama Lengkap'];
      if (!name || String(name).trim().length < 2) {
        rejected++;
        continue;
      }

      const dup = this.detectDuplicates({
        name,
        membershipNumber: row.membershipNumber || row.NTA || row.KTA,
        contingentName: row.contingentName || row.Kontingen || 'Kontingen',
        email: row.email || row.Email,
      });

      if (dup.isDuplicate) {
        duplicatesCount++;
        needsReview++;
      } else {
        accepted++;
      }

      const draft = {
        name: String(name).trim(),
        code: '',
        gender: String(row.gender || row['Jenis Kelamin'] || 'M').toUpperCase().startsWith('P') ? 'F' : 'M',
        role: row.role || row.Tingkatan || 'Penggalang',
        contingentId: row.contingentId || '',
        contingentName: row.contingentName || row.Kontingen || '',
        membershipNumber: row.membershipNumber || row.NTA || row.KTA || '',
        email: row.email || row.Email || '',
        phone: row.phone || row.Telepon || '',
        status: dup.isDuplicate ? 'revision' : 'submitted',
        checkedIn: false,
        xp: 0,
        level: 1,
        rank: this.participants.length + importedList.length + 1,
        attendanceCount: 0,
        badges: [],
        revisionReason: dup.reason,
        imported_by: importedBy,
      } as any;

      const saved = await adminPersistenceService.upsert<any>(
        'participants',
        this.participantToRecord(draft)
      );
      const item = this.normalizeParticipant(saved);
      this.participants.unshift(item);
      importedList.push(item);
    }

    this.notify();
    return { accepted, needsReview, rejected, duplicatesCount, importedList };
  }

  public async bulkApprove(ids: string[], actor: string): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (this.participants.some(p => p.id === id)) {
        await this.approveParticipant(id, actor);
        count++;
      }
    }
    return count;
  }

  public async bulkAssignContingent(ids: string[], contingentId: string, contingentName: string): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const p = this.participants.find(x => x.id === id);
      if (!p) continue;
      const saved = await adminPersistenceService.upsert<any>(
        'participants',
        this.participantToRecord({ ...p, contingentId, contingentName } as any)
      );
      this.participants[this.participants.findIndex(x => x.id === id)] = this.normalizeParticipant(saved);
      count++;
    }
    this.notify();
    return count;
  }

  public async bulkAssignCategory(ids: string[], role: Participant['role']): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const p = this.participants.find(x => x.id === id);
      if (!p) continue;
      const saved = await adminPersistenceService.upsert<any>(
        'participants',
        this.participantToRecord({ ...p, role } as any)
      );
      this.participants[this.participants.findIndex(x => x.id === id)] = this.normalizeParticipant(saved);
      count++;
    }
    this.notify();
    return count;
  }

  public async bulkArchive(ids: string[]): Promise<number> {
    for (const id of ids) {
      await adminPersistenceService.archive('participants', id, { status: 'ARCHIVED' });
    }
    this.participants = this.participants.filter(p => !ids.includes(p.id));
    this.notify();
    return ids.length;
  }

  public async contingentCheckIn(
    contingentId: string,
    officerName: string,
    exceptionIds: string[] = []
  ): Promise<{ checkedInCount: number; exceptionsCount: number }> {
    let checkedInCount = 0;
    let exceptionsCount = 0;

    for (const p of this.participants.filter(x => x.contingentId === contingentId)) {
      if (exceptionIds.includes(p.id)) {
        exceptionsCount++;
        continue;
      }
      await this.checkIn(p.id, officerName);
      checkedInCount++;
    }

    return { checkedInCount, exceptionsCount };
  }

  public async checkIn(participantId: string, officerName = 'Petugas Registrasi'): Promise<Participant> {
    const current = this.participants.find(p => p.id === participantId);
    if (!current) throw new Error('Peserta tidak ditemukan');
    const saved = await adminPersistenceService.upsert<any>(
      'participants',
      this.participantToRecord({
        ...current,
        checkedIn: true,
        checkInTime: new Date().toISOString(),
        checked_in_by: officerName,
      } as any)
    );
    const item = this.normalizeParticipant(saved);
    const idx = this.participants.findIndex(p => p.id === participantId);
    if (idx >= 0) this.participants[idx] = item;
    this.notify();
    return item;
  }

  public async addParticipant(data: Partial<Participant>): Promise<Participant> {
    const activeEvent = eventService.getCurrentEvent();
    const code = data.code || `${activeEvent.eventCode || 'PST'}-${String(this.participants.length + 1).padStart(4, '0')}`;
    const saved = await adminPersistenceService.upsert<any>(
      'participants',
      this.participantToRecord({
        ...data,
        code,
        status: data.status || 'submitted',
        checkedIn: data.checkedIn || false,
        xp: data.xp || 0,
        level: data.level || 1,
        rank: data.rank || this.participants.length + 1,
        attendanceCount: data.attendanceCount || 0,
        badges: data.badges || [],
      } as any)
    );
    const item = this.normalizeParticipant(saved);
    this.participants.unshift(item);
    this.notify();
    return item;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error('ParticipantService listener error', e); }
    });
  }
}

export const participantService = new ParticipantService();
