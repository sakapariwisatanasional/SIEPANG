import React, { useState } from 'react';
import {
  Home,
  Calendar,
  QrCode,
  Users,
  Image as ImageIcon,
  Shield,
  Award,
  Ticket,
  Trophy,
  MoreHorizontal,
  X,
  Wifi,
  FileSpreadsheet,
  Compass,
} from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavigationProps {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQRScanner: () => void;
  onOpenMyIDCard?: () => void;
  onOpenVisitorModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenLocalHost?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  role,
  activeTab,
  onSelectTab,
  onOpenQRScanner,
  onOpenMyIDCard,
  onOpenVisitorModal,
  onOpenAdminDashboard,
  onOpenLocalHost,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Quick helper for tabs
  const handleTabClick = (tabId: string) => {
    setShowMoreMenu(false);
    onSelectTab(tabId);
  };

  return (
    <>
      {/* Dropdown / Popover Sheet for "Lainnya" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-fadeIn">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setShowMoreMenu(false)} />

          <div className="w-full rounded-t-3xl bg-slate-900 border-t border-slate-700/80 p-4 shadow-2xl text-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Semua Fitur SiEpangApps
                </span>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs py-1">
              <button
                onClick={() => handleTabClick('beranda')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'beranda' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Home className="h-5 w-5 text-amber-400" />
                <span className="text-[10px] font-semibold">Beranda</span>
              </button>

              <button
                onClick={() => handleTabClick('jadwal')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'jadwal' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Calendar className="h-5 w-5 text-sky-400" />
                <span className="text-[10px] font-semibold">Jadwal</span>
              </button>

              <button
                onClick={() => handleTabClick('leaderboard')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'leaderboard' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Trophy className="h-5 w-5 text-amber-400" />
                <span className="text-[10px] font-semibold">Ranking</span>
              </button>

              <button
                onClick={() => handleTabClick('dokumentasi')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'dokumentasi' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <ImageIcon className="h-5 w-5 text-emerald-400" />
                <span className="text-[10px] font-semibold">Galeri</span>
              </button>

              <button
                onClick={() => handleTabClick('peserta')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'peserta' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Users className="h-5 w-5 text-indigo-400" />
                <span className="text-[10px] font-semibold">Peserta</span>
              </button>

              <button
                onClick={() => handleTabClick('pembina')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'pembina' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Award className="h-5 w-5 text-rose-400" />
                <span className="text-[10px] font-semibold">Pembina</span>
              </button>

              <button
                onClick={() => handleTabClick('pengunjung')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition ${
                  activeTab === 'pengunjung' ? 'bg-red-950/80 text-amber-300 border border-amber-400/30' : 'bg-slate-800/60 text-slate-300'
                }`}
              >
                <Ticket className="h-5 w-5 text-amber-400" />
                <span className="text-[10px] font-semibold">Pengunjung</span>
              </button>

              {onOpenLocalHost && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenLocalHost();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  title="Mode Local Host & WiFi Perkemahan"
                >
                  <Wifi className="h-5 w-5 text-emerald-400" />
                  <span className="text-[10px] font-semibold">Localhost</span>
                </button>
              )}

              {role === 'admin' && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenAdminDashboard();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-red-950/60 text-amber-300 border border-amber-400/40"
                >
                  <Shield className="h-5 w-5 text-amber-400" />
                  <span className="text-[10px] font-semibold">Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-red-950/40 text-slate-300 md:hidden shadow-2xl pb-safe">
        <div className="flex items-center justify-around px-1 py-1 h-16">
          {/* Tab 1: Beranda */}
          <button
            onClick={() => onSelectTab('beranda')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'beranda' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Beranda"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
          </button>

          {/* Tab 2: Ranking / Leaderboard */}
          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'leaderboard' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Peringkat & Skor"
          >
            <Trophy className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Ranking</span>
          </button>

          {/* Center Action Button (Prominent, Floating Native App Style) */}
          <div className="flex-1 flex justify-center">
            {role === 'admin' && (
              <button
                onClick={onOpenQRScanner}
                className="relative -top-3 flex flex-col items-center justify-center focus:outline-none"
                aria-label="Scan QR Presensi"
                title="Scan QR Presensi"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl border-4 border-slate-950 active:scale-90 transition bg-gradient-to-tr from-amber-500 to-amber-400 text-red-950">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-amber-300 mt-0.5">
                  Scan QR
                </span>
              </button>
            )}

            {role === 'member' && (
              <button
                onClick={onOpenMyIDCard || (() => {})}
                className="relative -top-3 flex flex-col items-center justify-center focus:outline-none"
                aria-label="ID Card Saya"
                title="ID Card Saya"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl border-4 border-slate-950 active:scale-90 transition bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white">
                  <Award className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-emerald-300 mt-0.5">
                  ID Card
                </span>
              </button>
            )}

            {role === 'public' && (
              <button
                onClick={onOpenVisitorModal}
                className="relative -top-3 flex flex-col items-center justify-center focus:outline-none"
                aria-label="E-Tiket Kunjungan"
                title="E-Tiket Kunjungan"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl border-4 border-slate-950 active:scale-90 transition bg-gradient-to-tr from-red-600 to-red-700 text-white">
                  <Ticket className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-amber-300 mt-0.5">
                  E-Tiket
                </span>
              </button>
            )}
          </div>

          {/* Tab 4: Jadwal Kegiatan */}
          <button
            onClick={() => onSelectTab('jadwal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'jadwal' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Jadwal Kegiatan"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Jadwal</span>
          </button>

          {/* Tab 5: Lainnya (Dropdown menu popover) */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              ['peserta', 'pembina', 'pengunjung', 'dokumentasi'].includes(activeTab)
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Menu Pilihan Lainnya"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
};
