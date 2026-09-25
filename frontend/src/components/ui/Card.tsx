import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ hoverEffect = true, className, children, ...props }) => {
  return (
    <div
      className={clsx(
        hoverEffect ? 'neo-card' : 'neo-box',
        'p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
