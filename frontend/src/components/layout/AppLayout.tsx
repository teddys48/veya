import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PlayerBar } from '../player/PlayerBar';
import { useMediaSession } from '../../hooks/useMediaSession';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const AppLayout: React.FC = () => {
  // Bind browser Media Session API and global keyboard shortcuts
  useMediaSession();
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-48 md:pb-36">
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
