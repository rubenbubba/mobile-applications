import type { ReachabilityResult } from '../types/Monitoring';

const TIMEOUT_MS = 10000;

// A real request from this device. no-cors hides the response, so we learn that the server
// answered and how fast, but not its status code. A server error page still counts as a response.
export async function checkReachability(url: string): Promise<ReachabilityResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  const finish = (outcome: ReachabilityResult['outcome']): ReachabilityResult => ({
    url,
    outcome,
    durationMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
  });

  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return finish('responded');
  } catch {
    return finish(controller.signal.aborted ? 'timed-out' : 'no-response');
  } finally {
    clearTimeout(timeout);
  }
}
