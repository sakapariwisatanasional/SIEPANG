/**
 * @license
 * SiEpang - Registration Officer (Petugas Registrasi) Home Screen
 * Prioritizes: Pending Registrations, Verification Queue, Photo Review,
 * Check-In, Search Participant, ID Card Printing.
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Users,
  CheckCircle2,
  Clock,
  Camera,
  Search,
  CreditCard,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { participantService } from '../../services/participantService';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard, SearchBar } from '../../components/common/GlobalUxComponents';

interface RegistrationOfficerHomeProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const RegistrationOfficerHome: React.FC<RegistrationOfficerHomeProps> = ({
  onNavigate,
  onOpenScanner,
}) => {
  const participants = participantService.getParticipants();
  const contingents = participantService.getContingents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>('ALL');

  const pendingVerification = participants.filter(p => !p.checkedIn);
  const checkedInCount = participants.filter(p => p.checkedIn).length;

  const filtered = participants
    .filter(p => {
      if (filterType === 'UNCHECKED') return !p.checkedIn;
      if (filterType === 'CHECKED') return p.checkedIn;
      return true;
    })
    .filter(
      p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contingentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleQuickCheckIn = (id: string) => {
    participantService.checkIn(id);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Header Greeting & Role Identity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">
            <span>🪪 Meja Registrasi & Verifikasi</span>
            <span>·</span>
            <span>Gate Masuk Buper</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Verifikasi & Kedatangan Peserta
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Validasi berkas mandat, tinjau kesesuaian foto profil, dan konfirmasi check-in kedatangan.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#208C60] to-[#F47743] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Scan Check-in QR</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('templates')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Cetak ID Card"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak ID Card</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics for Registration Officer (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value={participants.length}
          label="Total Terdaftar"
          sublabel="Semua kontingen"
          color="purple"
          icon={Users}
        />
        <MetricCard
          value={pendingVerification.length}
          label="Belum Check-in"
          sublabel="Menunggu kedatangan"
          color="amber"
          icon={Clock}
          onClick={() => setFilterType('UNCHECKED')}
        />
        <MetricCard
          value={checkedInCount}
          label="Sudah Verifikasi"
          sublabel={`${Math.round((checkedInCount / Math.max(1, participants.length)) * 100)}% tiba di buper`}
          color="emerald"
          icon={CheckCircle2}
          onClick={() => setFilterType('CHECKED')}
        />
        <MetricCard
          value={contingents.length}
          label="Kontingen Ranting"
          sublabel="Rombongan terdata"
          color="blue"
          icon={Users}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama peserta, nomor ID, atau kontingen..."
            className="flex-1"
          />

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({participants.length})
            </button>
            <button
              onClick={() => setFilterType('UNCHECKED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'UNCHECKED'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              Belum ({pendingVerification.length})
            </button>
            <button
              onClick={() => setFilterType('CHECKED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                filterType === 'CHECKED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
              }`}
            >
              Sudah ({checkedInCount})
            </button>
          </div>
        </div>

        {/* Participant List Table */}
        <div className="divide-y divide-[#ECECEF] dark:divide-white/5 pt-1">
          {filtered.slice(0, 8).map(p => (
            <div
              key={p.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#ECECEF] shrink-0"
                />
                <div>
                  <div className="font-bold text-[#171717] dark:text-white flex items-center gap-2">
                    <span>{p.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({p.code})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.contingentName} · Tenda {p.tentNumber} ({p.subCamp})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {p.checkedIn ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Check-in</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickCheckIn(p.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Check-in Sekarang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('participants')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  title="Detail Peserta"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
