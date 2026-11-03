import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface ToastProps {
  message: string;
  variant?: 'default' | 'success' | 'error';
  visible: boolean;
  actionLabel?: string;
  onAction?: () => void;
  bottomOffset?: number;
}

export function Toast({
  message,
  variant = 'default',
  visible,
  actionLabel,
  onAction,
  bottomOffset = spacing.lg,
}: ToastProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.scrim, borderColor: colors.border, bottom: bottomOffset },
      ]}
      role="status"
      aria-live="polite"
      testID="toast"
    >
      {variant === 'success' && <Icon name="checkmark-circle" size={20} color={colors.onScrim} />}
      {variant === 'error' && <Icon name="alert-circle" size={20} color={colors.onScrim} />}
      <View style={styles.message}>
        <Text size="sm" color={colors.onScrim}>{message}</Text>
      </View>
      {actionLabel !== undefined && onAction !== undefined && (
        <Touchable onPress={onAction} hoverColor="transparent" style={styles.action} testID="toast-action">
          <Text size="sm" weight="bold" color={colors.onScrim}>{actionLabel}</Text>
        </Touchable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignSelf: 'center',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  message: { flex: 1 },
  action: { minHeight: 40, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
});
