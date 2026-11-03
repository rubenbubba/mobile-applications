import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, type ToneName } from '../../theme/tokens';

interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: ToneName;
  label?: string;
  height?: number;
}

export function ProgressBar({ value, max = 100, tone, label, height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone !== undefined ? colors.tones[tone].mark : colors.accent;

  return (
    <View
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      style={[styles.track, { height, backgroundColor: colors.surfaceMuted }]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
});
