import React from 'react';

interface IOSGroupedSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}

export const IOSGroupedSection: React.FC<IOSGroupedSectionProps> = ({
  title,
  footer,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {title && (
        <div className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#121215] border border-black/5 dark:border-white/8 shadow-sm divide-y divide-black/5 dark:divide-white/5">
        {children}
      </div>
      {footer && (
        <div className="px-4 text-[11px] text-slate-500 leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
};
