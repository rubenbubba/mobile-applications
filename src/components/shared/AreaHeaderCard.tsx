import { Card, ProgressBar, Row, Stack, Text } from '@/components/primitives';
import type { AreaSummary } from '@/logic/overview';
import { toneForStatus } from './statusTone';
import { StatusBadge } from './Badges';
import { CheckedLine } from './CheckedLine';
import { ScoreFigure } from './ScoreFigure';

interface AreaHeaderCardProps {
  summary: AreaSummary;
  now: Date;
  headline: string;
  children?: React.ReactNode;
  testID?: string;
}

export function AreaHeaderCard({ summary, now, headline, children, testID }: AreaHeaderCardProps) {
  return (
    <Card testID={testID}>
      <Stack gap="md">
        <Row justify="space-between" gap="md" wrap>
          <ScoreFigure score={summary.score} testID="area-score" />
          <StatusBadge status={summary.status} />
        </Row>
        {summary.score !== undefined && (
          <ProgressBar value={summary.score} tone={toneForStatus(summary.status)} label="Score out of 100" />
        )}
        <Text size="lg" weight="semibold">{headline}</Text>
        {children}
        <CheckedLine summary={summary} now={now} />
      </Stack>
    </Card>
  );
}
