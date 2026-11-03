import { Redirect } from 'expo-router';
import { AppSplash } from '@/components/shell/AppSplash';
import { AppTabs } from '@/components/shell/AppTabs';
import { useAuthStore } from '@/state/useAuthStore';
import { useBootStore } from '@/state/useBootStore';

export default function AppLayout() {
  const isReady = useBootStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isReady) return <AppSplash />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return <AppTabs />;
}
