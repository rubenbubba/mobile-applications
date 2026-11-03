import { View, StyleSheet } from 'react-native';
import { Icon } from '@/components/primitives';
import { useTheme } from '@/theme/useTheme';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const { colors } = useTheme();
  const rounded = Math.round(value * 2) / 2;

  return (
    <View style={styles.base} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={rounded >= star ? 'star' : rounded >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.tones.warning.mark}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', gap: 1 },
});
