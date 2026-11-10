import { PrivacyPanel } from '@/components/privacy/PrivacyPanel';

// Reachable before signing up (linked from registration) and from Settings, as chapter 23 requires.
export default function PrivacyScreen() {
  return <PrivacyPanel />;
}
