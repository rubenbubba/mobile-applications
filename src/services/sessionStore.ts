import * as SecureStore from 'expo-secure-store';

// Where Supabase keeps the login session on native: the Keychain (iOS) or Keystore (Android), as chapter 18 asks.
// SecureStore holds at most 2048 bytes per value and a session is often larger, so values are split into chunks.
// The web build uses sessionStore.web.ts.
const CHUNK_SIZE = 1800;

function safeKey(key: string): string {
  return key.replace(/[^\w.-]/g, '_');
}

async function readCount(key: string): Promise<number> {
  const count = Number(await SecureStore.getItemAsync(`${safeKey(key)}.count`));
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function removeItem(key: string): Promise<void> {
  const count = await readCount(key);
  await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(`${safeKey(key)}.${index}`)),
  );
  await SecureStore.deleteItemAsync(`${safeKey(key)}.count`);
}

// supabase-js expects null for a missing value. That contract only exists at this boundary.
async function getItem(key: string): Promise<string | null> {
  const count = await readCount(key);
  if (count === 0) return null;

  const parts = await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${safeKey(key)}.${index}`)),
  );
  return parts.every((part) => typeof part === 'string') ? parts.join('') : null;
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const chunks = value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [''];
  await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${safeKey(key)}.${index}`, chunk)));
  await SecureStore.setItemAsync(`${safeKey(key)}.count`, String(chunks.length));
}

export const sessionStore = { getItem, setItem, removeItem };
