import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '../types/User';

// Real accounts go through Supabase Auth when the app has its keys (see README).
// The demo account never leaves the device, so the app can be tried without signing up.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_DELAY_MS = 400;
export const MIN_PASSWORD_LENGTH = 8;

export const DEMO_EMAIL = 'demo@vitrine.example';
export const DEMO_PASSWORD = 'demo-account';

export const accountsEnabled = isSupabaseConfigured;

export interface RegisterResult {
  user?: User;
  needsEmailConfirmation: boolean;
}

function toUser(user: SupabaseUser): User {
  const email = user.email ?? '';
  return { id: user.id, email, name: email.split('@')[0] ?? email, mode: 'live' };
}

// Supabase's messages are written for developers. These are the ones a user can act on.
function friendlyError(message: string): Error {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return new Error("That email address and password don't match.");
  if (lower.includes('email not confirmed')) return new Error('Confirm your email address first. Check your inbox for the link.');
  if (lower.includes('already registered')) return new Error('There is already an account with this email address. Log in instead.');
  if (lower.includes('rate limit') || lower.includes('too many')) return new Error('Too many attempts. Wait a minute and try again.');
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('json')) {
    return new Error("Can't reach the server. Check your connection and try again.");
  }
  return new Error(message);
}

function assertEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email.trim())) throw new Error('Enter a valid email address.');
}

function assertPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

// Where links in emails should open: this web app, or the native app through its scheme.
function appUrl(path: string): string | undefined {
  if (Platform.OS === 'web') return typeof window === 'undefined' ? undefined : `${window.location.origin}${path}`;
  return `vitrine://${path.replace(/^\//, '')}`;
}

export async function loginDemo(): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));
  return { id: 'demo-user', email: DEMO_EMAIL, name: 'Demo account', mode: 'demo' };
}

export async function login(email: string, password: string): Promise<User> {
  if (!accountsEnabled) {
    // Without accounts, any valid email and password opens the demo.
    if (!EMAIL_PATTERN.test(email.trim()) || password === '') {
      throw new Error('Enter a valid email address and a password.');
    }
    await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));
    return { id: 'demo-user', email: email.trim(), name: 'Demo account', mode: 'demo' };
  }

  assertEmail(email);
  if (password === '') throw new Error('Enter your password.');

  const { data, error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw friendlyError(error.message);
  return toUser(data.user);
}

export async function register(email: string, password: string): Promise<RegisterResult> {
  assertEmail(email);
  assertPassword(password);

  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: appUrl('/login') },
  });
  if (error) throw friendlyError(error.message);

  // With email confirmation on, Supabase returns a user without a session until the link is clicked.
  if (data.session !== null && data.user !== null) {
    return { user: toUser(data.user), needsEmailConfirmation: false };
  }
  return { needsEmailConfirmation: true };
}

export async function requestPasswordReset(email: string): Promise<void> {
  assertEmail(email);
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: appUrl('/reset-password'),
  });
  if (error) throw friendlyError(error.message);
}

export async function updatePassword(password: string): Promise<User> {
  assertPassword(password);
  const { data, error } = await getSupabase().auth.updateUser({ password });
  if (error) throw friendlyError(error.message);
  return toUser(data.user);
}

// The signed-in account according to Supabase, for example after a restart or an email link.
export async function restoreSession(): Promise<User | undefined> {
  if (!accountsEnabled) return undefined;
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user !== undefined ? toUser(data.session.user) : undefined;
}

export type AuthEvent = 'signed-in' | 'signed-out' | 'password-recovery';

export function subscribeToAuth(onChange: (event: AuthEvent, user?: User) => void): () => void {
  if (!accountsEnabled) return () => {};

  const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') onChange('password-recovery', session?.user !== undefined ? toUser(session.user) : undefined);
    else if (event === 'SIGNED_OUT') onChange('signed-out');
    else if (session?.user !== undefined) onChange('signed-in', toUser(session.user));
  });
  return () => data.subscription.unsubscribe();
}

export async function logout(user?: User): Promise<void> {
  if (user?.mode !== 'live') return;
  // Signing out locally always works, also offline. The server session then simply expires.
  await getSupabase().auth.signOut({ scope: 'local' });
}

// Deletes the account and, through the database's cascade rules, every row that belongs to it.
export async function deleteAccount(): Promise<void> {
  const { error } = await getSupabase().functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new Error('Your account could not be deleted. Check your connection and try again.');
  await getSupabase().auth.signOut({ scope: 'local' });
}
