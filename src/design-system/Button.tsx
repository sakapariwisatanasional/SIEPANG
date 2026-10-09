/**
 * @license
 * SiEpang Design System — Authoritative Button Component (RC1)
 * Enforces icon-first touch targets, Instagram gradients for primary actions, and accessible states.
 */

import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'icon'
  | 'danger'
  | 'success'
  | 'soft';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isIconOnly = variant === 'icon' || (!children && !!icon);

    const baseClasses =
      'inline-flex items-center justify-center font-semibold transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const sizeClasses = isIconOnly
      ? 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl p-2.5'
      : {
          sm: 'text-xs px-3 py-1.5 rounded-xl min-h-[36px] gap-1.5',
          md: 'text-xs sm:text-sm px-4 py-2.5 rounded-xl min-h-[44px] gap-2',
          lg: 'text-sm sm:text-base px-5 py-3 rounded-2xl min-h-[48px] gap-2.5',
          icon: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl p-2.5',
        }[size];

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-95 text-white shadow-md shadow-pink-500/20 border border-transparent',
      secondary:
        'bg-white dark:bg-[#1C1C1E] hover:bg-[#FAFAFA] dark:hover:bg-white/10 text-[#171717] dark:text-white border border-[#ECECEF] dark:border-white/10 shadow-2xs',
      ghost:
        'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#171717] dark:text-slate-200 border border-transparent',
      icon:
        'bg-white dark:bg-white/5 hover:bg-[#FAFAFA] dark:hover:bg-white/10 text-[#171717] dark:text-slate-200 border border-[#ECECEF] dark:border-white/10 shadow-2xs',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-transparent',
      success:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border border-transparent',
      soft:
        'bg-[#FFF0F4] hover:bg-[#FFE0E8] text-[#E1306C] border border-[#FFE0E8] dark:bg-pink-950/30 dark:border-pink-500/30 dark:text-pink-300',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
