import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginService, logout as logoutService } from '../services/authService';
import type { User } from '../types/User';
import { createPersistStorage } from './persistStorage';

interface AuthState {
  user?: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const user = await loginService(email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: async () => {
        await logoutService();
        set({ user: undefined, isAuthenticated: false });
      },
    }),
    {
      name: 'vitrine-session',
      storage: createPersistStorage(),
      skipHydration: true,
      // The demo session holds no token. Real tokens belong in secure storage (see TODOS.md).
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
