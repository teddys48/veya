import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialDark = typeof window !== 'undefined'
    ? localStorage.getItem('veya_theme') === 'dark'
    : false;

  if (typeof document !== 'undefined') {
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isDark: initialDark,
    toggleTheme: () => set((state) => {
      const nextDark = !state.isDark;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('veya_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('veya_theme', 'light');
      }
      return { isDark: nextDark };
    }),
    setDark: (isDark: boolean) => set(() => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('veya_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('veya_theme', 'light');
      }
      return { isDark };
    }),
  };
});
