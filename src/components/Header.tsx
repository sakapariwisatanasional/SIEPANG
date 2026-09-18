import React, { useState, useRef, useEffect } from 'react';
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
  Menu,
  X,
  Laptop,
  LogIn,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  LogOut,
} from 'lucide-react';
import { CurrentUser, HomeContent } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentUser: CurrentUser;
  homeContent?: HomeContent;
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
  onOpenWelcomeScreen?: () => void;
  onOpenAuthModal?: (tab?: 'login' | 'register') => void;
  onOpenLocalHost?: () => void;
  onSwitchBackToSuperAdmin?: () => void;
  onLogout?: () => void;
  mascotUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  homeContent,
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
  onOpenWelcomeScreen,
  onOpenAuthModal,
  onOpenLocalHost,
  onSwitchBackToSuperAdmin,
  onLogout,
  mascotUrl = '/MASKOT.png',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // App Dropdown States
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = Boolean(
    currentUser.adminLevel === 'superadmin' || currentUser.isSuperAdminSession
  );

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        quickMenuRef.current &&
        !quickMenuRef.current.contains(e.target as Node)
      ) {
        setShowQuickMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Role details helper
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        if (currentUser.adminLevel === 'superadmin') {
          return {
            label: 'SuperAdmin',
            shortLabel: 'Admin',
            icon: <Shield className="h-3.5 w-3.5 text-amber-300" />,
            bgColor: 'bg-amber-950/90 border-amber-400/70 text-amber-200',
          };
        }
        return {
          label: 'Admin Panitia',
          shortLabel: 'Admin',
          icon: <Shield className="h-3.5 w-3.5 text-amber-300" />,
          bgColor: 'bg-red-950/90 border-amber-400/50 text-amber-200',
        };
      case 'member':
        return {
          label: currentUser.memberType === 'pembina' ? 'Pembina' : 'Peserta',
          shortLabel: currentUser.memberType === 'pembina' ? 'Pembina' : 'Peserta',
          icon: <UserCheck className="h-3.5 w-3.5 text-emerald-300" />,
          bgColor: 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200',
        };
      case 'public':
      default:
        return {
          label: 'Pengunjung',
          shortLabel: 'Publik',
          icon: <Globe className="h-3.5 w-3.5 text-sky-300" />,
          bgColor: 'bg-slate-900/90 border-slate-600 text-slate-200',
        };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 border-b border-red-950/50 bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-2.5 sm:px-4 md:px-6">
        
        {/* BRAND IDENTITY (App Emblem + SIEPANG + SiEpangApps Badge) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-red-950 shadow-md border border-amber-300/80 overflow-hidden">
            {homeContent?.headerLogoUrl ? (
              <img
                src={homeContent.headerLogoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-0.5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-lg sm:text-xl select-none" role="img" aria-label="Tunas Kelapa Pramuka">
                ⚜️
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-black text-white border border-white">
              ✓
            </span>
          </div>

          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs leading-none">
                {homeContent?.headerAppTitle || 'SIEPANG'}
              </span>
              <span className="rounded-full bg-amber-400/20 border border-amber-300/40 px-1.5 py-0.2 text-[10px] font-black text-amber-300 leading-tight">
                {homeContent?.headerAppBadge || 'SiEpangApps'}
              </span>
            </div>
            <span className="text-[10px] text-red-200/90 hidden sm:block truncate leading-tight mt-0.5">
              {homeContent?.headerSubTitle || 'Jambore Ranting Sawangan'}
            </span>
          </div>

          {/* Maskot Avatar Chip (Compact & Clickable) */}
          {onOpenWelcomeScreen && (
            <button
              onClick={onOpenWelcomeScreen}
              className="flex items-center gap-1 rounded-full bg-red-950/60 border border-amber-400/30 px-1.5 py-0.5 hover:bg-red-800/80 transition active:scale-95 text-amber-300"
              title="Filosofi Maskot SIEPANG & Panduan Aplikasi"
            >
              <img
                src={mascotUrl}
                alt="Maskot"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('MASKOT.png') && !target.src.includes('Maskot.png')) {
                    target.src = '/MASKOT.png';
                  } else if (target.src.includes('MASKOT.png')) {
                    target.src = '/Maskot.png';
                  }
                }}
                className="h-5 w-5 object-contain"
              />
              <span className="text-[10px] font-bold hidden lg:inline">Maskot</span>
            </button>
          )}
        </div>

        {/* RIGHT ACTION CONTROLS (Icon-Dominant, User-Friendly, Dropdowns for multiple options) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* 1. Quick Scanner Icon Button */}
          <button
            onClick={onOpenQRScanner}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-400 px-2.5 text-xs font-black text-red-950 hover:bg-amber-300 shadow-sm transition active:scale-95"
            title="Buka Pemindai Kamera QR"
            aria-label="Pemindai QR"
          >
            <QrCode className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-bold hidden md:inline">Scan QR</span>
          </button>

          {/* 2. Push Notifications Bell (Icon-only with badge) */}
          <button
            onClick={onOpenNotifDrawer}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/70 text-red-100 border border-red-800/60 hover:bg-red-800 hover:text-white transition active:scale-95"
            aria-label="Notifikasi"
            title="Notifikasi & Pembaruan"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-red-950 shadow animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* 3. QUICK ACTIONS DROPDOWN (Consolidates Localhost, GAS, PWA Install, ID Card, Tiket) */}
          <div className="relative" ref={quickMenuRef}>
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex h-9 items-center gap-1 rounded-xl bg-red-950/70 border border-red-800/60 px-2 sm:px-2.5 text-red-200 hover:bg-red-800 hover:text-white transition active:scale-95"
              title="Menu Aksi Cepat & Jaringan"
              aria-label="Aksi Cepat"
            >
              <Layers className="h-4 w-4 text-amber-300" />
              <ChevronDown className={`h-3 w-3 text-red-300 transition-transform ${showQuickMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Actions Dropdown Menu */}
            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 shadow-2xl z-50 text-slate-100 animate-fadeIn">
                <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Aksi Cepat Aplikasi</span>
                  <span className="text-[9px] text-amber-400 font-mono">SiEpangApps</span>
                </div>

                <div className="py-1 space-y-0.5">
                  {/* Mode Local Host */}
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      if (onOpenLocalHost) {
                        onOpenLocalHost();
                      } else {
                        onOpenAdminDashboard();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-emerald-950/70 hover:text-emerald-300 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold">Mode Local Host (WiFi)</div>
                      <div className="text-[10px] text-slate-400">Server offline perkemahan</div>
                    </div>
                  </button>

                  {/* Google Sheets Sync */}
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenGASModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-blue-950/70 hover:text-blue-300 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Google Sheets (GAS)</span>
                        {isGASSynced && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Sinkronisasi database online</div>
                    </div>
                  </button>

                  {/* Role Specific Quick Actions */}
                  {currentUser.role === 'member' && onOpenMyIDCard && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenMyIDCard();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-emerald-300 hover:bg-emerald-950/60 transition"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">ID Card &amp; QR Pribadi</div>
                        <div className="text-[10px] text-slate-400">Tampilkan kartu presensi</div>
                      </div>
                    </button>
                  )}

                  {currentUser.role === 'public' && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        onOpenVisitorModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:bg-amber-950/60 transition"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">E-Tiket Kunjungan</div>
                        <div className="text-[10px] text-slate-400">Daftar &amp; QR masuk tamu</div>
                      </div>
                    </button>
                  )}

                  {/* PWA Install Action */}
                  {!isInstalled && isInstallable && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        install();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:bg-amber-950/60 transition"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <Download className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">Pasang di Perangkat</div>
                        <div className="text-[10px] text-slate-400">Akses cepat offline PWA</div>
                      </div>
                    </button>
                  )}

                  {!isInstalled && isIOS && (
                    <button
                      onClick={() => {
                        setShowQuickMenu(false);
                        setShowIOSGuide(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 shrink-0">
                        <Download className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold">Panduan Pasang di iOS</div>
                        <div className="text-[10px] text-slate-400">Tambah ke Home Screen Safari</div>
                      </div>
                    </button>
                  )}

                  {/* Network Status indicator row */}
                  <div className="pt-2 mt-1 border-t border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {isOnline ? (
                        <Wifi className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-rose-400" />
                      )}
                      <span>Status Jaringan:</span>
                    </span>
                    <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. USER PROFILE & ROLE DROPDOWN (Minim text, clean icon pill) */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-2 sm:px-2.5 text-xs font-bold transition hover:opacity-90 active:scale-95 shadow-xs ${roleInfo.bgColor}`}
              title="Menu Pengguna & Level Akses"
              aria-label="Profil & Level Akses"
            >
              {roleInfo.icon}
              <span className="text-[11px] font-bold hidden sm:inline max-w-[90px] md:max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <ChevronDown className={`h-3 w-3 text-slate-300 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile & Role Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 p-3 shadow-2xl z-50 text-slate-100 animate-fadeIn">
                {/* User Info Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 font-black text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mt-0.5">
                      {roleInfo.icon}
                      <span>{roleInfo.label}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="py-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                    Pilihan Akses
                  </div>

                  {/* Tombol Kembali ke SuperAdmin jika sedang simulasi demo */}
                  {currentUser.isSimulating && onSwitchBackToSuperAdmin && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onSwitchBackToSuperAdmin();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-black text-amber-300 bg-amber-950/70 border border-amber-400/50 hover:bg-amber-900/80 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-400" />
                        <span>Kembali ke SuperAdmin</span>
                      </span>
                      <span className="text-[10px] bg-amber-400 text-red-950 px-1.5 py-0.5 rounded font-black">
                        Master
                      </span>
                    </button>
                  )}

                  {/* Ubah Level Akses Modal - HANYA BISA DILIHAT OLEH SUPERADMIN */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onOpenRoleModal();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-amber-400" />
                        <span>Level Akses (Akun Demo)</span>
                      </span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        SuperAdmin
                      </span>
                    </button>
                  )}

                  {/* Masuk / Login Akun */}
                  {onOpenAuthModal && (!currentUser.isSuperAdminSession || currentUser.role === 'public') && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onOpenAuthModal('login');
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-emerald-400" />
                        <span>Masuk Akun</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Login</span>
                    </button>
                  )}

                  {/* Dashboard Admin (If admin) */}
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onOpenAdminDashboard();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-amber-300 hover:bg-red-950/70 transition"
                    >
                      <Shield className="h-4 w-4 text-amber-400" />
                      <span>Panel Dashboard Admin</span>
                    </button>
                  )}

                  {/* Logout / Keluar jika sedang login atau sedang simulasi */}
                  {onLogout && (currentUser.role !== 'public' || currentUser.isSuperAdminSession) && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-300 hover:bg-rose-950/40 transition"
                    >
                      <LogOut className="h-4 w-4 text-rose-400" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}

                  {/* Maskot Info */}
                  {onOpenWelcomeScreen && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onOpenWelcomeScreen();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Filosofi Maskot SIEPANG</span>
                    </button>
                  )}
                </div>

                {/* Footer Info */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>SiEpangApps v2.6</span>
                  <span className="text-emerald-400 font-semibold">Offline Ready</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-950 p-6 shadow-2xl border border-red-900 text-slate-100 space-y-3">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Download className="h-5 w-5" />
              <span>Install SiEpangApps di iOS</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed space-y-1">
              1. Buka aplikasi di browser <strong>Safari</strong>.<br />
              2. Ketuk tombol <strong>Share / Bagikan</strong> di bagian bawah.<br />
              3. Pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.<br />
              4. SiEpangApps akan terpasang layaknya aplikasi native tanpa App Store!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-red-700 py-2.5 text-xs font-bold text-white hover:bg-red-800 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
