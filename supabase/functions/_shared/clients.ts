import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Supabase provides these to every function. New projects use the *_KEYS JSON variables, older ones the single keys.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

function firstKey(name: string): string | undefined {
  try {
    // Supabase sets these variables to a JSON object of key names and values.
    const keys = JSON.parse(Deno.env.get(name) ?? '{}') as Record<string, string>;
    return Object.values(keys)[0];
  } catch {
    return undefined;
  }
}

const publicKey = Deno.env.get('SUPABASE_ANON_KEY') ?? firstKey('SUPABASE_PUBLISHABLE_KEYS') ?? '';
const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? firstKey('SUPABASE_SECRET_KEYS') ?? '';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

// Bypasses row level security. Only used for writes the user may not do themselves (check results, deleting the account).
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, secretKey, noSession);
}

export interface Caller {
  user: User;
  // Acts as the user, so row level security decides what they can read.
  client: SupabaseClient;
}

// The signed-in user behind this request, or undefined when the token is missing or invalid.
export async function getCaller(req: Request): Promise<Caller | undefined> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (token === '' || token === publicKey) return undefined;

  const client = createClient(SUPABASE_URL, publicKey, { ...noSession, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || data.user === null) return undefined;
  return { user: data.user, client };
}
