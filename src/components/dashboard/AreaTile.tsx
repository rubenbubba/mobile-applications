import { router } from 'expo-router';
import { Card, Icon, Row, Stack, Text } from '@/components/primitives';
import { StatusBadge } from '@/components/shared/Badges';
import { AREA_META } from '@/components/shared/areaMeta';
import type { AreaSummary } from '@/logic/overview';
import { useTheme } from '@/theme/useTheme';

export function AreaTile({ summary }: { summary: AreaSummary }) {
  const { colors } = useTheme();
  const meta = AREA_META[summary.area];
  const scoreText = summary.score !== undefined ? `${summary.score} out of 100` : 'no score';

  return (
    <Card
      onPress={() => router.navigate(meta.href)}
      flex={1}
      label={`${meta.label}: ${scoreText}. ${summary.detail}`}
      testID={`tile-${summary.area}`}
    >
      <Stack gap="sm">
        <Row gap="sm">
          <Icon name={meta.icon} size={18} color={colors.textSecondary} />
          <Text size="sm" weight="semibold" tone="secondary">{meta.label}</Text>
        </Row>
        <Text size="xxl" weight="bold" tone={summary.score === undefined ? 'muted' : 'primary'}>
          {summary.score ?? '–'}
        </Text>
        <StatusBadge status={summary.status} />
        <Text size="sm" tone="secondary">{summary.detail}</Text>
      </Stack>
    </Card>
  );
}
