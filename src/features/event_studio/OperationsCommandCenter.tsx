/**
 * @license
 * SiEpang - Operations Command Center Component v1.1
 * High-density, actionable operational command cards for event organizers:
 * - Registration, Participants, Verification, Contingents, Campsite, Schedule,
 *   Attendance, Competitions, Judges, Voting, Documents, Announcements, Readiness
 * - Event Context Header with Workspace, Organization & Event IDs
 * - Guided Event Closure Modal with checklist & archive
 * - Event Final Report Modal with metric breakdown & CSV export
 * - Cloud Backup & Safe Restore with Pre-Restore Snapshot
 * - Subsystem Health & Background Job Monitor
 * - Point Ledger & Transaction Adjustment Console
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Tent,
  Trophy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  CreditCard,
  Bell,
  HardDrive,
  Activity,
  FileText,
  FileCheck2,
  Download,
  Archive,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  Info,
  X,
  Check,
  Building2,
  Search,
} from 'lucide-react';
import {
  onlineOperationsService,
  CommandCenterCard,
  ClosureChecklistItem,
  EventFinalReport,
  CloudBackupRecord,
  SubsystemHealth,
  BackgroundJob,
  PointLedgerEntry,
} from '../../services/onlineOperationsService';
import { eventStudioService } from '../../services/eventStudioService';
import { workspaceService } from '../../services/workspaceService';
import { organizationService } from '../../services/organizationService';
import { authService } from '../../services/authService';
import { StudioSection } from './EventManagementStudio';

interface OperationsCommandCenterProps {
  onNavigateSection: (section: StudioSection) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OperationsCommandCenter: React.FC<OperationsCommandCenterProps> = ({
  onNavigateSection,
  onNavigateTab,
}) => {
  const [cards, setCards] = useState<CommandCenterCard[]>(onlineOperationsService.getCommandCenterCards());
  const [activeModal, setActiveModal] = useState<
    'closure' | 'final_report' | 'backup_restore' | 'health_jobs' | 'point_ledger' | null
  >(null);

  // Event Context
  const currentEvent = eventStudioService.getEvent();
  const currentWorkspace = workspaceService.getCurrentWorkspace();
  const currentOrg = organizationService.getOrganizationById(currentWorkspace.organization_id || '');
  const currentUser = authService.getCurrentUser();

  // Closure state
  const [closureChecklist, setClosureChecklist] = useState<ClosureChecklistItem[]>([]);
  const [closingNotes, setClosingNotes] = useState('Semua rangkaian kegiatan perkemahan telah terlaksana dengan sukses dan aman.');
  const [isProcessingClosure, setIsProcessingClosure] = useState(false);

  // Final Report state
  const [finalReport, setFinalReport] = useState<EventFinalReport | null>(null);

  // Backup state
  const [backups, setBackups] = useState<CloudBackupRecord[]>(onlineOperationsService.getBackups());
  const [newBackupName, setNewBackupName] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<CloudBackupRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);

  // Health & Jobs
  const [healths, setHealths] = useState<SubsystemHealth[]>(onlineOperationsService.getSubsystemHealths());
  const [jobs, setJobs] = useState<BackgroundJob[]>(onlineOperationsService.getBackgroundJobs());

  // Point Ledger
  const [ledgerEntries, setLedgerEntries] = useState<PointLedgerEntry[]>(onlineOperationsService.getPointLedger());
  const [adjustTarget, setAdjustTarget] = useState<PointLedgerEntry | null>(null);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    const unsub = onlineOperationsService.subscribe(() => {
      setCards(onlineOperationsService.getCommandCenterCards());
      setBackups(onlineOperationsService.getBackups());
      setHealths(onlineOperationsService.getSubsystemHealths());
      setJobs(onlineOperationsService.getBackgroundJobs());
      setLedgerEntries(onlineOperationsService.getPointLedger());
    });
    return () => unsub();
  }, []);

  const handleOpenClosure = () => {
    setClosureChecklist(onlineOperationsService.evaluateClosureChecklist());
    setActiveModal('closure');
  };

  const handleCompleteEvent = () => {
    setIsProcessingClosure(true);
    setTimeout(() => {
      onlineOperationsService.completeEvent(currentEvent.id, currentUser?.name || 'Administrator', closingNotes);
      setIsProcessingClosure(false);
      setActiveModal(null);
      alert('Event resmi diselesaikan! Status event kini COMPLETED.');
    }, 800);
  };

  const handleArchiveEvent = () => {
    if (confirm('Arsipkan event ini? Event akan beralih ke mode baca-saja.')) {
      onlineOperationsService.archiveEvent(currentEvent.id, currentUser?.name || 'Administrator');
      setActiveModal(null);
      alert('Event berhasil diarsipkan.');
    }
  };

  const handleOpenFinalReport = () => {
    const rep = onlineOperationsService.generateFinalReport();
    setFinalReport(rep);
    setActiveModal('final_report');
  };

  const handleExportReportCsv = () => {
    if (!finalReport) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Kategori,Metrik,Nilai\n' +
      `Peserta,Total Terdaftar,${finalReport.summary.totalParticipants}\n` +
      `Peserta,Terverifikasi,${finalReport.summary.verifiedParticipants}\n` +
      `Presensi,Check-in Buper,${finalReport.summary.checkInCount} (${finalReport.summary.checkInRate}%)\n` +
      `Kontingen,Total Kontingen,${finalReport.summary.totalContingents}\n` +
      `Bumi Perkemahan,Kavling Terisi,${finalReport.summary.campsiteLotsOccupied} (${finalReport.summary.campsiteUtilizationRate}%)\n` +
      `Kompetisi,Total Lomba,${finalReport.summary.totalCompetitions}\n` +
      `Gamifikasi,Total XP Dianugerahkan,${finalReport.summary.totalPointsAwarded}\n` +
      `Dokumen,Piagam Terbit,${finalReport.summary.totalCertificatesIssued}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Akhir_${currentEvent.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateBackup = () => {
    if (!newBackupName.trim()) return;
    onlineOperationsService.createManualBackup(newBackupName, currentUser?.name || 'Administrator');
    setNewBackupName('');
  };

  const handleRestore = async (backup: CloudBackupRecord) => {
    if (!confirm(`Restore basis data ke versi '${backup.name}'? Snapshot keamanan pre-restore akan otomatis dibuat.`)) {
      return;
    }
    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const res = await onlineOperationsService.restoreFromBackup(backup.id, currentUser?.name || 'Administrator');
      setRestoreResult(res.message);
    } catch (e: any) {
      alert(`Gagal restore: ${e.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleAdjustLedger = () => {
    if (!adjustTarget || !adjustReason.trim()) return;
    onlineOperationsService.adjustLedgerEntry(adjustTarget.id, 'ADJUSTED', adjustReason, currentUser?.name || 'Administrator');
    setAdjustTarget(null);
    setAdjustReason('');
  };

  return (
    <div className="space-y-5">
      {/* 1. Context & Top Summary Bar */}
      <div className="p-4 sm:p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
            <span>⚜️ {currentOrg ? currentOrg.organization_name : (currentWorkspace.name || 'Kwartir')}</span>
            <span>·</span>
            <span>Pusat Kendali Operasional</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Ikhtisar Operasional Lapangan
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Pantau status kesiapan seluruh pos, kegiatan, dan sarana perkemahan dalam satu kendali.
          </p>
        </div>

        {/* Quick Operations Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenFinalReport}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/40 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan Akhir</span>
          </button>

          <button
            type="button"
            onClick={handleOpenClosure}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Tutup Event</span>
          </button>
        </div>
      </div>

      {/* 2. Needs Attention Issues (If Any Exist) */}
      {cards.some(c => c.issuesCount > 0) && (
        <div className="p-4 sm:p-5 rounded-[24px] bg-amber-500/10 border border-amber-500/20 space-y-2.5">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Perlu Perhatian Segera</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cards
              .filter(c => c.issuesCount > 0)
              .map(card => (
                <button
                  key={card.id + '-issue'}
                  type="button"
                  onClick={() => onNavigateSection(card.targetSection as StudioSection)}
                  className="p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-amber-400 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-[#171717] dark:text-white truncate">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 truncate mt-0.5">
                      {card.issueDescription}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#833AB4] group-hover:text-[#E1306C] shrink-0">
                    <span>{card.primaryActionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 3. Grouped Operational Modules (Progressive Single-Elevation Surfaces) */}
      <div className="space-y-4">
        {[
          {
            category: 'Kegiatan & Penjurian',
            icon: Calendar,
            cardIds: ['cmd_participants', 'cmd_schedule', 'cmd_attendance', 'cmd_competitions', 'cmd_judging', 'cmd_voting'],
          },
          {
            category: 'Operasional Lapangan & Buper',
            icon: Tent,
            cardIds: ['cmd_campsite', 'cmd_health', 'cmd_logistics', 'cmd_visitors'],
          },
          {
            category: 'Dokumen & Publikasi',
            icon: FileCheck2,
            cardIds: ['cmd_registration', 'cmd_documents', 'cmd_announcements', 'cmd_readiness'],
          },
        ].map(group => {
          const GroupIcon = group.icon;
          const groupCards = cards.filter(c =>
            group.cardIds.includes(c.id) ||
            (group.category.includes('Kegiatan') && (c.category === 'PESERTA' || c.category === 'JADWAL' || c.category === 'LOMBA')) ||
            (group.category.includes('Operasional') && (c.category === 'BUPER' || c.category === 'KESEHATAN' || c.category === 'LOGISTIK')) ||
            (group.category.includes('Dokumen') && (c.category === 'DOKUMEN' || c.category === 'PUBLIKASI' || c.category === 'KESIAPAN'))
          );

          if (groupCards.length === 0) return null;

          return (
            <div
              key={group.category}
              className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#ECECEF]/60 dark:border-white/5">
                <div className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <GroupIcon className="w-4 h-4 text-[#833AB4]" />
                  <span>{group.category}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {groupCards.length} Modul
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {groupCards.map(card => {
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onNavigateSection(card.targetSection as StudioSection)}
                      className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/5 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#171717] dark:text-white truncate">
                            {card.title}
                          </span>
                        </div>
                        <div className="text-sm font-black text-[#171717] dark:text-white font-mono tabular-nums mt-0.5">
                          {card.count}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            card.statusColor === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : card.statusColor === 'amber'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : card.statusColor === 'rose'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                          }`}
                        >
                          {card.status}
                        </span>
                        <div className="text-[10px] font-bold text-[#833AB4] group-hover:text-[#E1306C] mt-1 flex items-center justify-end gap-0.5">
                          <span>Buka</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Advanced Operations & Diagnostic Tools (Collapsible Bottom Area) */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-slate-50 dark:bg-white/[0.02] border border-[#ECECEF] dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span>Alat Sistem & Cadangan Data</span>
          </div>
          <span className="text-[11px] text-slate-400">Lanjutan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveModal('point_ledger')}
            className="p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#833AB4]/30 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
          >
            <div>
              <div className="font-bold text-[#171717] dark:text-white">Buku Poin XP</div>
              <div className="text-[11px] text-slate-400">Audit mutasi skor</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('backup_restore')}
            className="p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#833AB4]/30 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
          >
            <div>
              <div className="font-bold text-[#171717] dark:text-white">Backup & Restore</div>
              <div className="text-[11px] text-slate-400">Pencadangan cloud</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('health_jobs')}
            className="p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#833AB4]/30 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
          >
            <div>
              <div className="font-bold text-[#171717] dark:text-white">Status Sistem & Job</div>
              <div className="text-[11px] text-slate-400">Kesehatan 9 subsistem</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ==================== MODAL 1: EVENT CLOSURE ==================== */}
      {activeModal === 'closure' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] dark:text-white">Panduan Penutupan Event (Event Closure)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Verifikasi kelengkapan seluruh modul sebelum penutupan resmi.</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Daftar Uji Kesiapan Penutupan:
              </div>

              <div className="space-y-2">
                {closureChecklist.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                      item.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/25'
                        : item.severity === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#171717] dark:text-white">{item.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">[{item.category}]</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Catatan Berita Acara Penutupan *</label>
                <textarea
                  rows={3}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFAFA] dark:bg-black/40 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white text-xs placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#ECECEF] dark:border-white/10">
              <button
                onClick={handleArchiveEvent}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Langsung Arsipkan (Read-Only)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleCompleteEvent}
                  disabled={isProcessingClosure}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessingClosure ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Selesaikan Event Resmi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: FINAL REPORT ==================== */}
      {activeModal === 'final_report' && finalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] dark:text-white">Ringkasan Laporan Akhir Kegiatan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{finalReport.eventName} · {finalReport.generatedAt}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Total Peserta</div>
                <div className="text-base font-bold text-[#171717] dark:text-white font-mono">{finalReport.summary.totalParticipants}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{finalReport.summary.verifiedParticipants} Terverifikasi</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Check-in Buper</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{finalReport.summary.checkInCount}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{finalReport.summary.checkInRate}% Kehadiran</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Kontingen & Gudep</div>
                <div className="text-base font-bold text-sky-600 dark:text-sky-400 font-mono">{finalReport.summary.totalContingents}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{finalReport.summary.totalOrganizations} Kwartir/Gudep</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Okupansi Buper</div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">{finalReport.summary.campsiteLotsOccupied}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{finalReport.summary.campsiteUtilizationRate}% Kavling Terisi</div>
              </div>
            </div>

            {/* Winners section */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Rekap Juara Kompetisi Resmi</span>
              </div>

              <div className="space-y-2">
                {finalReport.winnersSummary.map((win, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/20 border border-[#ECECEF] dark:border-white/5 space-y-1">
                    <div className="font-bold text-[#171717] dark:text-white text-xs">{win.competitionTitle}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>🥇 Juara 1: <strong className="text-amber-700 dark:text-amber-300">{win.winner1}</strong></div>
                      {win.winner2 && <div>🥈 Juara 2: <strong className="text-slate-800 dark:text-slate-200">{win.winner2}</strong></div>}
                      {win.winner3 && <div>🥉 Juara 3: <strong className="text-amber-600 dark:text-amber-500">{win.winner3}</strong></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#ECECEF] dark:border-white/10">
              <button
                onClick={handleExportReportCsv}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Laporan Resmi (CSV)</span>
              </button>

              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: CLOUD BACKUP & SAFE RESTORE ==================== */}
      {activeModal === 'backup_restore' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] dark:text-white">Pusat Cadangan & Restorasi Basis Data</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kelola snapshot data dan pemulihan aman dengan pre-restore lock.</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Backup */}
            <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-black/30 border border-[#ECECEF] dark:border-white/5 space-y-2 text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">Buat Cadangan Manual Baru</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama cadangan (contoh: Snapshot Sebelum Pengumuman Lomba)"
                  value={newBackupName}
                  onChange={e => setNewBackupName(e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white text-xs placeholder-slate-400"
                />
                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
                >
                  Buat Cadangan
                </button>
              </div>
            </div>

            {restoreResult && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{restoreResult}</span>
              </div>
            )}

            {/* Backup list */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Daftar Titik Pemulihan Tersedia:
              </div>

              <div className="space-y-2">
                {backups.map(bkp => (
                  <div
                    key={bkp.id}
                    className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-black/20 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#171717] dark:text-white text-xs truncate">{bkp.name}</span>
                        {bkp.isPreRestoreSnapshot && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            Safety Snapshot
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                        <span>{bkp.timestamp}</span>
                        <span>•</span>
                        <span>{bkp.creator}</span>
                        <span>•</span>
                        <span>{(bkp.fileSizeBytes / 1000000).toFixed(1)} MB</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(bkp)}
                      disabled={isRestoring}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {isRestoring ? 'Memulihkan...' : 'Pulihkan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#ECECEF] dark:border-white/10">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: SYSTEM HEALTH & JOBS ==================== */}
      {activeModal === 'health_jobs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] dark:text-white">Status Kesehatan 9 Subsistem Cloud</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pemeriksaan integritas konektivitas, otentikasi, dan antrean kerja.</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subsystem Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {healths.map(h => (
                <div key={h.subsystem} className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-black/25 border border-[#ECECEF] dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171717] dark:text-white">{h.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      {h.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{h.notes}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Latensi: {h.latencyMs}ms</div>
                </div>
              ))}
            </div>

            {/* Background Jobs */}
            <div className="space-y-2 text-xs pt-2 border-t border-[#ECECEF] dark:border-white/10">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Pekerjaan Latar Belakang (Background Jobs):
              </div>

              <div className="space-y-1.5">
                {jobs.map(j => (
                  <div key={j.id} className="p-2.5 rounded-xl bg-[#FAFAFA] dark:bg-black/20 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#171717] dark:text-white">{j.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Mulai: {j.startedAt}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#ECECEF] dark:border-white/10">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: POINT LEDGER & AUDIT ==================== */}
      {activeModal === 'point_ledger' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECEF] dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#171717] dark:text-white">Buku Besar Poin & Audit Gamifikasi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rekap transaksi XP tanpa manipulasi total saldo langsung.</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ledger entries list */}
            <div className="space-y-2 text-xs">
              {ledgerEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-black/20 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#171717] dark:text-white">{entry.participantName}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-semibold border ${
                        entry.status === 'SETTLED'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{entry.reason}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 flex gap-2">
                      <span>{entry.timestamp}</span>
                      <span>•</span>
                      <span>Oleh: {entry.actorName}</span>
                    </div>
                    {entry.adjustmentReason && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-300">Penyesuaian: {entry.adjustmentReason}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">+{entry.amount} XP</span>
                    {entry.status === 'SETTLED' && (
                      <button
                        onClick={() => {
                          setAdjustTarget(entry);
                          setAdjustReason('');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-[#ECECEF] dark:border-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Koreksi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Adjust input if target selected */}
            {adjustTarget && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 space-y-2 text-xs">
                <div className="font-bold text-amber-800 dark:text-amber-300">
                  Koreksi Transaksi {adjustTarget.id} ({adjustTarget.participantName})
                </div>
                <input
                  type="text"
                  placeholder="Alasan koreksi administratif..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-black/50 border border-[#ECECEF] dark:border-white/10 rounded-xl text-[#171717] dark:text-white text-xs placeholder-slate-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAdjustTarget(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAdjustLedger}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Simpan Koreksi
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#ECECEF] dark:border-white/10">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
