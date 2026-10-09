/**
 * @license
 * SiEpang - Judge (Dewan Juri) Home Screen
 * Prioritizes: Assigned Competitions, Entries Awaiting Score,
 * Quick Scoring Action, Submitted Scores, Schedule.
 * Free from unrelated admin or system modules.
 */

import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  CheckCircle2,
  Clock,
  Scale,
  Calendar,
  Lock,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { competitionService, JudgeScoreRecord } from '../../services/competitionService';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { MetricCard } from '../../components/common/GlobalUxComponents';

interface JudgeHomeProps {
  onNavigate: (tab: NavTab) => void;
}

export const JudgeHome: React.FC<JudgeHomeProps> = ({ onNavigate }) => {
  const competitions = competitionService.getCompetitions();
  const digitalWorks = competitionService.getDigitalWorks();
  const allScores = competitionService.getAllScores();

  // Find entries awaiting evaluation
  const scoredEntryIds = new Set(allScores.map((s: JudgeScoreRecord) => s.entryId));
  const pendingEntries = digitalWorks.filter(w => !scoredEntryIds.has(w.id));
  const submittedScores = allScores.filter((s: JudgeScoreRecord) => s.status === 'SUBMITTED' || s.status === 'LOCKED');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. Header Greeting & Role Identity */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-bold mb-2">
            <span>⚖️ Portal Dewan Juri Resmi</span>
            <span>·</span>
            <span>Rubrik & Penilaian Karya</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
            Penilaian Giat Prestasi Lomba
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
            Evaluasi karya peserta secara objektif berdasarkan rubrik kriteria resmi Kwartir.
          </p>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => onNavigate('judge')}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] to-[#E1306C] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
        >
          <Scale className="w-5 h-5 stroke-[2.2]" />
          <span>Buka Meja Penjurian</span>
        </button>
      </div>

      {/* 2. Key Metrics for Judge (Max 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          value={competitions.length}
          label="Cabang Lomba"
          sublabel="Tugas penilaian aktif"
          color="purple"
          icon={Trophy}
          onClick={() => onNavigate('judge')}
        />
        <MetricCard
          value={pendingEntries.length}
          label="Menunggu Nilai"
          sublabel="Karya/penampilan baru"
          color="amber"
          icon={Clock}
          onClick={() => onNavigate('judge')}
        />
        <MetricCard
          value={submittedScores.length}
          label="Nilai Terkunci"
          sublabel="Telah difinalisasi juri"
          color="emerald"
          icon={CheckCircle2}
          onClick={() => onNavigate('judge')}
        />
        <MetricCard
          value="100%"
          label="Integritas Rubrik"
          sublabel="Bobot terstandar Juknis"
          color="blue"
          icon={Scale}
        />
      </div>

      {/* 3. Entries Awaiting Score (Priority Action Area) */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Karya & Penampilan Menunggu Penilaian ({pendingEntries.length})</span>
          </h3>
          <button
            onClick={() => onNavigate('judge')}
            className="text-[11px] font-bold text-[#833AB4] hover:underline"
          >
            Lihat Semua di Meja Juri ›
          </button>
        </div>

        {pendingEntries.length > 0 ? (
          <div className="divide-y divide-[#ECECEF] dark:divide-white/5">
            {pendingEntries.slice(0, 4).map(entry => (
              <div
                key={entry.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-[#833AB4] border border-purple-200/50 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#171717] dark:text-white">{entry.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Kontingen: <strong className="text-slate-700 dark:text-slate-300">{entry.contingentName}</strong> · {entry.competitionTitle}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('judge')}
                  className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#E1306C] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Beri Nilai Sekarang</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-bold text-slate-700 dark:text-slate-200">
              Semua karya yang masuk telah dinilai!
            </div>
            <p>Menunggu pengunggahan karya baru dari peserta lomba.</p>
          </div>
        )}
      </div>

      {/* 4. Assigned Competitions List */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#833AB4]" />
            <span>Cabang Lomba yang Ditugaskan</span>
          </h3>
          <span className="text-[11px] text-slate-400">{competitions.length} Lomba</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {competitions.map(comp => (
            <div
              key={comp.id}
              onClick={() => onNavigate('judge')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-[#ECECEF] dark:border-white/10 hover:border-[#833AB4]/30 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
            >
              <div>
                <div className="font-bold text-[#171717] dark:text-white">{comp.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Bobot Juri: {comp.juryWeight}% · Publik: {comp.publicWeight}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {comp.scheduleTime} · {comp.location}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
