import './urlPolyfill';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { sessionStore } from '../services/sessionStore';

// Both values are public by design: the anon key only allows what row level security allows.
// Without them the app runs on demo data only, so a fresh clone works with no setup.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

let client: SupabaseClient | undefined;

// Created on first use, so the static web build (which renders pages in Node) never opens a connection.
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Accounts are not set up in this version of the app.');
  }

  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: sessionStore,
      autoRefreshToken: true,
      persistSession: true,
      // Links in sign-up and password-reset emails open the web app with the session in the address.
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  return client;
}
