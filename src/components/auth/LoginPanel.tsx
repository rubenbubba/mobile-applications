import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Banner, Card, InputField, Screen, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { APP_NAME, BrandMark } from '@/components/shell/BrandMark';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/services/authService';
import { useAuthStore } from '@/state/useAuthStore';

export function LoginPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const submit = async (submittedEmail: string, submittedPassword: string) => {
    setError(undefined);
    try {
      await login(submittedEmail, submittedPassword);
      router.replace('/');
    } catch {
      setError('Enter a valid email address and a password.');
    }
  };

  return (
    <Screen padding="lg" testID="screen-login">
      <View style={styles.center}>
        <View style={styles.column}>
          <Stack gap="xl">
            <Stack gap="md" align="center">
              <BrandMark size={56} />
              <Stack gap="xs">
                <Text size="xxl" weight="bold" align="center" heading={1}>{APP_NAME}</Text>
                <Text tone="secondary" align="center">See how your business is doing online, in one place.</Text>
              </Stack>
            </Stack>

            <Card padding="xl">
              <Stack gap="lg">
                <Banner
                  icon="flask-outline"
                  message="Demo mode. Nothing you type here is sent anywhere."
                  testID="demo-mode-note"
                />
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
                  onSubmitEditing={() => submit(email, password)}
                  testID="password-input"
                  error={error}
                />
                <Stack gap="sm">
                  <StyledButton
                    label="Log in"
                    onPress={() => submit(email, password)}
                    isLoading={isLoading}
                    testID="login-button"
                  />
                  <StyledButton
                    label="Use the demo account"
                    variant="ghost"
                    onPress={() => submit(DEMO_EMAIL, DEMO_PASSWORD)}
                    disabled={isLoading}
                    testID="demo-login-button"
                  />
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  column: { width: '100%', maxWidth: 420 },
});
