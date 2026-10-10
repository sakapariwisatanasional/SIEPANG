/**
 * @license
 * SiEpang - Global Reusable UX Components (Requirement 59)
 * Standardized building blocks ensuring 30-50% reduced density,
 * visual calm, light-first cheerful tokens, and progressive disclosure.
 */

import React from 'react';
import { ChevronRight, Search, AlertCircle, ArrowRight } from 'lucide-react';

/* =========================================================================
   1. PAGE HEADER
   Standard title + subtitle + optional primary CTA
   ========================================================================= */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'purple' | 'pink' | 'emerald' | 'amber' | 'blue';
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'purple',
  action,
}) => {
  const badgeColors = {
    purple: 'bg-[#833AB4]/10 text-[#833AB4] dark:text-[#E1306C]',
    pink: 'bg-[#E1306C]/10 text-[#E1306C]',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  };

  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
      <div className="min-w-0">
        {badge && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1 ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#208C60] via-[#F47743] to-[#F4A53A] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

/* =========================================================================
   2. METRIC CARD (Max 4 in a grid, concise: Value, Label, optional trend)
   ========================================================================= */
interface MetricCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  sublabel,
  icon: Icon,
  color = 'purple',
  onClick,
}) => {
  const iconColors = {
    purple: 'text-[#833AB4] bg-[#833AB4]/10',
    emerald: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
    amber: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
    rose: 'text-rose-600 bg-rose-500/10 dark:text-rose-400',
    blue: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-1 transition-all ${
        onClick ? 'cursor-pointer hover:border-[#208C60]/30 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6B7280] dark:text-slate-400 truncate">
          {label}
        </span>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColors[color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-[#171717] dark:text-white font-mono tabular-nums">
        {value}
      </div>
      {sublabel && (
        <div className="text-[11px] text-[#6B7280] dark:text-slate-400 font-medium truncate">
          {sublabel}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. SEARCH BAR
   Compact, responsive, user-friendly
   ========================================================================= */
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Cari...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 rounded-xl text-xs text-[#171717] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#208C60] transition-colors"
      />
    </div>
  );
};

/* =========================================================================
   4. ATTENTION LIST ITEM
   Clear call to action for items needing attention
   ========================================================================= */
export interface AttentionItem {
  id: string;
  title: string;
  count?: number;
  type?: 'urgent' | 'warning' | 'info';
  actionLabel?: string;
  onClick: () => void;
}

interface AttentionListProps {
  items: AttentionItem[];
}

export const AttentionList: React.FC<AttentionListProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/5 border border-amber-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Perlu Perhatian ({items.length})</span>
        </h3>
        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Tindakan Cepat</span>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="w-full p-3 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/40 flex items-center justify-between gap-3 text-left transition-all group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {item.count !== undefined && (
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {item.count}
                </span>
              )}
              <span className="text-xs font-bold text-[#171717] dark:text-white truncate">
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#208C60] group-hover:text-[#F47743] shrink-0">
              <span>{item.actionLabel || 'Selesaikan'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   5. QUICK ACTION GRID (4-6 max prominent buttons)
   ========================================================================= */
export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
  onClick: () => void;
  badge?: string;
}

interface QuickActionGridProps {
  actions: QuickActionItem[];
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#208C60]/40 dark:hover:border-white/20 shadow-xs flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group cursor-pointer"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                action.bgColor || 'bg-slate-50 dark:bg-white/5'
              } ${action.color || 'text-[#208C60]'}`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-[#171717] dark:text-white truncate w-full text-center">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
   6. COLLAPSIBLE MODULE GROUP (Progressive Disclosure)
   ========================================================================= */
export interface ModuleItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: string;
  statusColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  onClick: () => void;
}

interface ModuleGroupProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  items: ModuleItem[];
  defaultOpen?: boolean;
}

export const ModuleGroup: React.FC<ModuleGroupProps> = ({
  title,
  icon: GroupIcon,
  isOpen,
  onToggle,
  items,
}) => {
  const statusStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    purple: 'bg-[#833AB4]/10 text-[#833AB4]',
    slate: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  };

  return (
    <div className="rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 overflow-hidden shadow-xs transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          {GroupIcon && <GroupIcon className="w-4 h-4 text-[#208C60]" />}
          <span className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider">
            {title}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-[#6B7280] dark:text-slate-400">
            {items.length}
          </span>
        </div>

        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-90 text-[#208C60]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-[#ECECEF]/60 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in duration-150">
          {items.map(item => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-[#ECECEF] dark:border-white/5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-[#ECECEF] dark:border-white/5 flex items-center justify-center shrink-0 text-[#208C60]">
                    <ItemIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#171717] dark:text-white truncate">
                    {item.title}
                  </span>
                </div>

                {item.status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      statusStyles[item.statusColor || 'slate']
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   7. EMPTY STATE (Explains what is missing + clear action)
   ========================================================================= */
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 space-y-3 max-w-md mx-auto my-6 shadow-xs">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mx-auto flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[#171717] dark:text-white">{title}</h4>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      {action && (
        <div className="pt-2">
          <button
            type="button"
            onClick={action.onClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#208C60] to-[#F47743] text-white font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   8. PINNED ACTIONS BAR (Requirement 15: 4-6 pinned actions)
   ========================================================================= */
export interface PinnedActionItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface PinnedActionsBarProps {
  items: PinnedActionItem[];
  onManage?: () => void;
}

export const PinnedActionsBar: React.FC<PinnedActionsBarProps> = ({ items, onManage }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-bold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Favorit ({items.length})</span>
        </div>
        {onManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-[11px] font-semibold text-[#208C60] dark:text-[#F47743] hover:underline cursor-pointer"
          >
            Sesuaikan
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="p-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 hover:border-[#208C60]/30 flex items-center gap-2 text-left transition-colors cursor-pointer group shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-[#208C60] group-hover:scale-105 transition-transform">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#171717] dark:text-white truncate">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   9. RECENT ACTIVITY LIST (Requirement 25: 3-5 records, then "Lihat Semua")
   ========================================================================= */
export interface ActivityRecord {
  id: string;
  title: string;
  actor: string;
  time: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface RecentActivityListProps {
  activities: ActivityRecord[];
  onViewAll?: () => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onViewAll,
}) => {
  const [showAllModal, setShowAllModal] = React.useState(false);
  const displayed = activities.slice(0, 4);

  return (
    <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#171717] dark:text-white uppercase tracking-wider">
          Aktivitas Terbaru
        </h3>
        {activities.length > 4 && (
          <button
            type="button"
            onClick={onViewAll ? onViewAll : () => setShowAllModal(true)}
            className="text-[11px] font-bold text-[#208C60] dark:text-[#F47743] hover:underline cursor-pointer"
          >
            Lihat Semua ({activities.length})
          </button>
        )}
      </div>

      <div className="divide-y divide-[#ECECEF]/60 dark:divide-white/5">
        {displayed.map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {Icon && (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-[#171717] dark:text-white truncate">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-[#6B7280] dark:text-slate-400 truncate">
                    Oleh {act.actor}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">
                  {act.time}
                </span>
                {act.badge && (
                  <div className="text-[9px] font-bold text-[#208C60] dark:text-[#F47743]">
                    {act.badge}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECECEF] dark:border-white/10">
              <h3 className="text-sm font-bold text-[#171717] dark:text-white">
                Seluruh Log Aktivitas Sistem
              </h3>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="divide-y divide-[#ECECEF]/60 dark:divide-white/5 space-y-2">
              {activities.map(act => (
                <div key={act.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-[#171717] dark:text-white">{act.title}</div>
                    <div className="text-[11px] text-slate-500">Oleh {act.actor}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
