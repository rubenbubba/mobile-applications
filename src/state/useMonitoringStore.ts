import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectedIssueIds, issueTitle } from '../logic/issueRules';
import { overallForSections } from '../logic/scoring';
import { getDataMode } from '../services/dataMode';
import { fetchServerProgress } from '../services/liveMonitoringService';
import {
  addBusiness as addBusinessService,
  defaultBusinessId,
  fetchSnapshot,
  listBusinesses,
  loadBusinesses as loadBusinessesService,
  removeBusiness as removeBusinessService,
  runCheck as runCheckService,
  type NewBusiness,
} from '../services/monitoringService';
import { clearQueue, enqueue, pendingCount } from '../services/syncService';
import type { Business } from '../types/Business';
import type { IssueId } from '../types/Issue';
import type { ChangeEntry, MonitoringSnapshot } from '../types/Monitoring';
import { createPersistStorage } from './persistStorage';

export interface CheckResult {
  previousScore?: number;
  newScore?: number;
  verifiedCount: number;
}

interface MonitoringState {
  businessId: string;
  businesses: Business[];
  businessesLoaded: boolean;
  snapshots: Record<string, MonitoringSnapshot>;
  markedFixed: Record<string, IssueId[]>;
  verifiedFixes: Record<string, IssueId[]>;
  repliedReviews: Record<string, string[]>;
  checkLog: Record<string, ChangeEntry[]>;
  isLoading: boolean;
  isChecking: boolean;
  errorMessage?: string;
  load: () => Promise<void>;
  loadBusinesses: () => Promise<void>;
  addBusiness: (input: NewBusiness) => Promise<void>;
  removeBusiness: (businessId: string) => Promise<void>;
  runCheck: () => Promise<CheckResult>;
  selectBusiness: (businessId: string) => void;
  markFixed: (id: IssueId) => void;
  undoMarkFixed: (id: IssueId) => void;
  markReviewReplied: (reviewId: string) => void;
  resetDemo: () => Promise<void>;
  clearAccountData: () => void;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while loading your results.';
}

const timestamp = () => new Date().toISOString();

const EMPTY_PROGRESS = {
  snapshots: {},
  markedFixed: {},
  verifiedFixes: {},
  repliedReviews: {},
  checkLog: {},
  errorMessage: undefined,
};

