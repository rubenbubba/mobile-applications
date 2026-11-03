import { create } from 'zustand';

interface BootState {
  isReady: boolean;
  setReady: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  isReady: false,
  setReady: () => set({ isReady: true }),
}));
