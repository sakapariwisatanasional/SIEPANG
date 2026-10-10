/**
 * @license
 * SiEpang - Event Management Studio Service
 * Central service layer connecting React components to the SiEpang Backend API.
 * All mutations pass through:
 * Component -> Service -> apiClient -> SiEpang Backend API -> Auth & Workspace Guard -> RBAC Check -> Business Service -> Repository
 */

import {
  ScoutEvent,
  ScheduleItem,
  CampActivity,
  ActivityType,
  CampsiteSubcamp,
  CampsiteZone,
  CampsiteBlock,
  CampsiteLot,
  CampFacility,
  Competition,
  CompetitionType,
  JudgingCriterion,
  CompetitionJudge,
  VotingConfig,
  RegistrationSettings,
  RegistrationFieldConfig,
  PointRuleConfig,
  BadgeConfig,
  QrCheckpoint,
  CustomInfoPage,
  EventContactItem,
  AuditLog,
  Organization,
  HomeSectionConfig,
  ScheduleConflict,
  CampsiteCapacityReport,
  CompetitionReadiness,
  EventReadinessReport,
  RegisteredDevice,
  RoleScopedSnapshot,
} from '../types';
import { apiClient } from './apiClient';
import { apiTransport } from './apiTransport';
import { EMPTY_EVENT } from './eventService';
import {
  INITIAL_SCHEDULE,
  INITIAL_CAMP_ACTIVITIES,
  INITIAL_CAMPSITE_LOTS,
  INITIAL_CAMP_FACILITIES,
  INITIAL_COMPETITIONS,
  INITIAL_JUDGING_CRITERIA,
  INITIAL_COMPETITION_JUDGES,
  INITIAL_VOTING_CONFIG,
  INITIAL_REGISTRATION_FIELDS,
  INITIAL_POINT_RULES,
  INITIAL_QR_CHECKPOINTS,
  INITIAL_CUSTOM_PAGES,
  INITIAL_BADGES,
} from './mockData';

export type SaveStatusType = 'Saved ✓' | 'Saving…' | 'Unsaved Changes' | 'Save Failed';

export interface StudioSaveState {
  hasUnsaved: boolean;
  status: SaveStatusType;
  lastSaved: string;
  errorMessage?: string;
}

