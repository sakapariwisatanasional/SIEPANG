/**
 * @license
 * SiEpang - Consolidated QR Print Center & Unified Asset Studio (Req 59, 60, 61, 62)
 * Comprehensive batch printing and preview for:
 * - Activity QR Codes
 * - Checkpoint QRs (Wide Game / Penjelajahan)
 * - Visitor Passes (Approved camp guests)
 * - Participant ID QRs
 * - Certificate Verification QRs
 */

import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Calendar,
  Compass,
  Users,
  FileCheck2,
  Sliders,
  CheckCircle2,
  X,
  Eye,
  Download,
  Filter,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { activityQrService } from '../../services/activityQrService';
import { visitorManagementService } from '../../services/visitorManagementService';
import { participantService } from '../../services/participantService';
import { eventStudioService } from '../../services/eventStudioService';
import { ActivityQrConfig, VisitorRegistration } from '../../types';

interface QrPrintCenterModalProps {
  onClose: () => void;
}

export const QrPrintCenterModal: React.FC<QrPrintCenterModalProps> = ({ onClose }) => {
  const event = eventStudioService.getEvent();
  const [activeCategory, setActiveCategory] = useState<'activity' | 'checkpoint' | 'visitor' | 'participant'>('activity');

  // Print Layout Customizer (Req 61)
  const [paperFormat, setPaperFormat] = useState<'a4' | 'letter'>('a4');
  const [layoutMode, setLayoutMode] = useState<'single_large' | 'grid_cards' | 'activity_sign'>('activity_sign');
  const [showLogo, setShowLogo] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showXpBadge, setShowXpBadge] = useState(true);

  // Data Sources
  const activityConfigs = activityQrService.getConfigs();
  const allVisitors = visitorManagementService.getVisitors();
  const approvedVisitors = allVisitors.filter(v => v.status === 'APPROVED' || v.status === 'CHECKED_IN');
  const participants = participantService.getParticipants();

  // Multi-checkpoint extraction
  const allCheckpoints: Array<{ activityTitle: string; checkpoint: any }> = [];
  activityConfigs.forEach(c => {
    if (c.checkpoints) {
      c.checkpoints.forEach(cp => {
        allCheckpoints.push({ activityTitle: c.title, checkpoint: cp });
      });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#1c0c0f] border-2 border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto text-slate-100 flex flex-col">
        {/* Header (Hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-600/30 text-red-300 font-bold flex items-center justify-center">
                🖨️
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pusat Cetak QR Massal (QR Print Center)
                </h3>
                <p className="text-xs text-slate-400">
                  Cetak lembar QR Kegiatan, Pos Penjelajahan, Visitor Pass, dan Tanda Pengenal Peserta dalam satu pintu.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-red-950/50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Switcher (Hidden on print - Req 59, 60) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 text-xs font-semibold print:hidden">
          <button
            onClick={() => setActiveCategory('activity')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'activity' ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>QR Kegiatan ({activityConfigs.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('checkpoint')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'checkpoint' ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pos / Rute ({allCheckpoints.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('visitor')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'visitor' ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Visitor Pass ({approvedVisitors.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('participant')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeCategory === 'participant' ? 'bg-red-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Peserta ({participants.length})</span>
          </button>
        </div>

        {/* Layout Options Toolbar (Hidden on print - Req 61) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-black/30 rounded-2xl border border-white/5 text-xs print:hidden">
          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Tata Letak (Layout):</label>
            <select
              value={layoutMode}
              onChange={e => setLayoutMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-xl text-white font-medium"
            >
              <option value="activity_sign">A4 Lembar Papan Tanda (Activity Sign)</option>
              <option value="single_large">A4 QR Besar Tunggal (Gate / Stage)</option>
              <option value="grid_cards">Grid Kartu (4 Kartu per Lembar A4)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Ukuran Kertas:</label>
            <select
              value={paperFormat}
              onChange={e => setPaperFormat(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-xl text-white font-medium"
            >
              <option value="a4">A4 (210 x 297 mm)</option>
              <option value="letter">Letter / Kuarto</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] block mb-1">Opsi Tampilan Cetak:</label>
            <div className="flex gap-2 text-[11px] pt-1">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={e => setShowLogo(e.target.checked)}
                  className="accent-red-500 rounded"
                />
                <span>Logo</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInstructions}
                  onChange={e => setShowInstructions(e.target.checked)}
                  className="accent-red-500 rounded"
                />
                <span>Panduan</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showXpBadge}
                  onChange={e => setShowXpBadge(e.target.checked)}
                  className="accent-red-500 rounded"
                />
                <span>Poin XP</span>
              </label>
            </div>
          </div>
        </div>

        {/* PRINTABLE BATCH CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 bg-black/40 rounded-2xl border border-white/5 space-y-6">
          {/* CATEGORY 1: ACTIVITY QR BATCH */}
          {activeCategory === 'activity' && (
            <div className="space-y-6">
              {activityConfigs.map(cfg => (
                <div
                  key={cfg.id}
                  className="w-full max-w-xl mx-auto bg-white text-slate-900 rounded-3xl p-8 border-4 border-red-800 shadow-2xl text-center space-y-4 print:page-break-after print:border-none print:shadow-none print:p-0 print:my-0"
                >
                  <div className="border-b-2 border-red-800 pb-3 space-y-1">
                    {showLogo && (
                      <div className="text-[11px] font-black uppercase text-red-800">
                        {event.organizer || 'GERAKAN PRAMUKA'}
                      </div>
                    )}
                    <h2 className="text-lg font-black text-slate-950 uppercase">{event.name}</h2>
                    <div className="text-xs font-bold text-slate-600">{event.venue}</div>
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase">
                      {cfg.category}
                    </span>
                    <h1 className="text-2xl font-black text-slate-950 uppercase leading-snug">
                      {cfg.title}
                    </h1>
                    <div className="text-xs font-bold text-slate-700">
                      ⏰ {cfg.scanOpens} - {cfg.scanCloses} WIB · 📍 {cfg.location}
                    </div>
                  </div>

                  <div className="w-56 h-56 mx-auto p-3 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cfg.qrToken)}`}
                      alt={cfg.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2 border-t-2 border-slate-200 pt-3">
                    {showInstructions && (
                      <p className="text-xs font-bold text-slate-700">
                        Pindai menggunakan aplikasi SiEpang untuk mencatat kehadiran kegiatan
                      </p>
                    )}
                    {showXpBadge && cfg.rewardXp > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-slate-950 rounded-full font-black text-xs shadow">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>+{cfg.rewardXp} XP Poin Pramuka</span>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 font-mono">
                      Token Opaque: {cfg.qrToken.slice(0, 28)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY 2: CHECKPOINTS (WIDE GAME) BATCH */}
          {activeCategory === 'checkpoint' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allCheckpoints.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white text-slate-900 rounded-3xl p-6 border-4 border-slate-900 shadow-xl text-center space-y-3 print:page-break-inside-avoid"
                >
                  <div className="text-[10px] font-black uppercase text-red-800">
                    {item.activityTitle}
                  </div>
                  <h3 className="text-lg font-black text-slate-950 uppercase">
                    {item.checkpoint.name}
                  </h3>
                  <div className="text-xs font-bold text-slate-600">
                    📍 {item.checkpoint.location}
                  </div>

                  <div className="w-44 h-44 mx-auto p-2 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.checkpoint.qrToken)}`}
                      alt={item.checkpoint.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                      +{item.checkpoint.rewardXp} XP Checkpoint
                    </span>
                    {item.checkpoint.hint && (
                      <p className="text-[10px] text-slate-600 italic mt-1">
                        &quot;{item.checkpoint.hint}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY 3: VISITOR PASSES BATCH */}
          {activeCategory === 'visitor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedVisitors.map(v => (
                <div
                  key={v.id}
                  className="bg-white text-slate-900 rounded-3xl p-6 border-4 border-red-800 shadow-xl text-center space-y-3 print:page-break-inside-avoid"
                >
                  <div className="border-b border-slate-200 pb-2 space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-800">
                      KARTU TANDA PENGUNJUNG (VISITOR PASS)
                    </span>
                    <h4 className="text-base font-black text-slate-950">{v.name}</h4>
                    <div className="text-xs font-bold text-slate-600">
                      {v.category} · Izin: {v.visitDate}
                    </div>
                  </div>

                  <div className="w-40 h-40 mx-auto p-2 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(v.qrToken)}`}
                      alt={v.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1 text-left bg-slate-50 p-2.5 rounded-xl text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kode Kunjungan:</span>
                      <strong className="font-mono text-slate-900">{v.registrationCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mengunjungi:</span>
                      <span className="font-bold text-slate-900">{v.personVisited.targetName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jam Berkunjung:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {v.expectedArrival} - {v.expectedDeparture} WIB
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY 4: PARTICIPANT ID QR BATCH */}
          {activeCategory === 'participant' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {participants.slice(0, 12).map(p => (
                <div
                  key={p.id}
                  className="bg-white text-slate-900 rounded-2xl p-4 border-2 border-red-800 text-center space-y-2"
                >
                  <div className="text-xs font-black text-slate-950 truncate">{p.name}</div>
                  <div className="text-[10px] font-mono font-bold text-red-800">{p.code}</div>
                  <div className="w-28 h-28 mx-auto p-1 border border-slate-900 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(p.code)}`}
                      alt={p.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">{p.contingentName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
