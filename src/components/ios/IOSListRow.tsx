import React from 'react';
import { ChevronRight } from 'lucide-react';

interface IOSListRowProps {
  icon?: React.ReactNode;
  iconBgColor?: string;
  avatarUrl?: string;
  withGradientRing?: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  badge?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  hasChevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  className?: string;
}

export const IOSListRow: React.FC<IOSListRowProps> = ({
  icon,
  iconBgColor = 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200',
  avatarUrl,
  withGradientRing = false,
  title,
  subtitle,
  value,
  badge,
  rightAccessory,
  hasChevron = false,
  onClick,
  destructive = false,
  className = '',
}) => {
  const isClickable = !!onClick;

  const content = (
    <div
      onClick={onClick}
      className={`min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors select-none ${
        isClickable
          ? 'cursor-pointer active:bg-black/5 dark:active:bg-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
          : ''
      } ${className}`}
    >
      {/* Left: Icon / Avatar + Titles */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {avatarUrl ? (
          <div
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${
              withGradientRing
                ? 'p-[2px] bg-gradient-to-tr from-[#208C60] via-[#F47743] to-[#FFD36A]'
                : ''
            }`}
          >
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover rounded-full bg-slate-200 dark:bg-slate-800"
            />
          </div>
        ) : icon ? (
          <div
            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-semibold shadow-xs ${iconBgColor}`}
          >
            {icon}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-semibold truncate ${
              destructive
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right: Value, Badge, Accessory, Chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {value}
          </span>
        )}
        {badge}
        {rightAccessory}
        {hasChevron && (
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </div>
    </div>
  );

  return content;
};
