import { ProgressBar, Row, Stack, Text } from '@/components/primitives';
import { SectionCard } from '@/components/shared/SectionCard';
import { formatDecimal } from '@/logic/format';
import type { PerformanceData } from '@/types/Monitoring';

const HEAVY_PAGE_MB = 3;

export function PageWeightCard({ data }: { data: PerformanceData }) {
  const parts = [...data.weightParts].sort((a, b) => b.sizeMb - a.sizeMb);
  const total = parts.reduce((sum, part) => sum + part.sizeMb, 0);
  const largest = parts[0];
  const isHeavy = total > HEAVY_PAGE_MB;

  return (
    <SectionCard
      title={isHeavy ? 'What is slowing it down' : 'What visitors download'}
      description={
        largest !== undefined
          ? `Your homepage is ${formatDecimal(total)} MB. ${largest.label} take up the most space.`
          : undefined
      }
      testID="page-weight"
    >
      <Stack gap="md">
        {parts.map((part) => (
          <Stack key={part.id} gap="xs">
            <Row justify="space-between" gap="md">
              <Text size="sm" weight="medium">{part.label}</Text>
              <Text size="sm" tone="secondary" tabular>{formatDecimal(part.sizeMb)} MB</Text>
            </Row>
            <ProgressBar value={part.sizeMb} max={total} label={`${part.label} share of page size`} />
          </Stack>
        ))}
      </Stack>
    </SectionCard>
  );
}
