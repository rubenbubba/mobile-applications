import { View, StyleSheet } from 'react-native';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface RowProps {
  children: React.ReactNode;
  gap?: SpaceKey;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  wrap?: boolean;
  flex?: number;
}

export function Row({
  children,
  gap = 'none',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  flex,
}: RowProps) {
  return (
    <View
      style={[
        styles.base,
        { gap: spacing[gap], alignItems: align, justifyContent: justify },
        wrap && styles.wrap,
        flex !== undefined && { flex },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', minWidth: 0 },
  wrap: { flexWrap: 'wrap' },
});
