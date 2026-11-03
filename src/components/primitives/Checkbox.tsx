import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { MIN_TOUCH_TARGET, radii, spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const { colors } = useTheme();

  return (
    <Touchable
      onPress={() => onChange(!checked)}
      role="checkbox"
      checked={checked}
      label={label}
      hoverColor="transparent"
      style={styles.container}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.accent : colors.borderStrong },
          checked && { backgroundColor: colors.accent },
        ]}
      >
        {checked && <Icon name="checkmark" size={16} color={colors.onAccent} />}
      </View>
      <Text size="md">{label}</Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  box: {
    width: 24,
    height: 24,
    borderRadius: radii.sm - 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
