// Builds the PWA with fake Supabase keys, so the account screens can be tested without a real project.
// cypress/live/accounts.cy.ts answers every request to https://stub.supabase.co itself.
// Run with: npm run test:accounts (builds into dist/; run npm run build:web afterwards for the normal build).
const { execSync } = require('child_process');

const env = {
  ...process.env,
  EXPO_PUBLIC_SUPABASE_URL: 'https://stub.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'stub-anon-key',
};

// --clear: Expo writes EXPO_PUBLIC_* values into the bundle, and a cached build would keep the old ones.
execSync('npx expo export -p web --clear', { stdio: 'inherit', env });
execSync('node scripts/inject-precache.js', { stdio: 'inherit', env });
