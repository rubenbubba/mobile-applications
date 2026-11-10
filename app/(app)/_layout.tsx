import { Redirect } from 'expo-router';
import { FirstBusinessPanel } from '@/components/business/FirstBusinessPanel';
import { AppSplash } from '@/components/shell/AppSplash';
import { AppTabs } from '@/components/shell/AppTabs';
import { useBusinessLoader } from '@/hooks/useBusiness';
import { useAuthStore } from '@/state/useAuthStore';
import { useBootStore } from '@/state/useBootStore';
import { useMonitoringStore } from '@/state/useMonitoringStore';

export default function AppLayout() {
  const isReady = useBootStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLive = useAuthStore((state) => state.user?.mode === 'live');
  const hasNoBusiness = useMonitoringStore((state) => state.businessesLoaded && state.businesses.length === 0);
  useBusinessLoader();

  if (!isReady) return <AppSplash />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (isLive && hasNoBusiness) return <FirstBusinessPanel />;

  return <AppTabs />;
}
