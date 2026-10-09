import React from 'react';

export interface SegmentOption<T extends string | number = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

interface IOSSegmentedControlProps<T extends string | number = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function IOSSegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: IOSSegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`relative flex items-center p-1 bg-slate-200/70 dark:bg-white/10 rounded-xl select-none backdrop-blur-sm ${className}`}
    >
      {options.map(opt => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value.toString()}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`flex-1 relative z-10 flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all min-h-[34px] ${
              size === 'sm' ? 'py-1 text-[11px]' : 'py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'bg-black/5 dark:bg-white/5 text-slate-500'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
