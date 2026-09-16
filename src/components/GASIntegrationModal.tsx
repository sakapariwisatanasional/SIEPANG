import React, { useState } from 'react';
import { GASConfig, Participant, Leader, Visitor, ScheduleItem } from '../types';
import { DEFAULT_GAS_CODE, syncWithGAS, exportToCSV } from '../services/gasSyncService';
import {
  FileSpreadsheet,
  X,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  Terminal,
  Layers,
  HelpCircle,
  GitBranch,
  Globe,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface GASIntegrationModalProps {
  config: GASConfig;
  onSaveConfig: (cfg: GASConfig) => void;
  onApplyRemoteData?: (data: any) => void;
  participants: Participant[];
  leaders: Leader[];
  visitors?: Visitor[];
  schedules: ScheduleItem[];
  onClose: () => void;
}

export const GASIntegrationModal: React.FC<GASIntegrationModalProps> = ({
  config,
  onSaveConfig,
  onApplyRemoteData,
  participants,
  leaders,
  visitors = [],
  schedules,
  onClose,
}) => {
  const [gasUrl, setGasUrl] = useState(config.gasWebAppUrl || '');
  const [sheetId, setSheetId] = useState(config.sheetId || '');
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });
  const [activeSubTab, setActiveSubTab] = useState<'gas' | 'sheets' | 'github_vercel'>('gas');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(DEFAULT_GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    const updated: GASConfig = {
      ...config,
      gasWebAppUrl: gasUrl.trim(),
      sheetId: sheetId.trim(),
    };
    onSaveConfig(updated);
    setTestStatus({
      type: 'success',
      message: 'Pengaturan Google Apps Script berhasil disimpan di perangkat!',
    });
  };

  const handleTestSync = async () => {
    if (!gasUrl.trim()) {
      setTestStatus({
        type: 'error',
        message: 'Masukkan URL Web App GAS terlebih dahulu (akhiran /exec)',
      });
      return;
    }

    setIsTesting(true);
    setTestStatus({ type: 'idle', message: '' });

    try {
      const result = await syncWithGAS(gasUrl.trim());
      if (result && result.status === 'success') {
        setTestStatus({
          type: 'success',
          message: `Koneksi Berhasil! Terhubung ke Google Spreadsheet (Ditemukan: ${
            result.participants?.length || 0
          } Peserta, ${result.leaders?.length || 0} Pembina, ${result.visitors?.length || 0} Pengunjung, ${result.schedules?.length || 0} Jadwal)`,
        });

        if (onApplyRemoteData) {
          onApplyRemoteData(result);
        }

        // Save last sync time
        onSaveConfig({
          ...config,
          gasWebAppUrl: gasUrl.trim(),
          sheetId: sheetId.trim(),
          lastSyncTime: new Date().toLocaleString('id-ID'),
        });
      } else {
        setTestStatus({
          type: 'error',
          message: 'GAS merespons, namun format data belum sesuai struktur spreadsheet.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Gagal terhubung: ${err.message || 'Periksa izin Deploy Web App (Pilih Anyone/Siapa Saja)'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const downloadPesertaTemplate = () => {
    exportToCSV(participants, 'Template_Sheet_Peserta_Jambore');
  };

  const downloadPembinaTemplate = () => {
    exportToCSV(leaders, 'Template_Sheet_Pembina_Jambore');
  };

  const downloadPengunjungTemplate = () => {
    exportToCSV(visitors, 'Template_Sheet_Pengunjung_Jambore');
  };

  const downloadJadwalTemplate = () => {
    exportToCSV(schedules, 'Template_Sheet_Jadwal_Jambore');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header - Red Dominant Theme */}
        <div className="flex items-center justify-between border-b border-red-950/30 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-red-950 shadow font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Integrasi Google Sheets, GAS &amp; Vercel
              </h3>
              <p className="text-xs text-amber-200/80">
                Arsitektur sinkronisasi database tanpa server (Serverless Google Apps Script)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-200/70 hover:bg-red-800/60 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('gas')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeSubTab === 'gas'
                ? 'border-red-800 text-red-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="h-4 w-4 text-red-700" />
            <span>Koneksi Web App GAS</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sheets')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeSubTab === 'sheets'
                ? 'border-red-800 text-red-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="h-4 w-4 text-emerald-700" />
            <span>Template Spreadsheet &amp; CSV</span>
          </button>
          <button
            onClick={() => setActiveSubTab('github_vercel')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition ${
              activeSubTab === 'github_vercel'
                ? 'border-red-800 text-red-900 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4 text-blue-700" />
            <span>Deploy GitHub &amp; Vercel</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Subtab 1: GAS Setup */}
          {activeSubTab === 'gas' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Kode Google Apps Script (Code.gs) Siap Pakai
                  </h4>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white shadow hover:bg-emerald-700 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Seluruh Kode GAS'}</span>
                  </button>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Kode ini menangani pembacaan tabel Peserta, Pembina, Jadwal, dan pencatatan presensi
                  real-time saat scan QR Code langsung ke Google Sheets.
                </p>
              </div>

              {/* Step by step instructions */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <h5 className="font-bold text-stone-800 text-xs">Langkah Singkat Pemasangan:</h5>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 text-[11px] leading-relaxed">
                  <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
                  <li>
                    Buka menu <strong>Ekstensi &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Tempelkan kode yang disalin di atas ke dalam file <code>Code.gs</code>.
                  </li>
                  <li>
                    Klik tombol biru <strong>Terapkan (Deploy) &gt; Penerapan Baru</strong>.
                  </li>
                  <li>
                    Pilih tipe <strong>Aplikasi Web</strong>, set <em>Siapa yang memiliki akses:</em>{' '}
                    <strong>Siapa saja (Anyone)</strong>.
                  </li>
                  <li>Salin URL Aplikasi Web (akhiran <code>/exec</code>) lalu tempel di bawah ini.</li>
                </ol>
              </div>

              {/* URL Input Form */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    URL Web App Google Apps Script (GAS)
                  </label>
                  <input
                    type="url"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-stone-500">
                    Pastikan URL diakhiri dengan <code>/exec</code>, bukan <code>/edit</code>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleTestSync}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 font-bold text-white hover:bg-stone-800 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi &amp; Sinkronkan'}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Simpan Pengaturan
                  </button>
                </div>

                {/* Status message */}
                {testStatus.message && (
                  <div
                    className={`mt-2 flex items-start gap-2 rounded-xl p-3 text-xs ${
                      testStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {testStatus.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: Spreadsheet CSV Export */}
          {activeSubTab === 'sheets' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <h4 className="font-bold text-stone-900 text-sm mb-1">
                  Download Format CSV untuk Google Sheets
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Jika Anda ingin mengimpor database awal ke Google Spreadsheet, Anda bisa mengunduh file
                  CSV siap pakai dengan struktur kolom lengkap berikut:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-stone-800">Sheet: Peserta</h5>
                    <p className="text-[10px] text-stone-500">
                      {participants.length} data peserta, regu, kontak darurat &amp; status
                    </p>
                  </div>
                  <button
                    onClick={downloadPesertaTemplate}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200 py-1.5 text-xs font-bold text-red-900 hover:bg-red-100 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-red-700" />
                    <span>Unduh CSV Peserta</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-stone-800">Sheet: Pembina</h5>
                    <p className="text-[10px] text-stone-500">
                      {leaders.length} data pembina pendamping, pangkalan, WA
                    </p>
                  </div>
                  <button
                    onClick={downloadPembinaTemplate}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-amber-700" />
                    <span>Unduh CSV Pembina</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-stone-800">Sheet: Pengunjung (Publik)</h5>
                    <p className="text-[10px] text-stone-500">
                      {visitors.length} data tiket pengunjung, keperluan, &amp; check-in
                    </p>
                  </div>
                  <button
                    onClick={downloadPengunjungTemplate}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-purple-700" />
                    <span>Unduh CSV Pengunjung</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-stone-800">Sheet: Jadwal</h5>
                    <p className="text-[10px] text-stone-500">
                      {schedules.length} rundown agenda, lokasi &amp; status
                    </p>
                  </div>
                  <button
                    onClick={downloadJadwalTemplate}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Unduh CSV Jadwal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: GitHub & Vercel */}
          {activeSubTab === 'github_vercel' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-900 p-4 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-emerald-400" />
                  <h4 className="font-bold text-sm">Deployment ke GitHub &amp; Vercel</h4>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  Aplikasi ini dibangun menggunakan arsitektur Single Page Application (SPA) berbasis Vite +
                  React. Aplikasi ini 100% kompatibel dengan hosting gratis di Vercel atau GitHub Pages.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2.5">
                <h5 className="font-bold text-stone-800">Langkah ke Vercel:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-600 text-[11px] leading-relaxed">
                  <li>
                    Download ZIP atau Push repository ini ke <strong>GitHub</strong> Anda.
                  </li>
                  <li>
                    Buka <strong>vercel.com</strong> lalu klik <strong>&quot;Add New Project&quot;</strong>.
                  </li>
                  <li>Pilih repository GitHub Jambore ini.</li>
                  <li>
                    Vercel akan secara otomatis mendeteksi Framework <strong>Vite</strong> dengan build
                    command: <code>npm run build</code> dan output directory: <code>dist</code>.
                  </li>
                  <li>
                    Klik <strong>Deploy</strong>! Aplikasi Anda langsung aktif dengan domain HTTPS (misal:{' '}
                    <code>jambore-pramuka.vercel.app</code>) serta mendukung install PWA di iOS &amp; Android.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-5 py-3 text-xs text-stone-500">
          <span>Sistem Integrasi Jambore Pramuka</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-1.5 font-semibold text-white hover:bg-stone-900 transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
