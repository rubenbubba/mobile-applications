import { Row, Text } from '@/components/primitives';

interface ScoreFigureProps {
  score?: number;
  size?: 'display' | 'xxl';
  testID?: string;
}

export function ScoreFigure({ score, size = 'xxl', testID }: ScoreFigureProps) {
  if (score === undefined) {
    return <Text size={size} weight="bold" tone="muted" testID={testID}>–</Text>;
  }

  return (
    <Row align="flex-end" gap="xs">
      <Text size={size} weight="bold" testID={testID}>{score}</Text>
      <Text size={size === 'display' ? 'lg' : 'sm'} tone="muted">/ 100</Text>
    </Row>
  );
}
