/**
 * @license
 * SiEpang - Health Officer (Petugas Medis / P3K) Home Screen
 * Prioritizes: Posko Kesehatan, Rekam Medis & Riwayat Alergi Rahasia,
 * Pencatatan Insiden Baru, Kontak Darurat & Ambulans.
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Search,
  CheckCircle2,
  Plus,
  Lock,
} from 'lucide-react';
import { participantService } from '../../services/participantService';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard, SearchBar } from '../../components/common/GlobalUxComponents';

interface HealthOfficerHomeProps {
  onNavigate: (tab: NavTab) => void;
}

export const HealthOfficerHome: React.FC<HealthOfficerHomeProps> = ({ onNavigate }) => {
  const participants = participantService.getParticipants();
  const [searchQuery, setSearchQuery] = useState('');

  const searched = searchQuery.trim()
    ? participants
        .filter(
          p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.contingentName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Header Greeting & Role Identity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold mb-2">
            <span>🩺 Posko Kesehatan & P3K Buper</span>
            <span>·</span>
            <span>Akses Medis Terproteksi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Layanan Kesehatan & Tanggap Darurat
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Penanganan medis, catatan alergi peserta, rujukan ambulans, dan riwayat kesehatan.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => onNavigate('health')}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-[#E1306C] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
          <span>Catat Pasien / Insiden Baru</span>
        </button>
      </div>

      {/* 2. Key Metrics for Health Officer (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value="Siaga 24 Jam"
          label="Status Posko"
          sublabel="Pos Utama Selogiri"
          color="emerald"
          icon={CheckCircle2}
        />
        <MetricCard
          value="3 Pasien"
          label="Dirawat Hari Ini"
          sublabel="Gejala ringan / kelelahan"
          color="rose"
          icon={HeartPulse}
          onClick={() => onNavigate('health')}
        />
        <MetricCard
          value="0 Kasus"
          label="Rujukan RS"
          sublabel="Semua tertangani di buper"
          color="blue"
          icon={Stethoscope}
        />
        <MetricCard
          value="12 Terdata"
          label="Catatan Alergi"
          sublabel="Diwaspadai pada makanan"
          color="amber"
          icon={AlertTriangle}
        />
      </div>

      {/* 3. Confidential Medical Lookup (Privacy Enforced) */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider">
              Pencarian Rekam Medis Rahasia Peserta
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Khusus Petugas Medis</span>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Ketik nama atau nomor badge peserta untuk melihat alergi & kontak darurat..."
        />

        {searchQuery.trim() && (
          <div className="space-y-2 pt-1">
            {searched.length > 0 ? (
              searched.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-rose-500/20 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[#171717] dark:text-white text-sm">
                      {p.name} ({p.code})
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                      Gol. Darah: {p.bloodType || 'O+'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                    <div>Kontingen: <strong>{p.contingentName}</strong></div>
                    <div>Lokasi Tenda: <strong>Tenda {p.tentNumber} ({p.subCamp})</strong></div>
                    <div>Kontak Darurat: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{p.emergencyContact || '0812-3456-7890'}</strong></div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                    <strong>Riwayat Penyakit / Alergi:</strong> {p.medicalNotes || 'Tidak ada riwayat alergi yang tercatat.'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada peserta yang ditemukan dengan kata kunci "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Emergency Contacts & Quick Hospital Action */}
      <div className="p-4 rounded-[20px] bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-rose-800 dark:text-rose-300">
              Hotline Ambulans & Rumah Sakit Rujukan
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px]">
              Tim Medis & Ambulans Siaga di Posko Kesehatan Bumi Perkemahan.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('health')}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
        >
          Buku Log Medis
        </button>
      </div>
    </div>
  );
};
