import { router } from 'expo-router';
import { Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { AreaHeaderCard } from '@/components/shared/AreaHeaderCard';
import { AreaIssues } from '@/components/shared/AreaIssues';
import { UnavailableCard } from '@/components/shared/UnavailableCard';
import { formatDecimal } from '@/logic/format';
import type { Overview } from '@/logic/overview';
import { METRIC_THRESHOLDS, ratingForMetric, sectionValue } from '@/logic/scoring';
import { PageWeightCard } from './PageWeightCard';
import { VitalsCard } from './VitalsCard';

const LOAD_SUMMARY = {
  good: 'That is fast. Visitors will not have to wait.',
  'needs-work': 'That is a little slow. Some visitors will notice the wait.',
  poor: 'That is slow. Many visitors leave before a page this slow has loaded.',
};

export function PerformancePanel({ overview }: { overview: Overview }) {
  const { areas, now, snapshot } = overview;
  const data = sectionValue(snapshot.performance);

  if (data === undefined) {
    return (
      <UnavailableCard
        title="We could not measure your speed"
        reason={areas.performance.unavailableReason}
        action={<StyledButton label="See what to fix" variant="secondary" onPress={() => router.navigate('/issues')} />}
      />
    );
  }

  return (
    <Stack gap="lg">
      <AreaHeaderCard
        summary={areas.performance}
        now={now}
        headline={`Your homepage loads in ${formatDecimal(data.loadTimeSeconds)} seconds`}
        testID="speed-summary"
      >
        <Text tone="secondary">{LOAD_SUMMARY[ratingForMetric(data.loadTimeSeconds, METRIC_THRESHOLDS.load)]}</Text>
      </AreaHeaderCard>
      <VitalsCard data={data} />
      <PageWeightCard data={data} />
      <AreaIssues overview={overview} area="performance" title="How to make it faster" emptyTitle="Your site is fast. Nothing to do." />
    </Stack>
  );
}
