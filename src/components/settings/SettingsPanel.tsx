import { useState } from 'react';
import { router } from 'expo-router';
import { Badge, Divider, Expandable, Radio, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { AddBusinessForm } from '@/components/business/AddBusinessForm';
import { SourceBadge } from '@/components/shared/Badges';
import { SectionCard } from '@/components/shared/SectionCard';
import { useIsLiveAccount } from '@/hooks/useAccount';
import { useCurrentBusiness } from '@/hooks/useBusiness';
import { describeBusiness } from '@/logic/business';
import { downloadMyData } from '@/services/privacyService';
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

interface DataSourceRow {
  name: string;
  detail: string;
  source?: DataSource;
}

const DEMO_SOURCES: DataSourceRow[] = [
  { name: 'Website monitoring', detail: 'Sample results. A real check needs a server to run around the clock.', source: 'demo' },
  { name: 'Google reviews', detail: 'Sample reviews. Real reviews need a connected Google Business Profile.', source: 'demo' },
  { name: 'Search and speed checks', detail: 'Sample results. Real results need Google PageSpeed through a server.', source: 'demo' },
  { name: '"Test a website now"', detail: 'A real test from this device, on the Website screen.', source: 'live' },
];

const LIVE_SOURCES: DataSourceRow[] = [
  { name: 'Website monitoring', detail: 'Our server checks your website every 10 minutes, also when the app is closed.', source: 'live' },
  { name: 'Search and speed checks', detail: 'Your pages and Google PageSpeed, each time you run a check.', source: 'live' },
  { name: 'Google reviews', detail: 'Not connected yet. This needs access to your Google Business Profile.' },
  { name: '"Test a website now"', detail: 'A real test from our server, on the Website screen.', source: 'live' },
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

function BusinessSection() {
  const isLive = useIsLiveAccount();
  const businesses = useMonitoringStore((state) => state.businesses);
  const businessId = useMonitoringStore((state) => state.businessId);
  const selectBusiness = useMonitoringStore((state) => state.selectBusiness);
  const removeBusiness = useMonitoringStore((state) => state.removeBusiness);
  const current = useCurrentBusiness();
  const showToast = useToastStore((state) => state.showToast);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);

  return (
    <SectionCard
      title={isLive ? 'Your businesses' : 'Business'}
      description={isLive ? undefined : 'These sample businesses are fictional. Each one shows a different situation.'}
      testID="settings-business"
    >
      <Stack gap="md">
        <Stack role="radiogroup">
          {businesses.map((business) => (
            <Radio
              key={business.id}
              label={business.name}
              description={describeBusiness(business)}
              value={business.id}
              selected={business.id === businessId}
              onSelect={selectBusiness}
              testID={`business-${business.id}`}
            />
          ))}
        </Stack>

        {isLive && (
          <>
            <Expandable title="Add a business" testID="settings-add-business">
              <AddBusinessForm onAdded={() => showToast({ message: 'Business added. Run a check to see its results.', variant: 'success' })} />
            </Expandable>

            {current !== undefined &&
              (isConfirmingRemove ? (
                <Stack gap="sm" testID="remove-business-confirm">
                  <Text>Remove {current.name}? Its check results are deleted too.</Text>
                  <Row gap="sm" wrap>
                    <StyledButton
                      label="Yes, remove"
                      variant="danger"
                      onPress={async () => {
                        setIsConfirmingRemove(false);
                        try {
                          await removeBusiness(current.id);
                          showToast({ message: `${current.name} was removed.`, variant: 'success' });
                        } catch (caught) {
                          showToast({ message: caught instanceof Error ? caught.message : 'Could not remove it.', variant: 'error' });
                        }
                      }}
                      testID="remove-business-yes"
                    />
                    <StyledButton label="Keep it" variant="secondary" onPress={() => setIsConfirmingRemove(false)} />
                  </Row>
                </Stack>
              ) : (
                <StyledButton
                  label={`Remove ${current.name}`}
                  variant="ghost"
                  icon="trash-outline"
                  onPress={() => setIsConfirmingRemove(true)}
                  testID="remove-business"
                />
              ))}
          </>
        )}
      </Stack>
    </SectionCard>
  );
}

function PrivacySection() {
  const isLive = useIsLiveAccount();
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const clearAccountData = useMonitoringStore((state) => state.clearAccountData);
  const resetDemo = useMonitoringStore((state) => state.resetDemo);
  const showToast = useToastStore((state) => state.showToast);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <SectionCard title="Privacy" description="See what we store, take a copy, or delete it." testID="settings-privacy">
      <Stack gap="sm">
        <StyledButton
          label="Privacy policy"
          variant="secondary"
          icon="shield-checkmark-outline"
          onPress={() => router.push('/privacy')}
          testID="privacy-link"
        />
        <StyledButton
          label="Download my data"
          variant="secondary"
          icon="download-outline"
          onPress={async () => {
            try {
              await downloadMyData();
            } catch {
              showToast({ message: 'Your data could not be collected. Check your connection.', variant: 'error' });
            }
          }}
          testID="download-data"
        />
        {isConfirmingDelete ? (
          <Stack gap="sm" testID="delete-account-confirm">
            <Text>
              {isLive
                ? 'This deletes your account, your businesses and all their results. It cannot be undone.'
                : 'This deletes everything the demo saved on this device and logs you out.'}
            </Text>
            <Row gap="sm" wrap>
              <StyledButton
                label={isLive ? 'Yes, delete my account' : 'Yes, delete'}
                variant="danger"
                isLoading={isDeleting}
                onPress={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAccount();
                    if (isLive) clearAccountData();
                    else await resetDemo();
                    router.replace('/login');
                  } catch (caught) {
                    showToast({ message: caught instanceof Error ? caught.message : 'Could not delete.', variant: 'error' });
                  } finally {
                    setIsDeleting(false);
                    setIsConfirmingDelete(false);
                  }
                }}
                testID="delete-account-yes"
              />
              <StyledButton label="Cancel" variant="secondary" onPress={() => setIsConfirmingDelete(false)} />
            </Row>
          </Stack>
        ) : (
          <StyledButton
            label={isLive ? 'Delete my account' : 'Delete my data'}
            variant="ghost"
            icon="trash-outline"
            onPress={() => setIsConfirmingDelete(true)}
            testID="delete-account"
          />
        )}
      </Stack>
    </SectionCard>
  );
}

