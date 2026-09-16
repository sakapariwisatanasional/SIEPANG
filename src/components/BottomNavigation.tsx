import React from 'react';
import {
  Home,
  Calendar,
  QrCode,
  Users,
  Image as ImageIcon,
  Shield,
  Award,
  Ticket,
  Sparkles,
  Trophy,
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
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  role,
  activeTab,
  onSelectTab,
  onOpenQRScanner,
  onOpenMyIDCard,
  onOpenVisitorModal,
  onOpenAdminDashboard,
}) => {
  // Define items per role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { id: 'beranda', label: 'Beranda', icon: Home },
        { id: 'leaderboard', label: 'Ranking', icon: Trophy },
        {
          id: 'scan',
          label: 'Scan QR',
          icon: QrCode,
          isSpecial: true,
          onClick: onOpenQRScanner,
          specialColor: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-red-950',
        },
        { id: 'peserta', label: 'Peserta', icon: Users },
        {
          id: 'admin',
          label: 'Admin',
          icon: Shield,
          onClick: onOpenAdminDashboard,
        },
      ];
    }

    if (role === 'member') {
      return [
        { id: 'beranda', label: 'Beranda', icon: Home },
        { id: 'leaderboard', label: 'Ranking', icon: Trophy },
        {
          id: 'my-id',
          label: 'ID Card',
          icon: Award,
          isSpecial: true,
          onClick: onOpenMyIDCard || (() => {}),
          specialColor: 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white',
        },
        { id: 'jadwal', label: 'Jadwal', icon: Calendar },
        { id: 'peserta', label: 'Rekan', icon: Users },
      ];
    }

    // Default: 'public'
    return [
      { id: 'beranda', label: 'Beranda', icon: Home },
      { id: 'leaderboard', label: 'Ranking', icon: Trophy },
      {
        id: 'visitor-ticket',
        label: 'E-Tiket',
        icon: Ticket,
        isSpecial: true,
        onClick: onOpenVisitorModal,
        specialColor: 'bg-gradient-to-tr from-red-600 to-red-700 text-white',
      },
      { id: 'jadwal', label: 'Jadwal', icon: Calendar },
      { id: 'dokumentasi', label: 'Galeri', icon: ImageIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-red-950/40 text-slate-300 md:hidden shadow-xl pb-safe">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="relative -top-3.5 flex flex-col items-center justify-center focus:outline-none"
                aria-label={item.label}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl border-4 border-slate-950 active:scale-90 transition ${item.specialColor}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black text-amber-300 mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
