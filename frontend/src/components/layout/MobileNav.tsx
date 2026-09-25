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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)] border-t-3 border-black flex justify-around p-2 select-none shadow-[0_-4px_0px_0px_#000]">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 font-bold font-mono text-[10px] rounded-none ${
                isActive
                  ? 'bg-[var(--primary)] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-[var(--fg)] hover:bg-[var(--muted-bg)]'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
