import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRoot } from '@/components/shell/AppRoot';
import { useBootstrap } from '@/hooks/useBootstrap';

// Lets the static HTML render before the real screen size and insets are known.
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export default function RootLayout() {
  useBootstrap();

  return (
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <AppRoot>
        <StatusBar style="auto" />
        <Slot />
      </AppRoot>
    </SafeAreaProvider>
  );
}
