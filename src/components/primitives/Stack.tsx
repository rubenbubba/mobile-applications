import { View, StyleSheet, type Role } from 'react-native';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface StackProps {
  children: React.ReactNode;
  gap?: SpaceKey;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  padding?: SpaceKey;
  flex?: number;
  role?: Role;
  testID?: string;
}

export function Stack({
  children,
  gap = 'none',
  align = 'stretch',
  justify = 'flex-start',
  padding = 'none',
  flex,
  role,
  testID,
}: StackProps) {
  return (
    <View
      role={role}
      style={[
        styles.base,
        { gap: spacing[gap], padding: spacing[padding], alignItems: align, justifyContent: justify },
        flex !== undefined && { flex },
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'column', minWidth: 0 },
});
