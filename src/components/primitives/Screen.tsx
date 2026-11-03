import { ScrollView, View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  padding?: SpaceKey;
  scrollable?: boolean;
  maxWidth?: number;
  topInset?: number;
  testID?: string;
}

export function Screen({
  children,
  padding = 'md',
  scrollable = true,
  maxWidth,
  topInset = 0,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const paddingStyle: ViewStyle = { padding: spacing[padding], paddingTop: spacing[padding] + topInset };
  const widthStyle: ViewStyle = maxWidth !== undefined ? { maxWidth, width: '100%', alignSelf: 'center' } : {};

  if (!scrollable) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, paddingStyle]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, paddingStyle, widthStyle]}
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { flex: 1 },
  content: { flexGrow: 1 },
});
