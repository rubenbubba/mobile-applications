import { useColorScheme } from 'react-native';
import { useBootStore } from '../state/useBootStore';
import { useSettingsStore } from '../state/useSettingsStore';
import { darkTheme, lightTheme, type Theme } from './tokens';

// Stays light until the client has hydrated, because statically rendered HTML is always light.
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const isReady = useBootStore((state) => state.isReady);

  const prefersDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  return isReady && prefersDark ? darkTheme : lightTheme;
}
