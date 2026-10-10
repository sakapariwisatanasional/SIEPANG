/**
 * @license
 * SiEpang - Mobile Bottom Navigation Component (Milestone v1.4)
 * Format: Home, Schedule (or Competition/Gallery fallback), SCAN (Prominent elevated center action), Rank/Leaderboard, Profile
 * Dynamic adaptation with Feature Control subscriptions and safe-area inset support.
 */

import React, { useState, useEffect } from 'react';
import { Home, Calendar, QrCode, Trophy, User as UserIcon, Image as ImageIcon, Flame, MoreHorizontal } from 'lucide-react';
import { featureControlService } from '../../services/featureControlService';
import { MobileMoreMenuSheet } from './MobileMoreMenuSheet';

export type NavTab =
  | 'home'
  | 'schedule'
  | 'leaderboard'
  | 'profile'
  | 'participants'
  | 'competitions'
  | 'admin_dashboard'
  | 'superadmin'
  | 'organizations'
  | 'users'
  | 'judge'
  | 'attendance'
  | 'health'
  | 'logistics'
  | 'templates'
  | 'event_studio'
  | 'branding_settings'
  | 'database_storage'
  | 'installation'
  | 'system_update'
  | 'public_home'
  | 'public_gallery'
  | 'bootstrap';

interface MobileNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenScanner: () => void;
  role: string;
  isMoreMenuOpen?: boolean;
  onToggleMoreMenu?: (open: boolean) => void;
  onLogout?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
  role,
  isMoreMenuOpen: controlledMoreOpen,
  onToggleMoreMenu,
  onLogout,
}) => {
  const [scheduleActive, setScheduleActive] = useState(featureControlService.isFeatureEnabled('SCHEDULE'));
  const [leaderboardActive, setLeaderboardActive] = useState(featureControlService.isFeatureEnabled('POINTS_XP'));
  const [competitionActive, setCompetitionActive] = useState(featureControlService.isFeatureEnabled('COMPETITION'));
  const [galleryActive, setGalleryActive] = useState(featureControlService.isFeatureEnabled('PUBLIC_DOCUMENTATION'));
  const [internalMoreOpen, setInternalMoreOpen] = useState(false);

  const isMoreMenuOpen = controlledMoreOpen !== undefined ? controlledMoreOpen : internalMoreOpen;
  const setMoreMenuOpen = (open: boolean) => {
    if (onToggleMoreMenu) onToggleMoreMenu(open);
    setInternalMoreOpen(open);
  };

  useEffect(() => {
    const update = () => {
      setScheduleActive(featureControlService.isFeatureEnabled('SCHEDULE'));
      setLeaderboardActive(featureControlService.isFeatureEnabled('POINTS_XP'));
      setCompetitionActive(featureControlService.isFeatureEnabled('COMPETITION'));
      setGalleryActive(featureControlService.isFeatureEnabled('PUBLIC_DOCUMENTATION'));
    };
    const unsub = featureControlService.subscribe(update);
    return () => unsub();
  }, []);

  // Determine Tab 2
  const tab2: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> } = scheduleActive
    ? { id: 'schedule', label: 'Jadwal', icon: Calendar }
    : competitionActive
    ? { id: 'competitions', label: 'Lomba', icon: Flame }
    : galleryActive
    ? { id: 'public_gallery', label: 'Galeri', icon: ImageIcon }
    : { id: 'schedule', label: 'Jadwal', icon: Calendar };

  // Determine Tab 4
  const tab4: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> } = leaderboardActive
    ? { id: 'leaderboard', label: 'Peringkat', icon: Trophy }
    : competitionActive && tab2.id !== 'competitions'
    ? { id: 'competitions', label: 'Lomba', icon: Trophy }
    : { id: 'leaderboard', label: 'Peringkat', icon: Trophy };

  const Tab2Icon = tab2.icon;
  const Tab4Icon = tab4.icon;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-md border-t border-[#EEEEF0] dark:border-white/10 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)] transition-colors">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all select-none ${
            activeTab === 'home'
              ? 'text-[#F47743] font-bold scale-105'
              : 'text-[#9CA3AF] hover:text-[#171717] dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-1">Beranda</span>
        </button>

        {/* 2. Schedule / Dynamic Tab 2 */}
        <button
          type="button"
          onClick={() => onTabChange(tab2.id)}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all select-none ${
            activeTab === tab2.id
              ? 'text-[#F47743] font-bold scale-105'
              : 'text-[#9CA3AF] hover:text-[#171717] dark:hover:text-slate-200'
          }`}
        >
          <Tab2Icon className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-1">{tab2.label}</span>
        </button>

        {/* 3. SCAN - Large Prominent Elevated Center Action (Req 213) */}
        <div className="flex items-center justify-center relative">
          <button
            type="button"
            onClick={onOpenScanner}
            className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-tr from-[#208C60] via-[#F47743] to-[#FFD36A] text-white flex items-center justify-center shadow-lg shadow-pink-500/25 border-4 border-white dark:border-[#121215] active:scale-90 transition-all duration-150 cursor-pointer"
            aria-label="Pindai Kode QR Pramuka"
          >
            <QrCode className="w-7 h-7 stroke-[2.5] text-white" />
          </button>
        </div>

        {/* 4. Rank / Leaderboard / Dynamic Tab 4 */}
        <button
          type="button"
          onClick={() => onTabChange(tab4.id)}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all select-none ${
            activeTab === tab4.id
              ? 'text-[#F47743] font-bold scale-105'
              : 'text-[#9CA3AF] hover:text-[#171717] dark:hover:text-slate-200'
          }`}
        >
          <Tab4Icon className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-1">{tab4.label}</span>
        </button>

        {/* 5. More / Lainnya Menu Sheet */}
        <button
          type="button"
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all select-none ${
            isMoreMenuOpen || (!['home', tab2.id, tab4.id].includes(activeTab))
              ? 'text-[#F47743] font-bold scale-105'
              : 'text-[#9CA3AF] hover:text-[#171717] dark:hover:text-slate-200'
          }`}
          aria-label="Buka Menu Lainnya"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-1">Lainnya</span>
        </button>
      </div>

      {/* Mobile More Sheet Modal */}
      <MobileMoreMenuSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={onTabChange}
        role={role}
        onLogout={onLogout}
      />
    </nav>
  );
};
