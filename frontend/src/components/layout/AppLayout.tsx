import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PlayerBar } from '../player/PlayerBar';
import { useMediaSession } from '../../hooks/useMediaSession';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useScrollStore } from '../../stores/useScrollStore';

export const AppLayout: React.FC = () => {
  // Bind browser Media Session API and global keyboard shortcuts
  useMediaSession();
  useKeyboardShortcuts();

  const location = useLocation();

  useEffect(() => {
    const mainEl = document.getElementById('main-content-container');
    if (!mainEl) return;

    const handleScroll = () => {
      useScrollStore.getState().setScrollPosition(location.pathname, mainEl.scrollTop);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main id="main-content-container" className="flex-1 overflow-y-auto p-4 sm:p-6 pb-48 md:pb-36">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Persistent Audio Player Bar */}
      <PlayerBar />
    </div>
  );
};

