import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { Button } from './Button';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      className="neo-btn-ghost p-2"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400 fill-amber-400" /> : <Moon className="w-5 h-5 text-slate-800" />}
    </Button>
  );
};
