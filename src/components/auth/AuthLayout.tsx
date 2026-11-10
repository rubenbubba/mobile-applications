import { StyleSheet, View } from 'react-native';
import { Card, Screen, Stack, Text } from '@/components/primitives';
import { APP_NAME, BrandMark } from '@/components/shell/BrandMark';

interface AuthLayoutProps {
  title?: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID: string;
}

// The centred, single-column layout shared by log in, register and password screens.
export function AuthLayout({ title = APP_NAME, subtitle, children, footer, testID }: AuthLayoutProps) {
  return (
    <Screen padding="lg" testID={testID}>
      <View style={styles.center}>
        <View style={styles.column}>
          <Stack gap="xl">
            <Stack gap="md" align="center">
              <BrandMark size={56} />
              <Stack gap="xs">
                <Text size="xxl" weight="bold" align="center" heading={1}>{title}</Text>
                <Text tone="secondary" align="center">{subtitle}</Text>
              </Stack>
            </Stack>
            <Card padding="xl">{children}</Card>
            {footer}
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