export function SettingsPanel() {
  const isLive = useIsLiveAccount();
  const resetDemo = useMonitoringStore((state) => state.resetDemo);
  const clearAccountData = useMonitoringStore((state) => state.clearAccountData);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const sources = isLive ? LIVE_SOURCES : DEMO_SOURCES;

  return (
    <Stack gap="lg">
      <BusinessSection />

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
          {sources.map((item, index) => (
            <Stack key={item.name} gap="sm">
              {index > 0 && <Divider />}
              <Row justify="space-between" align="flex-start" gap="md">
                <Stack flex={1}>
                  <Text weight="medium">{item.name}</Text>
                  <Text size="sm" tone="secondary">{item.detail}</Text>
                </Stack>
                {item.source !== undefined && <SourceBadge source={item.source} />}
              </Row>
            </Stack>
          ))}
        </Stack>
      </SectionCard>

      <PrivacySection />

      <SectionCard title="Account" description={user !== undefined ? `Signed in as ${user.email}` : undefined} testID="settings-account">
        <Stack gap="sm">
          {!isLive &&
            (isConfirmingReset ? (
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
            ))}
          <StyledButton
            label="Log out"
            variant="ghost"
            onPress={async () => {
              await logout();
              // A real account's results do not stay on a shared device.
              if (isLive) clearAccountData();
              router.replace('/login');
            }}
            testID="logout"
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
