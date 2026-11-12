import { ResetPasswordPanel } from '@/components/auth/PasswordPanels';
import { AppSplash } from '@/components/shell/AppSplash';
import { useBootStore } from '@/state/useBootStore';

// Opened from the password-reset email. Supabase reads the one-time session from the address while the app starts.
export default function ResetPasswordScreen() {
  const isReady = useBootStore((state) => state.isReady);

  if (!isReady) return <AppSplash />;

  return <ResetPasswordPanel />;
}
