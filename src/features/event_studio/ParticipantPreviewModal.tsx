/**
 * @license
 * SiEpang - Participant Viewport Preview Modal (Requirement 31)
 * Simulates mobile event companion UI so admins can preview exactly what
 * participants will experience based on dynamic branding and active module settings.
 */

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Calendar,
  Trophy,
  Flame,
  MapPin,
  Phone,
  Shield,
  Heart,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { eventStudioService } from '../../services/eventStudioService';
import { participantService } from '../../services/participantService';

interface ParticipantPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParticipantPreviewModal: React.FC<ParticipantPreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [previewTab, setPreviewTab] = useState<'home' | 'schedule' | 'campsite' | 'competitions'>('home');
  const event = eventStudioService.getEvent();
  const schedule = eventStudioService.getSchedule().slice(0, 3);
  const lots = eventStudioService.getCampsiteLots();
  const sampleLot = lots[1] || lots[0] || { subCamp: 'Sektor Utama', zone: 'A', block: '01', lotNumber: '01' };
  const competitions = eventStudioService.getCompetitions().slice(0, 3);
  const participants = participantService.getParticipants();
  const previewParticipant = participants[0];
  const participantName = previewParticipant?.name || 'Nama Peserta';
  const participantSub = previewParticipant
    ? `${previewParticipant.participantCode || previewParticipant.code || previewParticipant.id} · ${previewParticipant.contingentName}`
    : 'ID Peserta · Kontingen';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#141418] border-4 border-slate-800 dark:border-slate-700 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Device Frame Top Notch & Title */}
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Smartphone className="w-4 h-4" />
            <span>Pratinjau Peserta (Live Preview)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
              {event.status}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="p-2 bg-slate-100 dark:bg-black/30 border-b border-[#ECECEF] dark:border-white/5 flex gap-1 text-[11px] overflow-x-auto">
          {[
            { id: 'home', label: 'Beranda' },
            { id: 'schedule', label: 'Jadwal' },
            { id: 'campsite', label: 'Kavling Tenda' },
            { id: 'competitions', label: 'Lomba' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setPreviewTab(t.id as any)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                previewTab === t.id ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mobile Viewport Screen Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F7F8] dark:bg-[#0C0C0E] text-slate-800 dark:text-slate-100">
          {previewTab === 'home' && (
            <div className="space-y-4">
              {/* Event Hero Card */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 border border-emerald-500/30 relative overflow-hidden shadow-lg">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 text-emerald-300 text-[10px] font-bold mb-2">
                  <span>⛺ {event.shortName}</span>
                </div>
                <h3 className="text-sm font-black text-white leading-snug">{event.name}</h3>
                <p className="text-[11px] text-emerald-200 mt-1 italic">"{event.theme}"</p>
                <div className="text-[10px] text-slate-300 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Digital Pass / QR Card */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 flex items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    Pas Pramuka Digital
                  </div>
                  <div className="text-xs font-bold text-[#171717] dark:text-white">{participantName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{participantSub}</div>
                </div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-white rounded-xl p-1 flex items-center justify-center shrink-0 border border-[#ECECEF] dark:border-transparent">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
              </div>

              {/* Assigned Campsite Card (Requirement 9) */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#171717] dark:text-white">
                    <span className="text-base">⛺</span>
                    <span>Kavling Tenda Kontingen</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold border border-emerald-200 dark:border-transparent">
                    Terverifikasi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAFAFA] dark:bg-black/30 p-2.5 rounded-2xl border border-[#ECECEF] dark:border-white/5">
                  <div>Sub Camp: <strong className="text-emerald-600 dark:text-emerald-300">{sampleLot.subCamp.replace('Sub Camp ', '')}</strong></div>
                  <div>Zona: <strong className="text-[#171717] dark:text-white">{sampleLot.zone}</strong></div>
                  <div>Blok: <strong className="text-[#171717] dark:text-white">{sampleLot.block}</strong></div>
                  <div>Kavling: <strong className="text-amber-600 dark:text-amber-400">{sampleLot.lotNumber}</strong></div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Fasilitas terdekat: 🚻 MCK Putra Sektor A (30m) · 🏥 Posko Medis Utama (80m)
                </p>
              </div>

              {/* Today's Schedule Preview */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Agenda Hari Ini:</div>
                {schedule.map(s => (
                  <div key={s.id} className="p-3 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <div className="font-bold text-[#171717] dark:text-white">{s.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.time} · {s.location}</div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">+{s.xpReward} XP</span>
                  </div>
                ))}
              </div>

              {/* Emergency Contacts Action Cards (Requirement 28) */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Kontak Cepat Buper:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-center cursor-pointer">
                    <div className="text-base">🚑</div>
                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mt-0.5">Medis</div>
                  </button>
                  <button className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-center cursor-pointer">
                    <div className="text-base">🛡️</div>
                    <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 mt-0.5">Keamanan</div>
                  </button>
                  <button className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-center cursor-pointer">
                    <div className="text-base">ℹ️</div>
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">Informasi</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {previewTab === 'schedule' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Jadwal Agenda Perkemahan:</div>
              {eventStudioService.getSchedule().map(item => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/5 space-y-1 text-xs shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">{item.time}</span>
                    <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">+{item.xpReward} XP</span>
                  </div>
                  <div className="font-bold text-[#171717] dark:text-white">{item.title}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.location} · Hari ke-{item.dayNumber}</div>
                </div>
              ))}
            </div>
          )}

          {previewTab === 'campsite' && (
            <div className="space-y-3 text-xs">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Informasi Lokasi Kemah & Titik Fasilitas:</div>
              <div className="p-4 rounded-3xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/8 space-y-2 shadow-xs">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">Kavling Anda: {sampleLot.lotNumber} ({sampleLot.block})</div>
                <p className="text-slate-700 dark:text-slate-300">Sub Camp: {sampleLot.subCamp}</p>
                <p className="text-slate-700 dark:text-slate-300">Kapasitas: {sampleLot.capacity} Peserta</p>
                <div className="pt-2 border-t border-[#ECECEF] dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400">
                  {sampleLot.notes}
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pt-2">Fasilitas Buper Terdekat:</div>
              {eventStudioService.getFacilities().slice(0, 4).map(f => (
                <div key={f.id} className="p-3 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{f.icon}</span>
                    <div>
                      <div className="font-bold text-[#171717] dark:text-white">{f.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{f.location}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{f.openingHours}</span>
                </div>
              ))}
            </div>
          )}

          {previewTab === 'competitions' && (
            <div className="space-y-3 text-xs">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Cabang Lomba & Giat Prestasi:</div>
              {competitions.map(c => (
                <div key={c.id} className="p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/5 space-y-1 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#171717] dark:text-white">{c.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold border border-amber-200 dark:border-transparent">
                      {c.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Waktu: {c.scheduleTime} · {c.location}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Penilaian: Juri {c.juryWeight}% {c.votingEnabled && `+ Publik ${c.publicWeight}%`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-white/10 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