export const useMonitoringStore = create<MonitoringState>()(
  persist(
    (set, get) => ({
      businessId: defaultBusinessId,
      businesses: listBusinesses(),
      businessesLoaded: false,
      snapshots: {},
      markedFixed: {},
      verifiedFixes: {},
      repliedReviews: {},
      checkLog: {},
      isLoading: false,
      isChecking: false,
      errorMessage: undefined,

      load: async () => {
        const { businessId, verifiedFixes, repliedReviews } = get();
        if (businessId === '') return;
        const mode = getDataMode();
        set({ isLoading: true, errorMessage: undefined });

        try {
          const snapshot = await fetchSnapshot(businessId, {
            verifiedFixes: verifiedFixes[businessId] ?? [],
            repliedReviewIds: repliedReviews[businessId] ?? [],
          });
          if (getDataMode() !== mode) {
            set({ isLoading: false });
            return;
          }
          set((state) => ({
            snapshots: { ...state.snapshots, [businessId]: snapshot },
            isLoading: false,
          }));

          // The server is the source of truth for a real account, unless this device still has changes to send.
          if (getDataMode() === 'live' && pendingCount(businessId) === 0) {
            const progress = await fetchServerProgress(businessId);
            if (getDataMode() !== mode) return;
            set((state) => ({
              markedFixed: { ...state.markedFixed, [businessId]: progress.markedFixed },
              verifiedFixes: { ...state.verifiedFixes, [businessId]: progress.verifiedFixes },
              repliedReviews: { ...state.repliedReviews, [businessId]: progress.repliedReviewIds },
            }));
          }
        } catch (error) {
          set({ isLoading: false, errorMessage: errorText(error) });
        }
      },

      loadBusinesses: async () => {
        const mode = getDataMode();
        try {
          const businesses = await loadBusinessesService();
          // Signed out or switched account while this was loading: the answer belongs to someone else.
          if (getDataMode() !== mode) return;
          set((state) => ({
            businesses,
            businessesLoaded: true,
            businessId: businesses.some((business) => business.id === state.businessId)
              ? state.businessId
              : (businesses[0]?.id ?? ''),
          }));
        } catch (error) {
          // Offline: keep the list saved on this device, so saved results stay readable.
          set({ businessesLoaded: true, errorMessage: get().businesses.length === 0 ? errorText(error) : undefined });
        }
      },

      addBusiness: async (input) => {
        const business = await addBusinessService(input);
        set((state) => ({
          businesses: [...state.businesses, business],
          businessId: business.id,
          errorMessage: undefined,
        }));
        await get().load();
      },

      removeBusiness: async (businessId) => {
        await removeBusinessService(businessId);
        set((state) => {
          const businesses = state.businesses.filter((business) => business.id !== businessId);
          const { [businessId]: _removed, ...snapshots } = state.snapshots;
          return {
            businesses,
            snapshots,
            businessId: state.businessId === businessId ? (businesses[0]?.id ?? '') : state.businessId,
          };
        });
      },

      runCheck: async () => {
        const { businessId, snapshots, markedFixed, verifiedFixes, repliedReviews } = get();
        const claimed = markedFixed[businessId] ?? [];
        const verified = verifiedFixes[businessId] ?? [];
        const previous = snapshots[businessId];
        set({ isChecking: true });

        try {
          const snapshot = await runCheckService(businessId, {
            verifiedFixes: [...verified, ...claimed],
            repliedReviewIds: repliedReviews[businessId] ?? [],
          });
          const now = new Date(snapshot.fetchedAt);
          const stillDetected = detectedIssueIds(snapshot, now);
          const newlyVerified = claimed.filter((id) => !stillDetected.includes(id));
          const previousScore = previous !== undefined ? overallForSections(previous, now) : undefined;
          const newScore = overallForSections(snapshot, now);

          for (const id of newlyVerified) {
            enqueue({ kind: 'issue', businessId, issueId: id, status: 'verified', at: timestamp() });
          }

          const entries: ChangeEntry[] = newlyVerified.map((id) => ({
            id: `verified-${id}-${snapshot.fetchedAt}`,
            at: snapshot.fetchedAt,
            tone: 'good',
            title: `Fix confirmed: ${issueTitle(id)}`,
          }));

          if (previousScore !== undefined && newScore !== undefined && previousScore !== newScore) {
            entries.push({
              id: `score-${snapshot.fetchedAt}`,
              at: snapshot.fetchedAt,
              tone: newScore > previousScore ? 'good' : 'bad',
              title: `Overall score went from ${previousScore} to ${newScore}`,
            });
          }

          set((state) => ({
            snapshots: { ...state.snapshots, [businessId]: snapshot },
            markedFixed: {
              ...state.markedFixed,
              [businessId]: claimed.filter((id) => !newlyVerified.includes(id)),
            },
            verifiedFixes: {
              ...state.verifiedFixes,
              [businessId]: [...verified, ...newlyVerified],
            },
            checkLog: {
              ...state.checkLog,
              [businessId]: [...entries, ...(state.checkLog[businessId] ?? [])],
            },
            isChecking: false,
            errorMessage: undefined,
          }));

          return { previousScore, newScore, verifiedCount: newlyVerified.length };
        } catch (error) {
          set({ isChecking: false });
          throw error;
        }
      },

      selectBusiness: (businessId) => set({ businessId, errorMessage: undefined }),

      markFixed: (id) => {
        set((state) => ({
          markedFixed: {
            ...state.markedFixed,
            [state.businessId]: [...(state.markedFixed[state.businessId] ?? []), id],
          },
        }));
        enqueue({ kind: 'issue', businessId: get().businessId, issueId: id, status: 'marked', at: timestamp() });
      },

      undoMarkFixed: (id) => {
        set((state) => ({
          markedFixed: {
            ...state.markedFixed,
            [state.businessId]: (state.markedFixed[state.businessId] ?? []).filter((item) => item !== id),
          },
        }));
        enqueue({ kind: 'issue', businessId: get().businessId, issueId: id, status: 'open', at: timestamp() });
      },

      markReviewReplied: (reviewId) => {
        set((state) => ({
          repliedReviews: {
            ...state.repliedReviews,
            [state.businessId]: [...(state.repliedReviews[state.businessId] ?? []), reviewId],
          },
        }));
        enqueue({ kind: 'review-replied', businessId: get().businessId, reviewId, at: timestamp() });
      },

      resetDemo: async () => {
        set(EMPTY_PROGRESS);
        await get().load();
      },

      // After logging out of (or deleting) a real account: nothing of it stays on this device.
      clearAccountData: () => {
        clearQueue();
        set({ ...EMPTY_PROGRESS, businessId: defaultBusinessId, businesses: listBusinesses(), businessesLoaded: false });
      },
    }),
    {
      name: 'vitrine-monitoring',
      storage: createPersistStorage(),
      skipHydration: true,
      partialize: (state) => ({
        businessId: state.businessId,
        businesses: state.businesses,
        snapshots: state.snapshots,
        markedFixed: state.markedFixed,
        verifiedFixes: state.verifiedFixes,
        repliedReviews: state.repliedReviews,
        checkLog: state.checkLog,
      }),
    },
  ),
);
