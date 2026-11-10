import { useState } from 'react';
import { router } from 'expo-router';
import { Banner, EmptyState, InputField, Stack } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { useAccountsEnabled } from '@/hooks/useAccount';
import { MIN_PASSWORD_LENGTH, requestPasswordReset } from '@/services/authService';
import { useAuthStore } from '@/state/useAuthStore';
import { AuthLayout } from './AuthLayout';
import { AccountsUnavailable } from './RegisterPanel';

const backToLogin = (
  <StyledButton label="Back to log in" variant="ghost" onPress={() => router.replace('/login')} testID="to-login" />
);

export function ForgotPasswordPanel() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const accountsEnabled = useAccountsEnabled();

  if (!accountsEnabled) return <AccountsUnavailable testID="screen-forgot-password" />;

  const submit = async () => {
    setError(undefined);
    setIsSending(true);
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The email could not be sent. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll email you a link to choose a new one." footer={backToLogin} testID="screen-forgot-password">
      {isSent ? (
        <Banner
          tone="healthy"
          icon="mail-outline"
          message={`If there is an account for ${email.trim()}, a link is on its way. Open it on this device.`}
          testID="reset-link-sent"
        />
      ) : (
        <Stack gap="lg">
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            onSubmitEditing={submit}
            error={error}
            testID="forgot-email"
          />
          <StyledButton label="Send the link" onPress={submit} isLoading={isSending} testID="forgot-button" />
        </Stack>
      )}
    </AuthLayout>
  );
}

// Opened from the link in the password-reset email. Supabase signs the user in from that link first.
export function ResetPasswordPanel() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasRecoverySession = useAuthStore((state) => state.user?.mode === 'live');
  const accountsEnabled = useAccountsEnabled();

  if (!accountsEnabled) return <AccountsUnavailable testID="screen-reset-password" />;

  if (!hasRecoverySession) {
    return (
      <AuthLayout title="Choose a new password" subtitle="This link has expired or was already used." footer={backToLogin} testID="screen-reset-password">
        <EmptyState
          icon="time-outline"
          title="Ask for a new link"
          description="Links in password emails work once, for a limited time."
          action={<StyledButton label="Send a new link" variant="secondary" onPress={() => router.replace('/forgot-password')} />}
          testID="reset-link-expired"
        />
      </AuthLayout>
    );
  }

  const submit = async () => {
    setError(undefined);
    try {
      await updatePassword(password);
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your password could not be changed. Try again.');
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="You'll use it the next time you log in." testID="screen-reset-password">
      <Stack gap="lg">
        <InputField
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          onSubmitEditing={submit}
          error={error}
          testID="new-password"
        />
        <StyledButton label="Save new password" onPress={submit} isLoading={isLoading} testID="save-password" />
      </Stack>
    </AuthLayout>
  );
}
