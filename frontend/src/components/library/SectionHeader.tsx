import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-3 border-black pb-3 my-4">
      <div>
        <h2 className="font-black text-2xl uppercase tracking-tight text-[var(--fg)]">{title}</h2>
        {subtitle && <p className="text-xs font-mono text-[var(--muted)] font-semibold mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
