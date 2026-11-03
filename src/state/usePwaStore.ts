import { create } from 'zustand';
import type { InstallState } from '../services/pwaService';

interface PwaState {
  installState: InstallState;
  updateAvailable: boolean;
  setInstallState: (installState: InstallState) => void;
  setUpdateAvailable: () => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  installState: 'unavailable',
  updateAvailable: false,
  setInstallState: (installState) => set({ installState }),
  setUpdateAvailable: () => set({ updateAvailable: true }),
}));
