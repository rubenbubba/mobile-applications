import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, EmptyState, InputField, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { useAccountsEnabled } from '@/hooks/useAccount';
import { MIN_PASSWORD_LENGTH } from '@/services/authService';
import { useAuthStore } from '@/state/useAuthStore';
import { AuthLayout } from './AuthLayout';

export function AccountsUnavailable({ testID }: { testID: string }) {
  return (
    <AuthLayout subtitle="Accounts are not available in this version." testID={testID}>
      <EmptyState
        icon="flask-outline"
        title="This version runs on demo data"
        description="You can explore everything with the demo account."
        action={<StyledButton label="Back to log in" variant="secondary" onPress={() => router.replace('/login')} />}
      />
    </AuthLayout>
  );
}

export function RegisterPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | undefined>();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const accountsEnabled = useAccountsEnabled();

  if (!accountsEnabled) return <AccountsUnavailable testID="screen-register" />;

  const submit = async () => {
    setError(undefined);
    try {
      const { needsEmailConfirmation } = await register(email, password);
      if (needsEmailConfirmation) setSentTo(email.trim());
      else router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your account could not be created. Try again.');
    }
  };

  const footer = (
    <StyledButton label="I already have an account" variant="ghost" onPress={() => router.replace('/login')} testID="to-login" />
  );

  if (sentTo !== undefined) {
    return (
      <AuthLayout title="Check your inbox" subtitle="One more step." footer={footer} testID="screen-register">
        <Banner
          tone="healthy"
          icon="mail-outline"
          message={`We sent a link to ${sentTo}. Open it on this device to finish creating your account.`}
          testID="register-check-inbox"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Keep an eye on your own business." footer={footer} testID="screen-register">
      <Stack gap="lg">
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          testID="register-email"
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          onSubmitEditing={submit}
          error={error}
          testID="register-password"
        />
        <Stack gap="xs">
          <Text size="sm" tone="secondary">
            We store your email address, your businesses and their check results in the EU, and nothing else.
          </Text>
          <StyledButton
            label="Read the privacy policy"
            variant="ghost"
            compact
            icon="shield-checkmark-outline"
            onPress={() => router.push({ pathname: '/privacy', params: { from: 'register' } })}
            testID="register-privacy"
          />
        </Stack>
        <StyledButton label="Create account" onPress={submit} isLoading={isLoading} testID="register-button" />
      </Stack>
    </AuthLayout>
  );
}
