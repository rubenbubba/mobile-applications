import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { MIN_TOUCH_TARGET, radii, spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface TagProps {
  label: string;
  onRemove?: () => void;
  onPress?: () => void;
  selected?: boolean;
  testID?: string;
}

export function Tag({ label, onRemove, onPress, selected = false, testID }: TagProps) {
  const { colors } = useTheme();
  const surface = {
    backgroundColor: selected ? colors.accent : colors.surface,
    borderColor: selected ? colors.accent : colors.borderStrong,
  };

  if (onPress !== undefined) {
    return (
      <Touchable
        onPress={onPress}
        role="checkbox"
        checked={selected}
        label={label}
        hoverColor={selected ? colors.accent : colors.surfaceMuted}
        style={[styles.base, styles.pressable, surface]}
        testID={testID}
      >
        <Text size="sm" weight="medium" tone={selected ? 'onAccent' : 'primary'}>{label}</Text>
      </Touchable>
    );
  }

  return (
    <View style={[styles.base, surface]} testID={testID}>
      <Text size="sm" weight="medium" tone={selected ? 'onAccent' : 'primary'}>{label}</Text>
      {onRemove !== undefined && (
        <Touchable onPress={onRemove} label={`Remove ${label}`} style={styles.removeButton}>
          <Icon name="close" size={14} color={selected ? colors.onAccent : colors.textSecondary} />
        </Touchable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  pressable: { minHeight: 40 },
  removeButton: {
    minWidth: MIN_TOUCH_TARGET / 2,
    minHeight: MIN_TOUCH_TARGET / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
});
