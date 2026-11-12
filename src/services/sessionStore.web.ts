// Where Supabase keeps the login session in the browser. Browsers have no secure storage like the Keychain,
// so the PWA uses localStorage with Supabase's short-lived access tokens (refreshed automatically).
// That is the standard trade-off for web apps. Native uses SecureStore (sessionStore.ts).
function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

// supabase-js expects null for a missing value. That contract only exists at this boundary.
export const sessionStore = {
  getItem(key: string): string | null {
    return getStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string): void {
    try {
      getStorage()?.setItem(key, value);
    } catch {
      // Storage can be full or blocked. The session then lasts until the tab closes.
    }
  },
  removeItem(key: string): void {
    getStorage()?.removeItem(key);
  },
};
