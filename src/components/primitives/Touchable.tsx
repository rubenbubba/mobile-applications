import {
  Pressable,
  type PressableStateCallbackType,
  type Role,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';

// react-native-web adds hovered to the press state. Native never sets it.
type InteractionState = PressableStateCallbackType & { hovered?: boolean };

interface TouchableProps {
  children: React.ReactNode;
  onPress: () => void;
  label?: string;
  hint?: string;
  role?: Role;
  selected?: boolean;
  checked?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  hoverColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Touchable({
  children,
  onPress,
  label,
  hint,
  role = 'button',
  selected,
  checked,
  expanded,
  disabled = false,
  hoverColor,
  style,
  testID,
}: TouchableProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role={role}
      aria-label={label}
      aria-description={hint}
      aria-selected={selected}
      aria-checked={checked}
      aria-expanded={expanded}
      aria-disabled={disabled}
      testID={testID}
      style={(state: InteractionState) => [
        style,
        state.hovered === true && !disabled && { backgroundColor: hoverColor ?? colors.surfaceMuted },
        state.pressed && { opacity: 0.72 },
        disabled && { opacity: 0.55 },
      ]}
    >
      {children}
    </Pressable>
  );
}
