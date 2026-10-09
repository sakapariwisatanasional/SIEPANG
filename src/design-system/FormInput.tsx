/**
 * @license
 * SiEpang Design System — Form Controls (RC1)
 * Standardizes inputs, selects, labels, and error states with >=16px mobile font to prevent iOS zoom.
 */

import React from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#171717] dark:text-slate-200">
            {label}
            {props.required && <span className="text-[#E1306C] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-white dark:bg-[#1A1A1E] text-[#171717] dark:text-white border ${
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-[#ECECEF] dark:border-white/10 focus:border-[#E1306C] focus:ring-[#E1306C]/20'
            } rounded-xl ${
              icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } py-2.5 text-[16px] md:text-sm placeholder:text-[#9CA3AF] shadow-2xs outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:bg-slate-50 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-[#6B7280] dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#171717] dark:text-slate-200">
            {label}
            {props.required && <span className="text-[#E1306C] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-white dark:bg-[#1A1A1E] text-[#171717] dark:text-white border ${
            error
              ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
              : 'border-[#ECECEF] dark:border-white/10 focus:border-[#E1306C] focus:ring-[#E1306C]/20'
          } rounded-xl px-3.5 py-2.5 text-[16px] md:text-sm shadow-2xs outline-none focus:ring-2 transition-all disabled:opacity-50 ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-[#6B7280] dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
