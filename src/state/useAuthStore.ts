import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  accountsEnabled,
  deleteAccount as deleteAccountService,
  login as loginService,
  loginDemo,
  logout as logoutService,
  register as registerService,
  restoreSession,
  updatePassword as updatePasswordService,
} from '../services/authService';
import { setDataMode } from '../services/dataMode';
import type { User } from '../types/User';
import { createPersistStorage } from './persistStorage';

interface AuthState {
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  startDemo: () => Promise<void>;
  register: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  updatePassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncSession: () => Promise<void>;
  setSignedIn: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Runs a sign-in style action with the loading flag, and keeps the error for the screen to show.
      const withLoading = async <T,>(action: () => Promise<T>): Promise<T> => {
        set({ isLoading: true });
        try {
          return await action();
        } finally {
          set({ isLoading: false });
        }
      };

      return {
        user: undefined,
        isAuthenticated: false,
        isLoading: false,

        login: (email, password) =>
          withLoading(async () => {
            const user = await loginService(email, password);
            set({ user, isAuthenticated: true });
          }),

        startDemo: () =>
          withLoading(async () => {
            const user = await loginDemo();
            set({ user, isAuthenticated: true });
          }),

        register: (email, password) =>
          withLoading(async () => {
            const result = await registerService(email, password);
            if (result.user !== undefined) set({ user: result.user, isAuthenticated: true });
            return { needsEmailConfirmation: result.needsEmailConfirmation };
          }),

        updatePassword: (password) =>
          withLoading(async () => {
            const user = await updatePasswordService(password);
            set({ user, isAuthenticated: true });
          }),

        logout: async () => {
          await logoutService(get().user);
          set({ user: undefined, isAuthenticated: false });
        },

        deleteAccount: async () => {
          if (get().user?.mode === 'live') await deleteAccountService();
          set({ user: undefined, isAuthenticated: false });
        },

        // After a restart: trust Supabase's session over the saved copy, which may have expired.
        syncSession: async () => {
          if (!accountsEnabled) return;
          const saved = get().user;
          try {
            const user = await restoreSession();
            if (user !== undefined) set({ user, isAuthenticated: true });
            else if (saved?.mode === 'live') set({ user: undefined, isAuthenticated: false });
          } catch {
            // Offline at start-up: keep the saved session so the saved results stay readable.
          }
        },

        setSignedIn: (user) => set({ user, isAuthenticated: true }),

        clearSession: () => {
          if (get().user?.mode === 'live') set({ user: undefined, isAuthenticated: false });
        },
      };
    },
    {
      name: 'vitrine-session',
      storage: createPersistStorage(),
      skipHydration: true,
      // Only who is signed in. Tokens are kept by Supabase in secure storage (src/services/sessionStore.ts).
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

// The services read sample data or Supabase depending on who is signed in.
useAuthStore.subscribe((state) => setDataMode(state.user?.mode === 'live' ? 'live' : 'demo'));
