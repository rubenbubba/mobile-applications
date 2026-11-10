// "Delete my account" (GDPR, chapter 23). Deleting the user removes all their data through "on delete cascade".
// Only the server may delete users, so this runs with the service role for the signed-in caller only.
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, getCaller } from '../_shared/clients.ts';
import { json, preflight } from '../_shared/http.ts';

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const caller = await getCaller(req);
  if (!caller) return json({ error: 'Sign in first.' }, 401);

  const { error } = await adminClient().auth.admin.deleteUser(caller.user.id);
  if (error) {
    console.error('delete-account failed', error);
    return json({ error: 'Your account could not be deleted. Try again later.' }, 500);
  }

  return json({ ok: true });
});
