import React, { forwardRef } from 'react';

// FormField Wrapper
export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <div className="text-xs text-slate-400 mt-1">{helperText}</div>
      ) : null}
    </div>
  );
};

// Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const errorClasses = error
      ? 'border-rose-500/60 focus:ring-rose-500/50 focus:border-rose-500'
      : 'border-slate-700/80 focus:ring-indigo-500/40 focus:border-indigo-500';

    return (
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-lg border transition-all duration-150 py-2.5 px-3.5 focus:outline-none focus:ring-2 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${errorClasses} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    const errorClasses = error
      ? 'border-rose-500/60 focus:ring-rose-500/50 focus:border-rose-500'
      : 'border-slate-700/80 focus:ring-indigo-500/40 focus:border-indigo-500';

    return (
      <textarea
        ref={ref}
        className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-lg border transition-all duration-150 py-2.5 px-3.5 focus:outline-none focus:ring-2 resize-y min-h-[90px] ${errorClasses} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// Select
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, placeholder, className = '', ...props }, ref) => {
    const errorClasses = error
      ? 'border-rose-500/60 focus:ring-rose-500/50 focus:border-rose-500'
      : 'border-slate-700/80 focus:ring-indigo-500/40 focus:border-indigo-500';

    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none bg-slate-900/90 text-slate-100 text-sm rounded-lg border transition-all duration-150 py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 ${errorClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-slate-900 text-slate-500">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-slate-900 text-slate-100"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
