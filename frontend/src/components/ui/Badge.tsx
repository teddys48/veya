import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'primary' | 'pink' | 'cyan' | 'green' | 'orange';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className }) => {
  const bgStyles = {
    primary: 'bg-[var(--primary)] text-black',
    pink: 'bg-[var(--accent-pink)] text-black',
    cyan: 'bg-[var(--accent-cyan)] text-black',
    green: 'bg-[var(--accent-green)] text-black',
    orange: 'bg-[var(--accent-orange)] text-black',
  };

  return (
    <span className={clsx('neo-badge inline-block font-mono font-bold', bgStyles[variant], className)}>
      {children}
    </span>
  );
};
