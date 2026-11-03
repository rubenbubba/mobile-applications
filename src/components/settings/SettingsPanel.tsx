import { useState } from 'react';
import { router } from 'expo-router';
import { Badge, Divider, Radio, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { SourceBadge } from '@/components/shared/Badges';
import { SectionCard } from '@/components/shared/SectionCard';
import { listBusinesses } from '@/services/monitoringService';
import { promptInstall } from '@/services/pwaService';
import { useAuthStore } from '@/state/useAuthStore';
import { useMonitoringStore } from '@/state/useMonitoringStore';
import { usePwaStore } from '@/state/usePwaStore';
import { useSettingsStore, type ThemeMode } from '@/state/useSettingsStore';
import { useToastStore } from '@/state/useToastStore';
import type { DataSource } from '@/types/Monitoring';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Same as this device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const DATA_SOURCES: { name: string; detail: string; source: DataSource }[] = [
  { name: 'Website monitoring', detail: 'Sample results. A real check needs a server to run around the clock.', source: 'demo' },
  { name: 'Google reviews', detail: 'Sample reviews. Real reviews need a connected Google Business Profile.', source: 'demo' },
  { name: 'Search and speed checks', detail: 'Sample results. Real results need Google PageSpeed through a server.', source: 'demo' },
  { name: '"Test a website now"', detail: 'A real test from this device, on the Website screen.', source: 'live' },
];

function isThemeMode(value: string): value is ThemeMode {
  return THEME_OPTIONS.some((option) => option.value === value);
}

function InstallSection() {
  const installState = usePwaStore((state) => state.installState);
  const setInstallState = usePwaStore((state) => state.setInstallState);

  if (installState === 'installed') {
    return <Badge label="Installed on this device" variant="success" icon="checkmark-circle" testID="install-installed" />;
  }

  if (installState === 'ios-instructions') {
    return <Text tone="secondary" testID="install-ios">In Safari, tap the Share button, then choose "Add to Home Screen".</Text>;
  }

  if (installState === 'available') {
    return (
      <StyledButton
        label="Install the app"
        icon="download-outline"
        onPress={async () => {
          if (await promptInstall()) setInstallState('installed');
        }}
        testID="install-button"
      />
    );
  }

  return (
    <Text tone="secondary" testID="install-unavailable">
      Your browser has not offered installation yet. In Chrome or Edge, look for the install icon in the address bar or
      the option in the browser menu.
    </Text>
  );
}

export function SettingsPanel() {
  const businessId = useMonitoringStore((state) => state.businessId);
  const selectBusiness = useMonitoringStore((state) => state.selectBusiness);
  const resetDemo = useMonitoringStore((state) => state.resetDemo);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  return (
    <Stack gap="lg">
      <SectionCard title="Business" description="These sample businesses are fictional. Each one shows a different situation." testID="settings-business">
        <Stack role="radiogroup">
          {listBusinesses().map((business) => (
            <Radio
              key={business.id}
              label={business.name}
              description={`${business.category} in ${business.city}`}
              value={business.id}
              selected={business.id === businessId}
              onSelect={selectBusiness}
              testID={`business-${business.id}`}
            />
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Appearance" testID="settings-theme">
        <Stack role="radiogroup">
          {THEME_OPTIONS.map((option) => (
            <Radio
              key={option.value}
              label={option.label}
              value={option.value}
              selected={option.value === themeMode}
              onSelect={(value) => {
                if (isThemeMode(value)) setThemeMode(value);
              }}
              testID={`theme-${option.value}`}
            />
          ))}
        </Stack>
      </SectionCard>

      <SectionCard
        title="Use it like an app"
        description="Install Vitrine for quick access. Your last results stay available when you are offline."
        testID="settings-install"
      >
        <InstallSection />
      </SectionCard>

      <SectionCard title="Where your data comes from" testID="settings-sources">
        <Stack gap="sm">
          {DATA_SOURCES.map((item, index) => (
            <Stack key={item.name} gap="sm">
              {index > 0 && <Divider />}
              <Row justify="space-between" align="flex-start" gap="md">
                <Stack flex={1}>
                  <Text weight="medium">{item.name}</Text>
                  <Text size="sm" tone="secondary">{item.detail}</Text>
                </Stack>
                <SourceBadge source={item.source} />
              </Row>
            </Stack>
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Account" description={user !== undefined ? `Signed in as ${user.email}` : undefined} testID="settings-account">
        <Stack gap="sm">
          {isConfirmingReset ? (
            <Stack gap="sm" testID="reset-confirm">
              <Text>This clears your fixes, replies and check history for all sample businesses.</Text>
              <Row gap="sm" wrap>
                <StyledButton
                  label="Yes, reset"
                  variant="danger"
                  onPress={async () => {
                    setIsConfirmingReset(false);
                    await resetDemo();
                    showToast({ message: 'Demo data has been reset.', variant: 'success' });
                  }}
                  testID="reset-confirm-yes"
                />
                <StyledButton label="Keep my data" variant="secondary" onPress={() => setIsConfirmingReset(false)} />
              </Row>
            </Stack>
          ) : (
            <StyledButton label="Reset demo data" variant="secondary" onPress={() => setIsConfirmingReset(true)} testID="reset-demo" />
          )}
          <StyledButton
            label="Log out"
            variant="ghost"
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            testID="logout"
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
