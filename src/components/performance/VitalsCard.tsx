import { Badge, Divider, Row, Stack, Text, ThresholdBar } from '@/components/primitives';
import { MetricBadge } from '@/components/shared/Badges';
import { SectionCard } from '@/components/shared/SectionCard';
import { formatDecimal } from '@/logic/format';
import {
  METRIC_THRESHOLDS,
  ratingForMetric,
  thresholdPosition,
  type MetricThreshold,
} from '@/logic/scoring';
import type { PerformanceData } from '@/types/Monitoring';

interface MetricRowProps {
  title: string;
  technicalName: string;
  explanation: string;
  value: number;
  valueLabel: string;
  threshold: MetricThreshold;
}

function MetricRow({ title, technicalName, explanation, value, valueLabel, threshold }: MetricRowProps) {
  return (
    <Stack gap="sm">
      <Row justify="space-between" align="flex-start" gap="md">
        <Stack flex={1}>
          <Text weight="semibold">{title}</Text>
          <Text size="xs" tone="muted">{technicalName}</Text>
        </Stack>
        <Stack align="flex-end" gap="xs">
          <Text weight="bold" tabular>{valueLabel}</Text>
          <MetricBadge rating={ratingForMetric(value, threshold)} />
        </Stack>
      </Row>
      <ThresholdBar position={thresholdPosition(value, threshold)} />
      <Text size="sm" tone="secondary">{explanation}</Text>
    </Stack>
  );
}

export function VitalsCard({ data }: { data: PerformanceData }) {
  return (
    <SectionCard
      title="How it feels to visitors"
      description="Google uses these Core Web Vitals to judge your site. Further left is better."
      testID="vitals-card"
    >
      <Stack gap="lg">
        <MetricRow
          title="Main content appears"
          technicalName="Largest Contentful Paint"
          explanation={`How long people wait to see your main content. Under ${METRIC_THRESHOLDS.lcp.good} s is good.`}
          value={data.lcpSeconds}
          valueLabel={`${formatDecimal(data.lcpSeconds)} s`}
          threshold={METRIC_THRESHOLDS.lcp}
        />
        <Divider />
        {data.inpMs !== undefined ? (
          <MetricRow
            title="Reacts to taps and clicks"
            technicalName="Interaction to Next Paint"
            explanation={`How quickly your site reacts. Under ${METRIC_THRESHOLDS.inp.good} ms is good.`}
            value={data.inpMs}
            valueLabel={`${Math.round(data.inpMs)} ms`}
            threshold={METRIC_THRESHOLDS.inp}
          />
        ) : (
          <Row justify="space-between" align="flex-start" gap="md">
            <Stack flex={1}>
              <Text weight="semibold">Reacts to taps and clicks</Text>
              <Text size="xs" tone="muted">Interaction to Next Paint</Text>
              <Text size="sm" tone="secondary">Your site does not have enough visitors yet to measure this.</Text>
            </Stack>
            <Badge label="Not available" icon="remove-circle-outline" testID="inp-unavailable" />
          </Row>
        )}
        <Divider />
        <MetricRow
          title="Stays still while loading"
          technicalName="Cumulative Layout Shift"
          explanation={`How much the page jumps around. Under ${METRIC_THRESHOLDS.cls.good} is good.`}
          value={data.cls}
          valueLabel={data.cls.toFixed(2)}
          threshold={METRIC_THRESHOLDS.cls}
        />
      </Stack>
    </SectionCard>
  );
}
