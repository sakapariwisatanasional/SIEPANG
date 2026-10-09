/**
 * @license
 * SiEpang - Judge / Penjurian Lomba Interface (RC1 Global Design System)
 * Dedicated focused UI for contest judges with scoring rubrics, sliders, and lock mechanism.
 * Standardized to Light-First, Instagram-inspired accent system, and 44px touch targets.
 */

import React, { useState } from 'react';
import {
  Medal,
  Award,
  CheckCircle2,
  Lock,
  Unlock,
  Sliders,
  Save,
  ChevronRight,
  Sparkles,
  WifiOff,
  Cloud,
  HardDrive,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { competitionService, JudgeScoreSubmission } from '../../services/competitionService';
import { participantService } from '../../services/participantService';
import { syncQueueService } from '../../offline/syncQueueService';
import { localCampServerService } from '../../services/localCampServerService';
import { JudgeScoreStatus } from '../../offline/types';

export const JudgeScoringInterface: React.FC = () => {
  const competitions = competitionService.getCompetitions();
  const contingents = participantService.getContingents();

  const [selectedCompId, setSelectedCompId] = useState(competitions[0].id);
  const [selectedContingentId, setSelectedContingentId] = useState(contingents[0].id);
  const [entityVersion, setEntityVersion] = useState<number>(104);
  const [scoreStatus, setScoreStatus] = useState<JudgeScoreStatus>('DRAFT_LOCAL');

  // Scoring rubric
  const [scores, setScores] = useState({
    kreativitas: 85,
    kesesuaianTema: 90,
    teknikPramuka: 88,
    kerapian: 82,
  });

  const [notes, setNotes] = useState('Pionering simpul kuat dan rapi, bendera terpasang kokoh.');
  const [isLocked, setIsLocked] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'saved_device' | 'saved_buper' | 'synced_cloud' | 'conflict' | 'locked';
    message: string;
    txId?: string;
  } | null>(null);

  const selectedComp = competitions.find(c => c.id === selectedCompId) || competitions[0];
  const selectedContingent = contingents.find(c => c.id === selectedContingentId) || contingents[0];

  const totalScore = Math.round(
    scores.kreativitas * 0.3 +
      scores.kesesuaianTema * 0.25 +
      scores.teknikPramuka * 0.3 +
      scores.kerapian * 0.15
  );

  const isOffline = syncQueueService.getConnectionState() === 'offline';

  const handleSaveScore = () => {
    if (isLocked) {
      setFeedback({
        type: 'locked',
        message: 'SCORE_LOCKED: Nilai lomba tidak dapat diubah karena telah dikunci oleh Ketua Dewan Juri.',
      });
      return;
    }

    const tx = syncQueueService.enqueueTransaction({
      entity: 'scoring',
      action: 'SCORE',
      record_id: `score_${selectedCompId}_${selectedContingentId}`,
      expected_version: entityVersion,
      payload: {
        competitionId: selectedCompId,
        entryId: `entry_${selectedContingentId}`,
        contingentName: selectedContingent.name,
        scores,
        totalScore,
        notes,
        isLocked,
      },
    });

    competitionService.submitJudgeScore({
      competitionId: selectedCompId,
      entryId: `entry_${selectedContingentId}`,
      contingentName: selectedContingent.name,
      scores,
      totalScore,
      notes,
    });

    const operationalMode = localCampServerService.getOperationalMode();

    if (isOffline) {
      setScoreStatus('DRAFT_LOCAL');
      setFeedback({
        type: 'saved_device',
        message: `Nilai ${selectedContingent.name} (${totalScore} Poin) disimpan di perangkat lokal (DRAFT_LOCAL).`,
        txId: tx.transaction_id,
      });
    } else if (operationalMode === 'local' || operationalMode === 'hybrid') {
      localCampServerService.receiveTransactionFromDevice(tx);
      setScoreStatus('EDGE_SAVED');
      setFeedback({
        type: 'saved_buper',
        message: `Nilai ${selectedContingent.name} (${totalScore} Poin) disimpan di Server Buper (EDGE_SAVED).`,
        txId: tx.transaction_id,
      });
    } else {
      setScoreStatus('CLOUD_SAVED');
      setFeedback({
        type: 'synced_cloud',
        message: `Nilai ${selectedContingent.name} (${totalScore} Poin) resmi tersinkron ke Cloud (CLOUD_SAVED).`,
        txId: tx.transaction_id,
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleReloadLatestVersion = () => {
    setEntityVersion(prev => prev + 1);
    setScores({
      kreativitas: 88,
      kesesuaianTema: 92,
      teknikPramuka: 90,
      kerapian: 85,
    });
    setFeedback(null);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 rounded-[28px] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30">
          <Medal className="w-3.5 h-3.5" />
          <span>Panel Juri Resmi Perkemahan</span>
        </div>
        <h1 className="text-xl font-bold text-[#171717] dark:text-white tracking-tight">
          Lembar Penilaian Lomba
        </h1>
        <p className="text-xs text-[#6B7280] dark:text-slate-400">
          Masukkan evaluasi berdasarkan rubrik penilaian teknis kepramukaan secara objektif dan transparan.
        </p>

        {/* Competition Selector */}
        <div className="pt-2 space-y-1">
          <label className="text-xs text-[#171717] dark:text-slate-300 font-semibold block">
            Pilih Cabang Lomba:
          </label>
          <select
            value={selectedCompId}
            onChange={e => setSelectedCompId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#E1306C]"
          >
            {competitions.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.type === 'field' ? 'Lapangan' : 'Digital'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contingent Entry Selector */}
      <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 shadow-xs space-y-3">
        <label className="text-xs text-[#171717] dark:text-slate-300 font-semibold block">
          Pilih Kontingen Peserta:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {contingents.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedContingentId(c.id)}
              className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                selectedContingentId === c.id
                  ? 'bg-[#FFF0F4] text-[#E1306C] border-[#E1306C]/30 font-semibold shadow-xs'
                  : 'bg-[#FAFAFA] dark:bg-white/5 text-[#6B7280] dark:text-slate-400 border-[#ECECEF] dark:border-white/5 hover:border-slate-300'
              }`}
            >
              <div className="truncate font-semibold text-[#171717] dark:text-white">{c.name}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5">{c.campZone.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SCORING RUBRIC SLIDERS */}
      <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#ECECEF] dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#171717] dark:text-white">
              Kriteria & Bobot Penilaian
            </h3>
            <p className="text-[11px] text-[#6B7280] dark:text-slate-400">Rentang nilai 0 s.d 100 per kriteria</p>
          </div>

          {/* Big Total Score Badge & Score Status */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border inline-block ${
                  scoreStatus === 'LOCKED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : scoreStatus === 'CLOUD_SAVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : scoreStatus === 'EDGE_SAVED'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {scoreStatus === 'LOCKED'
                  ? '🔒 LOCKED'
                  : scoreStatus === 'CLOUD_SAVED'
                  ? '☁ CLOUD_SAVED'
                  : scoreStatus === 'EDGE_SAVED'
                  ? '💻 EDGE_SAVED'
                  : '💾 DRAFT_LOCAL'}
              </span>
              <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mt-0.5 font-bold">Total Skor</div>
              <div className="text-2xl font-black text-[#E1306C] font-mono">{totalScore}</div>
            </div>
          </div>
        </div>

        {/* Rubric Sliders */}
        <div className="space-y-4 pt-1">
          {/* 1. Kreativitas */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#171717] dark:text-slate-200">
                1. Kreativitas & Inovasi (30%)
              </span>
              <span className="font-mono font-bold text-[#E1306C]">{scores.kreativitas}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isLocked}
              value={scores.kreativitas}
              onChange={e => setScores({ ...scores, kreativitas: Number(e.target.value) })}
              className="w-full accent-[#E1306C] cursor-pointer"
            />
          </div>

          {/* 2. Kesesuaian Tema */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#171717] dark:text-slate-200">
                2. Kesesuaian Tema Pramuka (25%)
              </span>
              <span className="font-mono font-bold text-[#E1306C]">{scores.kesesuaianTema}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isLocked}
              value={scores.kesesuaianTema}
              onChange={e => setScores({ ...scores, kesesuaianTema: Number(e.target.value) })}
              className="w-full accent-[#E1306C] cursor-pointer"
            />
          </div>

          {/* 3. Teknik Kepramukaan */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#171717] dark:text-slate-200">
                3. Ketepatan Teknik / Simpul (30%)
              </span>
              <span className="font-mono font-bold text-[#E1306C]">{scores.teknikPramuka}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isLocked}
              value={scores.teknikPramuka}
              onChange={e => setScores({ ...scores, teknikPramuka: Number(e.target.value) })}
              className="w-full accent-[#E1306C] cursor-pointer"
            />
          </div>

          {/* 4. Kerapian */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#171717] dark:text-slate-200">
                4. Kerapian & Keindahan (15%)
              </span>
              <span className="font-mono font-bold text-[#E1306C]">{scores.kerapian}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isLocked}
              value={scores.kerapian}
              onChange={e => setScores({ ...scores, kerapian: Number(e.target.value) })}
              className="w-full accent-[#E1306C] cursor-pointer"
            />
          </div>

          {/* Judge Feedback Notes */}
          <div className="pt-2 space-y-1">
            <label className="text-xs text-[#171717] dark:text-slate-300 font-semibold block">
              Catatan Dewan Juri:
            </label>
            <textarea
              rows={3}
              disabled={isLocked}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 rounded-xl text-base md:text-xs text-[#171717] dark:text-white focus:outline-none focus:border-[#E1306C]"
            />
          </div>
        </div>

        {/* Lock State Toggle & Save Button */}
        <div className="pt-3 border-t border-[#ECECEF] dark:border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const nextLocked = !isLocked;
              setIsLocked(nextLocked);
              if (nextLocked) {
                setScoreStatus('LOCKED');
                setFeedback({
                  type: 'locked',
                  message: 'Nilai resmi dikunci oleh Dewan Juri (LOCKED). Perubahan nilai tidak dapat dilakukan tanpa otorisasi pembukaan kunci.',
                });
              } else {
                setScoreStatus('DRAFT_LOCAL');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] cursor-pointer ${
              isLocked
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-white hover:bg-[#FAFAFA] text-[#6B7280] border-[#ECECEF] dark:bg-white/5 dark:text-slate-300'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Skor Terkunci' : 'Kunci Skor'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveScore}
            disabled={isLocked}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Nilai Kontingen</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border shadow-xs text-xs space-y-2 animate-in fade-in ${
            feedback.type === 'saved_device'
              ? 'bg-[#FEFCE8] border-[#FEF08A] text-amber-900'
              : feedback.type === 'saved_buper'
              ? 'bg-[#F5F3FF] border-[#DDD6FE] text-purple-900'
              : feedback.type === 'synced_cloud'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-emerald-900'
              : 'bg-[#FFF1F2] border-[#FECDD3] text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              {feedback.type === 'saved_device' && (
                <>
                  <span>💾</span>
                  <span>Saved on Device (Lokal Perangkat)</span>
                </>
              )}
              {feedback.type === 'saved_buper' && (
                <>
                  <span>💻</span>
                  <span>Saved on Server Buper (Wi-Fi LAN Buper)</span>
                </>
              )}
              {feedback.type === 'synced_cloud' && (
                <>
                  <span>☁️</span>
                  <span>Synced to Cloud (Canonical)</span>
                </>
              )}
              {feedback.type === 'locked' && (
                <>
                  <span>🔒</span>
                  <span>SCORE_LOCKED (Nilai Terkunci)</span>
                </>
              )}
              {feedback.type === 'conflict' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>VERSION_CONFLICT (Konflik Versi Data)</span>
                </>
              )}
            </span>

            {feedback.txId && (
              <span className="text-[10px] font-mono text-[#6B7280]">
                UUID: {feedback.txId.substring(0, 8)}...
              </span>
            )}
          </div>

          <p className="text-[11px] leading-relaxed">{feedback.message}</p>

          {feedback.type === 'conflict' && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleReloadLatestVersion}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Muat Ulang Versi Terbaru</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
