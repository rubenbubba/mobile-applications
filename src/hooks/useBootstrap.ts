import { useEffect } from 'react';
import { subscribeToAuth } from '../services/authService';
import { startPwa } from '../services/pwaService';
import { preloadStorage } from '../services/storageService';
import { startSync } from '../services/syncService';
import { useAuthStore } from '../state/useAuthStore';
import { useBootStore } from '../state/useBootStore';
import { useMonitoringStore } from '../state/useMonitoringStore';
import { usePwaStore } from '../state/usePwaStore';
import { useSettingsStore } from '../state/useSettingsStore';

// Saved state is read after mount so the first client render matches the static HTML.
export function useBootstrap(): void {
  useEffect(() => {
    const finish = useBootStore.getState().setReady;

    // Native storage must be loaded into memory before the stores read it. On the web this resolves at once.
    preloadStorage()
      .then(() =>
        Promise.all([
          useAuthStore.persist.rehydrate(),
          useSettingsStore.persist.rehydrate(),
          useMonitoringStore.persist.rehydrate(),
        ]),
      )
      // With real accounts, Supabase decides who is signed in (the saved copy may have expired).
      .then(() => useAuthStore.getState().syncSession())
      .finally(finish);

    // Sign-ins from email links, expired sessions and sign-outs on another tab.
    const stopAuth = subscribeToAuth((event, user) => {
      const auth = useAuthStore.getState();
      if (event === 'signed-out') {
        if (auth.user?.mode === 'live') useMonitoringStore.getState().clearAccountData();
        auth.clearSession();
      } else if (user !== undefined && auth.user?.id !== user.id) {
        auth.setSignedIn(user);
      }
    });

    // Fixes and replies made offline are sent when the connection returns (chapter 22).
    const stopSync = startSync();

    const { setInstallState, setUpdateAvailable } = usePwaStore.getState();
    startPwa({ onInstallStateChange: setInstallState, onUpdateAvailable: setUpdateAvailable });

    return () => {
      stopAuth();
      stopSync();
    };
  }, []);
}
