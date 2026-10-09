/**
 * @license
 * SiEpang - Public Certificate & Piagam Verification Portal (Requirement 179)
 * Privacy-preserving public validation:
 * Displays only appropriate verification info (Valid status, recipient name, document type, event, number, date, signatory).
 * Masks private participant contact details, NIK, or internal IDs.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck,
  Award,
  Calendar,
  Building,
  User,
  ExternalLink,
} from 'lucide-react';
import { documentStudioService } from '../../services/documentStudioService';
import { eventService } from '../../services/eventService';

export const PublicCertificateVerification: React.FC = () => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<any>(null);

  const activeEvent = eventService.getCurrentEvent();
  const organizerName = activeEvent.organizer || 'Kwartir Penyelenggara';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    setResult(documentStudioService.verifyPublicDocument(query.trim()));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Verifikasi Keaslian Dokumen & Piagam
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Pusat validasi digital resmi {organizerName}. Masukkan nomor seri atau pindai kode QR untuk memeriksa keabsahan sertifikat.
        </p>
      </div>

      {/* Verification Query Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Masukkan Nomor Seri Dokumen / Piagam..."
          className="flex-1 px-4 py-3 bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-2xl text-xs text-[#171717] dark:text-white font-mono focus:outline-none focus:border-[#E1306C] shadow-xs"
        />
        <button
          type="submit"
          className="px-6 py-3 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 52%, #F77737 78%, #FCAF45 100%)',
          }}
        >
          <Search className="w-4 h-4" />
          <span>Periksa</span>
        </button>
      </form>

      {/* Verification Result Card */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {result.isValid ? (
            <div className="rounded-[28px] bg-white dark:bg-[#141418] border-2 border-emerald-500/40 p-6 space-y-5 shadow-xs">
              {/* Status Header */}
              <div className="flex items-center gap-3 border-b border-[#ECECEF] dark:border-white/10 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                    <span>DOKUMEN ASLI & TERVERIFIKASI</span>
                  </div>
                  <h2 className="text-base font-bold text-[#171717] dark:text-white mt-1">
                    {result.recipientName}
                  </h2>
                  <p className="text-xs text-[#6B7280] dark:text-slate-400">{result.documentType}</p>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Nomor Registrasi Resmi</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {result.documentNumber}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Nama Kegiatan</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {result.eventName}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tanggal Terbit</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {result.issueDate}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                    <Building className="w-3.5 h-3.5" />
                    <span>Penandatangan Resmi</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {result.signatoryName}
                  </div>
                </div>
              </div>

              {/* Privacy protection notice */}
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                <p className="leading-relaxed">
                  Sesuai kebijakan privasi SiEpang Kwartir, informasi pribadi sensitif (NIK, nomor telepon, dan identitas wali) dilindungi dan tidak ditampilkan ke publik.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-8 text-center space-y-2">
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                Dokumen Tidak Terdaftar / Tidak Valid
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Nomor sertifikat <strong>"{query}"</strong> tidak ditemukan dalam basis data resmi SiEpang. Pastikan nomor dimasukkan dengan benar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
