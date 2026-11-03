import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: SpaceKey;
}

export function Divider({ orientation = 'horizontal', spacing: space = 'none' }: DividerProps) {
  const { colors } = useTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        { backgroundColor: colors.border },
        isHorizontal ? { marginVertical: spacing[space] } : { marginHorizontal: spacing[space] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: { height: 1, width: '100%' },
  vertical: { width: 1, height: '100%' },
});
