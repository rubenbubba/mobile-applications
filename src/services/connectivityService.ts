import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// Native connectivity through NetInfo. The web build uses connectivityService.web.ts.
// Until NetInfo reports, the app assumes it is online, the same as the web version does without `navigator`.
let online = true;
const listeners = new Set<() => void>();

function isStateOnline(state: NetInfoState): boolean {
  // isInternetReachable is unknown (null) right after start-up. Only a definite "false" counts as offline.
  return state.isConnected !== false && state.isInternetReachable !== false;
}

NetInfo.addEventListener((state) => {
  const next = isStateOnline(state);
  if (next === online) return;
  online = next;
  listeners.forEach((listener) => listener());
});

export function isOnline(): boolean {
  return online;
}

export function subscribeToConnectivity(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
