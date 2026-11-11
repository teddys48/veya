import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Music, Disc, Users, ListMusic } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/songs', label: 'Songs', icon: Music },
    { to: '/albums', label: 'Albums', icon: Disc },
    { to: '/artists', label: 'Artists', icon: Users },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
  ];

  return (
    <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)] border-t-3 border-[var(--border-color)] flex justify-around p-1.5 select-none shadow-[0_-4px_0px_0px_#000]">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 font-bold font-mono text-xs rounded-none transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-[var(--fg)] hover:bg-[var(--muted-bg)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
                <span>{item.label}</span>
                {isActive && <span className="sr-only"> (current page)</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
