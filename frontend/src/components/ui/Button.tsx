import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'pink' | 'green' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'neo-btn font-bold rounded-none';
  
  const variantStyles = {
    primary: 'bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)]',
    accent: 'bg-[var(--accent-cyan)] text-black',
    pink: 'bg-[var(--accent-pink)] text-black',
    green: 'bg-[var(--accent-green)] text-black',
    ghost: 'bg-[var(--card-bg)] text-[var(--fg)] hover:bg-[var(--muted-bg)]',
    outline: 'bg-transparent text-[var(--fg)] border-2 border-black',
    danger: 'bg-red-500 text-white',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 text-sm',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3 text-lg',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
