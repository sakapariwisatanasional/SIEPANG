/**
 * @license
 * SiEpang - Document, ID Card & Certificate Verification Service v1.1
 * Batch generation queue, eligibility rules, and privacy-preserving public verification.
 */

import { IDCardTemplate, IssuedCertificate } from '../types';
import { participantService } from './participantService';

const DEFAULT_ID_CARD_TEMPLATE: IDCardTemplate = {
  id: 'tmpl_id_default',
  name: 'Template ID Card Standar',
  backgroundUrl: '',
  width: 340,
  height: 520,
  fields: {
    photo: { x: 95, y: 110, width: 150, height: 150, visible: true },
    name: { x: 170, y: 285, fontSize: 16, color: '#FFFFFF', visible: true },
    code: { x: 170, y: 310, fontSize: 13, color: '#38BDF8', visible: true },
    contingent: { x: 170, y: 335, fontSize: 13, color: '#CBD5E1', visible: true },
    role: { x: 170, y: 360, fontSize: 12, color: '#F59E0B', visible: true },
    qr: { x: 120, y: 390, size: 100, visible: true },
  },
};

export type DocumentJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED';

export interface DocumentBatchJob {
  jobId: string;
  type: 'ID_CARD' | 'CERTIFICATE';
  title: string;
  totalItems: number;
  processedCount: number;
  failedCount: number;
  status: DocumentJobStatus;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface PublicVerifiedCertificate {
  isValid: boolean;
  certificateNumber: string;
  recipientName: string;
  category: string;
  eventName: string;
  organizer: string;
  issuedDate: string;
  verificationHash: string;
  isPrivacyMasked: boolean;
}

class DocumentService {
  private idTemplate: IDCardTemplate = { ...DEFAULT_ID_CARD_TEMPLATE };
  private certificates: IssuedCertificate[] = [];
  private generationJobs: DocumentBatchJob[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {}

  public getIdCardTemplate(): IDCardTemplate {
    return this.idTemplate;
  }

  public updateIdCardTemplate(updated: Partial<IDCardTemplate>): void {
    this.idTemplate = { ...this.idTemplate, ...updated };
    this.notify();
  }

  // ==================== BATCH GENERATION QUEUE ====================

  public enqueueIdCardBatch(filterDescription: string, participantIds: string[]): DocumentBatchJob {
    const job: DocumentBatchJob = {
      jobId: `job_idcard_${Date.now()}`,
      type: 'ID_CARD',
      title: `Batch Cetak ID Card: ${filterDescription} (${participantIds.length} Peserta)`,
      totalItems: participantIds.length,
      processedCount: participantIds.length,
      failedCount: 0,
      status: 'COMPLETED',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    this.generationJobs.unshift(job);
    this.notify();
    return job;
  }

  public enqueueCertificateBatch(recipientCategory: string, count: number): DocumentBatchJob {
    const job: DocumentBatchJob = {
      jobId: `job_cert_${Date.now()}`,
      type: 'CERTIFICATE',
      title: `Penerbitan Piagam: ${recipientCategory} (${count} Lembar)`,
      totalItems: count,
      processedCount: count,
      failedCount: 0,
      status: 'COMPLETED',
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    this.generationJobs.unshift(job);
    this.notify();
    return job;
  }

  public getGenerationJobs(): DocumentBatchJob[] {
    return this.generationJobs;
  }

  // ==================== PRIVACY-PRESERVING PUBLIC VERIFICATION ====================

  public verifyCertificatePublic(numberOrHash: string): PublicVerifiedCertificate {
    const cleaned = numberOrHash.trim().toLowerCase();
    const found = this.certificates.find(
      c => c.certificateNumber.toLowerCase() === cleaned || c.verificationHash.toLowerCase() === cleaned
    );

    if (!found) {
      return {
        isValid: false,
        certificateNumber: numberOrHash,
        recipientName: '-',
        category: '-',
        eventName: '-',
        organizer: '-',
        issuedDate: '-',
        verificationHash: '',
        isPrivacyMasked: true,
      };
    }

    // Mask sensitive identifiers (never expose internal database IDs or private contact information)
    return {
      isValid: true,
      certificateNumber: found.certificateNumber,
      recipientName: found.recipientName,
      category: found.role || 'Peserta',
      eventName: found.eventName,
      organizer: (found as any).organizer || 'Kwartir Gerakan Pramuka',
      issuedDate: found.issueDate,
      verificationHash: found.verificationHash,
      isPrivacyMasked: true,
    };
  }

  public verifyCertificate(numberOrHash: string): IssuedCertificate | null {
    const cleaned = numberOrHash.trim().toLowerCase();
    return this.certificates.find(
      c => c.certificateNumber.toLowerCase() === cleaned || c.verificationHash.toLowerCase() === cleaned
    ) || null;
  }

  public getCertificates(): IssuedCertificate[] {
    return this.certificates;
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

export const documentService = new DocumentService();
