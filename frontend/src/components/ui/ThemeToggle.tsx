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
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className="neo-btn-ghost p-2 flex items-center justify-center cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 fill-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-900 fill-slate-900" />
      )}
    </Button>
  );
};
