import type { AccountMode } from '../types/User';

// Which data the services use: sample data for demo sessions, Supabase for real accounts.
// The auth store keeps this in step with the signed-in user (useAuthStore.ts).
let mode: AccountMode = 'demo';

export function setDataMode(next: AccountMode): void {
  mode = next;
}

export function getDataMode(): AccountMode {
  return mode;
}
