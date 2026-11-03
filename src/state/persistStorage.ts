import { createJSONStorage } from 'zustand/middleware';
import { storageService } from '../services/storageService';

// zustand's storage contract expects null for a missing key, which only exists at this boundary.
export function createPersistStorage<T>() {
  return createJSONStorage<T>(() => ({
    getItem: (key) => storageService.getItem(key) ?? null,
    setItem: (key, value) => storageService.setItem(key, value),
    removeItem: (key) => storageService.removeItem(key),
  }));
}
