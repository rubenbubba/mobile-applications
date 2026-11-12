// Runs a full check of one business's website for its owner and saves the raw results.
// Called by the app's "Run new check" button. Needs a signed-in user who owns the business.
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, getCaller } from '../_shared/clients.ts';
import { json, preflight, readJson } from '../_shared/http.ts';
import { runFullCheck } from '../_shared/siteCheck.ts';

// PageSpeed has a daily quota, so checks closer together than this reuse the last result.
const MIN_INTERVAL_MS = 2 * 60 * 1000;

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: 'Sign in first.' }, 401);

  const { businessId } = await readJson(req);
  if (typeof businessId !== 'string') return json({ error: 'businessId is required.' }, 400);

  // Row level security: this only finds the business when the caller owns it.
  const { data: business } = await caller.client
    .from('businesses')
    .select('id, website_url, created_at')
    .eq('id', businessId)
    .maybeSingle();
  if (!business) return json({ error: 'Business not found.' }, 404);

  const admin = adminClient();

  const { data: latest } = await admin
    .from('check_snapshots')
    .select('checked_at')
    .eq('business_id', business.id)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest && Date.now() - new Date(latest.checked_at).getTime() < MIN_INTERVAL_MS) {
    return json({ ok: true, checkedAt: latest.checked_at, reused: true });
  }

  // When did the site last answer, and since when has it been down? Comes from the uptime monitor.
  const { data: lastUp } = await admin
    .from('uptime_checks')
    .select('checked_at')
    .eq('business_id', business.id)
    .eq('is_up', true)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  let firstDownQuery = admin
    .from('uptime_checks')
    .select('checked_at')
    .eq('business_id', business.id)
    .eq('is_up', false);
  if (lastUp) firstDownQuery = firstDownQuery.gt('checked_at', lastUp.checked_at);
  const { data: firstDown } = await firstDownQuery.order('checked_at', { ascending: true }).limit(1).maybeSingle();

  try {
    const result = await runFullCheck(business.website_url, {
      lastSuccess: lastUp?.checked_at ?? business.created_at,
      downSince: firstDown?.checked_at,
    });

    const { error: snapshotError } = await admin.from('check_snapshots').insert({
      business_id: business.id,
      checked_at: result.checkedAt,
      website: result.website,
      seo: result.seo ?? null,
      performance: result.performance ?? null,
    });
    if (snapshotError) throw snapshotError;

    await admin.from('uptime_checks').insert({
      business_id: business.id,
      checked_at: result.checkedAt,
      is_up: result.website.isUp,
      status_code: result.website.statusCode,
      response_time_ms: result.website.responseTimeMs,
    });

    return json({ ok: true, checkedAt: result.checkedAt });
  } catch (error) {
    console.error('run-check failed', error);
    return json({ error: 'The check could not be completed. Try again in a few minutes.' }, 500);
  }
});
