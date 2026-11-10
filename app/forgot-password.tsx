import { Redirect } from 'expo-router';
import { ForgotPasswordPanel } from '@/components/auth/PasswordPanels';
import { AppSplash } from '@/components/shell/AppSplash';
import { useAuthStore } from '@/state/useAuthStore';
import { useBootStore } from '@/state/useBootStore';

export default function ForgotPasswordScreen() {
  const isReady = useBootStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isReady) return <AppSplash />;
  if (isAuthenticated) return <Redirect href="/" />;

  return <ForgotPasswordPanel />;
}
