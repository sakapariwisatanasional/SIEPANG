/**
 * @license
 * SiEpang Design System — Authoritative Card Component (RC1)
 * Standardizes card surfaces across participant, admin, and public views.
 */

import React from 'react';

export type CardVariant =
  | 'default'
  | 'soft'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'media'
  | 'pastel-purple'
  | 'pastel-pink'
  | 'pastel-orange'
  | 'pastel-blue'
  | 'pastel-green'
  | 'pastel-amber';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  padded?: boolean | 'sm' | 'md' | 'lg' | 'none';
  radius?: 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  padded = 'md',
  radius = '2xl',
  className = '',
  children,
  onClick,
  ...props
}) => {
  const radiusClasses = {
    lg: 'rounded-2xl',
    xl: 'rounded-[20px]',
    '2xl': 'rounded-[24px]',
    '3xl': 'rounded-[28px]',
  }[radius];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[typeof padded === 'boolean' ? (padded ? 'md' : 'none') : padded];

  const variantClasses: Record<CardVariant, string> = {
    default: 'bg-white dark:bg-[#141418] border border-[#ECECEF] dark:border-white/10 text-[#171717] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
    soft: 'bg-[#FAFAFA] dark:bg-[#1A1A1E] border border-[#ECECEF] dark:border-white/10 text-[#171717] dark:text-white shadow-2xs',
    accent: 'bg-white dark:bg-[#141418] border border-[#E1306C]/30 text-[#171717] dark:text-white shadow-[0_4px_16px_rgba(225,48,108,0.08)]',
    info: 'bg-[#EFF6FF] dark:bg-sky-950/40 border border-[#BFDBFE] dark:border-sky-500/20 text-sky-950 dark:text-sky-200',
    success: 'bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200',
    warning: 'bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FEF08A] dark:border-amber-500/20 text-amber-950 dark:text-amber-200',
    danger: 'bg-[#FFF1F2] dark:bg-rose-950/40 border border-[#FECDD3] dark:border-rose-500/20 text-rose-950 dark:text-rose-200',
    media: 'bg-slate-900 border border-white/10 text-white shadow-xl overflow-hidden',
    'pastel-purple': 'bg-[#F5F3FF] dark:bg-purple-950/30 border border-[#DDD6FE] dark:border-purple-500/20 text-purple-950 dark:text-purple-200',
    'pastel-pink': 'bg-[#FFF1F2] dark:bg-pink-950/30 border border-[#FECDD3] dark:border-pink-500/20 text-pink-950 dark:text-pink-200',
    'pastel-orange': 'bg-[#FFF7ED] dark:bg-orange-950/30 border border-[#FED7AA] dark:border-orange-500/20 text-orange-950 dark:text-orange-200',
    'pastel-blue': 'bg-[#EFF6FF] dark:bg-blue-950/30 border border-[#BFDBFE] dark:border-blue-500/20 text-blue-950 dark:text-blue-200',
    'pastel-green': 'bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-500/20 text-emerald-950 dark:text-emerald-200',
    'pastel-amber': 'bg-[#FEFCE8] dark:bg-amber-950/30 border border-[#FEF08A] dark:border-amber-500/20 text-amber-950 dark:text-amber-200',
  };

  const interactiveClasses = interactive || onClick
    ? 'cursor-pointer hover:border-[#E1306C]/40 active:scale-[0.99] transition-all'
    : '';

  return (
    <div
      className={`${radiusClasses} ${variantClasses[variant]} ${paddingClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
