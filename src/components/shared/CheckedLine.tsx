import { Row, Text } from '@/components/primitives';
import { formatRelativeTime } from '@/logic/format';
import type { AreaSummary } from '@/logic/overview';
import { SourceBadge } from './Badges';

interface CheckedLineProps {
  summary: AreaSummary;
  now: Date;
}

export function CheckedLine({ summary, now }: CheckedLineProps) {
  return (
    <Row gap="sm" wrap>
      <SourceBadge source={summary.source} />
      {summary.checkedAt !== undefined && (
        <Text size="sm" tone="muted">Checked {formatRelativeTime(summary.checkedAt, now)}</Text>
      )}
    </Row>
  );
}
