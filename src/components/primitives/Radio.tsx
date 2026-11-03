import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { MIN_TOUCH_TARGET, spacing } from '../../theme/tokens';
import { Stack } from './Stack';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface RadioProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  description?: string;
  testID?: string;
}

export function Radio({ label, value, selected, onSelect, description, testID }: RadioProps) {
  const { colors } = useTheme();

  return (
    <Touchable
      onPress={() => onSelect(value)}
      role="radio"
      checked={selected}
      label={label}
      hoverColor="transparent"
      style={styles.container}
      testID={testID}
    >
      <View style={[styles.circle, { borderColor: selected ? colors.accent : colors.borderStrong }]}>
        {selected && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
      </View>
      <Stack flex={1}>
        <Text size="md" weight={selected ? 'semibold' : 'normal'}>{label}</Text>
        {description !== undefined && <Text size="sm" tone="secondary">{description}</Text>}
      </Stack>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH_TARGET },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 999 },
});
