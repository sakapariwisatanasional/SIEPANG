import React, { useState } from 'react';
import {
  Bell,
  FileSpreadsheet,
  Download,
  Wifi,
  WifiOff,
  QrCode,
  Shield,
  UserCheck,
  Globe,
  Ticket,
  ChevronDown,
  Award,
} from 'lucide-react';
import { CurrentUser } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentUser: CurrentUser;
  onOpenRoleModal: () => void;
  unreadNotifCount: number;
  onOpenNotifDrawer: () => void;
  onOpenGASModal: () => void;
  onOpenQRScanner: () => void;
  onOpenAdminDashboard: () => void;
  onOpenMyIDCard?: () => void;
  onOpenVisitorModal: () => void;
  isOnline: boolean;
  isGASSynced: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenRoleModal,
  unreadNotifCount,
  onOpenNotifDrawer,
  onOpenGASModal,
  onOpenQRScanner,
  onOpenAdminDashboard,
  onOpenMyIDCard,
  onOpenVisitorModal,
  isOnline,
  isGASSynced,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Role details helper
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return {
          label: 'Admin (Panitia)',
          shortLabel: 'Admin',
          icon: <Shield className="h-3.5 w-3.5 text-amber-300" />,
          bgColor: 'bg-red-950/70 border-amber-400/40 text-amber-200',
        };
      case 'member':
        return {
          label: currentUser.memberType === 'pembina' ? 'Member (Pembina)' : 'Member (Peserta)',
          shortLabel: 'Member',
          icon: <UserCheck className="h-3.5 w-3.5 text-emerald-300" />,
          bgColor: 'bg-emerald-950/70 border-emerald-400/40 text-emerald-200',
        };
      case 'public':
      default:
        return {
          label: 'Publik (Pengunjung)',
          shortLabel: 'Publik',
          icon: <Globe className="h-3.5 w-3.5 text-amber-300" />,
          bgColor: 'bg-slate-900/80 border-slate-700 text-slate-200',
        };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 border-b border-red-950/40 bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
        {/* Brand Left */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-red-950 shadow-md border border-amber-300">
            <span className="text-xl select-none" role="img" aria-label="Tunas Kelapa Pramuka">
              ⚜️
            </span>
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white border border-white">
              ✓
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white sm:text-base drop-shadow-xs">
                Si-EPANG
              </h1>
            </div>
            <p className="text-[11px] font-medium text-red-200 hidden sm:block">
              Sistem Informasi Terpadu • Jambore
            </p>
          </div>
        </div>

        {/* Center / Role Selector Pill */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition hover:opacity-90 shadow-xs ${roleInfo.bgColor}`}
            title="Klik untuk mengganti level pengguna (Admin / Member / Publik)"
          >
            {roleInfo.icon}
            <span className="hidden md:inline">{roleInfo.label}</span>
            <span className="md:hidden">{roleInfo.shortLabel}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>

        {/* Right Tools & Role-Specific Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Online/Offline status */}
          <div
            className={`hidden lg:flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* ADMIN-SPECIFIC BUTTONS */}
          {currentUser.role === 'admin' && (
            <>
              {/* Quick QR Scanner Button */}
              <button
                onClick={onOpenQRScanner}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-2.5 py-1.5 text-xs font-black text-red-950 hover:bg-amber-300 shadow-sm transition active:scale-95"
                title="Buka Pemindai QR Presensi Peserta & Visitor"
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>

              {/* Admin Dashboard Button */}
              <button
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1.5 rounded-xl border border-red-700 bg-red-800/60 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-red-700/80 transition"
                title="Dashboard Admin: Edit URL YouTube, Drive, Banner & Jadwal"
              >
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>

              {/* Google Sheets / GAS Sync Integration Button */}
              <button
                onClick={onOpenGASModal}
                className={`hidden xl:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  isGASSynced
                    ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'border-red-800/70 bg-red-950/60 text-red-200 hover:bg-red-900'
                }`}
                title="Integrasi Google Spreadsheet & Apps Script (GAS)"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Spreadsheet</span>
              </button>
            </>
          )}

          {/* MEMBER-SPECIFIC BUTTONS */}
          {currentUser.role === 'member' && onOpenMyIDCard && (
            <button
              onClick={onOpenMyIDCard}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 shadow-sm transition active:scale-95"
              title="Buka Kartu ID & QR Code Pribadi"
            >
              <Award className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">ID Card Saya</span>
            </button>
          )}

          {/* PUBLIK-SPECIFIC BUTTONS */}
          {currentUser.role === 'public' && (
            <button
              onClick={onOpenVisitorModal}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-2.5 py-1.5 text-xs font-black text-red-950 hover:bg-amber-300 shadow-sm transition active:scale-95"
              title="Daftar & Terbitkan QR Code E-Tiket Kunjungan Pengunjung"
            >
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tiket Visitor</span>
            </button>
          )}

          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-amber-300 border border-amber-400/30 hover:bg-slate-800 transition"
              title="Install Aplikasi ke HP"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Install</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="hidden md:flex items-center gap-1 rounded-xl border border-red-800 bg-red-950/60 px-2 py-1.5 text-[11px] text-red-200 hover:text-white"
            >
              <Download className="h-3 w-3" />
              <span>Install iOS</span>
            </button>
          )}

          {/* Push Notifications Bell */}
          <button
            onClick={onOpenNotifDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/70 text-red-100 border border-red-800/60 hover:bg-red-800 hover:text-white transition"
            aria-label="Pusat Notifikasi & Pembaruan Jadwal"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-red-950 shadow animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-bar showing active user identity banner */}
      <div className="bg-red-950/90 px-3 py-1 text-[11px] border-t border-red-900/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-red-200">
            <span className="text-amber-400 font-bold">Status Pengguna:</span>
            <span className="text-white font-semibold truncate max-w-[280px] sm:max-w-md">
              {currentUser.name}
            </span>
          </div>

          <button
            onClick={onOpenRoleModal}
            className="text-[11px] font-bold text-amber-300 hover:text-white hover:underline flex items-center gap-1"
          >
            <span>Ganti Level</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-950 p-6 shadow-2xl border border-red-900 text-slate-100">
            <h3 className="text-base font-bold text-amber-400">
              Install Jambore App di iPhone / iPad
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              1. Buka halaman ini di browser <strong>Safari</strong>.<br />
              2. Ketuk tombol <strong>Share / Bagikan</strong> (ikon kotak panah ke atas) di bagian bawah.<br />
              3. Gulir ke bawah lalu pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.<br />
              4. Aplikasi Jambore akan terpasang layaknya aplikasi native tanpa App Store!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-red-700 py-2.5 text-xs font-bold text-white hover:bg-red-800 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
