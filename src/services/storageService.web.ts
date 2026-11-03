function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

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
