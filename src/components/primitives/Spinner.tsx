import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Spinner({ size = 'small', color }: SpinnerProps) {
  const { colors } = useTheme();

  return <ActivityIndicator size={size} color={color ?? colors.accent} />;
}
