import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Shield,
  UserCheck,
  Calendar,
  Award,
  QrCode,
  ArrowRight,
  LogIn,
  UserPlus,
  Tent,
  CheckCircle2,
  BookOpen,
  Info,
} from 'lucide-react';
import { CurrentUser, HomeContent } from '../types';
import { MascotDetailModal } from './MascotDetailModal';

interface WelcomeScreenProps {
  currentUser: CurrentUser;
  homeContent?: HomeContent;
  onEnterHome: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onDismissForever?: (dontShowAgain: boolean) => void;
  mascotUrl?: string;
  onUpdateMascotUrl?: (url: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  currentUser,
  homeContent,
  onEnterHome,
  onOpenLogin,
  onOpenRegister,
  onDismissForever,
  mascotUrl = '/MASKOT.png',
  onUpdateMascotUrl,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMascotDetail, setShowMascotDetail] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [mascotUrl]);

  const handleEnter = () => {
    if (onDismissForever && dontShowAgain) {
      onDismissForever(true);
    }
    onEnterHome();
  };

  const handleLoginClick = () => {
    if (onDismissForever && dontShowAgain) {
      onDismissForever(true);
    }
    onOpenLogin();
  };

  const handleRegisterClick = () => {
    if (onDismissForever && dontShowAgain) {
      onDismissForever(true);
    }
    onOpenRegister();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md animate-fadeIn">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-amber-500/30 text-stone-100 shadow-2xl">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden border-b border-red-900/40 bg-gradient-to-r from-red-950 via-red-900 to-red-950 px-6 py-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300">
            {homeContent?.headerLogoUrl ? (
              <img
                src={homeContent.headerLogoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="h-4 w-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-sm">⚜️</span>
            )}
            <span>{homeContent?.welcomeHeaderBadge || 'Gerakan Pramuka • Jambore Ranting Sawangan 2026'}</span>
          </div>

          <h2 className="mt-2.5 text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {homeContent?.welcomeTitle || (
              <>
                Selamat Datang di <span className="text-amber-400">SIEPANG</span>
              </>
            )}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-red-200 font-medium">
            {homeContent?.welcomeSubtitle || 'Sistem Informasi Terpadu Jambore Ranting Sawangan'}
          </p>
        </div>

        {/* Mascot & Main Hero Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Mascot Container with Motion */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative flex shrink-0 flex-col items-center cursor-pointer group"
              onClick={() => setShowMascotDetail(true)}
              title="Klik untuk melihat filosofi lengkap Maskot Resmi SIEPANG"
            >
              <div className="relative flex h-60 w-44 sm:h-72 sm:w-48 items-center justify-center rounded-3xl bg-gradient-to-b from-stone-900/90 via-stone-800 to-black p-2 shadow-xl border-2 border-amber-500/50 group-hover:border-amber-400 transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                {/* Floating Glow */}
                <div className="absolute inset-0 rounded-3xl bg-amber-400/10 blur-xl group-hover:bg-amber-400/20 transition" />

                {!imgError ? (
                  <img
                    src={mascotUrl}
                    alt="Maskot Resmi SIEPANG Jambore Penggalang"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('MASKOT.png') && !target.src.includes('Maskot.png')) {
                        target.src = '/MASKOT.png';
                      } else if (target.src.includes('MASKOT.png')) {
                        target.src = '/Maskot.png';
                      } else {
                        setImgError(true);
                      }
                    }}
                    className="relative z-10 h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-4xl shadow-md">
                      🦋
                    </div>
                    <span className="mt-2 text-xs font-bold text-amber-300">
                      Maskot SIEPANG
                    </span>
                    <span className="text-[10px] text-stone-400">Jambore Penggalang</span>
                  </div>
                )}

                {/* Badge on mascot box */}
                <div className="absolute -bottom-2.5 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-0.5 text-[10px] font-black tracking-wider text-red-950 shadow-md flex items-center gap-1">
                  <span>★</span>
                  <span>MASKOT RESMI</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
                  <span>SIEPANG Pandu Tangkas</span>
                  <Info className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition" />
                </span>
                <p className="text-[10px] text-amber-200/70 underline underline-offset-2 mt-0.5 group-hover:text-amber-300 transition">
                  Ketuk untuk filosofi &amp; makna maskot
                </p>
              </div>
            </motion.div>

            {/* Feature Highlights */}
            <div className="flex-1 space-y-2.5 text-left w-full">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3 hover:border-amber-500/30 transition">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">
                      Rundown &amp; Agenda Real-Time
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                      Jadwal upacara, giat prestasi, pentas seni, dan notifikasi siaran langsung dari panitia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3 hover:border-amber-500/30 transition">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">
                      Verifikasi &amp; Presensi QR Code
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                      Check-in mandiri peserta di pos tantangan, pintu gerbang bumi perkemahan, dan tiket pengunjung.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3 hover:border-amber-500/30 transition">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">
                      Peringkat Regu &amp; Poin Prestasi
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                      Pantau akumulasi poin regu penggalang putra &amp; putri secara transparan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3 hover:border-amber-500/30 transition">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-100">
                      Juklak, Juknis &amp; Dokumentasi Media
                    </h4>
                    <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                      Buku pedoman PDF Google Drive &amp; rekaman video YouTube kegiatan perkemahan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Quick Status & Action Buttons */}
        <div className="border-t border-stone-800 bg-stone-950/90 px-6 py-4">
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Status Akses Saat Ini: <strong className="text-stone-200 capitalize">{currentUser.role}</strong> ({currentUser.name})
              </span>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-400 hover:text-stone-200 select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-amber-500"
              />
              <span>Jangan tampilkan lagi saat membuka aplikasi</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Button 1: Enter directly to home */}
            <button
              onClick={handleEnter}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-black text-red-950 hover:from-amber-400 hover:to-amber-500 transition shadow-lg active:scale-98"
            >
              <span>Masuk ke Beranda</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Button 2: Login */}
            <button
              onClick={handleLoginClick}
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-800/80 bg-red-950/60 px-4 py-3 text-xs font-bold text-amber-200 hover:bg-red-900/60 hover:text-white transition active:scale-98"
            >
              <LogIn className="h-4 w-4 text-amber-400" />
              <span>Masuk Akun (Login)</span>
            </button>

            {/* Button 3: Register */}
            <button
              onClick={handleRegisterClick}
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-800/70 px-4 py-3 text-xs font-bold text-stone-200 hover:bg-stone-800 hover:text-white transition active:scale-98"
            >
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mascot Detail & Philosophy Modal */}
      <MascotDetailModal
        isOpen={showMascotDetail}
        onClose={() => setShowMascotDetail(false)}
        mascotUrl={mascotUrl}
        onUpdateMascotUrl={onUpdateMascotUrl}
      />
    </div>
  );
};
