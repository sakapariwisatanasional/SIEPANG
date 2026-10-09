import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface IOSStatusBadgeProps {
  label: React.ReactNode;
  variant?: StatusVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const IOSStatusBadge: React.FC<IOSStatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'sm',
  className = '',
}) => {
  const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30',
    warning: 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
    danger: 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30',
    info: 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30',
    neutral: 'bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/10',
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold border leading-none tracking-tight ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
