import AsyncStorage from '@react-native-async-storage/async-storage';

// Native storage. AsyncStorage is asynchronous, but the stores expect instant reads like the web's localStorage.
// So the app keeps a copy in memory, loads it once at start-up (preloadStorage), and writes every change through.
// Only non-sensitive app state lives here. Login tokens belong in secure storage (chapter 18).
// The web build uses storageService.web.ts.
const KEY_PREFIX = 'vitrine-';
const memory = new Map<string, string>();

function persist(task: Promise<void>): void {
  task.catch(() => {
    // Storage can be full or unavailable. The app keeps working from memory for this session.
  });
}

export async function preloadStorage(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(KEY_PREFIX));
    const entries = await AsyncStorage.multiGet(keys);
    for (const [key, value] of entries) {
      if (value !== null && !memory.has(key)) memory.set(key, value);
    }
  } catch {
    // Start with empty storage rather than blocking the app.
  }
}

export const storageService = {
  getItem(key: string): string | undefined {
    return memory.get(key);
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
    persist(AsyncStorage.setItem(key, value));
  },
  removeItem(key: string): void {
    memory.delete(key);
    persist(AsyncStorage.removeItem(key));
  },
};
