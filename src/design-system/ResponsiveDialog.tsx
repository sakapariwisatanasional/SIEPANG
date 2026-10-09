/**
 * @license
 * SiEpang Design System — Authoritative Responsive Dialog & Sheet (RC1)
 * Mobile renders as a native-feeling Bottom Sheet, Desktop renders as a centered Dialog Modal.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop Dismiss */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface: Bottom Sheet on Mobile, Dialog on Desktop */}
      <div
        className={`relative w-full ${maxWidthClasses} bg-white dark:bg-[#141418] rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-[#ECECEF] dark:border-white/10 shadow-2xl z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full" />
        </div>

        {/* Dialog Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#ECECEF] dark:border-white/10 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-[#171717] dark:text-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 -mr-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup Dialog"
                title="Tutup Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:px-6 space-y-4">
          {children}
        </div>

        {/* Sticky/Fixed Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-[#ECECEF] dark:border-white/10 bg-[#FAFAFA] dark:bg-[#1A1A1E] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
