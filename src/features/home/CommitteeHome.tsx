/**
 * @license
 * SiEpang - Committee (Panitia) Home Screen
 * Prioritizes: Today's Tasks, Schedule, Attendance Scan, Announcements,
 * Participant Lookup, Activity Status, Emergency / Incident Quick Action.
 */

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  QrCode,
  Users,
  AlertTriangle,
  Bell,
  Clock,
  Compass,
  Search,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { participantService } from '../../services/participantService';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard, SearchBar } from '../../components/common/GlobalUxComponents';

interface CommitteeHomeProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const CommitteeHome: React.FC<CommitteeHomeProps> = ({
  onNavigate,
  onOpenScanner,
}) => {
  const event = eventService.getCurrentEvent();
  const scheduleToday = eventService.getSchedule(1);
  const participants = participantService.getParticipants();
  const announcements = eventService.getAnnouncements();

  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Siapkan Posko Giat 1: Pioneering', time: '08:00', done: true },
    { id: '2', title: 'Presensi Peserta Upacara Pembukaan', time: '09:30', done: true },
    { id: '3', title: 'Cek Kesiapan Konsumsi Siang Kontingen', time: '11:45', done: false },
    { id: '4', title: 'Monitoring Jalur Wide Game Pos Selogiri', time: '14:00', done: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const searchedParticipants = searchQuery.trim()
    ? participants
        .filter(
          p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.contingentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const checkedInTotal = participants.filter(p => p.checkedIn).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Greeting & Event Context Bar */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
            <span>⚜️ Posko Panitia Lapangan</span>
            <span>·</span>
            <span>{event.shortName || 'Jambore'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Tugas & Operasional Hari Ini
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Pastikan seluruh giat perkemahan berjalan tertib, aman, dan tepat waktu.
          </p>
        </div>

        {/* Primary Scan Button */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-pink-500/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <QrCode className="w-5 h-5 stroke-[2.2]" />
          <span>Pindai Presensi / Pos</span>
        </button>
      </div>

      {/* 2. Key Metrics for Committee (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value={`${checkedInTotal}/${participants.length}`}
          label="Kehadiran Buper"
          sublabel="Total peserta di area"
          color="emerald"
          icon={CheckCircle2}
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          value={tasks.filter(t => t.done).length}
          label="Tugas Selesai"
          sublabel={`dari ${tasks.length} target panitia`}
          color="purple"
          icon={CheckCircle2}
        />
        <MetricCard
          value={scheduleToday.length}
          label="Sesi Jadwal"
          sublabel="Hari ke-1 perkemahan"
          color="blue"
          icon={Calendar}
          onClick={() => onNavigate('schedule')}
        />
        <MetricCard
          value="Normal"
          label="Status Lapangan"
          sublabel="Posko & cuaca aman"
          color="amber"
          icon={Compass}
        />
      </div>

      {/* 3. Quick Participant Lookup */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#833AB4]" />
            <span>Pencarian Cepat Peserta / Kontingen</span>
          </h3>
          <span className="text-[11px] text-slate-400">Verifikasi lapangan</span>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Ketik nama peserta, nomor ID, atau nama kontingen..."
        />

        {searchQuery.trim() && (
          <div className="space-y-1.5 pt-1">
            {searchedParticipants.length > 0 ? (
              searchedParticipants.map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#ECECEF]"
                    />
                    <div>
                      <div className="font-bold text-[#171717] dark:text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.contingentName} · Tenda {p.tentNumber} ({p.subCamp})
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.checkedIn
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {p.checkedIn ? 'Hadir di Buper' : 'Belum Check-in'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                Tidak ada peserta yang cocok dengan "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Two-Column Layout: Today's Tasks & Today's Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Daftar Tugas Panitia</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {tasks.filter(t => t.done).length}/{tasks.length} Selesai
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  task.done
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20 text-slate-500 dark:text-slate-400'
                    : 'bg-slate-50 dark:bg-white/5 border-[#ECECEF] dark:border-white/10 text-[#171717] dark:text-white hover:border-[#833AB4]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      task.done
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-black/40'
                    }`}
                  >
                    {task.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-semibold ${task.done ? 'line-through' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {task.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#833AB4]" />
              <span>Jadwal Kegiatan Terdekat</span>
            </h3>
            <button
              onClick={() => onNavigate('schedule')}
              className="text-[11px] font-bold text-[#833AB4] hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2">
            {scheduleToday.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#171717] dark:text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#833AB4]">{item.time}</div>
                  <span className="text-[10px] text-slate-400 uppercase">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Emergency Incident Quick Alert */}
      <div className="p-4 rounded-[20px] bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-rose-800 dark:text-rose-300">
              Posko P3K & Tanggap Darurat Siaga
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-[11px]">
              Jika terjadi insiden medis atau cuaca darurat, segera laporkan ke tim kesehatan.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('health')}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer"
        >
          Buka Posko Medis
        </button>
      </div>
    </div>
  );
};
