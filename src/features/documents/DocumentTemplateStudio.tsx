/**
 * @license
 * SiEpang - Document Template Studio (Full Upgrade v1.8 - Requirements 123 - 200)
 * Visual Document Template Studio:
 * 1. Template Manager (ID Card, Piagam, Sertifikat, Surat Tugas, Badge Card)
 * 2. Visual Drag & Drop Designer Modal (Canva-like editor)
 * 3. Signatory & Officials Manager (/SiEpang/Documents/Signatures/)
 * 4. Single Document Generation & Live Preview
 * 5. Chunked Non-Blocking Batch Document Generation (Google Drive customer storage)
 * 6. Public Certificate Verification Portal
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileCheck2,
  Sliders,
  Eye,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  Layers,
  FolderArchive,
  RefreshCw,
  HardDrive,
  Users,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  DocumentTemplate,
  DocumentType,
  PageSize,
  PageOrientation,
} from '../../types';
import {
  documentStudioService,
  DOCUMENT_TYPE_LABELS,
  PAPER_DIMENSIONS,
} from '../../services/documentStudioService';
import { participantService } from '../../services/participantService';
import { DocumentCanvasEditor } from './DocumentCanvasEditor';
import { SignatoryManager } from './SignatoryManager';
import { PublicCertificateVerification } from './PublicCertificateVerification';

export const DocumentTemplateStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'signatories' | 'batch_gen' | 'verifier'>('templates');
  const [templates, setTemplates] = useState<DocumentTemplate[]>(documentStudioService.getTemplates());
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Template Form State
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplType, setNewTmplType] = useState<DocumentType>('ID_CARD_PARTICIPANT');
  const [newTmplSize, setNewTmplSize] = useState<PageSize>('CR80');
  const [newTmplOrientation, setNewTmplOrientation] = useState<PageOrientation>('PORTRAIT');
  const [newTmplBackground, setNewTmplBackground] = useState('');

  // Batch Generation State
  const [batchTemplateId, setBatchTemplateId] = useState<string>('');
  const [batchScope, setBatchScope] = useState<'all' | 'contingent' | 'role'>('all');
  const [batchTarget, setBatchTarget] = useState<string>('');
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Single Generate Modal
  const [singleGenModal, setSingleGenModal] = useState<{ open: boolean; templateId: string; recipientName: string }>({
    open: false,
    templateId: '',
    recipientName: '',
  });
  const [generatedSuccessDoc, setGeneratedSuccessDoc] = useState<any | null>(null);

  const participants = participantService.getParticipants();
  const contingents = participantService.getContingents();
  const batches = documentStudioService.getBatches();

  useEffect(() => {
    const unsub = documentStudioService.subscribe(() => {
      setTemplates(documentStudioService.getTemplates());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (templates.length > 0 && !batchTemplateId) {
      setBatchTemplateId(templates[0].id);
    }
  }, [templates, batchTemplateId]);

  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmplName.trim()) return;

    const created = documentStudioService.createTemplate({
      name: newTmplName.trim(),
      documentType: newTmplType,
      pageSize: newTmplSize,
      orientation: newTmplOrientation,
      backgroundUrl: newTmplBackground.trim() || '',
    });

    setShowCreateModal(false);
    setNewTmplName('');
    setEditingTemplate(created);
  };

  const handleDuplicate = (id: string) => {
    documentStudioService.duplicateTemplate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus template dokumen ini?')) {
      documentStudioService.deleteTemplate(id);
    }
  };

  const handleStartBatch = async () => {
    if (!batchTemplateId) return;
    setIsBatchRunning(true);
    setBatchProgress({ processed: 0, total: 1 });
    setBatchSuccessMessage(null);

    try {
      const res = await documentStudioService.runBatchGeneration({
        templateId: batchTemplateId,
        targetFilter: batchScope,
        targetValue: batchTarget,
        onProgress: (processed, total) => {
          setBatchProgress({ processed, total });
        },
      });

      setBatchSuccessMessage(
        `✅ Batch dokumen berhasil diproses! Sebanyak ${res.processedCount} file tersimpan di Google Drive: ${res.outputDriveFolder}`
      );
    } catch (err: any) {
      alert(`Gagal memproses batch: ${err.message}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleRunSingleGenerate = (templateId: string) => {
    try {
      const doc = documentStudioService.generateSingleDocument({
        templateId,
        participantId: participants[0]?.id || 'SIM-PAR-01',
      });
      setGeneratedSuccessDoc(doc);
    } catch (err: any) {
      alert(`Gagal generate dokumen: ${err.message}`);
    }
  };

  // If currently inside visual canvas editor, render full-screen editor
  if (editingTemplate) {
    return (
      <DocumentCanvasEditor
        template={editingTemplate}
        onUpdateTemplate={updated => {
          documentStudioService.updateTemplate(updated.id, updated);
          setEditingTemplate(updated);
        }}
        onClose={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 px-4 sm:px-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-[#E1306C] border border-pink-200 dark:bg-pink-950/80 dark:text-pink-300 dark:border-pink-800 text-[10px] font-bold mb-1.5">
              <span>CANVA-LIKE DOCUMENT STUDIO v1.8</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
              Studio Desain Dokumen & ID Card
            </h1>
            <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
              Desain visual ID Card, Piagam, dan Sertifikat dengan binding database SiEpang, pejabat penandatangan, dan Google Drive Kwartir.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="p-2.5 sm:px-5 sm:py-2.5 rounded-2xl text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 min-h-[44px] min-w-[44px]"
            style={{
              background: 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 52%, #F77737 78%, #FCAF45 100%)',
            }}
            title="Buat Template Baru"
            aria-label="Buat Template Baru"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Template Baru</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Template ({templates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signatories')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signatories'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pejabat & TTD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch_gen')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'batch_gen'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Generate Massal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verifier')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'verifier'
                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifikasi Publik</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TEMPLATE CARDS & STUDIO LAUNCHER */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tmpl => {
              const meta = DOCUMENT_TYPE_LABELS[tmpl.documentType] || { label: tmpl.documentType, icon: '📄' };
              return (
                <div
                  key={tmpl.id}
                  className="rounded-3xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition-all shadow-xs group"
                >
                  {/* Template Card Thumbnail Preview */}
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden flex items-center justify-center">
                    {tmpl.backgroundUrl ? (
                      <img
                        src={tmpl.backgroundUrl}
                        alt={tmpl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                    ) : (
                      <div className="text-4xl text-slate-700">{meta.icon}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Status & Version badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        tmpl.status === 'ACTIVE'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {tmpl.status === 'ACTIVE' ? '✓ Aktif' : 'Draft'}
                      </span>
                      <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                        v{tmpl.version}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 text-xs font-mono text-white bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10">
                      {tmpl.pageSize} · {tmpl.orientation === 'LANDSCAPE' ? 'Landscape' : 'Portrait'}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[10px] text-emerald-400 font-semibold">{meta.label}</div>
                      <h3 className="text-sm font-bold truncate drop-shadow-md">{tmpl.name}</h3>
                    </div>
                  </div>

                  {/* Card Content & Meta */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Elemen Terpasang:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tmpl.elements.length} Komponen
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dua Sisi (Front & Back):</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tmpl.hasBackPage ? 'Ya (Depan & Belakang)' : 'Satu Sisi'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nomor Seri:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {tmpl.numberingRule?.prefix || 'CERT'}/... ({tmpl.numberingRule?.currentSequence || 0} terbit)
                        </span>
                      </div>
                    </div>

                    {/* Actions bar (Requirements 125, 126, 127) */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(tmpl.id)}
                          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Duplikat Template"
                          aria-label="Duplikat Template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tmpl.id)}
                          className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Hapus Template"
                          aria-label="Hapus Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunSingleGenerate(tmpl.id)}
                          className="p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-500 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Generate Dokumen Tunggal"
                          aria-label="Generate Dokumen Tunggal"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingTemplate(tmpl)}
                        className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[44px] sm:min-h-0"
                        title="Buka Studio Desain Dokumen"
                        aria-label="Buka Studio Desain Dokumen"
                      >
                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span className="hidden sm:inline">Buka Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SIGNATORIES & OFFICIALS */}
      {activeTab === 'signatories' && <SignatoryManager />}

      {/* TAB 3: BATCH GENERATION */}
      {activeTab === 'batch_gen' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#171717] dark:text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-[#E1306C]" />
                <span>Penerbitan Dokumen Massal (Batch Generator)</span>
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
                Generate ratusan ID Card atau Piagam sekaligus dengan pembagian chunk non-blocking agar tidak terkena timeout Apps Script.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-semibold">Pilih Template Dokumen</label>
                <select
                  value={batchTemplateId}
                  onChange={e => setBatchTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({DOCUMENT_TYPE_LABELS[t.documentType]?.label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 dark:text-slate-300 font-semibold">Cakupan Penerima (Target Scope)</label>
                <select
                  value={batchScope}
                  onChange={e => setBatchScope(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="all">Semua Peserta Terdaftar ({participants.length} Orang)</option>
                  <option value="contingent">Berdasarkan Kontingen Tertentu</option>
                  <option value="role">Berdasarkan Peran (Penggalang / Pembina)</option>
                </select>
              </div>
            </div>

            {batchScope === 'contingent' && (
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-600 dark:text-slate-300 font-semibold">Pilih Kontingen Target</label>
                <select
                  value={batchTarget}
                  onChange={e => setBatchTarget(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Pilih Kontingen...</option>
                  {contingents.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Folder Output Storage Information */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-black/30 border border-emerald-200 dark:border-white/5 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                <HardDrive className="w-4 h-4" />
                <span>Penyimpanan Google Drive Resmi Kegiatan</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Dokumen hasil generate akan diatur otomatis dalam folder: <br />
                <code className="text-emerald-700 dark:text-emerald-300 font-mono">
                  /SiEpang/Certificates/ atau /SiEpang/ID Cards/
                </code>
              </p>
            </div>

            {/* Batch Progress Bar */}
            {isBatchRunning && (
              <div className="space-y-2 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Memproses Dokumen...</span>
                  <span>{batchProgress.processed} / {batchProgress.total}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{
                      width: `${batchProgress.total > 0 ? (batchProgress.processed / batchProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {batchSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                {batchSuccessMessage}
              </div>
            )}

            <button
              type="button"
              disabled={isBatchRunning || !batchTemplateId}
              onClick={handleStartBatch}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isBatchRunning ? 'animate-spin' : ''}`} />
              <span>{isBatchRunning ? 'Sedang Memproses...' : 'Mulai Penerbitan Batch Sekarang'}</span>
            </button>
          </div>

          {/* Historical Batches List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/10 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Batch Penerbitan Dokumen</h3>
            <div className="space-y-2">
              {batches.map(b => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tersimpan di: <span className="font-mono text-emerald-600 dark:text-emerald-400">{b.outputDriveFolder}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      ✓ {b.status} ({b.processedCount} Dokumen)
                    </span>
                    <span className="text-[10px] text-slate-400">{b.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUBLIC VERIFICATION PORTAL */}
      {activeTab === 'verifier' && <PublicCertificateVerification />}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateTemplateSubmit}
            className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-6 space-y-4 shadow-2xl text-[#171717] dark:text-white"
          >
            <div className="flex items-center justify-between border-b border-[#ECECEF] dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold tracking-tight">Buat Template Dokumen Baru</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#6B7280] dark:text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Nama Template *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ID Card Panitia Kegiatan"
                  value={newTmplName}
                  onChange={e => setNewTmplName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Jenis Dokumen
                  </label>
                  <select
                    value={newTmplType}
                    onChange={e => {
                      const val = e.target.value as DocumentType;
                      setNewTmplType(val);
                      if (val.startsWith('ID_CARD')) {
                        setNewTmplSize('CR80');
                        setNewTmplOrientation('PORTRAIT');
                      } else {
                        setNewTmplSize('A4');
                        setNewTmplOrientation('LANDSCAPE');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.icon} {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Ukuran Halaman
                  </label>
                  <select
                    value={newTmplSize}
                    onChange={e => setNewTmplSize(e.target.value as PageSize)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl"
                  >
                    {Object.entries(PAPER_DIMENSIONS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Orientasi Lembar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTmplOrientation('PORTRAIT')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      newTmplOrientation === 'PORTRAIT'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-50 dark:bg-black/30 text-slate-500 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    Portrait (Tegak)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTmplOrientation('LANDSCAPE')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      newTmplOrientation === 'LANDSCAPE'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-50 dark:bg-black/30 text-slate-500 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    Landscape (Mendatar)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  URL Background Awal (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="URL gambar PNG/JPG latar belakang..."
                  value={newTmplBackground}
                  onChange={e => setNewTmplBackground(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Lanjut ke Canvas Studio →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GENERATED DOCUMENT SUCCESS PREVIEW MODAL */}
      {generatedSuccessDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-6 space-y-4 shadow-2xl text-[#171717] dark:text-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold">Dokumen Berhasil Dibuat!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen resmi telah di-generate dengan snapshot tanda tangan dan kode verifikasi.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Penerima:</span>
                <span className="font-bold text-slate-900 dark:text-white">{generatedSuccessDoc.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Dokumen:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{generatedSuccessDoc.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Google Drive:</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">{generatedSuccessDoc.outputDrivePath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Token Verifikasi:</span>
                <span className="font-mono text-[10px] text-amber-500">{generatedSuccessDoc.verificationToken}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGeneratedSuccessDoc(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
