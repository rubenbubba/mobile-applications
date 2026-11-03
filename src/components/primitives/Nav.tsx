import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing } from '../../theme/tokens';

interface NavProps {
  children: React.ReactNode;
  orientation?: 'bar' | 'side';
  bottomInset?: number;
  topInset?: number;
}

export function Nav({ children, orientation = 'bar', bottomInset = 0, topInset = 0 }: NavProps) {
  const { colors } = useTheme();
  const isBar = orientation === 'bar';

  return (
    <View
      role="navigation"
      style={[
        isBar ? styles.bar : styles.side,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isBar ? { paddingBottom: bottomInset } : { paddingTop: spacing.xl + topInset },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  side: {
    flexDirection: 'column',
    width: 232,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
});
