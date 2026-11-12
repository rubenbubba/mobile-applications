import { getSupabase } from '../lib/supabase';
import { isOnline, subscribeToConnectivity } from './connectivityService';
import { getDataMode } from './dataMode';
import { storageService } from './storageService';

// Offline-first for the owner's own actions (chapter 22): marking fixes and replies works without a connection.
// Each action is saved in a queue on the device, applied to the screen at once, and sent in order when online.
// Actions are idempotent (upsert/delete by key), so sending one twice is harmless.

const QUEUE_KEY = 'vitrine-sync-queue';

export type SyncAction =
  | { kind: 'issue'; businessId: string; issueId: string; status: 'marked' | 'verified' | 'open'; at: string }
  | { kind: 'review-replied'; businessId: string; reviewId: string; at: string };

let isFlushing = false;

function readQueue(): SyncAction[] {
  try {
    const parsed: unknown = JSON.parse(storageService.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SyncAction[]): void {
  if (queue.length === 0) storageService.removeItem(QUEUE_KEY);
  else storageService.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function send(action: SyncAction): Promise<void> {
  const supabase = getSupabase();

  if (action.kind === 'review-replied') {
    const { error } = await supabase
      .from('review_replies')
      .upsert({ business_id: action.businessId, review_id: action.reviewId, replied_at: action.at });
    if (error) throw error;
    return;
  }

  const { error } =
    action.status === 'open'
      ? await supabase.from('issue_progress').delete().eq('business_id', action.businessId).eq('issue_id', action.issueId)
      : await supabase
          .from('issue_progress')
          .upsert({ business_id: action.businessId, issue_id: action.issueId, status: action.status, updated_at: action.at });
  if (error) throw error;
}

export function pendingCount(businessId?: string): number {
  return readQueue().filter((action) => businessId === undefined || action.businessId === businessId).length;
}

// Sends what is waiting, oldest first. Stops at the first failure and tries again later, so the order is kept.
export async function flushQueue(): Promise<void> {
  if (isFlushing || getDataMode() !== 'live' || !isOnline()) return;
  isFlushing = true;

  try {
    let queue = readQueue();
    while (queue.length > 0) {
      const [next, ...rest] = queue;
      if (next === undefined) break;
      try {
        await send(next);
      } catch {
        return;
      }
      queue = rest;
      writeQueue(queue);
    }
  } finally {
    isFlushing = false;
  }
}

export function enqueue(action: SyncAction): void {
  if (getDataMode() !== 'live') return;
  writeQueue([...readQueue(), action]);
  void flushQueue();
}

export function clearQueue(): void {
  writeQueue([]);
}

// Started once at boot: sends the queue now and whenever the connection comes back.
export function startSync(): () => void {
  void flushQueue();
  return subscribeToConnectivity(() => {
    if (isOnline()) void flushQueue();
  });
}
