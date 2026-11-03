import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/useTheme';

export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const { colors } = useTheme();

  return <Ionicons name={name} size={size} color={color ?? colors.text} aria-hidden />;
}
