// Checks that every business's website answers. pg_cron calls this every 10 minutes (see the migration),
// so monitoring keeps running while the app is closed. Protected by the CRON_SECRET header, not by a user login.
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient } from '../_shared/clients.ts';
import { json } from '../_shared/http.ts';
import { mapLimited, probe } from '../_shared/probe.ts';
import { parseSafeUrl } from '../_shared/safeUrl.ts';

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Not allowed.' }, 401);

  const admin = adminClient();
  const { data: businesses, error } = await admin.from('businesses').select('id, website_url');
  if (error) {
    console.error('uptime-monitor could not read businesses', error);
    return json({ error: 'Could not read businesses.' }, 500);
  }

  const checkedAt = new Date().toISOString();
  const rows = await mapLimited(businesses ?? [], 10, async (business) => {
    const url = parseSafeUrl(business.website_url);
    const result = url ? await probe(url.toString(), { timeoutMs: 15000 }) : undefined;
    return {
      business_id: business.id,
      checked_at: checkedAt,
      is_up: result?.isUp ?? false,
      status_code: result?.statusCode ?? 0,
      response_time_ms: result?.responseTimeMs ?? 0,
    };
  });

  if (rows.length > 0) {
    const { error: insertError } = await admin.from('uptime_checks').insert(rows);
    if (insertError) {
      console.error('uptime-monitor could not save results', insertError);
      return json({ error: 'Could not save results.' }, 500);
    }
  }

  return json({ checked: rows.length, down: rows.filter((row) => !row.is_up).length });
});
