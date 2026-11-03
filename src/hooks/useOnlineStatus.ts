import { useSyncExternalStore } from 'react';
import { isOnline, subscribeToConnectivity } from '../services/connectivityService';

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeToConnectivity, isOnline, () => true);
}
