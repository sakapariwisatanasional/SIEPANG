/**
 * @license
 * SiEpang - Participant Mobile-First Home Screen
 * iPhone-quality layout + Instagram-inspired color energy + Scouting identity (Part 1, 10, 32, 34, 93, 94, 120)
 */

import React, { useState } from 'react';
import {
  Calendar,
  Trophy,
  Flame,
  QrCode,
  Heart,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Bell,
  Award,
  Layers,
  CheckCircle2,
  ExternalLink,
  Tent,
  Phone,
  Shield,
  Info as InfoIcon,
  Zap,
  Compass,
  Camera,
  Users,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { pointService } from '../../services/pointService';
import { participantService } from '../../services/participantService';
import { documentationService } from '../../services/documentationService';
import { PublicHeroBanner } from '../../components/banners/PublicHeroBanner';
import { PublicInformationBanner } from '../../components/banners/PublicInformationBanner';
import { PublicSponsorStrip } from '../../components/banners/PublicSponsorStrip';
import { PersonalQrModal } from './PersonalQrModal';
import { NavTab } from '../../components/navigation/MobileNavigation';
import { IOSGroupedSection, IOSListRow, IOSStatusBadge } from '../../components/ios';

interface ParticipantHomeProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export const ParticipantHome: React.FC<ParticipantHomeProps> = ({ onNavigate, onOpenScanner }) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCampMapModal, setShowCampMapModal] = useState(false);

  const participants = participantService.getParticipants();
  const participant = participants[0] || {
    id: 'p_empty',
    name: 'Peserta',
    contingentName: 'Kontingen Pramuka',
    subCamp: 'Bumi Perkemahan',
    registrationNumber: '-',
    xp: 0,
    level: 1,
    role: 'Penggalang',
    points: 0,
    qrCode: '',
  };
  const event = eventService.getCurrentEvent();
  const scheduleToday = eventService.getSchedule(1).slice(0, 3);
  const badges = pointService.getBadges();
  const announcements = eventService.getAnnouncements();

  // XP level calculation
  const currentXp = participant.xp || 0;
  const currentLevel = participant.level || 1;
  const nextLevelXp = currentLevel * 200;
  const prevLevelXp = (currentLevel - 1) * 200;
  const progressPct = Math.min(100, Math.max(0, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-6">
      {/* 1. Header Greeting & Avatar with Instagram-Inspired Gradient Ring (Req 198-200) */}
      <div className="px-1 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-[#6C4ACF] font-bold">⚜️ {event.shortName || 'Jambore Pramuka'}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[#E1306C] font-extrabold bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFE0E8]">Hari ke-1</span>
          </div>
          <h1 className="text-2xl font-black text-[#171717] dark:text-white tracking-tight truncate mt-1">
            Halo, {participant.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-slate-400 truncate mt-0.5">
            {participant.contingentName} · {participant.subCamp}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="shrink-0 p-[2.5px] rounded-full bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45] shadow-sm active:scale-95 transition-transform"
          title="Buka Profil"
        >
          <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-white dark:border-[#121215]">
            <img
              src={participant.photoUrl}
              alt={participant.name}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>

      {/* 2. Circular Event Highlight Shortcuts (Cheerful Light Style - Req 201-203) */}
      <div className="-mx-3 sm:-mx-5 px-3 sm:px-5 flex items-center gap-3.5 overflow-x-auto pb-2 pt-1 no-scrollbar select-none scroll-smooth">
        {[
          { title: 'Pembukaan', icon: Sparkles, ring: 'border-[#F77737]', bgRing: 'bg-[#FFF7ED]', color: 'text-[#F77737]', route: 'schedule' },
          { title: 'Lomba', icon: Trophy, ring: 'border-[#E1306C]', bgRing: 'bg-[#FFF1F2]', color: 'text-[#E1306C]', route: 'competitions' },
          { title: 'Wide Game', icon: Compass, ring: 'border-[#10B981]', bgRing: 'bg-[#ECFDF5]', color: 'text-[#10B981]', route: 'schedule' },
          { title: 'Api Unggun', icon: Flame, ring: 'border-[#EA580C]', bgRing: 'bg-[#FFF7ED]', color: 'text-[#EA580C]', route: 'schedule' },
          { title: 'Dokumentasi', icon: Camera, ring: 'border-[#0284C7]', bgRing: 'bg-[#F0F9FF]', color: 'text-[#0284C7]', route: 'public_gallery' },
          { title: 'Kunjungan', icon: Users, ring: 'border-[#833AB4]', bgRing: 'bg-[#FAF5FF]', color: 'text-[#833AB4]', route: 'public_home' },
        ].map(hl => {
          const IconComponent = hl.icon;
          return (
            <button
              key={hl.title}
              type="button"
              onClick={() => onNavigate(hl.route as any)}
              className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95 transition-transform cursor-pointer"
              aria-label={hl.title}
              title={hl.title}
            >
              <div className={`w-14 h-14 rounded-full p-[2px] border-2 ${hl.ring} ${hl.bgRing} flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IconComponent className={`w-6 h-6 ${hl.color}`} />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#303038] dark:text-slate-300 truncate max-w-[64px]">
                {hl.title}
              </span>
            </button>
          );
        })}
        {/* Trailing space ensuring the rightmost item is never cut off (Req 141) */}
        <div className="w-2 shrink-0" aria-hidden="true" />
      </div>

      {/* 3. Hero Banner Rotator */}
      <PublicHeroBanner onNavigateRoute={route => onNavigate(route as any)} />

      {/* 4. Urgent Information Banner */}
      <PublicInformationBanner onNavigateRoute={route => onNavigate(route as any)} />

      {/* 5. Digital Scout Pass Wallet Card (Part 32, 120) */}
      <div className="rounded-[24px] p-[1.5px] bg-gradient-to-tr from-[#833AB4]/30 via-[#E1306C]/30 to-[#FCAF45]/30 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="rounded-[23px] bg-white dark:bg-[#141418] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#833AB4] to-[#E1306C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ⚜️
              </div>
              <div>
                <div className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider">
                  Digital Scout Pass
                </div>
                <div className="text-[11px] font-mono text-[#E1306C] font-semibold">
                  {participant.code}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF0F4] hover:bg-[#FFE0E8] text-[#E1306C] text-xs font-bold border border-[#FFE0E8] transition-colors active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E1306C]" />
              <span>Buka QR</span>
            </button>
          </div>

          {/* Tap-to-expand card preview */}
          <div
            onClick={() => setShowQrModal(true)}
            className="cursor-pointer bg-[#FAFAFA] dark:bg-black/40 rounded-2xl p-4 border border-[#ECECEF] dark:border-white/5 flex items-center gap-4 hover:border-[#E1306C]/30 transition-colors"
          >
            <div className="w-16 h-16 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800">
              <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                <rect x="5" y="5" width="28" height="28" rx="4" />
                <rect x="9" y="9" width="20" height="20" fill="white" />
                <rect x="13" y="13" width="12" height="12" />
                <rect x="67" y="5" width="28" height="28" rx="4" />
                <rect x="71" y="9" width="20" height="20" fill="white" />
                <rect x="75" y="13" width="12" height="12" />
                <rect x="5" y="67" width="28" height="28" rx="4" />
                <rect x="9" y="71" width="20" height="20" fill="white" />
                <rect x="13" y="75" width="12" height="12" />
                <rect x="38" y="38" width="24" height="24" rx="4" fill="#C13584" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Siap Dipindai Petugas</span>
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-ping" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Tenda {participant.tentNumber} ({participant.subCamp})
              </div>
              <div className="text-[10px] font-semibold text-[#E1306C] mt-1 flex items-center gap-1">
                <span>Ketuk untuk mode kecerahan layar</span>
                <span>›</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Gamified XP & Rank Bar (Req 210, 211) */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-[#ECECEF] dark:border-white/8 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#833AB4] to-[#FCAF45] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6B7280] dark:text-slate-400">Total Poin XP</div>
              <div className="text-lg font-black bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] bg-clip-text text-transparent font-mono tracking-tight">
                ⚡ {currentXp.toLocaleString()} XP
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className="text-right p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="text-xs font-semibold text-[#6B7280] dark:text-slate-400 flex items-center justify-end gap-1">
              <span>Peringkat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-base font-black text-[#171717] dark:text-white font-mono">
              🏆 #{participant.rank} <span className="text-[10px] font-normal text-slate-400">/ 1.282</span>
            </div>
          </button>
        </div>

        {/* XP Progress Bar (Purple -> Magenta -> Orange) */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-bold text-[#171717] dark:text-white">Level {currentLevel}: Scout Explorer</span>
            <span className="text-[#6B7280] font-mono text-[11px]">
              {currentXp} / {nextLevelXp} XP
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden p-0.5 border border-[#ECECEF] dark:border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7. Akses Cepat (Quick Action Bar) (Req 210) */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Akses Cepat
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Scan QR - Primary Gradient */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45] text-white shadow-md shadow-pink-500/20 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold mt-2">Scan</span>
          </button>

          {/* Galeri Dokumentasi */}
          <button
            type="button"
            onClick={() => onNavigate('public_gallery')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#121215] border border-[#ECECEF] dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#833AB4]/40 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#833AB4] border border-[#E9D5FF] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-2">Galeri</span>
          </button>

          {/* Voting & Lomba */}
          <button
            type="button"
            onClick={() => onNavigate('competitions')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#121215] border border-[#ECECEF] dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#E1306C]/40 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#E1306C] border border-[#FFE4E6] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-2">Voting</span>
          </button>

          {/* Kunjungan & Tamu */}
          <button
            type="button"
            onClick={() => onNavigate('public_home')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#121215] border border-[#ECECEF] dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#F77737]/40 active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] flex items-center justify-center">
              <Tent className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-2">Kunjungan</span>
          </button>
        </div>
      </div>

      {/* 8. Grouped Today's Agenda (Kegiatan Hari Ini) (Part 10, 120) */}
      <IOSGroupedSection
        title="Kegiatan Hari Ini"
        footer="Pindai QR kegiatan di lokasi pos untuk mendapatkan poin reward XP."
      >
        {scheduleToday.map(item => (
          <IOSListRow
            key={item.id}
            onClick={() => onNavigate('schedule')}
            icon={<Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            title={item.title}
            subtitle={`${item.time} · 📍 ${item.location}`}
            badge={
              item.xpReward > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20">
                  +{item.xpReward} XP
                </span>
              ) : undefined
            }
            hasChevron
          />
        ))}
      </IOSGroupedSection>

      {/* 9. Campsite & Tenda Information (Part 10) */}
      <IOSGroupedSection
        title="Tapak Kemah & Tenda Anda"
        footer="Kavling resmi terdata di Peta Buper Selogiri."
      >
        <IOSListRow
          icon={<Tent className="w-4 h-4 text-[#F77737]" />}
          title={`Sub Camp ${participant.subCamp} · ${participant.tentNumber}`}
          subtitle="Zona A (Putra) · MCK terdekat 35m"
          value="Peta Buper"
          hasChevron
          onClick={() => setShowCampMapModal(true)}
        />
      </IOSGroupedSection>

      {/* 10. Latest Announcement */}
      {announcements.length > 0 && (
        <IOSGroupedSection title="Pengumuman Terbaru">
          <div className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Penting</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{announcements[0].timestamp}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {announcements[0].title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {announcements[0].content}
            </div>
          </div>
        </IOSGroupedSection>
      )}

      {/* 11. Collectible Badges (Part 35) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lencana Koleksi
          </span>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="text-xs font-semibold text-[#E1306C] flex items-center gap-0.5"
          >
            <span>Semua Lencana</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {badges.slice(0, 3).map(badge => (
            <div
              key={badge.id}
              className={`p-3 rounded-2xl border text-center transition-all ${
                badge.unlocked
                  ? 'bg-white dark:bg-[#121215] border-black/5 dark:border-white/10 shadow-xs'
                  : 'bg-slate-100/60 dark:bg-white/5 border-transparent opacity-60 grayscale'
              }`}
            >
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg mb-1.5 ${
                  badge.unlocked
                    ? 'p-[1.5px] bg-gradient-to-tr from-[#833AB4] via-[#E1306C] to-[#FCAF45]'
                    : 'bg-slate-200 dark:bg-white/10'
                }`}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-[#121215] flex items-center justify-center">
                  {badge.id === 'badge_spirit' && '🔥'}
                  {badge.id === 'badge_eco' && '🌱'}
                  {badge.id === 'badge_pioneering' && '⛺'}
                  {badge.id === 'badge_social' && '🤝'}
                  {badge.id === 'badge_champ' && '🏆'}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {badge.name}
              </div>
              <div className="text-[10px] font-semibold text-[#E1306C] mt-0.5">
                {badge.unlocked ? '✓ Terbuka' : 'Terkunci'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12. Public Sponsor Strip (Requirements 36, 37) */}
      <PublicSponsorStrip />

      {/* Fullscreen QR Modal */}
      <PersonalQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        participant={participant}
      />

      {/* Campsite Map Dialog Modal */}
      {showCampMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141418] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Peta Kavling Tenda & Fasilitas</h3>
                  <div className="text-[10px] text-[#E1306C] font-semibold">{event.campGround}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCampMapModal(false)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full h-52 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#0a1e12] dark:to-[#051109] border border-black/5 dark:border-white/10 p-3 overflow-hidden text-center flex flex-col justify-between select-none">
              <div className="text-[9px] font-mono text-slate-400 dark:text-emerald-400/50 uppercase tracking-widest">
                ▲ Lereng Kalipuro (Utara)
              </div>

              <div className="p-3 bg-white dark:bg-emerald-800/90 border-2 border-[#E1306C] rounded-2xl w-48 mx-auto shadow-lg space-y-0.5 animate-pulse">
                <div className="text-xs font-black text-[#E1306C] dark:text-amber-300">📍 Lokasi Tenda Anda</div>
                <div className="text-[11px] font-bold text-slate-900 dark:text-white">Sub Camp {participant.subCamp}</div>
                <div className="text-[10px] text-slate-500 dark:text-emerald-200">{participant.tentNumber}</div>
              </div>

              <div className="text-[9px] font-mono text-slate-400 dark:text-emerald-400/50 uppercase tracking-widest">
                ▼ Lapangan Utama Selogiri (Selatan)
              </div>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-black/30 p-3 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="font-bold text-slate-900 dark:text-white text-[11px]">Fasilitas Sekitar Tenda Anda:</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                <span>🚻 MCK & Kamar Mandi Putra:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-300">35 meter (Zona A)</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                <span>🏥 Posko Medis & Ambulans PMI:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-300">80 meter (Sektor Pusat)</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                <span>🍽 Dapur Umum & Logistik:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-300">120 meter (Gerbang Selatan)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCampMapModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-transform"
            >
              Tutup Peta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
