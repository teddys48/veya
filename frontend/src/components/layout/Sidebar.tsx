import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Music, Disc, Users, ListMusic, Heart, History, Home, RefreshCw, Radio } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { ScanStatus } from '../../types';

export const Sidebar: React.FC = () => {
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = async () => {
    try {
      setIsScanning(true);
      await api.triggerScan();
      const status = await api.getScanStatus();
      setScanStatus(status);
    } catch (err) {
      console.error('Failed to trigger scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/songs', label: 'Songs', icon: Music },
    { to: '/albums', label: 'Albums', icon: Disc },
    { to: '/artists', label: 'Artists', icon: Users },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
    { to: '/favorites', label: 'Favorites', icon: Heart },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <aside className="w-64 border-r-3 border-black bg-[var(--card-bg)] flex flex-col h-full select-none hidden md:flex shrink-0">
      {/* Brand Logo */}
      <div className="p-5 border-b-3 border-black bg-[var(--primary)] text-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl border-2 border-black shadow-[2px_2px_0px_0px_#fff]">
            <Radio className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter uppercase leading-none">VEYA</h1>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-black text-white px-1 py-0.5 inline-block">
              MUSIC PLAYER
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-bold border-2 border-black transition-all ${
                  isActive
                    ? 'bg-[var(--primary)] text-black shadow-[3px_3px_0px_0px_#000] translate-x-1'
                    : 'bg-[var(--card-bg)] text-[var(--fg)] hover:bg-[var(--muted-bg)] hover:shadow-[2px_2px_0px_0px_#000]'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-mono text-sm tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Library Scanner Action Footer */}
      <div className="p-4 border-t-3 border-black bg-[var(--muted-bg)] space-y-3">
        <Button
          variant="accent"
          size="sm"
          onClick={handleTriggerScan}
          disabled={isScanning}
          className="w-full justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'SCANNING...' : 'SCAN LIBRARY'}</span>
        </Button>
        {scanStatus && scanStatus.message && (
          <p className="text-[11px] font-mono text-center font-semibold truncate text-[var(--fg)]">
            {scanStatus.message}
          </p>
        )}
      </div>
    </aside>
  );
};
