import { accountsEnabled } from '../services/authService';
import { useAuthStore } from '../state/useAuthStore';

// True for a real account with real data, false for the demo.
export function useIsLiveAccount(): boolean {
  return useAuthStore((state) => state.user?.mode === 'live');
}

// Whether this version of the app can create real accounts (Supabase keys are set).
export function useAccountsEnabled(): boolean {
  return accountsEnabled;
}
