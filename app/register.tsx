import { Redirect } from 'expo-router';
import { RegisterPanel } from '@/components/auth/RegisterPanel';
import { AppSplash } from '@/components/shell/AppSplash';
import { useAuthStore } from '@/state/useAuthStore';
import { useBootStore } from '@/state/useBootStore';

export default function RegisterScreen() {
  const isReady = useBootStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isReady) return <AppSplash />;
  if (isAuthenticated) return <Redirect href="/" />;

  return <RegisterPanel />;
}
