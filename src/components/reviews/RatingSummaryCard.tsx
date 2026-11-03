import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Row, Stack, Text } from '@/components/primitives';
import { CheckedLine } from '@/components/shared/CheckedLine';
import { StatusBadge } from '@/components/shared/Badges';
import { formatDecimal, formatNumber, pluralize } from '@/logic/format';
import type { AreaSummary } from '@/logic/overview';
import { ratingChange, ratingDistribution } from '@/logic/reviewInsights';
import { averageRating } from '@/logic/scoring';
import type { ReviewsData } from '@/types/Monitoring';
import { Stars } from './Stars';

interface RatingSummaryCardProps {
  data: ReviewsData;
  summary: AreaSummary;
  now: Date;
}

function changeText(change: number | undefined): string | undefined {
  if (change === undefined) return undefined;
  if (Math.abs(change) < 0.05) return 'About the same as the 3 months before.';
  return `${change > 0 ? 'Up' : 'Down'} ${formatDecimal(Math.abs(change))} from the 3 months before.`;
}

export function RatingSummaryCard({ data, summary, now }: RatingSummaryCardProps) {
  const average = averageRating(data);
  const change = changeText(ratingChange(data, now));
  const total = data.ratings.length;

  return (
    <Card testID="rating-summary">
      <Stack gap="lg">
        <Row justify="space-between" align="flex-start" gap="md" wrap>
          <Stack gap="xs">
            <Text size="xxl" weight="bold" testID="average-rating">{average !== undefined ? formatDecimal(average) : '–'}</Text>
            {average !== undefined && <Stars value={average} size={18} />}
            <Text size="sm" tone="secondary" testID="review-total">{pluralize(total, 'review')} on Google</Text>
          </Stack>
          <StatusBadge status={summary.status} />
        </Row>

        {change !== undefined && <Text weight="medium">{change}</Text>}

        <Stack gap="xs">
          {ratingDistribution(data).map((bucket) => (
            <Row key={bucket.stars} gap="sm">
              <View style={styles.starLabel}>
                <Text size="sm" tone="secondary" tabular align="right">{bucket.stars}★</Text>
              </View>
              <View style={styles.bar}>
                <ProgressBar value={bucket.count} max={Math.max(total, 1)} label={`${bucket.stars} star reviews`} />
              </View>
              <View style={styles.count}>
                <Text size="sm" tone="secondary" tabular align="right">{formatNumber(bucket.count)}</Text>
              </View>
            </Row>
          ))}
        </Stack>

        <CheckedLine summary={summary} now={now} />
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  starLabel: { width: 28 },
  bar: { flex: 1 },
  count: { width: 32 },
});
