import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistStorage } from './persistStorage';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
  setThemeMode: (themeMode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'vitrine-settings',
      storage: createPersistStorage(),
      skipHydration: true,
    },
  ),
);
