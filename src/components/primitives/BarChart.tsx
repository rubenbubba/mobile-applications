import { useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing } from '../../theme/tokens';
import { Divider } from './Divider';
import { Expandable } from './Expandable';
import { Text } from './Text';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
}

interface BarChartProps {
  data: BarDatum[];
  max: number;
  summary: string;
  height?: number;
  testID?: string;
}

const MAX_BAR_WIDTH = 24;

// One series: the selected bar uses the accent colour, the rest step back. Press or hover to read a bar.
export function BarChart({ data, max, summary, height = 112, testID }: BarChartProps) {
  const { colors } = useTheme();
  const lastIndex = data.length - 1;
  const [selectedIndex, setSelectedIndex] = useState(lastIndex);
  const selected = data[Math.min(selectedIndex, lastIndex)];

  if (selected === undefined) return null;

  return (
    <View style={styles.base} testID={testID}>
      <View style={styles.readout}>
        <Text size="sm" tone="secondary">{selected.label}</Text>
        <Text size="sm" weight="semibold" tabular>{selected.valueLabel}</Text>
      </View>

      <View role="group" aria-label={summary} style={[styles.plot, { height, borderColor: colors.border }]}>
        {data.map((datum, index) => (
          <Pressable
            key={datum.key}
            onPress={() => setSelectedIndex(index)}
            onHoverIn={() => setSelectedIndex(index)}
            role="button"
            aria-label={`${datum.label}: ${datum.valueLabel}`}
            style={styles.slot}
          >
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, (datum.value / max) * height),
                  backgroundColor: index === selectedIndex ? colors.accent : colors.chartMuted,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.axis}>
        <Text size="xs" tone="muted">{data[0]?.label}</Text>
        <Text size="xs" tone="muted">{data[lastIndex]?.label}</Text>
      </View>

      <Expandable title="Show the numbers">
        {data.map((datum, index) => (
          <View key={datum.key}>
            {index > 0 && <Divider spacing="xs" />}
            <View style={styles.tableRow}>
              <Text size="sm" tone="secondary">{datum.label}</Text>
              <Text size="sm" weight="medium" tabular>{datum.valueLabel}</Text>
            </View>
          </View>
        ))}
      </Expandable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: spacing.sm },
  readout: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, borderBottomWidth: 1 },
  slot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', maxWidth: MAX_BAR_WIDTH, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
});
