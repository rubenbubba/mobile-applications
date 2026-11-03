import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export const APP_NAME = 'Vitrine';

// Same geometry as scripts/generate-icons.js, on a unit square.
const STROKES = [
  { fromX: 0.3, fromY: 0.5, toX: 0.45, toY: 0.68 },
  { fromX: 0.45, fromY: 0.68, toX: 0.72, toY: 0.32 },
];
const THICKNESS = 0.17;

// Drawn with views instead of an icon font. It appears in the static HTML, before any font has loaded.
export function BrandMark({ size = 36 }: { size?: number }) {
  const { colors } = useTheme();

  return (
    <View
      aria-hidden
      style={[styles.base, { width: size, height: size, borderRadius: size * 0.22, backgroundColor: colors.accent }]}
    >
      {STROKES.map((stroke) => {
        const dx = stroke.toX - stroke.fromX;
        const dy = stroke.toY - stroke.fromY;
        const length = Math.hypot(dx, dy) + THICKNESS;

        return (
          <View
            key={stroke.fromX}
            style={[
              styles.stroke,
              {
                width: length * size,
                height: THICKNESS * size,
                borderRadius: (THICKNESS * size) / 2,
                left: ((stroke.fromX + stroke.toX) / 2 - length / 2) * size,
                top: ((stroke.fromY + stroke.toY) / 2 - THICKNESS / 2) * size,
                backgroundColor: colors.onAccent,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  stroke: { position: 'absolute' },
});
