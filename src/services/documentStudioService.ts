/**
 * @license
 * SiEpang - Canonical Document Template Studio Service (Requirements 123 - 200)
 * Canva-like visual template designer, dynamic field binding, officials/signatories management,
 * customer Google Drive storage abstraction, chunked batch generation, and public certificate verification.
 */

import {
  DocumentTemplate,
  TemplateElement,
  DocumentType,
  Signatory,
  GeneratedDocumentSnapshot,
  DocumentGenerationBatch,
  DocumentNumberRule,
  PageSize,
  PageOrientation,
  DynamicFieldSource,
} from '../types';
import { participantService } from './participantService';
import { featureControlService } from './featureControlService';
import { eventService } from './eventService';
import { adminPersistenceService } from './adminPersistenceService';

export const PAPER_DIMENSIONS: Record<PageSize, { widthMm: number; heightMm: number; label: string }> = {
  CR80: { widthMm: 54, heightMm: 86, label: 'ID Card (CR-80: 54 × 86 mm)' },
  A6: { widthMm: 105, heightMm: 148, label: 'A6 (105 × 148 mm)' },
  A5: { widthMm: 148, heightMm: 210, label: 'A5 (148 × 210 mm)' },
  A4: { widthMm: 210, heightMm: 297, label: 'A4 Standar (210 × 297 mm)' },
  CUSTOM: { widthMm: 200, heightMm: 200, label: 'Kustom' },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { label: string; icon: string; category: 'ID_CARD' | 'CERTIFICATE' | 'LETTER' | 'OTHER' }> = {
  ID_CARD_PARTICIPANT: { label: 'ID Card Peserta', icon: '🪪', category: 'ID_CARD' },
  ID_CARD_COMMITTEE: { label: 'ID Card Panitia', icon: '🪪', category: 'ID_CARD' },
  ID_CARD_OFFICIAL: { label: 'ID Card Pejabat / Mabiran', icon: '🪪', category: 'ID_CARD' },
  ID_CARD_JUDGE: { label: 'ID Card Dewan Juri', icon: '🪪', category: 'ID_CARD' },
  ID_CARD_VISITOR: { label: 'ID Card Pengunjung / Tamu', icon: '🪪', category: 'ID_CARD' },
  CERTIFICATE_PARTICIPANT: { label: 'Sertifikat Peserta', icon: '📜', category: 'CERTIFICATE' },
  CERTIFICATE_COMMITTEE: { label: 'Sertifikat Panitia', icon: '📜', category: 'CERTIFICATE' },
  CERTIFICATE_JUDGE: { label: 'Sertifikat Dewan Juri', icon: '📜', category: 'CERTIFICATE' },
  CERTIFICATE_WINNER: { label: 'Piagam Juara Lomba', icon: '🏅', category: 'CERTIFICATE' },
  CERTIFICATE_SPEAKER: { label: 'Piagam Pemateri / Narasumber', icon: '🎖️', category: 'CERTIFICATE' },
  CERTIFICATE_VOLUNTEER: { label: 'Sertifikat Relawan', icon: '📜', category: 'CERTIFICATE' },
  PIAGAM_PENGHARGAAN: { label: 'Piagam Penghargaan Umum', icon: '🏅', category: 'CERTIFICATE' },
  SURAT_TUGAS: { label: 'Surat Tugas / Mandat', icon: '📄', category: 'LETTER' },
  BADGE_CARD: { label: 'Kartu Tanda Kecakapan / Badge', icon: '🔰', category: 'OTHER' },
  CUSTOM_DOCUMENT: { label: 'Dokumen Kustom', icon: '📑', category: 'OTHER' },
};

export interface DynamicFieldMeta {
  source: string;
  category: 'Peserta' | 'Pembina' | 'Panitia' | 'Juri' | 'Kontingen' | 'Organisasi' | 'Event' | 'Dokumen' | 'Penandatangan';
  label: string;
  sampleValue: string;
}

export const AVAILABLE_DYNAMIC_FIELDS: DynamicFieldMeta[] = [
  // Peserta
  { source: 'participant.full_name', category: 'Peserta', label: 'Nama Lengkap Peserta', sampleValue: 'Nama Peserta' },
  { source: 'participant.participant_number', category: 'Peserta', label: 'Nomor Peserta (Nomer Registrasi)', sampleValue: 'NOMOR-001' },
  { source: 'participant.nta', category: 'Peserta', label: 'Nomor Tanda Anggota (NTA)', sampleValue: '00.00.00.0000' },
  { source: 'participant.gender', category: 'Peserta', label: 'Jenis Kelamin (Putra / Putri)', sampleValue: 'Putra' },
  { source: 'participant.role', category: 'Peserta', label: 'Peran / Jabatan Peserta', sampleValue: 'Penggalang' },
  { source: 'participant.photo', category: 'Peserta', label: 'Foto Resmi Peserta', sampleValue: '' },
  { source: 'participant.contingent', category: 'Peserta', label: 'Nama Kontingen / Gudep', sampleValue: 'Nama Kontingen' },
  { source: 'participant.subcamp', category: 'Peserta', label: 'Sub Kemah / Kavling Tenda', sampleValue: 'Kavling Tenda' },

  // Pembina, Panitia & Juri
  { source: 'official.photo', category: 'Pembina', label: 'Foto Resmi Pembina / Pinkon', sampleValue: '' },
  { source: 'committee.photo', category: 'Panitia', label: 'Foto Resmi Panitia', sampleValue: '' },
  { source: 'judge.photo', category: 'Juri', label: 'Foto Resmi Dewan Juri', sampleValue: '' },

  // Kontingen & Organisasi
  { source: 'contingent.name', category: 'Kontingen', label: 'Nama Regu / Pangkalan', sampleValue: 'Nama Regu' },
  { source: 'organization.name', category: 'Organisasi', label: 'Nama Kwartir / Lembaga', sampleValue: 'Nama Kwartir' },
  { source: 'organization.code', category: 'Organisasi', label: 'Kode Kwarran / Gudep', sampleValue: '00.00.00' },

  // Event
  { source: 'event.name', category: 'Event', label: 'Nama Lengkap Event', sampleValue: 'Nama Kegiatan Perkemahan' },
  { source: 'event.short_name', category: 'Event', label: 'Nama Singkat Event', sampleValue: 'Nama Singkat' },
  { source: 'event.location', category: 'Event', label: 'Lokasi Bumi Perkemahan', sampleValue: 'Bumi Perkemahan' },
  { source: 'event.start_date', category: 'Event', label: 'Tanggal Mulai', sampleValue: '01 Januari 2026' },
  { source: 'event.end_date', category: 'Event', label: 'Tanggal Selesai', sampleValue: '03 Januari 2026' },
  { source: 'event.year', category: 'Event', label: 'Tahun Kegiatan', sampleValue: '2026' },
  { source: 'event.theme', category: 'Event', label: 'Tema Perkemahan', sampleValue: 'Tema Kegiatan' },

  // Dokumen
  { source: 'document.number', category: 'Dokumen', label: 'Nomor Surat / Piagam Resmi', sampleValue: 'NOMOR/SURAT/001' },
  { source: 'document.issue_date', category: 'Dokumen', label: 'Tanggal Penerbitan Dokumen', sampleValue: '01 Januari 2026' },
  { source: 'document.role', category: 'Dokumen', label: 'Kategori / Sebagai', sampleValue: 'Peserta' },
  { source: 'document.award_title', category: 'Dokumen', label: 'Predikat / Penghargaan', sampleValue: 'Penghargaan' },
  { source: 'document.verification_url', category: 'Dokumen', label: 'Tautan Verifikasi Keaslian', sampleValue: 'https://siepang.app/verify/certificate' },

  // Penandatangan
  { source: 'signatory.1.name', category: 'Penandatangan', label: 'Nama Penandatangan 1', sampleValue: 'Nama Penandatangan 1' },
  { source: 'signatory.1.title', category: 'Penandatangan', label: 'Jabatan Penandatangan 1', sampleValue: 'Jabatan 1' },
  { source: 'signatory.2.name', category: 'Penandatangan', label: 'Nama Penandatangan 2', sampleValue: 'Nama Penandatangan 2' },
  { source: 'signatory.2.title', category: 'Penandatangan', label: 'Jabatan Penandatangan 2', sampleValue: 'Jabatan 2' },
];

class DocumentStudioService {
  private templates: DocumentTemplate[] = [];
  private signatories: Signatory[] = [];
  private generatedDocuments: GeneratedDocumentSnapshot[] = [];
  private batches: DocumentGenerationBatch[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    setTimeout(() => void this.refreshFromBackend(), 0);
  }

  private async refreshFromBackend(): Promise<void> {
    const [templateRows, generatedRows, signatories] = await Promise.all([
      adminPersistenceService.list<any>('documentTemplates'),
      adminPersistenceService.list<any>('generatedDocuments'),
      adminPersistenceService.getConfig<Signatory[]>('DOCUMENT_SIGNATORIES'),
    ]);

    this.templates = templateRows.map((r: any) => {
      const payload = typeof r.template_json === 'object' && r.template_json ? r.template_json : {};
      return {
        ...payload,
        id: r.id,
        workspaceId: r.workspace_id || payload.workspaceId || '',
        name: r.name || payload.name || 'Template',
        documentType: r.template_type || payload.documentType || 'CERTIFICATE_PARTICIPANT',
        backgroundFileId: r.drive_file_id || payload.backgroundFileId,
        status: r.status || payload.status || 'DRAFT',
        updatedAt: r.updated_at || payload.updatedAt || '',
      } as DocumentTemplate;
    });

    this.generatedDocuments = generatedRows.map((r: any) => {
      const payload = typeof r.snapshot_json === 'object' && r.snapshot_json ? r.snapshot_json : {};
      return {
        ...payload,
        id: r.id,
        templateId: r.template_id || payload.templateId,
        recipientId: r.recipient_id || payload.recipientId,
        recipientCategory: r.recipient_type || payload.recipientCategory,
        documentNumber: r.serial_number || payload.documentNumber,
        verificationToken: r.verification_token || payload.verificationToken,
        outputFileId: r.drive_file_id || payload.outputFileId,
        generatedAt: r.generated_at || payload.generatedAt,
      } as GeneratedDocumentSnapshot;
    });

    this.signatories = Array.isArray(signatories) ? signatories : [];
    this.notify();
  }

  public getTemplates(filters?: { type?: DocumentType; status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }): DocumentTemplate[] {
    let list = [...this.templates];
    if (filters?.type) list = list.filter(t => t.documentType === filters.type);
    if (filters?.status) list = list.filter(t => t.status === filters.status);
    return list;
  }

  public getTemplateById(id: string): DocumentTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  private async persistTemplate(template: DocumentTemplate): Promise<DocumentTemplate> {
    const saved = await adminPersistenceService.upsert<any>('documentTemplates', {
      id: template.id?.startsWith('TMPL-') ? undefined : template.id || undefined,
      workspace_id: template.workspaceId || '',
      template_type: template.documentType,
      name: template.name,
      drive_file_id: template.backgroundFileId || '',
      placeholders_json: (template.elements || []).map((el: any) => el.dataSource).filter(Boolean),
      status: template.status || 'DRAFT',
      updated_at: new Date().toISOString(),
      template_json: template,
    });
    return { ...template, id: saved.id, updatedAt: saved.updated_at || template.updatedAt } as DocumentTemplate;
  }

  public async createTemplate(data: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const pSize = data.pageSize || 'A4';
    const dim = PAPER_DIMENSIONS[pSize];
    const orientation = data.orientation || (pSize === 'CR80' ? 'PORTRAIT' : 'LANDSCAPE');
    const width = orientation === 'PORTRAIT' ? Math.min(dim.widthMm, dim.heightMm) : Math.max(dim.widthMm, dim.heightMm);
    const height = orientation === 'PORTRAIT' ? Math.max(dim.widthMm, dim.heightMm) : Math.min(dim.widthMm, dim.heightMm);

    const draft: DocumentTemplate = {
      id: '',
      workspaceId: data.workspaceId || '',
      eventId: data.eventId,
      name: data.name || 'Template Baru',
      documentType: data.documentType || 'CERTIFICATE_PARTICIPANT',
      pageSize: pSize,
      orientation,
      widthMm: data.widthMm || width,
      heightMm: data.heightMm || height,
      unit: 'mm',
      backgroundUrl: data.backgroundUrl || '',
      backgroundFileId: data.backgroundFileId,
      backgroundBehavior: data.backgroundBehavior || 'cover',
      hasBackPage: !!data.hasBackPage,
      backBackgroundUrl: data.backBackgroundUrl || '',
      backBackgroundBehavior: data.backBackgroundBehavior || 'cover',
      elements: data.elements || this.getDefaultElementsForType(data.documentType || 'CERTIFICATE_PARTICIPANT'),
      numberingRule: data.numberingRule || {
        id: `RULE-${Date.now()}`,
        prefix: data.documentType?.startsWith('ID_CARD') ? 'ID' : 'CERT',
        eventCodePattern: 'EVENT',
        includeYear: true,
        separator: '/',
        sequenceLength: 4,
        currentSequence: 0,
      },
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Admin SiEpang',
    };

    const saved = await this.persistTemplate(draft);
    this.templates.unshift(saved);
    this.notify();
    return saved;
  }

  public async updateTemplate(id: string, updates: Partial<DocumentTemplate>, bumpVersion = false): Promise<DocumentTemplate> {
    const idx = this.templates.findIndex(t => t.id === id);
    if (idx < 0) throw new Error('Template tidak ditemukan');
    const prev = this.templates[idx];
    const candidate = {
      ...prev,
      ...updates,
      id,
      version: bumpVersion ? prev.version + 1 : prev.version,
      updatedAt: new Date().toISOString(),
    } as DocumentTemplate;
    const saved = await this.persistTemplate(candidate);
    this.templates[idx] = saved;
    this.notify();
    return saved;
  }

  public async duplicateTemplate(id: string, newName?: string): Promise<DocumentTemplate> {
    const source = this.getTemplateById(id);
    if (!source) throw new Error('Template sumber tidak ditemukan');
    return this.createTemplate({
      ...JSON.parse(JSON.stringify(source)),
      id: undefined,
      name: newName || `${source.name} (Salinan)`,
      status: 'DRAFT',
      version: 1,
      createdAt: undefined,
      updatedAt: undefined,
    } as any);
  }

  public async deleteTemplate(id: string): Promise<boolean> {
    const exists = this.templates.some(t => t.id === id);
    if (!exists) return false;
    await adminPersistenceService.archive('documentTemplates', id, { status: 'ARCHIVED' });
    this.templates = this.templates.filter(t => t.id !== id);
    this.notify();
    return true;
  }

  public getSignatories(): Signatory[] {
    return [...this.signatories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getSignatoryById(id: string): Signatory | undefined {
    return this.signatories.find(s => s.id === id);
  }

  public async saveSignatory(data: Partial<Signatory>): Promise<Signatory> {
    let item: Signatory;
    if (data.id && this.signatories.some(s => s.id === data.id)) {
      item = {
        ...this.signatories.find(s => s.id === data.id)!,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.signatories = this.signatories.map(s => s.id === item.id ? item : s);
    } else {
      item = {
        id: `SIG-${Date.now()}`,
        workspaceId: data.workspaceId || '',
        eventId: data.eventId,
        fullName: data.fullName || 'Pejabat Penandatangan',
        positionTitle: data.positionTitle || 'Ketua Kwartir',
        organizationName: data.organizationName || 'Kwartir Penyelenggara',
        nta: data.nta || '',
        signatureUrl: data.signatureUrl || '',
        stampUrl: data.stampUrl || '',
        status: data.status || 'ACTIVE',
        roleType: data.roleType || 'CHAIRPERSON',
        displayOrder: this.signatories.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Signatory;
      this.signatories.push(item);
    }
    await adminPersistenceService.setConfig('DOCUMENT_SIGNATORIES', this.signatories);
    this.notify();
    return item;
  }

  public async deleteSignatory(id: string): Promise<boolean> {
    const exists = this.signatories.some(s => s.id === id);
    if (!exists) return false;
    const next = this.signatories.filter(s => s.id !== id);
    await adminPersistenceService.setConfig('DOCUMENT_SIGNATORIES', next);
    this.signatories = next;
    this.notify();
    return true;
  }

  public resolveFieldValue(
    source: DynamicFieldSource | string | undefined,
    context: {
      participant?: any;
      contingent?: any;
      event?: any;
      signatories?: Signatory[];
      customRole?: string;
      docNumber?: string;
    }
  ): string {
    if (!source) return '';
    const p = context.participant || {};
    const c = context.contingent || {};
    const e = context.event || {};
    const sigs = context.signatories || this.getSignatories();
    const map: Record<string, string> = {
      'participant.full_name': p.name || p.full_name || '',
      'participant.participant_number': p.code || p.participant_number || '',
      'participant.nta': p.nta || p.membershipNumber || '',
      'participant.photo': p.profile_photo_url || p.photoUrl || '',
      'official.photo': p.official_photo_url || p.profile_photo_url || '',
      'committee.photo': p.committee_photo_url || p.profile_photo_url || '',
      'judge.photo': p.judge_photo_url || p.profile_photo_url || '',
      'participant.gender': p.gender === 'M' || p.gender === 'L' ? 'Putra' : 'Putri',
      'participant.role': p.role || 'Peserta',
      'participant.contingent': p.contingentName || c.name || '',
      'participant.subcamp': p.campsite_lot || p.subCamp || '',
      'contingent.name': c.name || p.contingentName || '',
      'organization.name': e.organizer || '',
      'organization.code': e.organizationCode || '',
      'event.name': e.name || '',
      'event.short_name': e.shortName || '',
      'event.location': e.location || '',
      'event.start_date': e.startDate || '',
      'event.end_date': e.endDate || '',
      'event.year': e.year || new Date().getFullYear().toString(),
      'event.theme': e.theme || '',
      'document.number': context.docNumber || '',
      'document.issue_date': new Date().toLocaleDateString('id-ID'),
      'document.role': context.customRole || 'Peserta',
      'document.verification_url': context.docNumber ? `https://siepang.vercel.app/verify/certificate/${encodeURIComponent(context.docNumber)}` : '',
      'signatory.1.name': sigs[0]?.fullName || '',
      'signatory.1.title': sigs[0]?.positionTitle || '',
      'signatory.2.name': sigs[1]?.fullName || '',
      'signatory.2.title': sigs[1]?.positionTitle || '',
    };
    return map[source] || '';
  }

  public async generateSingleDocument(params: {
    templateId: string;
    participantId: string;
    customRole?: string;
    awardTitle?: string;
  }): Promise<GeneratedDocumentSnapshot> {
    const tmpl = this.getTemplateById(params.templateId);
    if (!tmpl) throw new Error('Template dokumen tidak ditemukan');
    const participant = participantService.getParticipants().find(p => p.id === params.participantId);
    if (!participant) throw new Error(`Data peserta '${params.participantId}' tidak ditemukan.`);

    const nextSeq = (tmpl.numberingRule?.currentSequence || 100) + 1;
    if (tmpl.numberingRule) tmpl.numberingRule.currentSequence = nextSeq;
    const docNum = tmpl.numberingRule
      ? `${tmpl.numberingRule.prefix}/${tmpl.numberingRule.eventCodePattern || 'DOC'}/${new Date().getFullYear()}/${String(nextSeq).padStart(tmpl.numberingRule.sequenceLength || 4, '0')}`
      : `DOC-${Date.now()}`;
    const token = `v_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const activeEvent = eventService.getCurrentEvent();

    const snapshot: GeneratedDocumentSnapshot = {
      id: '',
      documentNumber: docNum,
      verificationToken: token,
      templateId: tmpl.id,
      templateVersion: tmpl.version,
      documentType: tmpl.documentType,
      recipientId: participant.id,
      recipientName: participant.name,
      recipientCategory: params.customRole || 'Peserta',
      contingentName: participant.contingentName,
      eventId: tmpl.eventId || activeEvent.id || '',
      eventName: activeEvent.name || '',
      issueDate: new Date().toLocaleDateString('id-ID'),
      outputFileUrl: tmpl.backgroundUrl || '',
      outputFileId: '',
      outputDrivePath: '',
      generatedBy: 'Admin SiEpang',
      generatedAt: new Date().toISOString(),
      signatoriesSnapshot: this.getSignatories().map(s => ({
        fullName: s.fullName,
        positionTitle: s.positionTitle,
        organizationName: s.organizationName,
      })),
      isValid: true,
    };

    const saved = await adminPersistenceService.upsert<any>('generatedDocuments', {
      template_id: tmpl.id,
      batch_id: '',
      recipient_id: participant.id,
      recipient_type: snapshot.recipientCategory,
      serial_number: docNum,
      verification_token: token,
      drive_file_id: '',
      generation_status: 'GENERATED',
      verified_count: 0,
      generated_at: snapshot.generatedAt,
      snapshot_json: snapshot,
    });
    snapshot.id = saved.id;
    this.generatedDocuments.unshift(snapshot);
    await this.updateTemplate(tmpl.id, { numberingRule: tmpl.numberingRule } as any);
    this.notify();
    return snapshot;
  }

  public async runBatchGeneration(params: {
    templateId: string;
    targetFilter: 'all' | 'contingent' | 'role';
    targetValue?: string;
    onProgress?: (processed: number, total: number) => void;
  }): Promise<DocumentGenerationBatch> {
    const tmpl = this.getTemplateById(params.templateId);
    if (!tmpl) throw new Error('Template dokumen tidak ditemukan');
    let participants = participantService.getParticipants();
    if (params.targetFilter === 'contingent' && params.targetValue) {
      participants = participants.filter(p => p.contingentId === params.targetValue || p.contingentName === params.targetValue);
    } else if (params.targetFilter === 'role' && params.targetValue) {
      participants = participants.filter(p => p.role === params.targetValue);
    }
    if (!participants.length) throw new Error('Belum ada data peserta untuk pembuatan batch dokumen.');

    const batch: DocumentGenerationBatch = {
      id: `BATCH-${Date.now()}`,
      title: `Batch ${DOCUMENT_TYPE_LABELS[tmpl.documentType]?.label || 'Dokumen'} (${participants.length} Peserta)`,
      documentType: tmpl.documentType,
      templateId: tmpl.id,
      targetCount: participants.length,
      processedCount: 0,
      failedCount: 0,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      outputDriveFolder: '',
    };
    this.batches.unshift(batch);

    for (const p of participants) {
      try {
        await this.generateSingleDocument({ templateId: tmpl.id, participantId: p.id });
        batch.processedCount++;
      } catch {
        batch.failedCount++;
      }
      params.onProgress?.(batch.processedCount + batch.failedCount, participants.length);
    }
    batch.status = 'COMPLETED';
    batch.completedAt = new Date().toISOString();
    this.notify();
    return batch;
  }

  public verifyPublicDocument(tokenOrNumber: string) {
    const q = tokenOrNumber.trim().toLowerCase();
    const doc = this.generatedDocuments.find(
      d => d.documentNumber.toLowerCase() === q || d.verificationToken.toLowerCase() === q
    );
    if (!doc) {
      return { isValid: false, recipientName: '-', documentType: '-', eventName: '-', documentNumber: tokenOrNumber, issueDate: '-', signatoryName: '-' };
    }
    return {
      isValid: true,
      recipientName: doc.recipientName,
      documentType: DOCUMENT_TYPE_LABELS[doc.documentType]?.label || 'Dokumen Resmi',
      eventName: doc.eventName,
      documentNumber: doc.documentNumber,
      issueDate: doc.issueDate,
      signatoryName: doc.signatoriesSnapshot[0]?.fullName || '',
    };
  }

  public getGeneratedDocuments(): GeneratedDocumentSnapshot[] {
    return [...this.generatedDocuments];
  }

  public getBatches(): DocumentGenerationBatch[] {
    return [...this.batches];
  }

  private getDefaultElementsForType(type: DocumentType): TemplateElement[] {
    if (type.startsWith('ID_CARD')) {
      return [
        {
          id: 'EL-DEF-02', name: 'Foto Peserta', page: 'FRONT', type: 'PHOTO',
          x: 25, y: 18, width: 50, height: 32, rotation: 0, zIndex: 15,
          dataSource: 'participant.photo', photoCrop: 'rounded',
          borderColor: '#E2E8F0', borderWidth: 2, borderRadius: 12,
          visible: true, locked: false,
        },
        {
          id: 'EL-DEF-03', name: 'Nama Lengkap', page: 'FRONT', type: 'DYNAMIC_TEXT',
          x: 5, y: 53, width: 90, height: 8, rotation: 0, zIndex: 20,
          dataSource: 'participant.full_name', fontFamily: 'Inter',
          fontSize: 14, fontWeight: 'bold', color: '#FFFFFF',
          alignment: 'center', visible: true, locked: false,
        },
      ] as TemplateElement[];
    }
    return [
      {
        id: 'EL-DEF-CERT-02', name: 'Nama Penerima', page: 'FRONT', type: 'DYNAMIC_TEXT',
        x: 10, y: 38, width: 80, height: 10, rotation: 0, zIndex: 15,
        dataSource: 'participant.full_name', fontFamily: 'Georgia',
        fontSize: 22, fontWeight: 'bold', color: '#0F172A',
        alignment: 'center', underline: true, visible: true, locked: false,
      },
    ] as TemplateElement[];
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const documentStudioService = new DocumentStudioService();
