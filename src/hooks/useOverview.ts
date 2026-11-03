import { useEffect, useMemo } from 'react';
import { deriveOverview, type Overview } from '../logic/overview';
import { getBusiness } from '../services/monitoringService';
import { useMonitoringStore } from '../state/useMonitoringStore';
import type { ChangeEntry } from '../types/Monitoring';
import type { IssueId } from '../types/Issue';
import { useOnlineStatus } from './useOnlineStatus';

export type OverviewState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; retry: () => void }
  | { kind: 'ready'; overview: Overview };

const NO_ISSUES: IssueId[] = [];
const NO_CHANGES: ChangeEntry[] = [];
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function useOverview(): OverviewState {
  const businessId = useMonitoringStore((state) => state.businessId);
  const snapshot = useMonitoringStore((state) => state.snapshots[state.businessId]);
  const markedFixed = useMonitoringStore((state) => state.markedFixed[state.businessId] ?? NO_ISSUES);
  const verifiedFixes = useMonitoringStore((state) => state.verifiedFixes[state.businessId] ?? NO_ISSUES);
  const checkLog = useMonitoringStore((state) => state.checkLog[state.businessId] ?? NO_CHANGES);
  const errorMessage = useMonitoringStore((state) => state.errorMessage);
  const load = useMonitoringStore((state) => state.load);

  return useMemo<OverviewState>(() => {
    if (snapshot !== undefined) {
      return {
        kind: 'ready',
        overview: deriveOverview({
          business: getBusiness(businessId),
          snapshot,
          progress: { markedFixed, verifiedFixes },
          checkLog,
          now: new Date(),
        }),
      };
    }

    return errorMessage !== undefined ? { kind: 'error', message: errorMessage, retry: load } : { kind: 'loading' };
  }, [businessId, snapshot, markedFixed, verifiedFixes, checkLog, errorMessage, load]);
}

// Loads the selected business once, refreshes old results, and retries when the connection returns.
export function useSnapshotLoader(): void {
  const businessId = useMonitoringStore((state) => state.businessId);
  const fetchedAt = useMonitoringStore((state) => state.snapshots[state.businessId]?.fetchedAt);
  const load = useMonitoringStore((state) => state.load);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const isStale = fetchedAt !== undefined && Date.now() - new Date(fetchedAt).getTime() > STALE_AFTER_MS;
    if (fetchedAt === undefined || (isStale && isOnline)) {
      void load();
    }
  }, [businessId, fetchedAt, isOnline, load]);
}
