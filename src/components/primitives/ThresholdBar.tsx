import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii } from '../../theme/tokens';

interface ThresholdBarProps {
  position: number;
}

// Three equal zones (good, needs work, poor) with a marker. Position runs from 0 to 1.
export function ThresholdBar({ position }: ThresholdBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, position));
  const zones = [colors.tones.healthy.mark, colors.tones.warning.mark, colors.tones.critical.mark];

  return (
    <View style={styles.base} aria-hidden>
      <View style={styles.zones}>
        {zones.map((zone) => (
          <View key={zone} style={[styles.zone, { backgroundColor: zone }]} />
        ))}
      </View>
      <View
        style={[
          styles.marker,
          { left: `${clamped * 100}%`, backgroundColor: colors.text, borderColor: colors.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { height: 16, justifyContent: 'center' },
  zones: { flexDirection: 'row', gap: 2, height: 6 },
  zone: { flex: 1, borderRadius: radii.pill },
  marker: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: radii.pill,
    borderWidth: 2,
  },
});
