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
    this.initStore();
  }

  private initStore() {
    // Pure runtime state - starts with 0 dummy records
    this.templates = [];
    this.signatories = [];
    this.generatedDocuments = [];
    this.batches = [];
  }

  // ==================== TEMPLATE CRUD & VERSIONING ====================

  public getTemplates(filters?: { type?: DocumentType; status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }): DocumentTemplate[] {
    let list = [...this.templates];
    if (filters?.type) list = list.filter(t => t.documentType === filters.type);
    if (filters?.status) list = list.filter(t => t.status === filters.status);
    return list;
  }

  public getTemplateById(id: string): DocumentTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  public createTemplate(data: Partial<DocumentTemplate>): DocumentTemplate {
    const pSize = data.pageSize || 'A4';
    const dim = PAPER_DIMENSIONS[pSize];
    const orientation = data.orientation || (pSize === 'CR80' ? 'PORTRAIT' : 'LANDSCAPE');

    const width = orientation === 'PORTRAIT' ? Math.min(dim.widthMm, dim.heightMm) : Math.max(dim.widthMm, dim.heightMm);
    const height = orientation === 'PORTRAIT' ? Math.max(dim.widthMm, dim.heightMm) : Math.min(dim.widthMm, dim.heightMm);

    const newTemplate: DocumentTemplate = {
      id: `TMPL-${Date.now()}`,
      workspaceId: data.workspaceId || 'ws_default',
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

    this.templates.unshift(newTemplate);
    this.notify();
    return newTemplate;
  }

  public updateTemplate(id: string, updates: Partial<DocumentTemplate>, bumpVersion = false): DocumentTemplate {
    const idx = this.templates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Template tidak ditemukan');

    const prev = this.templates[idx];
    const newVersion = bumpVersion ? prev.version + 1 : prev.version;

    const updated: DocumentTemplate = {
      ...prev,
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };

    this.templates[idx] = updated;
    this.notify();
    return updated;
  }

  public duplicateTemplate(id: string, newName?: string): DocumentTemplate {
    const source = this.getTemplateById(id);
    if (!source) throw new Error('Template sumber tidak ditemukan');

    const copy: DocumentTemplate = {
      ...JSON.parse(JSON.stringify(source)),
      id: `TMPL-COPY-${Date.now()}`,
      name: newName || `${source.name} (Salinan)`,
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.unshift(copy);
    this.notify();
    return copy;
  }

  public deleteTemplate(id: string): boolean {
    const idx = this.templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.templates.splice(idx, 1);
      this.notify();
      return true;
    }
    return false;
  }

  // ==================== SIGNATORIES CRUD (Section 141-149) ====================

  public getSignatories(): Signatory[] {
    return [...this.signatories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getSignatoryById(id: string): Signatory | undefined {
    return this.signatories.find(s => s.id === id);
  }

  public saveSignatory(data: Partial<Signatory>): Signatory {
    if (data.id) {
      const idx = this.signatories.findIndex(s => s.id === data.id);
      if (idx !== -1) {
        this.signatories[idx] = {
          ...this.signatories[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.notify();
        return this.signatories[idx];
      }
    }

    const newSig: Signatory = {
      id: `SIG-${Date.now()}`,
      workspaceId: data.workspaceId || 'ws_default',
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
    };

    this.signatories.push(newSig);
    this.notify();
    return newSig;
  }

  public deleteSignatory(id: string): boolean {
    const idx = this.signatories.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.signatories.splice(idx, 1);
      this.notify();
      return true;
    }
    return false;
  }

  // ==================== VALUE RESOLVER & DATA BINDING ====================

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

    switch (source) {
      case 'participant.full_name':
        return p.name || p.full_name || 'Nama Lengkap Peserta';
      case 'participant.participant_number':
        return p.code || p.participant_number || 'NOMOR-PESERTA';
      case 'participant.nta':
        return p.nta || p.national_id || '-';
      case 'participant.photo':
        return p.profile_photo_url || p.photoUrl || p.photo || '';
      case 'official.photo':
        return p.official_photo_url || p.profile_photo_url || '';
      case 'committee.photo':
        return p.committee_photo_url || p.profile_photo_url || '';
      case 'judge.photo':
        return p.judge_photo_url || p.profile_photo_url || '';
      case 'participant.gender':
        return p.gender === 'M' || p.gender === 'L' ? 'Putra' : 'Putri';
      case 'participant.role':
        return p.role || 'Peserta';
      case 'participant.contingent':
        return p.contingentName || c.name || 'Kontingen';
      case 'participant.subcamp':
        return p.campsite_lot || 'Bumi Perkemahan';
      case 'contingent.name':
        return c.name || p.contingentName || 'Nama Kontingen';
      case 'organization.name':
        return e.organizer || 'Kwartir Penyelenggara';
      case 'organization.code':
        return e.organizationCode || '-';
      case 'event.name':
        return e.name || 'Kegiatan Pramuka';
      case 'event.short_name':
        return e.shortName || 'Kegiatan';
      case 'event.location':
        return e.location || 'Bumi Perkemahan';
      case 'event.start_date':
        return e.startDate || '-';
      case 'event.end_date':
        return e.endDate || '-';
      case 'event.year':
        return e.year || new Date().getFullYear().toString();
      case 'event.theme':
        return e.theme || '';
      case 'document.number':
        return context.docNumber || 'NOMOR/DOKUMEN/001';
      case 'document.issue_date':
        return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'document.role':
        return context.customRole || 'Peserta';
      case 'document.award_title':
        return 'Peserta Tergiat';
      case 'document.verification_url':
        return context.docNumber ? `https://siepang.app/verify/certificate/${context.docNumber}` : '';
      case 'signatory.1.name':
        return sigs[0]?.fullName || '';
      case 'signatory.1.title':
        return sigs[0]?.positionTitle || '';
      case 'signatory.2.name':
        return sigs[1]?.fullName || '';
      case 'signatory.2.title':
        return sigs[1]?.positionTitle || '';
      default:
        return '';
    }
  }

  // ==================== DOCUMENT GENERATION (SINGLE & BATCH) ====================

  public generateSingleDocument(params: {
    templateId: string;
    participantId: string;
    customRole?: string;
    awardTitle?: string;
  }): GeneratedDocumentSnapshot {
    const tmpl = this.getTemplateById(params.templateId);
    if (!tmpl) throw new Error('Template dokumen tidak ditemukan');

    const participant = participantService.getParticipants().find(p => p.id === params.participantId);
    if (!participant) {
      throw new Error(`Data peserta '${params.participantId}' tidak ditemukan.`);
    }

    const nextSeq = (tmpl.numberingRule?.currentSequence || 100) + 1;
    if (tmpl.numberingRule) {
      tmpl.numberingRule.currentSequence = nextSeq;
    }

    const docNum = tmpl.numberingRule
      ? `${tmpl.numberingRule.prefix}/${tmpl.numberingRule.eventCodePattern || 'DOC'}/${new Date().getFullYear()}/${String(nextSeq).padStart(tmpl.numberingRule.sequenceLength || 4, '0')}`
      : `DOC-${Date.now()}`;

    const verificationToken = `v_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;

    // Build customer Drive path based on folder hierarchy
    const activeEvent = eventService.getCurrentEvent();
    const eventFolder = activeEvent.eventCode && activeEvent.eventCode !== 'NONE' ? activeEvent.eventCode : 'DEFAULT';
    const folderType = tmpl.documentType.startsWith('ID_CARD') ? 'ID Cards' : 'Certificates';
    const subFolder = params.customRole || 'Peserta';
    const drivePath = `/SiEpang/${folderType}/${eventFolder}/${subFolder}/${docNum.replace(/\//g, '_')}_${participant.name.replace(/\s+/g, '_')}.pdf`;

    const snapshot: GeneratedDocumentSnapshot = {
      id: `GEN-${Date.now()}`,
      documentNumber: docNum,
      verificationToken,
      templateId: tmpl.id,
      templateVersion: tmpl.version,
      documentType: tmpl.documentType,
      recipientId: participant.id,
      recipientName: participant.name,
      recipientCategory: params.customRole || 'Peserta',
      contingentName: participant.contingentName,
      eventId: tmpl.eventId || activeEvent.id || '',
      eventName: activeEvent.name || 'Kegiatan Pramuka',
      issueDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      outputFileUrl: tmpl.backgroundUrl || '',
      outputFileId: `drive_file_${Date.now()}`,
      outputDrivePath: drivePath,
      generatedBy: 'Admin SiEpang',
      generatedAt: new Date().toISOString(),
      signatoriesSnapshot: this.getSignatories().map(s => ({
        fullName: s.fullName,
        positionTitle: s.positionTitle,
        organizationName: s.organizationName,
      })),
      isValid: true,
    };

    this.generatedDocuments.unshift(snapshot);
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

    let allParticipants = participantService.getParticipants();
    if (params.targetFilter === 'contingent' && params.targetValue) {
      allParticipants = allParticipants.filter(p => p.contingentId === params.targetValue || p.contingentName === params.targetValue);
    } else if (params.targetFilter === 'role' && params.targetValue) {
      allParticipants = allParticipants.filter(p => p.role === params.targetValue);
    }

    if (allParticipants.length === 0) {
      throw new Error('Belum ada data peserta untuk pembuatan batch dokumen.');
    }

    const total = allParticipants.length;
    const batchId = `BATCH-${Date.now()}`;
    const activeEv = eventService.getCurrentEvent();
    const eventFolder = activeEv.eventCode && activeEv.eventCode !== 'NONE' ? activeEv.eventCode : 'DEFAULT';
    const folderType = tmpl.documentType.startsWith('ID_CARD') ? 'ID Cards' : 'Certificates';
    const driveFolder = `/SiEpang/${folderType}/${eventFolder}/Batch_${batchId}/`;

    const batchRecord: DocumentGenerationBatch = {
      id: batchId,
      title: `Batch ${DOCUMENT_TYPE_LABELS[tmpl.documentType]?.label || 'Dokumen'} (${total} Peserta)`,
      documentType: tmpl.documentType,
      templateId: tmpl.id,
      targetCount: total,
      processedCount: 0,
      failedCount: 0,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      outputDriveFolder: driveFolder,
    };

    this.batches.unshift(batchRecord);
    this.notify();

    // Chunked non-blocking processing to adhere to Apps Script quotas
    const chunkSize = 4;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = allParticipants.slice(i, i + chunkSize);
      for (const p of chunk) {
        this.generateSingleDocument({
          templateId: tmpl.id,
          participantId: p.id,
        });
        batchRecord.processedCount += 1;
        params.onProgress?.(batchRecord.processedCount, total);
      }
      this.notify();
      // Yield to main thread
      await new Promise(r => setTimeout(r, 60));
    }

    batchRecord.status = 'COMPLETED';
    batchRecord.completedAt = new Date().toISOString();
    this.notify();
    return batchRecord;
  }

  // ==================== PUBLIC CERTIFICATE VERIFICATION (Section 179) ====================

  public verifyPublicDocument(tokenOrNumber: string): {
    isValid: boolean;
    recipientName: string;
    documentType: string;
    eventName: string;
    documentNumber: string;
    issueDate: string;
    signatoryName: string;
  } {
    const q = tokenOrNumber.trim().toLowerCase();
    const doc = this.generatedDocuments.find(
      d => d.documentNumber.toLowerCase() === q || d.verificationToken.toLowerCase() === q
    );

    if (doc) {
      return {
        isValid: true,
        recipientName: doc.recipientName,
        documentType: DOCUMENT_TYPE_LABELS[doc.documentType]?.label || 'Dokumen Resmi',
        eventName: doc.eventName,
        documentNumber: doc.documentNumber,
        issueDate: doc.issueDate,
        signatoryName: doc.signatoriesSnapshot[0]?.fullName || 'Ketua Kwartir',
      };
    }

    return {
      isValid: false,
      recipientName: '-',
      documentType: '-',
      eventName: '-',
      documentNumber: tokenOrNumber,
      issueDate: '-',
      signatoryName: '-',
    };
  }

  public getGeneratedDocuments(): GeneratedDocumentSnapshot[] {
    return [...this.generatedDocuments];
  }

  public getBatches(): DocumentGenerationBatch[] {
    return [...this.batches];
  }

  // Helper default template builder
  private getDefaultElementsForType(type: DocumentType): TemplateElement[] {
    if (type.startsWith('ID_CARD')) {
      return [
        {
          id: 'EL-DEF-01',
          name: 'Judul ID Card',
          page: 'FRONT',
          type: 'STATIC_TEXT',
          x: 5,
          y: 6,
          width: 90,
          height: 8,
          rotation: 0,
          zIndex: 10,
          staticValue: 'TANDA PENGENAL RESMI',
          fontFamily: 'Inter',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#FDE047',
          alignment: 'center',
          visible: true,
          locked: false,
        },
        {
          id: 'EL-DEF-02',
          name: 'Foto Peserta',
          page: 'FRONT',
          type: 'PHOTO',
          x: 25,
          y: 18,
          width: 50,
          height: 32,
          rotation: 0,
          zIndex: 15,
          dataSource: 'participant.photo',
          photoCrop: 'rounded',
          borderColor: '#E2E8F0',
          borderWidth: 2,
          borderRadius: 12,
          visible: true,
          locked: false,
        },
        {
          id: 'EL-DEF-03',
          name: 'Nama Lengkap',
          page: 'FRONT',
          type: 'DYNAMIC_TEXT',
          x: 5,
          y: 53,
          width: 90,
          height: 8,
          rotation: 0,
          zIndex: 20,
          dataSource: 'participant.full_name',
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#FFFFFF',
          alignment: 'center',
          visible: true,
          locked: false,
        },
        {
          id: 'EL-DEF-04',
          name: 'Kode QR',
          page: 'FRONT',
          type: 'QR_CODE',
          x: 35,
          y: 75,
          width: 30,
          height: 18,
          rotation: 0,
          zIndex: 20,
          qrType: 'PARTICIPANT_QR',
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          visible: true,
          locked: false,
        },
      ];
    }

    return [
      {
        id: 'EL-DEF-CERT-01',
        name: 'Judul Piagam',
        page: 'FRONT',
        type: 'STATIC_TEXT',
        x: 10,
        y: 15,
        width: 80,
        height: 10,
        rotation: 0,
        zIndex: 10,
        staticValue: 'PIAGAM PENGHARGAAN',
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        alignment: 'center',
        visible: true,
        locked: false,
      },
      {
        id: 'EL-DEF-CERT-02',
        name: 'Nama Penerima',
        page: 'FRONT',
        type: 'DYNAMIC_TEXT',
        x: 10,
        y: 38,
        width: 80,
        height: 10,
        rotation: 0,
        zIndex: 15,
        dataSource: 'participant.full_name',
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        alignment: 'center',
        underline: true,
        visible: true,
        locked: false,
      },
    ];
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const documentStudioService = new DocumentStudioService();
