import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Screen, Stack, Text, Touchable } from '@/components/primitives';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatDateTime } from '@/logic/format';
import { getBusiness } from '@/services/monitoringService';
import { applyUpdate } from '@/services/pwaService';
import { useMonitoringStore } from '@/state/useMonitoringStore';
import { usePwaStore } from '@/state/usePwaStore';
import { CONTENT_MAX_WIDTH } from '@/theme/tokens';

function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const fetchedAt = useMonitoringStore((state) => state.snapshots[state.businessId]?.fetchedAt);

  if (isOnline) return null;

  return (
    <Banner
      tone="warning"
      icon="cloud-offline"
      message={
        fetchedAt !== undefined
          ? `You're offline. Showing results from ${formatDateTime(fetchedAt)}.`
          : "You're offline. Results will load when you're back online."
      }
      testID="offline-banner"
    />
  );
}

function UpdateBanner() {
  const updateAvailable = usePwaStore((state) => state.updateAvailable);

  if (!updateAvailable) return null;

  return (
    <Banner
      icon="arrow-up-circle"
      message="A new version of the app is ready."
      action={
        <Touchable onPress={applyUpdate} hoverColor="transparent" testID="apply-update">
          <Text size="sm" weight="bold" tone="accent">Reload</Text>
        </Touchable>
      }
      testID="update-banner"
    />
  );
}

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
  showBusiness?: boolean;
  description?: string;
  subNav?: React.ReactNode;
  leading?: React.ReactNode;
  testID: string;
}

export function PageLayout({ title, children, showBusiness = true, description, subNav, leading, testID }: PageLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const businessId = useMonitoringStore((state) => state.businessId);

  return (
    <Screen padding={isWide ? 'xxl' : 'lg'} maxWidth={CONTENT_MAX_WIDTH} topInset={insets.top} testID={testID}>
      <Stack gap="lg">
        <OfflineBanner />
        <UpdateBanner />
        {leading}
        <Stack gap="xs">
          {showBusiness && <Text size="sm" tone="muted">{getBusiness(businessId).name}</Text>}
          {title !== undefined && <Text size="xxl" weight="bold" heading={1}>{title}</Text>}
          {description !== undefined && <Text tone="secondary">{description}</Text>}
        </Stack>
        {subNav}
        {children}
      </Stack>
    </Screen>
  );
}
