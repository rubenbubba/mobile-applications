// "Test a website now" for signed-in users: a request from the server, which (unlike the browser) can read the status code.
import '@supabase/functions-js/edge-runtime.d.ts';
import { getCaller } from '../_shared/clients.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { probe } from '../_shared/probe.ts';
import { parseSafeUrl } from '../_shared/safeUrl.ts';

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: 'Sign in first.' }, 401);

  const { url } = await readJson(req);
  const safeUrl = parseSafeUrl(url);
  if (!safeUrl) return json({ error: 'Enter the address of a public website.' }, 400);

  const result = await probe(safeUrl.toString(), { timeoutMs: 10000 });

  return json({
    url: safeUrl.toString(),
    outcome: result.statusCode > 0 ? 'responded' : result.timedOut ? 'timed-out' : 'no-response',
    statusCode: result.statusCode > 0 ? result.statusCode : undefined,
    durationMs: result.responseTimeMs,
    checkedAt: new Date().toISOString(),
  });
});
