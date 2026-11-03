import { useEffect } from 'react';
import Head from 'expo-router/head';
import { StyleSheet, View } from 'react-native';
import { setDocumentThemeColor } from '@/services/pwaService';
import { useBootStore } from '@/state/useBootStore';
import { useTheme } from '@/theme/useTheme';
import { APP_NAME } from './BrandMark';

export function AppRoot({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const isReady = useBootStore((state) => state.isReady);

  useEffect(() => {
    if (isReady) setDocumentThemeColor(colors.background);
  }, [colors.background, isReady]);

  return (
    <View style={[styles.base, isReady && { backgroundColor: colors.background }]}>
      <Head>
        <title>{APP_NAME}</title>
      </Head>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
