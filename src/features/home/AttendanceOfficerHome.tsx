/**
 * @license
 * SiEpang - Attendance Officer (Petugas Presensi) Home Screen
 * Prioritizes: Presensi Gate & Giat Lapangan, Quick QR Scanner,
 * Tingkat Kehadiran Kontingen, Log Presensi Terkini.
 */

import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  Users,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { participantService } from '../../services/participantService';
import { eventService } from '../../services/eventService';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard } from '../../components/common/GlobalUxComponents';

interface AttendanceOfficerHomeProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const AttendanceOfficerHome: React.FC<AttendanceOfficerHomeProps> = ({
  onNavigate,
  onOpenScanner,
}) => {
  const participants = participantService.getParticipants();
  const contingents = participantService.getContingents();
  const scheduleToday = eventService.getSchedule(1);

  const checkedInCount = participants.filter(p => p.checkedIn).length;
  const attendanceRate = Math.round((checkedInCount / Math.max(1, participants.length)) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Header Greeting & Role Identity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
            <span>📷 Meja Presensi & Pos Lapangan</span>
            <span>·</span>
            <span>Check-in & Barcode Scanner</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Pencatatan Presensi Peserta
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Pindai QR badge peserta untuk mencatat kehadiran sesi giat atau kedatangan pintu gerbang.
          </p>
        </div>

        {/* Primary Giant Scanner Action */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="self-start sm:self-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#E1306C] hover:opacity-95 text-white font-black text-xs shadow-md shadow-emerald-950/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <QrCode className="w-5 h-5 stroke-[2.2]" />
          <span>Buka Pemindai Barcode / QR</span>
        </button>
      </div>

      {/* 2. Key Metrics (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value={checkedInCount}
          label="Total Hadir"
          sublabel={`dari ${participants.length} peserta`}
          color="emerald"
          icon={CheckCircle2}
        />
        <MetricCard
          value={`${attendanceRate}%`}
          label="Persentase Hadir"
          sublabel="Tiba di area perkemahan"
          color="purple"
          icon={TrendingUp}
        />
        <MetricCard
          value={participants.length - checkedInCount}
          label="Belum Hadir"
          sublabel="Dalam perjalanan / verifikasi"
          color="amber"
          icon={Clock}
        />
        <MetricCard
          value={scheduleToday.length}
          label="Sesi Hari Ini"
          sublabel="Agenda terdaftar"
          color="blue"
          icon={Calendar}
          onClick={() => onNavigate('schedule')}
        />
      </div>

      {/* 3. Contingent Check-in Status List */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Status Kehadiran Rombongan Kontingen</span>
          </h3>
          <span className="text-[11px] text-slate-400">{contingents.length} Kontingen</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contingents.map(c => {
            const cParticipants = participants.filter(p => p.contingentId === c.id);
            const cHadir = cParticipants.filter(p => p.checkedIn).length;
            const cPct = Math.round((cHadir / Math.max(1, cParticipants.length)) * 100);

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[#171717] dark:text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sub-Camp {c.subCamp} · Kuota: {c.quota}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {cHadir}/{cParticipants.length}
                  </div>
                  <span className="text-[10px] text-slate-400">{cPct}% Hadir</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
