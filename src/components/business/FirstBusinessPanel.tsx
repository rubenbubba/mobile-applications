import { router } from 'expo-router';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { StyledButton } from '@/components/StyledButton';
import { useAuthStore } from '@/state/useAuthStore';
import { useMonitoringStore } from '@/state/useMonitoringStore';
import { AddBusinessForm } from './AddBusinessForm';

// The empty state for a new account: nothing to show until there is a business to check.
export function FirstBusinessPanel() {
  const logout = useAuthStore((state) => state.logout);
  const clearAccountData = useMonitoringStore((state) => state.clearAccountData);
  const runCheck = useMonitoringStore((state) => state.runCheck);

  return (
    <AuthLayout
      title="Add your business"
      subtitle="Tell us which website to keep an eye on. You can add more later in Settings."
      footer={
        <StyledButton
          label="Log out"
          variant="ghost"
          onPress={async () => {
            await logout();
            clearAccountData();
            router.replace('/login');
          }}
          testID="first-business-logout"
        />
      }
      testID="screen-first-business"
    >
      <AddBusinessForm
        onAdded={() => {
          // The first full check takes up to a minute. The dashboard shows "Not checked yet" until it is done.
          void runCheck().catch(() => undefined);
        }}
      />
    </AuthLayout>
  );
}
