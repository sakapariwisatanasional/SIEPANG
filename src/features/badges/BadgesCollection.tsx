/**
 * @license
 * SiEpang - Badges & Participant Scout Profile (RC1 Global Design System)
 * Collectible badge grid (locked/unlocked) and peer appreciation logs.
 * Standardized to Light-First, Instagram-inspired accent system, and 44px touch targets.
 */

import React, { useState } from 'react';
import {
  Award,
  Lock,
  Unlock,
  Flame,
  Leaf,
  Tent,
  HeartHandshake,
  Trophy,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  X,
} from 'lucide-react';
import { pointService } from '../../services/pointService';
import { participantService } from '../../services/participantService';
import { Badge } from '../../types';

export const BadgesCollection: React.FC = () => {
  const badges = pointService.getBadges();
  const participant = participantService.getParticipants()[0]; // Ahmad
  const transactions = pointService.getTransactions(participant.id);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'badge_spirit':
        return '🔥';
      case 'badge_eco':
        return '🌱';
      case 'badge_pioneering':
        return '⛺';
      case 'badge_social':
        return '🤝';
      case 'badge_champ':
        return '🏆';
      default:
        return '⚜️';
    }
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-8">
      {/* Profile Summary Card */}
      <div className="bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-6 rounded-[28px] text-center space-y-4 shadow-xs relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-full p-[2.5px] bg-gradient-to-tr from-[#208C60] via-[#F47743] to-[#FFD36A] shadow-sm">
          <img
            src={participant.photoUrl}
            alt={participant.name}
            className="w-full h-full object-cover rounded-full border-2 border-white dark:border-[#141418]"
          />
        </div>

        <div>
          <h1 className="text-lg font-black text-[#171717] dark:text-white">{participant.name}</h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400">
            {participant.role} · {participant.contingentName}
          </p>
          <p className="text-xs font-mono text-[#F47743] mt-1 font-semibold">{participant.code}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#ECECEF] dark:border-white/10 text-center">
          <div className="p-3 bg-[#FAFAFA] dark:bg-white/5 rounded-2xl border border-[#ECECEF] dark:border-white/5">
            <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-semibold uppercase tracking-wider">Total XP</div>
            <div className="text-base font-bold text-[#F47743] font-mono mt-0.5">{participant.xp}</div>
          </div>
          <div className="p-3 bg-[#FAFAFA] dark:bg-white/5 rounded-2xl border border-[#ECECEF] dark:border-white/5">
            <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-semibold uppercase tracking-wider">Level</div>
            <div className="text-base font-bold text-[#171717] dark:text-white font-mono mt-0.5">Lv {participant.level}</div>
          </div>
          <div className="p-3 bg-[#FAFAFA] dark:bg-white/5 rounded-2xl border border-[#ECECEF] dark:border-white/5">
            <div className="text-[10px] text-[#6B7280] dark:text-slate-400 font-semibold uppercase tracking-wider">Peringkat</div>
            <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">#{participant.rank}</div>
          </div>
        </div>
      </div>

      {/* COLLECTIBLE BADGES GRID (Requirement 35) */}
      <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#171717] dark:text-white">Lencana Kehormatan Pramuka</h2>
            <p className="text-[11px] text-[#6B7280] dark:text-slate-400">Koleksi pencapaian selama perkemahan</p>
          </div>
          <span className="text-xs text-[#F47743] font-mono font-bold bg-[#FFF0F4] px-2.5 py-1 rounded-full border border-[#FFE0E8]">
            {badges.filter(b => b.unlocked).length} / {badges.length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`cursor-pointer p-4 rounded-2xl border text-center transition-all select-none ${
                badge.unlocked
                  ? 'bg-[#FFF7ED] border-[#FED7AA] hover:border-orange-400 shadow-2xs'
                  : 'bg-[#FAFAFA] dark:bg-white/5 border-[#ECECEF] dark:border-white/5 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="relative w-12 h-12 mx-auto rounded-2xl bg-white dark:bg-black/30 flex items-center justify-center text-2xl mb-2 shadow-xs border border-slate-100 dark:border-white/5">
                <span>{getBadgeIcon(badge.id)}</span>
                {!badge.unlocked && (
                  <span className="absolute -top-1 -right-1 p-1 bg-slate-800 rounded-full text-white shadow-xs">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-[#171717] dark:text-white truncate">{badge.name}</div>
              <div className="text-[10px] text-[#6B7280] dark:text-slate-400 mt-1">
                {badge.unlocked ? (
                  <span className="text-emerald-600 font-semibold">✓ Terbuka</span>
                ) : (
                  <span>Butuh {badge.xpRequired} XP</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT XP / PEER APPRECIATION LOGS */}
      <div className="rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider">
          Riwayat Perolehan XP & Apresiasi Kawan
        </div>

        <div className="space-y-2">
          {transactions.map(tx => (
            <div
              key={tx.id}
              className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-white/5 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-[#171717] dark:text-white">{tx.reason}</div>
                <div className="text-[10px] text-[#6B7280] dark:text-slate-400">{tx.timestamp}</div>
              </div>
              <div className="font-mono font-bold text-[#F47743] text-xs">+{tx.amount} XP</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-[28px] p-6 text-center space-y-3 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FFF0F4] border border-[#FFE0E8] text-3xl flex items-center justify-center">
              {getBadgeIcon(selectedBadge.id)}
            </div>

            <h3 className="text-base font-bold text-[#171717] dark:text-white">{selectedBadge.name}</h3>
            <p className="text-xs text-[#6B7280] dark:text-slate-300 leading-relaxed">{selectedBadge.description}</p>

            <div className="pt-2 text-xs font-semibold text-emerald-600">
              {selectedBadge.unlocked ? '🏆 Lencana Resmi Dimiliki' : `Terkunci: Butuh ${selectedBadge.xpRequired} XP`}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 bg-[#FAFAFA] hover:bg-slate-100 text-[#171717] rounded-xl text-xs font-bold mt-3 border border-[#ECECEF] min-h-[44px] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
