import { View } from 'react-native';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface ContainerProps {
  children: React.ReactNode;
  flex?: number;
  padding?: SpaceKey;
}

export function Container({ children, flex, padding = 'none' }: ContainerProps) {
  return (
    <View style={[{ padding: spacing[padding] }, flex !== undefined && { flex }]}>
      {children}
    </View>
  );
}
