import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (theme) => {
  const root = document.documentElement;

  const resolved = theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light')
    : theme;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark' | 'auto'

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      // A appeler une fois au démarrage de l'app
      initTheme: () => {
        applyTheme(get().theme);

        // Réagit aux changements système si mode 'auto'
        window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', () => {
            if (get().theme === 'auto') applyTheme('auto');
          });
      }
    }),
    { name: 'erp-theme' }
  )
);

export default useThemeStore;