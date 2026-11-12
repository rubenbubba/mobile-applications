import { useEffect } from 'react';
import { useAuthStore } from '../state/useAuthStore';
import { useBootStore } from '../state/useBootStore';
import { useMonitoringStore } from '../state/useMonitoringStore';
import type { Business } from '../types/Business';

// The business shown on every screen: a sample business in the demo, or one of the owner's own.
export function useCurrentBusiness(): Business | undefined {
  return useMonitoringStore((state) => state.businesses.find((business) => business.id === state.businessId));
}

// Loads the list of businesses whenever someone signs in, and again for a different account.
export function useBusinessLoader(): void {
  const isReady = useBootStore((state) => state.isReady);
  const userId = useAuthStore((state) => state.user?.id);
  const mode = useAuthStore((state) => state.user?.mode);
  const loadBusinesses = useMonitoringStore((state) => state.loadBusinesses);

  useEffect(() => {
    if (isReady && userId !== undefined) void loadBusinesses();
  }, [isReady, userId, mode, loadBusinesses]);
}
