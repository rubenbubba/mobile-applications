import type { User } from '../types/User';

// Demo login that never leaves the device. Replace with Supabase Auth (see TODOS.md).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_DELAY_MS = 400;

export const DEMO_EMAIL = 'demo@vitrine.example';
export const DEMO_PASSWORD = 'demo-account';

export async function login(email: string, password: string): Promise<User> {
  if (!EMAIL_PATTERN.test(email.trim()) || password === '') {
    throw new Error('Enter a valid email address and a password.');
  }

  await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));

  return { id: 'demo-user', email: email.trim(), name: 'Demo account' };
}

export async function logout(): Promise<void> {
  return Promise.resolve();
}
