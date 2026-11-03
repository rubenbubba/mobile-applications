import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { Toast } from '@/components/primitives';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSnapshotLoader } from '@/hooks/useOverview';
import { useToastStore } from '@/state/useToastStore';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { AppNav } from './AppNav';

const BAR_HEIGHT = 60;

// Off by default on web, which leaves inactive tabs reachable by keyboard and screen readers.
enableScreens(true);

function GlobalToast({ bottomOffset }: { bottomOffset: number }) {
  const toast = useToastStore((state) => state.toast);

  return (
    <Toast
      visible={toast !== undefined}
      message={toast?.message ?? ''}
      variant={toast?.variant}
      actionLabel={toast?.actionLabel}
      onAction={toast?.onAction}
      bottomOffset={bottomOffset}
    />
  );
}

export function AppTabs() {
  const { colors } = useTheme();
  const { isWide } = useBreakpoint();
  const insets = useSafeAreaInsets();
  useSnapshotLoader();

  return (
    <View style={styles.base}>
      <Tabs
        backBehavior="history"
        tabBar={() => <AppNav isWide={isWide} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: isWide ? 'left' : 'bottom',
          sceneStyle: { backgroundColor: colors.background },
        }}
      />
      <GlobalToast bottomOffset={isWide ? spacing.lg : BAR_HEIGHT + insets.bottom + spacing.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
