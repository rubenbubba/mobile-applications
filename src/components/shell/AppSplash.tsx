import { StyleSheet, View } from 'react-native';
import { BrandMark } from './BrandMark';

// Shown in the static HTML and until saved state has been read, so nothing flashes.
export function AppSplash() {
  return (
    <View style={styles.base} testID="app-splash">
      <BrandMark size={56} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
