import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { MIN_TOUCH_TARGET, radii, spacing } from '../theme/tokens';
import { Icon, type IoniconsName } from './primitives/Icon';
import { Spinner } from './primitives/Spinner';
import { Text } from './primitives/Text';
import { Touchable } from './primitives/Touchable';

interface StyledButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: IoniconsName;
  hint?: string;
  compact?: boolean;
  testID?: string;
}

export function StyledButton({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  icon,
  hint,
  compact = false,
  testID,
}: StyledButtonProps) {
  const { colors } = useTheme();

  const surfaces = {
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    danger: { backgroundColor: colors.tones.critical.background, borderColor: colors.tones.critical.background },
  };
  const foregrounds = {
    primary: colors.onAccent,
    secondary: colors.text,
    ghost: colors.accentText,
    danger: colors.tones.critical.text,
  };

  return (
    <Touchable
      onPress={onPress}
      disabled={isLoading || disabled}
      label={label}
      hint={hint}
      hoverColor={surfaces[variant].backgroundColor === 'transparent' ? colors.surfaceMuted : surfaces[variant].backgroundColor}
      style={[styles.base, surfaces[variant], compact && styles.compact]}
      testID={testID}
    >
      <View style={styles.content}>
        {isLoading ? (
          <Spinner size="small" color={foregrounds[variant]} />
        ) : (
          icon !== undefined && <Icon name={icon} size={18} color={foregrounds[variant]} />
        )}
        <Text size={compact ? 'sm' : 'md'} weight="semibold" color={foregrounds[variant]} align="center">{label}</Text>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  compact: { minHeight: 40, paddingHorizontal: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
