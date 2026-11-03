import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing } from '../../theme/tokens';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  testID?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View role="tablist" aria-label={label} style={[styles.base, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Touchable
            key={option.value}
            onPress={() => onChange(option.value)}
            role="tab"
            selected={isSelected}
            hoverColor={isSelected ? colors.surface : 'transparent'}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            testID={option.testID}
          >
            <Text size="sm" weight={isSelected ? 'semibold' : 'medium'} tone={isSelected ? 'primary' : 'secondary'} align="center">
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', padding: spacing.xs, borderRadius: radii.md, gap: spacing.xs },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
