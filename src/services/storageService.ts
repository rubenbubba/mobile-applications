// In-memory fallback until the native build adds AsyncStorage. The web build uses storageService.web.ts.
const memory = new Map<string, string>();

export const storageService = {
  getItem(key: string): string | undefined {
    return memory.get(key);
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
  },
  removeItem(key: string): void {
    memory.delete(key);
  },
};
