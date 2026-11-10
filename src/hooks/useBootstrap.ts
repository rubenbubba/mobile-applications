import { useEffect } from 'react';
import { startPwa } from '../services/pwaService';
import { preloadStorage } from '../services/storageService';
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
      .finally(finish);

    const { setInstallState, setUpdateAvailable } = usePwaStore.getState();
    startPwa({ onInstallStateChange: setInstallState, onUpdateAvailable: setUpdateAvailable });
  }, []);
}
