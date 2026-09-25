import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialDark = typeof window !== 'undefined'
    ? localStorage.getItem('veya_theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  if (initialDark && typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
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
