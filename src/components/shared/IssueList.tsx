import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Divider, Icon, Row, Stack, Text, Touchable } from '@/components/primitives';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Issue } from '@/types/Issue';
import { IssueStateBadge, SeverityBadge } from './Badges';

function IssueRow({ issue }: { issue: Issue }) {
  const { colors } = useTheme();

  return (
    <Touchable
      onPress={() => router.push({ pathname: '/details/[id]', params: { id: issue.id } })}
      role="link"
      hoverColor="transparent"
      style={styles.row}
      testID={`issue-${issue.id}`}
    >
      <Stack flex={1} gap="xs">
        <Row gap="xs" wrap>
          <SeverityBadge severity={issue.severity} />
          {issue.state !== 'open' && <IssueStateBadge state={issue.state} />}
        </Row>
        <Text weight="semibold">{issue.title}</Text>
        <Text size="sm" tone="secondary" numberOfLines={2}>{issue.explanation}</Text>
      </Stack>
      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
    </Touchable>
  );
}

export function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <Stack>
      {issues.map((issue, index) => (
        <Stack key={issue.id}>
          {index > 0 && <Divider />}
          <IssueRow issue={issue} />
        </Stack>
      ))}
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
});
