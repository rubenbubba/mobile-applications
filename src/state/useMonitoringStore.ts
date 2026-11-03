import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { detectedIssueIds, issueTitle } from '../logic/issueRules';
import { overallForSections } from '../logic/scoring';
import {
  defaultBusinessId,
  fetchSnapshot,
  runCheck as runCheckService,
} from '../services/monitoringService';
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
  snapshots: Record<string, MonitoringSnapshot>;
  markedFixed: Record<string, IssueId[]>;
  verifiedFixes: Record<string, IssueId[]>;
  repliedReviews: Record<string, string[]>;
  checkLog: Record<string, ChangeEntry[]>;
  isLoading: boolean;
  isChecking: boolean;
  errorMessage?: string;
  load: () => Promise<void>;
  runCheck: () => Promise<CheckResult>;
  selectBusiness: (businessId: string) => void;
  markFixed: (id: IssueId) => void;
  undoMarkFixed: (id: IssueId) => void;
  markReviewReplied: (reviewId: string) => void;
  resetDemo: () => Promise<void>;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while loading your results.';
}

export const useMonitoringStore = create<MonitoringState>()(
  persist(
    (set, get) => ({
      businessId: defaultBusinessId,
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
        set({ isLoading: true, errorMessage: undefined });

        try {
          const snapshot = await fetchSnapshot(businessId, {
            verifiedFixes: verifiedFixes[businessId] ?? [],
            repliedReviewIds: repliedReviews[businessId] ?? [],
          });
          set((state) => ({
            snapshots: { ...state.snapshots, [businessId]: snapshot },
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, errorMessage: errorText(error) });
        }
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

      markFixed: (id) =>
        set((state) => ({
          markedFixed: {
            ...state.markedFixed,
            [state.businessId]: [...(state.markedFixed[state.businessId] ?? []), id],
          },
        })),

      undoMarkFixed: (id) =>
        set((state) => ({
          markedFixed: {
            ...state.markedFixed,
            [state.businessId]: (state.markedFixed[state.businessId] ?? []).filter((item) => item !== id),
          },
        })),

      markReviewReplied: (reviewId) =>
        set((state) => ({
          repliedReviews: {
            ...state.repliedReviews,
            [state.businessId]: [...(state.repliedReviews[state.businessId] ?? []), reviewId],
          },
        })),

      resetDemo: async () => {
        set({
          snapshots: {},
          markedFixed: {},
          verifiedFixes: {},
          repliedReviews: {},
          checkLog: {},
          errorMessage: undefined,
        });
        await get().load();
      },
    }),
    {
      name: 'vitrine-monitoring',
      storage: createPersistStorage(),
      skipHydration: true,
      partialize: (state) => ({
        businessId: state.businessId,
        snapshots: state.snapshots,
        markedFixed: state.markedFixed,
        verifiedFixes: state.verifiedFixes,
        repliedReviews: state.repliedReviews,
        checkLog: state.checkLog,
      }),
    },
  ),
);
