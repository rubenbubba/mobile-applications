// Builds the PWA in demo mode, ignoring .env, so the main test suite always tests the demo
// even on a machine where .env holds real Supabase keys.
// Run with: npm run build:web:demo
const { execSync } = require('child_process');

const env = { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' };

// --clear: Expo writes EXPO_PUBLIC_* values into the bundle, and a cached build would keep the old ones.
execSync('npx expo export -p web --clear', { stdio: 'inherit', env });
execSync('node scripts/inject-precache.js', { stdio: 'inherit', env });