class EventStudioService {
  // Local cache for immediate UI responsiveness and offline hydration
  private event: ScoutEvent = { ...EMPTY_EVENT };
  private schedules: ScheduleItem[] = [...INITIAL_SCHEDULE];
  private activities: CampActivity[] = [...INITIAL_CAMP_ACTIVITIES];
  private activityTypes: ActivityType[] = [];
  private subcamps: CampsiteSubcamp[] = [];
  private zones: CampsiteZone[] = [];
  private blocks: CampsiteBlock[] = [];
  private lots: CampsiteLot[] = [...INITIAL_CAMPSITE_LOTS];
  private facilities: CampFacility[] = [...INITIAL_CAMP_FACILITIES];
  private competitions: Competition[] = [...INITIAL_COMPETITIONS];
  private competitionTypes: CompetitionType[] = [];
  private criteria: JudgingCriterion[] = [...INITIAL_JUDGING_CRITERIA];
  private judges: CompetitionJudge[] = [...INITIAL_COMPETITION_JUDGES];
  private votingConfig: VotingConfig = { ...INITIAL_VOTING_CONFIG };
  private registrationSettings: RegistrationSettings = {
    registrationStart: '2026-08-01',
    registrationEnd: '2026-09-25',
    maxParticipants: 1500,
    contingentRepresentationLevel: 'KWARRAN',
    maxParticipantsPerContingent: 32,
    maxAdvisorsPerContingent: 4,
    allowSelfRegistration: true,
    status: 'OPEN',
  };
  private dynamicFields: RegistrationFieldConfig[] = [...INITIAL_REGISTRATION_FIELDS];
  private pointRules: PointRuleConfig[] = [...INITIAL_POINT_RULES];
  private badges: BadgeConfig[] = INITIAL_BADGES.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.iconName || b.icon || 'Award',
    description: b.description,
    condition: `Raih ${b.xpRequired || 0} XP dalam kegiatan bertema ${b.category}`,
    xpRequired: b.xpRequired || 0,
    status: 'active' as const,
  }));
  private checkpoints: QrCheckpoint[] = [...INITIAL_QR_CHECKPOINTS];
  private customPages: CustomInfoPage[] = [...INITIAL_CUSTOM_PAGES];
  private contacts: EventContactItem[] = [];
  private auditLogs: AuditLog[] = [];
  private organizations: Organization[] = [];

  // Autosave / Debounce State Management
  private saveState: StudioSaveState = {
    hasUnsaved: false,
    status: 'Saved ✓',
    lastSaved: 'Baru saja',
  };
  private pendingDraft: any = null;
  private debounceTimer: any = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Defer initial sync to next macrotask so all ESM singletons are fully initialized
    setTimeout(() => {
      this.initialSync();
    }, 0);
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Initializes cache by pulling live data through the API Client.
   */
  public async initialSync(): Promise<void> {
    try {
      const [
        evRes,
        schRes,
        actRes,
        actTypeRes,
        subRes,
        zoneRes,
        blockRes,
        lotRes,
        facRes,
        compTypeRes,
        compRes,
        critRes,
        jdgRes,
        voteRes,
        regRes,
        fldRes,
        ptRes,
        bdgRes,
        chkRes,
        pageRes,
        cntRes,
        audRes,
        orgRes,
      ] = await Promise.all([
        apiTransport.send<ScoutEvent>('events.get', {}, { timeoutMs: 30000 }),
        apiClient.request<ScheduleItem[]>('/api/schedules/list'),
        apiClient.request<CampActivity[]>('/api/activities/list'),
        apiClient.request<ActivityType[]>('/api/activities/types/list'),
        apiClient.request<CampsiteSubcamp[]>('/api/campsite/subcamps/list'),
        apiClient.request<CampsiteZone[]>('/api/campsite/zones/list'),
        apiClient.request<CampsiteBlock[]>('/api/campsite/blocks/list'),
        apiClient.request<CampsiteLot[]>('/api/campsite/lots/list'),
        apiClient.request<CampFacility[]>('/api/campsite/facilities/list'),
        apiClient.request<CompetitionType[]>('/api/competitions/types/list'),
        apiClient.request<Competition[]>('/api/competitions/list'),
        apiClient.request<JudgingCriterion[]>('/api/competitions/criteria/list'),
        apiClient.request<CompetitionJudge[]>('/api/competitions/judges/list'),
        apiClient.request<VotingConfig>('/api/competitions/voting/get'),
        apiClient.request<RegistrationSettings>('/api/registration/settings/get'),
        apiClient.request<RegistrationFieldConfig[]>('/api/registration/fields/list'),
        apiClient.request<PointRuleConfig[]>('/api/gamification/points/list'),
        apiClient.request<BadgeConfig[]>('/api/gamification/badges/list'),
        apiClient.request<QrCheckpoint[]>('/api/gamification/checkpoints/list'),
        apiClient.request<CustomInfoPage[]>('/api/content/pages/list'),
        apiClient.request<EventContactItem[]>('/api/content/contacts/list'),
        apiClient.request<AuditLog[]>('/api/audit/list'),
        apiClient.request<Organization[]>('/api/organizations/list'),
      ]);

      if (evRes.ok && evRes.data) {
        this.event = evRes.data;
      } else {
        this.event = { ...EMPTY_EVENT };
      }
      if (schRes.success && schRes.data) this.schedules = schRes.data;
      if (actRes.success && actRes.data) this.activities = actRes.data;
      if (actTypeRes.success && actTypeRes.data) this.activityTypes = actTypeRes.data;
      if (subRes.success && subRes.data) this.subcamps = subRes.data;
      if (zoneRes.success && zoneRes.data) this.zones = zoneRes.data;
      if (blockRes.success && blockRes.data) this.blocks = blockRes.data;
      if (lotRes.success && lotRes.data) this.lots = lotRes.data;
      if (facRes.success && facRes.data) this.facilities = facRes.data;
      if (compTypeRes.success && compTypeRes.data) this.competitionTypes = compTypeRes.data;
      if (compRes.success && compRes.data) this.competitions = compRes.data;
      if (critRes.success && critRes.data) this.criteria = critRes.data;
      if (jdgRes.success && jdgRes.data) this.judges = jdgRes.data;
      if (voteRes.success && voteRes.data) this.votingConfig = voteRes.data;
      if (regRes.success && regRes.data) this.registrationSettings = regRes.data;
      if (fldRes.success && fldRes.data) this.dynamicFields = fldRes.data;
      if (ptRes.success && ptRes.data) this.pointRules = ptRes.data;
      if (bdgRes.success && bdgRes.data) this.badges = bdgRes.data;
      if (chkRes.success && chkRes.data) this.checkpoints = chkRes.data;
      if (pageRes.success && pageRes.data) this.customPages = pageRes.data;
      if (cntRes.success && cntRes.data) this.contacts = cntRes.data;
      if (audRes.success && audRes.data) this.auditLogs = audRes.data;
      if (orgRes.success && orgRes.data) this.organizations = orgRes.data;

      this.notify();
    } catch (err) {
      console.error('Initial sync error:', err);
    }
  }

  // ==================== AUTOSAVE & STATE ENGINE ====================

  public getSaveState(): StudioSaveState {
    return this.saveState;
  }

  public markDirty(draftPayload?: any) {
    this.pendingDraft = draftPayload || { event: this.event };
    this.saveState = {
      ...this.saveState,
      hasUnsaved: true,
      status: 'Unsaved Changes',
    };
    this.notify();

    // Debounced safe autosave (2000ms delay to avoid spreadsheet throttling)
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.saveAll();
    }, 2500);
  }

  public async saveAll(): Promise<boolean> {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.saveState = {
      ...this.saveState,
      status: 'Saving…',
    };
    this.notify();

    try {
      const eventId = String(this.event.id || '').trim();

      if (!eventId) {
        throw new Error(
          'Event aktif belum terhubung ke backend. Muat ulang Event Studio lalu coba lagi.'
        );
      }

      const res = await apiTransport.send<ScoutEvent>(
        'events.update',
        {
          eventId,
          updates: this.event,
        },
        {
          timeoutMs: 30000,
        }
      );

      if (res.ok && res.data) {
        this.event = res.data;
        this.pendingDraft = null;
        this.saveState = {
          hasUnsaved: false,
          status: 'Saved ✓',
          lastSaved: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        this.notify();
        return true;
      }

      this.saveState = {
        hasUnsaved: true,
        status: 'Save Failed',
        lastSaved: this.saveState.lastSaved,
        errorMessage:
          res.error?.message || 'Gagal menyimpan ke backend Google Apps Script.',
      };
      this.notify();
      return false;
    } catch (err: any) {
      this.saveState = {
        hasUnsaved: true,
        status: 'Save Failed',
        lastSaved: this.saveState.lastSaved,
        errorMessage:
          err?.message || 'Gagal menyimpan pengaturan event.',
      };
      this.notify();
      return false;
    }
  }

  // ==================== EVENT CONTRACT ====================

  public getEvent(): ScoutEvent {
    return this.event;
  }

  public async updateEvent(updates: Partial<ScoutEvent>): Promise<ScoutEvent> {
    this.saveState = { ...this.saveState, status: 'Saving…' };
    this.notify();

    const eventId = String(this.event.id || '').trim();
    if (!eventId) {
      const message =
        'Event aktif belum terhubung ke backend. Muat ulang Event Studio lalu coba lagi.';
      this.saveState = {
        hasUnsaved: true,
        status: 'Save Failed',
        lastSaved: this.saveState.lastSaved,
        errorMessage: message,
      };
      this.notify();
      throw new Error(message);
    }

    const res = await apiTransport.send<ScoutEvent>(
      'events.update',
      {
        eventId,
        updates,
      },
      {
        timeoutMs: 30000,
      }
    );

    if (res.ok && res.data) {
      this.event = res.data;
      this.saveState = {
        hasUnsaved: false,
        status: 'Saved ✓',
        lastSaved: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Audit refresh is intentionally not allowed to turn a successful
      // event mutation into "Save Failed". GAS event update already records
      // its authoritative audit entry server-side.
      this.notify();
      return res.data;
    }

    const message =
      res.error?.message || 'Gagal memperbarui event di backend Google Apps Script.';

    this.saveState = {
      hasUnsaved: true,
      status: 'Save Failed',
      lastSaved: this.saveState.lastSaved,
      errorMessage: message,
    };
    this.notify();
    throw new Error(message);
  }

  public updateGeneralSettings(updates: Partial<ScoutEvent>): Promise<ScoutEvent> {
    return this.updateEvent(updates);
  }

  public async archiveEvent(eventId?: string): Promise<ScoutEvent> {
    const res = await apiClient.request<ScoutEvent>('/api/events/archive', {
      data: { eventId: eventId || this.event.id },
    });
    if (res.success && res.data) {
      this.event = res.data;
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengarsipkan event.');
  }

  // ==================== SCHEDULE CONTRACT ====================

  public listSchedules(): ScheduleItem[] {
    return this.schedules;
  }

  public getSchedule(): ScheduleItem[] {
    return this.listSchedules();
  }

  public async createSchedule(schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
    this.saveState = { ...this.saveState, status: 'Saving…' };
    this.notify();

    const res = await apiClient.request<ScheduleItem>('/api/schedules/create', {
      data: { schedule },
    });

    if (res.success && res.data) {
      this.schedules.push(res.data);
      this.schedules.sort((a, b) => ((a.dayNumber ?? 0) - (b.dayNumber ?? 0)) || (a.time || '').localeCompare(b.time || ''));
      this.saveState = {
        hasUnsaved: false,
        status: 'Saved ✓',
        lastSaved: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    this.saveState = { ...this.saveState, status: 'Save Failed', errorMessage: res.error };
    this.notify();
    throw new Error(res.error || 'Gagal menambah jadwal.');
  }

  public addSchedule(schedule: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
    return this.createSchedule(schedule);
  }

  public async updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    this.saveState = { ...this.saveState, status: 'Saving…' };
    this.notify();

    const res = await apiClient.request<ScheduleItem>('/api/schedules/update', {
      data: { id, updates },
    });

    if (res.success && res.data) {
      this.schedules = this.schedules.map(s => s.id === id ? res.data! : s);
      this.saveState = {
        hasUnsaved: false,
        status: 'Saved ✓',
        lastSaved: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    this.saveState = { ...this.saveState, status: 'Save Failed', errorMessage: res.error };
    this.notify();
    throw new Error(res.error || 'Gagal memperbarui jadwal.');
  }

  public async duplicateSchedule(id: string): Promise<ScheduleItem> {
    const res = await apiClient.request<ScheduleItem>('/api/schedules/duplicate', {
      data: { id },
    });
    if (res.success && res.data) {
      this.schedules.push(res.data);
      this.schedules.sort((a, b) => ((a.dayNumber ?? 0) - (b.dayNumber ?? 0)) || (a.time || '').localeCompare(b.time || ''));
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menduplikasi jadwal.');
  }

  public async moveSchedule(id: string, newDay: number): Promise<ScheduleItem> {
    const res = await apiClient.request<ScheduleItem>('/api/schedules/move', {
      data: { id, newDay },
    });
    if (res.success && res.data) {
      this.schedules = this.schedules.map(s => s.id === id ? res.data! : s);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memindahkan jadwal.');
  }

  public moveScheduleDay(id: string, newDay: number): Promise<ScheduleItem> {
    return this.moveSchedule(id, newDay);
  }

  public async publishSchedule(id: string, isPublished: boolean): Promise<ScheduleItem> {
    const res = await apiClient.request<ScheduleItem>('/api/schedules/publish', {
      data: { id, isPublished },
    });
    if (res.success && res.data) {
      this.schedules = this.schedules.map(s => s.id === id ? res.data! : s);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengubah status publikasi jadwal.');
  }

  public async archiveSchedule(id: string): Promise<ScheduleItem> {
    const res = await apiClient.request<ScheduleItem>('/api/schedules/archive', {
      data: { id },
    });
    if (res.success && res.data) {
      this.schedules = this.schedules.filter(s => s.id !== id);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengarsipkan jadwal.');
  }

  public deleteSchedule(id: string): Promise<ScheduleItem> {
    return this.archiveSchedule(id);
  }

  // ==================== ACTIVITIES CONTRACT ====================

  public listActivities(): CampActivity[] {
    return this.activities;
  }

  public getActivities(): CampActivity[] {
    return this.listActivities();
  }

  public async createActivity(activity: Omit<CampActivity, 'id'>): Promise<CampActivity> {
    const res = await apiClient.request<CampActivity>('/api/activities/create', {
      data: { activity },
    });
    if (res.success && res.data) {
      this.activities.unshift(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat aktivitas.');
  }

  public addActivity(act: Omit<CampActivity, 'id'>): Promise<CampActivity> {
    return this.createActivity(act);
  }

  public async updateActivity(id: string, updates: Partial<CampActivity>): Promise<CampActivity> {
    const res = await apiClient.request<CampActivity>('/api/activities/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.activities = this.activities.map(a => a.id === id ? res.data! : a);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui aktivitas.');
  }

  public async archiveActivity(id: string): Promise<CampActivity> {
    const res = await apiClient.request<CampActivity>('/api/activities/archive', {
      data: { id },
    });
    if (res.success && res.data) {
      this.activities = this.activities.filter(a => a.id !== id);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengarsipkan aktivitas.');
  }

  public deleteActivity(id: string): Promise<CampActivity> {
    return this.archiveActivity(id);
  }

  public listActivityTypes(): ActivityType[] {
    return this.activityTypes;
  }

  public async createActivityType(activityType: Omit<ActivityType, 'id'>): Promise<ActivityType> {
    const res = await apiClient.request<ActivityType>('/api/activities/types/create', {
      data: { activityType },
    });
    if (res.success && res.data) {
      this.activityTypes.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat tipe aktivitas.');
  }

  // ==================== CAMPSITE CONTRACT ====================

  public listSubcamps(): CampsiteSubcamp[] {
    return this.subcamps;
  }

  public async createSubcamp(subcamp: Omit<CampsiteSubcamp, 'id'>): Promise<CampsiteSubcamp> {
    const res = await apiClient.request<CampsiteSubcamp>('/api/campsite/subcamps/create', {
      data: { subcamp },
    });
    if (res.success && res.data) {
      this.subcamps.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat sub camp.');
  }

  public listZones(): CampsiteZone[] {
    return this.zones;
  }

  public async createZone(zone: Omit<CampsiteZone, 'id'>): Promise<CampsiteZone> {
    const res = await apiClient.request<CampsiteZone>('/api/campsite/zones/create', {
      data: { zone },
    });
    if (res.success && res.data) {
      this.zones.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat zona kemah.');
  }

  public listBlocks(): CampsiteBlock[] {
    return this.blocks;
  }

  public async createBlock(block: Omit<CampsiteBlock, 'id'>): Promise<CampsiteBlock> {
    const res = await apiClient.request<CampsiteBlock>('/api/campsite/blocks/create', {
      data: { block },
    });
    if (res.success && res.data) {
      this.blocks.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat blok tenda.');
  }

  public listLots(): CampsiteLot[] {
    return this.lots;
  }

  public getCampsiteLots(): CampsiteLot[] {
    return this.listLots();
  }

  public async createLot(lot: Omit<CampsiteLot, 'id'>): Promise<CampsiteLot> {
    const res = await apiClient.request<CampsiteLot>('/api/campsite/lots/create', {
      data: { lot },
    });
    if (res.success && res.data) {
      this.lots.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menambah kavling.');
  }

  public addCampsiteLot(lot: Omit<CampsiteLot, 'id'>): Promise<CampsiteLot> {
    return this.createLot(lot);
  }

  public async updateLot(id: string, updates: Partial<CampsiteLot>): Promise<CampsiteLot> {
    const res = await apiClient.request<CampsiteLot>('/api/campsite/lots/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.lots = this.lots.map(l => l.id === id ? res.data! : l);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui kavling.');
  }

  public updateCampsiteLot(id: string, updates: Partial<CampsiteLot>): Promise<CampsiteLot> {
    return this.updateLot(id, updates);
  }

  public deleteCampsiteLot(id: string): void {
    this.lots = this.lots.filter(l => l.id !== id);
    this.notify();
  }

  public async assignContingentToLot(lotId: string, contingentId: string, contingentName: string): Promise<CampsiteLot> {
    const res = await apiClient.request<CampsiteLot>('/api/campsite/lots/assign', {
      data: { lotId, contingentId, contingentName },
    });
    if (res.success && res.data) {
      this.lots = this.lots.map(l => l.id === lotId ? res.data! : l);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menetapkan kontingen ke kavling.');
  }

  public listFacilities(): CampFacility[] {
    return this.facilities;
  }

  public getFacilities(): CampFacility[] {
    return this.listFacilities();
  }

  public async createFacility(facility: Omit<CampFacility, 'id'>): Promise<CampFacility> {
    const res = await apiClient.request<CampFacility>('/api/campsite/facilities/create', {
      data: { facility },
    });
    if (res.success && res.data) {
      this.facilities.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menambah fasilitas.');
  }

  public addFacility(fac: Omit<CampFacility, 'id'>): Promise<CampFacility> {
    return this.createFacility(fac);
  }

  public async updateFacility(id: string, updates: Partial<CampFacility>): Promise<CampFacility> {
    const res = await apiClient.request<CampFacility>('/api/campsite/facilities/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.facilities = this.facilities.map(f => f.id === id ? res.data! : f);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui fasilitas.');
  }

  public deleteFacility(id: string): void {
    this.facilities = this.facilities.filter(f => f.id !== id);
    this.notify();
  }

  // ==================== COMPETITIONS & JUDGING CONTRACT ====================

  public listCompetitionTypes(): CompetitionType[] {
    return this.competitionTypes;
  }

  public async createCompetitionType(competitionType: Omit<CompetitionType, 'id'>): Promise<CompetitionType> {
    const res = await apiClient.request<CompetitionType>('/api/competitions/types/create', {
      data: { competitionType },
    });
    if (res.success && res.data) {
      this.competitionTypes.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat tipe kompetisi.');
  }

  public listCompetitions(): Competition[] {
    return this.competitions;
  }

  public getCompetitions(): Competition[] {
    return this.listCompetitions();
  }

  public async createCompetition(competition: Omit<Competition, 'id' | 'registeredEntries'>): Promise<Competition> {
    const res = await apiClient.request<Competition>('/api/competitions/create', {
      data: { competition },
    });
    if (res.success && res.data) {
      this.competitions.unshift(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat lomba.');
  }

  public addCompetition(comp: Omit<Competition, 'id' | 'registeredEntries'>): Promise<Competition> {
    return this.createCompetition(comp);
  }

  public async updateCompetition(id: string, updates: Partial<Competition>): Promise<Competition> {
    const res = await apiClient.request<Competition>('/api/competitions/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.competitions = this.competitions.map(c => c.id === id ? res.data! : c);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui lomba.');
  }

  public deleteCompetition(id: string): void {
    this.competitions = this.competitions.filter(c => c.id !== id);
    this.notify();
  }

  public listJudgingCriteria(): JudgingCriterion[] {
    return this.criteria;
  }

  public getJudgingCriteria(): JudgingCriterion[] {
    return this.listJudgingCriteria();
  }

  public async configureCriteria(criteria: JudgingCriterion[]): Promise<{ valid: boolean; totalWeight: number }> {
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    const valid = totalWeight === 100;
    this.criteria = criteria;

    const res = await apiClient.request<{ valid: boolean; totalWeight: number; criteria: JudgingCriterion[] }>('/api/competitions/criteria/configure', {
      data: { criteria },
    });

    if (res.success && res.data) {
      this.criteria = res.data.criteria;
      await this.refreshAudit();
      this.notify();
      return { valid: res.data.valid, totalWeight: res.data.totalWeight };
    }
    return { valid, totalWeight };
  }

  public updateJudgingCriteria(criteria: JudgingCriterion[]): { valid: boolean; totalWeight: number } {
    this.configureCriteria(criteria);
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    return { valid: totalWeight === 100, totalWeight };
  }

  public listJudges(): CompetitionJudge[] {
    return this.judges;
  }

  public getJudges(): CompetitionJudge[] {
    return this.listJudges();
  }

  public async assignJudges(judge: Omit<CompetitionJudge, 'id'>): Promise<CompetitionJudge> {
    const res = await apiClient.request<CompetitionJudge>('/api/competitions/judges/assign', {
      data: { judge },
    });
    if (res.success && res.data) {
      this.judges.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menugaskan juri.');
  }

  public addJudge(judge: Omit<CompetitionJudge, 'id'>): Promise<CompetitionJudge> {
    return this.assignJudges(judge);
  }

  public async toggleJudgeLock(judgeId: string): Promise<CompetitionJudge> {
    const res = await apiClient.request<CompetitionJudge>('/api/competitions/judges/toggle-lock', {
      data: { judgeId },
    });
    if (res.success && res.data) {
      this.judges = this.judges.map(j => j.id === judgeId ? res.data! : j);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengubah kunci juri.');
  }

  public deleteJudge(judgeId: string): void {
    this.judges = this.judges.filter(j => j.id !== judgeId);
    this.notify();
  }

  public getVotingConfig(): VotingConfig {
    return this.votingConfig;
  }

  public async configureVoting(config: Partial<VotingConfig>): Promise<VotingConfig> {
    const res = await apiClient.request<VotingConfig>('/api/competitions/voting/configure', {
      data: { config },
    });
    if (res.success && res.data) {
      this.votingConfig = res.data;
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengonfigurasi voting.');
  }

  public updateVotingConfig(updates: Partial<VotingConfig>): Promise<VotingConfig> {
    return this.configureVoting(updates);
  }

  // ==================== REGISTRATION CONTRACT ====================

  public getRegistrationSettings(): RegistrationSettings {
    return this.registrationSettings;
  }

  public async updateRegistrationSettings(settings: Partial<RegistrationSettings>): Promise<RegistrationSettings> {
    const res = await apiClient.request<RegistrationSettings>('/api/registration/settings/update', {
      data: { settings },
    });
    if (res.success && res.data) {
      this.registrationSettings = res.data;
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui pengaturan registrasi.');
  }

  public listDynamicFields(): RegistrationFieldConfig[] {
    return this.dynamicFields;
  }

  public getRegistrationFields(): RegistrationFieldConfig[] {
    return this.listDynamicFields();
  }

  public async createDynamicField(field: Omit<RegistrationFieldConfig, 'id'>): Promise<RegistrationFieldConfig> {
    const res = await apiClient.request<RegistrationFieldConfig>('/api/registration/fields/create', {
      data: { field },
    });
    if (res.success && res.data) {
      this.dynamicFields.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat kolom formulir dinamis.');
  }

  public addRegistrationField(field: Omit<RegistrationFieldConfig, 'id'>): Promise<RegistrationFieldConfig> {
    return this.createDynamicField(field);
  }

  public async updateDynamicField(id: string, updates: Partial<RegistrationFieldConfig>): Promise<RegistrationFieldConfig> {
    const res = await apiClient.request<RegistrationFieldConfig>('/api/registration/fields/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.dynamicFields = this.dynamicFields.map(f => f.id === id ? res.data! : f);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui kolom formulir.');
  }

  public updateRegistrationField(id: string, updates: Partial<RegistrationFieldConfig>): Promise<RegistrationFieldConfig> {
    return this.updateDynamicField(id, updates);
  }

  // ==================== GAMIFICATION CONTRACT ====================

  public listPointRules(): PointRuleConfig[] {
    return this.pointRules;
  }

  public getPointRules(): PointRuleConfig[] {
    return this.listPointRules();
  }

  public async createPointRule(rule: Omit<PointRuleConfig, 'id'>): Promise<PointRuleConfig> {
    const res = await apiClient.request<PointRuleConfig>('/api/gamification/points/create', {
      data: { rule },
    });
    if (res.success && res.data) {
      this.pointRules.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat aturan XP.');
  }

  public addPointRule(rule: Omit<PointRuleConfig, 'id'>): Promise<PointRuleConfig> {
    return this.createPointRule(rule);
  }

  public async updatePointRule(id: string, updates: Partial<PointRuleConfig>): Promise<PointRuleConfig> {
    const res = await apiClient.request<PointRuleConfig>('/api/gamification/points/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.pointRules = this.pointRules.map(r => r.id === id ? res.data! : r);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui aturan XP.');
  }

  public deletePointRule(id: string): void {
    this.pointRules = this.pointRules.filter(r => r.id !== id);
    this.notify();
  }

  public listBadges(): BadgeConfig[] {
    return this.badges;
  }

  public getBadges(): BadgeConfig[] {
    return this.listBadges();
  }

  public async createBadge(badge: Omit<BadgeConfig, 'id'>): Promise<BadgeConfig> {
    const res = await apiClient.request<BadgeConfig>('/api/gamification/badges/create', {
      data: { badge },
    });
    if (res.success && res.data) {
      this.badges.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat lencana.');
  }

  public addBadge(badge: Omit<BadgeConfig, 'id'>): Promise<BadgeConfig> {
    return this.createBadge(badge);
  }

  public async updateBadge(id: string, updates: Partial<BadgeConfig>): Promise<BadgeConfig> {
    const res = await apiClient.request<BadgeConfig>('/api/gamification/badges/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.badges = this.badges.map(b => b.id === id ? res.data! : b);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui lencana.');
  }

  public deleteBadge(id: string): void {
    this.badges = this.badges.filter(b => b.id !== id);
    this.notify();
  }

  public listCheckpoints(): QrCheckpoint[] {
    return this.checkpoints;
  }

  public getCheckpoints(): QrCheckpoint[] {
    return this.listCheckpoints();
  }

  public async createCheckpoint(checkpoint: Omit<QrCheckpoint, 'id' | 'scanCount'>): Promise<QrCheckpoint> {
    const res = await apiClient.request<QrCheckpoint>('/api/gamification/checkpoints/create', {
      data: { checkpoint },
    });
    if (res.success && res.data) {
      this.checkpoints.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat checkpoint.');
  }

  public addCheckpoint(chk: Omit<QrCheckpoint, 'id' | 'scanCount'>): Promise<QrCheckpoint> {
    return this.createCheckpoint(chk);
  }

  public async updateCheckpoint(id: string, updates: Partial<QrCheckpoint>): Promise<QrCheckpoint> {
    const res = await apiClient.request<QrCheckpoint>('/api/gamification/checkpoints/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.checkpoints = this.checkpoints.map(c => c.id === id ? res.data! : c);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui checkpoint.');
  }

  public deleteCheckpoint(id: string): void {
    this.checkpoints = this.checkpoints.filter(c => c.id !== id);
    this.notify();
  }

  public async regenerateCheckpointQr(id: string): Promise<string> {
    const res = await apiClient.request<{ qrCode: string }>('/api/gamification/checkpoints/regenerate', {
      data: { id },
    });
    if (res.success && res.data) {
      this.checkpoints = this.checkpoints.map(c => c.id === id ? { ...c, qrCode: res.data!.qrCode } : c);
      await this.refreshAudit();
      this.notify();
      return res.data!.qrCode;
    }
    throw new Error(res.error || 'Gagal regenerasi kode QR.');
  }

  // ==================== EVENT FEATURES CONTRACT ====================

  public getEventFeatures(): ScoutEvent['features'] {
    return this.event.features;
  }

  public async updateEventFeature(featureKey: keyof ScoutEvent['features'], enabled: boolean): Promise<ScoutEvent['features']> {
    const res = await apiClient.request<ScoutEvent['features']>('/api/features/update', {
      data: { featureKey, enabled },
    });
    if (res.success && res.data) {
      this.event.features = res.data;
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui sakelar fitur.');
  }

  public toggleFeature(featureKey: keyof ScoutEvent['features']): Promise<ScoutEvent['features']> {
    const curr = this.event.features[featureKey];
    return this.updateEventFeature(featureKey, !curr);
  }

  public async reorderHomepageSections(sections: HomeSectionConfig[]): Promise<HomeSectionConfig[]> {
    const res = await apiClient.request<HomeSectionConfig[]>('/api/features/home-sections/reorder', {
      data: { sections },
    });
    if (res.success && res.data) {
      this.event.homeSections = res.data;
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui susunan seksi beranda.');
  }

  public updateHomeSections(sections: HomeSectionConfig[]): Promise<HomeSectionConfig[]> {
    return this.reorderHomepageSections(sections);
  }

  // ==================== CONTENT & CONTACTS CONTRACT ====================

  public listEventPages(): CustomInfoPage[] {
    return this.customPages;
  }

  public getCustomPages(): CustomInfoPage[] {
    return this.listEventPages();
  }

  public async createEventPage(page: Omit<CustomInfoPage, 'id'>): Promise<CustomInfoPage> {
    const res = await apiClient.request<CustomInfoPage>('/api/content/pages/create', {
      data: { page },
    });
    if (res.success && res.data) {
      this.customPages.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal membuat halaman informasi.');
  }

  public addCustomPage(page: Omit<CustomInfoPage, 'id'>): Promise<CustomInfoPage> {
    return this.createEventPage(page);
  }

  public async updateEventPage(id: string, updates: Partial<CustomInfoPage>): Promise<CustomInfoPage> {
    const res = await apiClient.request<CustomInfoPage>('/api/content/pages/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.customPages = this.customPages.map(p => p.id === id ? res.data! : p);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui halaman.');
  }

  public updateCustomPage(id: string, updates: Partial<CustomInfoPage>): Promise<CustomInfoPage> {
    return this.updateEventPage(id, updates);
  }

  public deleteCustomPage(id: string): void {
    this.customPages = this.customPages.filter(p => p.id !== id);
    this.notify();
  }

  public listEventContacts(): EventContactItem[] {
    return this.contacts;
  }

  public async createEventContact(contact: Omit<EventContactItem, 'id'>): Promise<EventContactItem> {
    const res = await apiClient.request<EventContactItem>('/api/content/contacts/create', {
      data: { contact },
    });
    if (res.success && res.data) {
      this.contacts.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal menambah kontak posko.');
  }

  public async updateEventContact(id: string, updates: Partial<EventContactItem>): Promise<EventContactItem> {
    const res = await apiClient.request<EventContactItem>('/api/content/contacts/update', {
      data: { id, updates },
    });
    if (res.success && res.data) {
      this.contacts = this.contacts.map(c => c.id === id ? res.data! : c);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal memperbarui kontak.');
  }

  // ==================== AUDIT CONTRACT ====================

  public listAuditLog(): AuditLog[] {
    return this.auditLogs;
  }

  public getAuditLogs(): AuditLog[] {
    return this.listAuditLog();
  }

  public addAuditLogEntry(action: string, details: string, user: string = 'Administrator Sistem'): void {
    const entry: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      user,
      action,
      details,
    };
    this.auditLogs.unshift(entry);
    this.notify();
  }

  private async refreshAudit(): Promise<void> {
    const res = await apiClient.request<AuditLog[]>('/api/audit/list', {
      data: { eventId: this.event.id },
    });
    if (res.success && res.data) {
      this.auditLogs = res.data;
    }
  }

  // ==================== ORGANIZATIONS CONTRACT ====================

  public listOrganizations(): Organization[] {
    return this.organizations;
  }

  public async createOrganization(organization: Omit<Organization, 'organization_id'>): Promise<Organization> {
    const res = await apiClient.request<Organization>('/api/organizations/create', {
      data: { organization },
    });
    if (res.success && res.data) {
      this.organizations.push(res.data);
      await this.refreshAudit();
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mendaftarkan organisasi.');
  }

  // ==================== OPERATIONAL INTEGRITY & READINESS ====================

  public async getEventReadiness(): Promise<EventReadinessReport> {
    const res = await apiClient.request<EventReadinessReport>('/api/readiness/get');
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error || 'Gagal menghitung skor kesiapan event.');
  }

  public async detectScheduleConflicts(): Promise<ScheduleConflict[]> {
    const res = await apiClient.request<ScheduleConflict[]>('/api/conflicts/schedules');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  }

  public async validateCampsiteCapacity(): Promise<CampsiteCapacityReport> {
    const res = await apiClient.request<CampsiteCapacityReport>('/api/campsite/capacity-check');
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error || 'Gagal memvalidasi daya tampung perkemahan.');
  }

  public async validateCompetitionReadiness(competitionId?: string): Promise<CompetitionReadiness[]> {
    const res = await apiClient.request<CompetitionReadiness[]>('/api/competitions/readiness', {
      data: { competitionId },
    });
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  }

  public async listDevices(): Promise<RegisteredDevice[]> {
    const res = await apiClient.request<RegisteredDevice[]>('/api/devices/list');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  }

  public async revokeDevice(deviceId: string): Promise<RegisteredDevice> {
    const res = await apiClient.request<RegisteredDevice>('/api/devices/revoke', {
      data: { deviceId },
    });
    if (res.success && res.data) {
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mencabut akses perangkat.');
  }

  public async activateDevice(deviceId: string): Promise<RegisteredDevice> {
    const res = await apiClient.request<RegisteredDevice>('/api/devices/activate', {
      data: { deviceId },
    });
    if (res.success && res.data) {
      this.notify();
      return res.data;
    }
    throw new Error(res.error || 'Gagal mengaktifkan kembali perangkat.');
  }

  public async downloadRoleScopedSnapshot(): Promise<RoleScopedSnapshot | null> {
    const res = await apiClient.request<RoleScopedSnapshot>('/api/sync/snapshot');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  }
}

export const eventStudioService = new EventStudioService();
