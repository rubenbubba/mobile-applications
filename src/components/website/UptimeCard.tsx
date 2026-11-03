import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Expandable, Row, Stack, Text } from '@/components/primitives';
import { SectionCard } from '@/components/shared/SectionCard';
import { formatDayMonth, formatPercent, pluralize } from '@/logic/format';
import { averageUptime } from '@/logic/scoring';
import type { ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { UptimeDay, WebsiteData } from '@/types/Monitoring';

function toneForDay(day: UptimeDay): ToneName {
  if (day.uptimePercent >= 99.9) return 'healthy';
  return day.uptimePercent >= 97 ? 'warning' : 'critical';
}

function dayLabel(day: UptimeDay): string {
  return `${formatDayMonth(day.date)}: ${formatPercent(day.uptimePercent)} online`;
}

export function UptimeCard({ data }: { data: WebsiteData }) {
  const { colors } = useTheme();
  const days = data.uptimeDays;
  const [selectedIndex, setSelectedIndex] = useState(days.length - 1);
  const selected = days[selectedIndex];
  const problemDays = days.filter((day) => day.uptimePercent < 99.9);

  return (
    <SectionCard
      title="Availability, last 30 days"
      description={`Online ${formatPercent(averageUptime(data))} of the time. Each block is one day.`}
      testID="uptime-card"
    >
      <Stack gap="sm">
        <View style={styles.strip} role="group" aria-label={`${pluralize(problemDays.length, 'day')} with outages in the last 30 days`}>
          {days.map((day, index) => (
            <Pressable
              key={day.date}
              onPress={() => setSelectedIndex(index)}
              onHoverIn={() => setSelectedIndex(index)}
              role="button"
              aria-label={dayLabel(day)}
              style={[
                styles.day,
                { backgroundColor: colors.tones[toneForDay(day)].mark },
                index === selectedIndex && { borderColor: colors.text },
              ]}
            />
          ))}
        </View>
        <Row justify="space-between" gap="sm">
          <Text size="xs" tone="muted">30 days ago</Text>
          <Text size="xs" tone="muted">Today</Text>
        </Row>
        {selected !== undefined && <Text size="sm" weight="medium" tabular>{dayLabel(selected)}</Text>}
        {problemDays.length > 0 && (
          <Expandable title={`${pluralize(problemDays.length, 'day')} with outages`}>
            {problemDays.map((day) => (
              <Text key={day.date} size="sm" tone="secondary">{dayLabel(day)}</Text>
            ))}
          </Expandable>
        )}
      </Stack>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 2, height: 32 },
  day: { flex: 1, borderRadius: 2, borderWidth: 1, borderColor: 'transparent' },
});
