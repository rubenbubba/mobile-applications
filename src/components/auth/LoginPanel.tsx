import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, Divider, InputField, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { useAccountsEnabled } from '@/hooks/useAccount';
import { useAuthStore } from '@/state/useAuthStore';
import { AuthLayout } from './AuthLayout';

export function LoginPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const login = useAuthStore((state) => state.login);
  const startDemo = useAuthStore((state) => state.startDemo);
  const isLoading = useAuthStore((state) => state.isLoading);
  const accountsEnabled = useAccountsEnabled();

  const submit = async () => {
    setError(undefined);
    try {
      await login(email, password);
      router.replace('/');
    } catch (caught) {
      // Without accounts any valid email works, so the only possible mistake is the format.
      setError(
        accountsEnabled && caught instanceof Error ? caught.message : 'Enter a valid email address and a password.',
      );
    }
  };

  const openDemo = async () => {
    setError(undefined);
    await startDemo();
    router.replace('/');
  };

  return (
    <AuthLayout subtitle="See how your business is doing online, in one place." testID="screen-login">
      <Stack gap="lg">
        {!accountsEnabled && (
          <Banner icon="flask-outline" message="Demo mode. Nothing you type here is sent anywhere." testID="demo-mode-note" />
        )}
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          testID="email-input"
        />
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={submit}
          testID="password-input"
          error={error}
        />
        <Stack gap="sm">
          <StyledButton label="Log in" onPress={submit} isLoading={isLoading} testID="login-button" />
          {accountsEnabled && (
            <Row justify="space-between" wrap>
              <StyledButton
                label="Forgot your password?"
                variant="ghost"
                compact
                onPress={() => router.push('/forgot-password')}
                testID="forgot-password-link"
              />
              <StyledButton
                label="Create an account"
                variant="ghost"
                compact
                onPress={() => router.push('/register')}
                testID="register-link"
              />
            </Row>
          )}
        </Stack>

        {accountsEnabled && <Divider />}

        <Stack gap="xs">
          <StyledButton
            label={accountsEnabled ? 'Explore with sample data' : 'Use the demo account'}
            variant={accountsEnabled ? 'secondary' : 'ghost'}
            icon={accountsEnabled ? 'flask-outline' : undefined}
            onPress={openDemo}
            disabled={isLoading}
            testID="demo-login-button"
          />
          {accountsEnabled && (
            <Text size="sm" tone="muted" align="center">
              Three fictional businesses. Nothing is saved to an account.
            </Text>
          )}
        </Stack>
      </Stack>
    </AuthLayout>
  );
}
