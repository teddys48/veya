import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx('neo-input w-full font-mono text-sm', className)}
          {...props}
        />
        {error && <span className="text-xs text-red-600 font-bold">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
