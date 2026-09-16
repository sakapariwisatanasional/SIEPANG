import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  QrCode,
  Search,
  CheckCircle2,
  Users,
  Compass,
  ArrowUpRight,
  Shield,
  Star,
  ChevronRight,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';
import { Participant, ActivityPost, VisitorRegistration, CurrentUser } from '../types';

interface LeaderboardViewProps {
  participants: Participant[];
  activityPosts: ActivityPost[];
  visitors: VisitorRegistration[];
  isAdmin: boolean;
  currentUser: CurrentUser;
  onOpenQRScanner: () => void;
  onOpenAdminPosts?: () => void;
  onSelectParticipant?: (p: Participant) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  participants,
  activityPosts,
  visitors,
  isAdmin,
  currentUser,
  onOpenQRScanner,
  onOpenAdminPosts,
  onSelectParticipant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegu, setFilterRegu] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'ranking' | 'pos'>('ranking');

  // 1. Perhitungan Jumlah Kunjungan Pengunjung yang Scan QR
  const verifiedVisitors = visitors.filter((v) => v.checkInStatus);
  const totalVisitorPax = verifiedVisitors.reduce((sum, v) => sum + (v.paxCount || 1), 0);

  // 2. Perhitungan Jumlah Peserta Aktif (memperoleh poin dari pos QR)
  const activeParticipants = participants.filter((p) => (p.points || 0) > 0);

  // 3. Sorting peserta berdasarkan poin tertinggi (Ranking)
  const sortedParticipants = [...participants].sort((a, b) => {
    const ptsA = a.points || 0;
    const ptsB = b.points || 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    // Jika poin sama, urutkan berdasarkan jumlah pos yang diselesaikan
    const countA = a.completedPosts?.length || 0;
    const countB = b.completedPosts?.length || 0;
    return countB - countA;
  });

  // Filter regu options
  const uniqueRegus = Array.from(new Set(participants.map((p) => p.regu))).filter(Boolean);

  // Filtered participants
  const filteredParticipants = sortedParticipants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pangkalan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.regu.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegu = filterRegu === 'all' || p.regu === filterRegu;

    return matchesSearch && matchesRegu;
  });

  // Top 3 Podium
  const top1 = sortedParticipants[0];
  const top2 = sortedParticipants[1];
  const top3 = sortedParticipants[2];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Header & Gamification Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-red-900 to-amber-950 p-5 sm:p-7 text-white shadow-xl border border-red-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-300 border border-amber-400/30 backdrop-blur-xs">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span>SISTEM POIN &amp; RANKING RESMI JAMBORE</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Papan Peringkat Peserta &amp; Pos Kegiatan
            </h2>
            <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
              Setiap pos kegiatan menyediakan QR Code bernilai poin (misal: Kegiatan Pionering = 10 Poin). 
              Pindai QR di setiap pos untuk mengumpulkan poin dan menempati ranking tertinggi perkemahan!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenQRScanner}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 text-xs font-black text-red-950 hover:from-amber-300 hover:to-amber-400 transition shadow-lg active:scale-95"
            >
              <QrCode className="h-4 w-4 text-red-950" />
              <span>Pindai QR Pos Kegiatan</span>
            </button>

            {isAdmin && onOpenAdminPosts && (
              <button
                onClick={onOpenAdminPosts}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-800/80 border border-red-700 px-3.5 py-3 text-xs font-bold text-amber-200 hover:bg-red-700 transition"
              >
                <Shield className="h-4 w-4 text-amber-300" />
                <span>Atur Pos &amp; Poin (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative corner glows */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />
      </div>

      {/* 3 Metrik Kunci Sesuai Permintaan Pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Jumlah Kunjungan Scan QR */}
        <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white via-red-50/30 to-amber-50/20 p-4 sm:p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-red-900 tracking-wider">
              JUMLAH KUNJUNGAN SCAN QR
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-800">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalVisitorPax}
            </span>
            <span className="text-xs font-semibold text-slate-500">Orang Pengunjung</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              Dari <strong>{verifiedVisitors.length}</strong> tiket pengunjung yang telah scan verifikasi masuk.
            </span>
          </p>
        </div>

        {/* Metric 2: Jumlah Peserta Aktif Berpoin */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 p-4 sm:p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
              PESERTA AKTIF (BERPOIN)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Flame className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeParticipants.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              / {participants.length} Peserta
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              Telah menuntaskan tantangan di {activityPosts.length} pos kegiatan ber-QR.
            </span>
          </p>
        </div>

        {/* Metric 3: Rekor Poin Tertinggi */}
        <div className="rounded-3xl border border-red-950/20 bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-4 sm:p-5 text-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider">
              POIN TERTINGGI (RANK #1)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-red-950">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {top1?.points || 0}
            </span>
            <span className="text-xs font-bold text-red-200">Poin Peringkat 1</span>
          </div>
          <p className="mt-1.5 text-[11px] text-red-100 truncate">
            👑 <strong>{top1?.fullName || 'Belum ada'}</strong> ({top1?.regu || '-'})
          </p>
        </div>
      </div>

      {/* Podium Juara 1, 2, 3 Visual Showcase */}
      {sortedParticipants.length >= 3 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="text-center max-w-md mx-auto mb-6">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-900 border border-amber-300">
              PODIUM TERTINGGI
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Peringkat Teratas Jambore Saat Ini
            </h3>
            <p className="text-xs text-slate-500">
              Peserta dengan akumulasi perolehan poin terbanyak dari pos kegiatan
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-4">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <img
                  src={top2.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={top2.fullName}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-4 border-slate-300 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-black text-xs border-2 border-white shadow">
                  2
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[95%]">
                {top2.nickname || top2.fullName.split(' ')[0]}
              </h4>
              <p className="text-[10px] text-slate-500 truncate max-w-[95%]">{top2.regu}</p>
              <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 py-3 sm:py-5 border-t border-slate-300 text-center">
                <span className="text-base sm:text-lg font-black text-slate-800">{top2.points || 0}</span>
                <span className="block text-[9px] font-bold text-slate-500">POIN</span>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <Crown className="h-6 w-6 text-amber-500 mx-auto -mb-1 animate-bounce" />
                <img
                  src={top1.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={top1.fullName}
                  className="h-18 w-18 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-amber-400 shadow-xl ring-4 ring-amber-200"
                />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-red-950 font-black text-xs border-2 border-white shadow">
                  1
                </span>
              </div>
              <h4 className="text-xs sm:text-base font-black text-slate-900 truncate max-w-[95%]">
                {top1.nickname || top1.fullName.split(' ')[0]}
              </h4>
              <p className="text-[11px] font-bold text-red-800 truncate max-w-[95%]">{top1.regu}</p>
              <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-amber-400 to-amber-300 py-4 sm:py-7 border-t border-amber-500 text-center shadow-md">
                <span className="text-lg sm:text-2xl font-black text-red-950">{top1.points || 0}</span>
                <span className="block text-[10px] font-black text-red-900">POIN</span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <img
                  src={top3.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={top3.fullName}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-4 border-amber-600 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-black text-xs border-2 border-white shadow">
                  3
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[95%]">
                {top3.nickname || top3.fullName.split(' ')[0]}
              </h4>
              <p className="text-[10px] text-slate-500 truncate max-w-[95%]">{top3.regu}</p>
              <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-amber-100 to-amber-50 py-2 sm:py-3.5 border-t border-amber-300 text-center">
                <span className="text-base sm:text-lg font-black text-amber-900">{top3.points || 0}</span>
                <span className="block text-[9px] font-bold text-amber-700">POIN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs: Peringkat Peserta vs Daftar Pos Kegiatan */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('ranking')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'ranking'
              ? 'bg-red-800 text-amber-200 shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Klasemen Peringkat Peserta ({filteredParticipants.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'pos'
              ? 'bg-red-800 text-amber-200 shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Daftar Pos &amp; Nilai Poin ({activityPosts.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Klasemen Peringkat Peserta */}
      {activeSubTab === 'ranking' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama peserta, regu, atau pangkalan..."
                className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-semibold focus:border-red-700 focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterRegu}
                onChange={(e) => setFilterRegu(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold bg-white text-slate-700 focus:border-red-700 focus:outline-none"
              >
                <option value="all">Semua Regu</option>
                {uniqueRegus.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Table / Cards */}
          <div className="space-y-2">
            {filteredParticipants.map((p, idx) => {
              const rank = idx + 1;
              const isCurrentUser =
                currentUser.role === 'member' &&
                (currentUser.memberId === p.regId || currentUser.name.toLowerCase() === p.fullName.toLowerCase());

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl p-3 sm:p-3.5 transition border ${
                    isCurrentUser
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40'
                      : rank <= 3
                      ? 'bg-slate-50/90 border-slate-200'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Rank & Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs sm:text-sm ${
                        rank === 1
                          ? 'bg-amber-400 text-red-950 shadow-sm border border-amber-300'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-800'
                          : rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    <img
                      src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={p.fullName}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {p.fullName}
                        </h4>
                        {isCurrentUser && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-black text-emerald-800 border border-emerald-300">
                            Anda
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500 font-bold">
                          ({p.regId})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        <strong className="text-red-800">{p.regu}</strong> • {p.pangkalan}
                      </p>

                      {/* Completed post chips */}
                      {p.completedPosts && p.completedPosts.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">Selesai:</span>
                          {p.completedPosts.slice(0, 3).map((code) => (
                            <span
                              key={code}
                              className="rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 border border-emerald-200"
                            >
                              ✓ {code.replace('POS-', '')}
                            </span>
                          ))}
                          {p.completedPosts.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{p.completedPosts.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Total Points */}
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-3 py-1.5 text-amber-300 font-black shadow-xs">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm sm:text-base">{p.points || 0}</span>
                      <span className="text-[10px] text-amber-200">Pts</span>
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {p.completedPosts?.length || 0} pos tuntas
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredParticipants.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-bold">Tidak ada peserta yang cocok dengan filter pencarian.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Daftar Pos Kegiatan Ber-QR & Poin */}
      {activeSubTab === 'pos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Pos Kegiatan Ber-QR Code ({activityPosts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Kunjungi pos-pos berikut, selesaikan ujian keterampilan, dan scan QR Code yang disediakan panitia untuk mendapatkan poin.
              </p>
            </div>

            {isAdmin && onOpenAdminPosts && (
              <button
                onClick={onOpenAdminPosts}
                className="flex items-center gap-1.5 rounded-xl bg-red-800 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-red-900 transition shrink-0"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Kelola Pos &amp; Nilai Poin</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activityPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-950 border border-amber-300">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1 rounded-xl bg-red-800 px-2.5 py-1 text-xs font-black text-amber-300">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>+{post.points} Poin</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mt-2">{post.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-red-700 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">PIC: {post.picName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                    {post.code}
                  </span>
                  <button
                    onClick={onOpenQRScanner}
                    className="flex items-center gap-1 text-xs font-bold text-red-800 hover:text-red-950"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan QR Pos</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
