/**
 * @license
 * SiEpang Design System — Authoritative Table Wrapper (RC1)
 * Enforces local horizontal overflow containment and prevents body-level horizontal scrolling.
 */

import React from 'react';

export interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
  caption?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  children,
  className = '',
  minWidth = '640px',
  caption,
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-[#ECECEF] dark:border-white/10 bg-white dark:bg-[#141418] shadow-2xs ${className}`}>
      {caption && (
        <div className="px-4 py-2.5 bg-[#FAFAFA] dark:bg-[#1A1A1E] border-b border-[#ECECEF] dark:border-white/10 text-xs font-semibold text-[#6B7280] dark:text-slate-400">
          {caption}
        </div>
      )}
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div style={{ minWidth }} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
