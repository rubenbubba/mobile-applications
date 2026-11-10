function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

// localStorage is synchronous, so there is nothing to load first. Native needs this step (storageService.ts).
export async function preloadStorage(): Promise<void> {}

export const storageService = {
  getItem(key: string): string | undefined {
    return getStorage()?.getItem(key) ?? undefined;
  },
  setItem(key: string, value: string): void {
    try {
      getStorage()?.setItem(key, value);
    } catch {
      // Storage can be full or blocked. The app keeps working from memory for this session.
    }
  },
  removeItem(key: string): void {
    getStorage()?.removeItem(key);
  },
};
