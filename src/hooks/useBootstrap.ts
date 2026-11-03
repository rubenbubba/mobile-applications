import { useEffect } from 'react';
import { startPwa } from '../services/pwaService';
import { useAuthStore } from '../state/useAuthStore';
import { useBootStore } from '../state/useBootStore';
import { useMonitoringStore } from '../state/useMonitoringStore';
import { usePwaStore } from '../state/usePwaStore';
import { useSettingsStore } from '../state/useSettingsStore';

// Saved state is read after mount so the first client render matches the static HTML.
export function useBootstrap(): void {
  useEffect(() => {
    const finish = useBootStore.getState().setReady;

    Promise.all([
      useAuthStore.persist.rehydrate(),
      useSettingsStore.persist.rehydrate(),
      useMonitoringStore.persist.rehydrate(),
    ]).finally(finish);

    const { setInstallState, setUpdateAvailable } = usePwaStore.getState();
    startPwa({ onInstallStateChange: setInstallState, onUpdateAvailable: setUpdateAvailable });
  }, []);
}
