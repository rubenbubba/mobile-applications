import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Banner, Card, Divider, EmptyState, Icon, Row, Stack, Text, Touchable } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { AREA_META } from '@/components/shared/areaMeta';
import { IssueStateBadge, SeverityBadge } from '@/components/shared/Badges';
import { RunCheckButton } from '@/components/shared/RunCheckButton';
import type { Overview } from '@/logic/overview';
import { useMonitoringStore } from '@/state/useMonitoringStore';
import { useToastStore } from '@/state/useToastStore';
import { MIN_TOUCH_TARGET, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { Issue } from '@/types/Issue';

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/issues');
  }
}

export function BackButton() {
  const { colors } = useTheme();

  return (
    <Touchable onPress={goBack} label="Back to issues" hoverColor="transparent" style={styles.back} testID="issue-back">
      <Icon name="chevron-back" size={20} color={colors.accentText} />
      <Text weight="semibold" tone="accent">Back</Text>
    </Touchable>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="xs">
      <Text weight="semibold" heading={2}>{title}</Text>
      {children}
    </Stack>
  );
}

function IssueActions({ issue }: { issue: Issue }) {
  const markFixed = useMonitoringStore((state) => state.markFixed);
  const undoMarkFixed = useMonitoringStore((state) => state.undoMarkFixed);
  const showToast = useToastStore((state) => state.showToast);

  if (issue.state === 'resolved') {
    return <Banner tone="healthy" icon="checkmark-circle" message="A new check confirmed this is fixed." testID="issue-resolved" />;
  }

  if (issue.state === 'marked-fixed') {
    return (
      <Stack gap="sm">
        <Banner
          tone="warning"
          icon="time-outline"
          message="You marked this as fixed. Your score updates once a new check confirms it."
          testID="issue-waiting"
        />
        <RunCheckButton variant="primary" />
        <StyledButton label="It's not fixed yet" variant="ghost" onPress={() => undoMarkFixed(issue.id)} testID="undo-mark-fixed" />
      </Stack>
    );
  }

  if (!issue.canMarkFixed) {
    return (
      <Banner
        icon="information-circle"
        message="There is nothing to mark as fixed here. This clears by itself as your new reviews improve."
        testID="issue-not-markable"
      />
    );
  }

  return (
    <StyledButton
      label="Mark as fixed"
      icon="checkmark"
      onPress={() => {
        markFixed(issue.id);
        showToast({
          message: 'Marked as fixed.',
          variant: 'success',
          actionLabel: 'Undo',
          onAction: () => {
            undoMarkFixed(issue.id);
            useToastStore.getState().hideToast();
          },
        });
      }}
      testID="mark-fixed"
    />
  );
}

export function IssueDetailPanel({ overview, issueId }: { overview: Overview; issueId: string }) {
  const issue = overview.issues.find((item) => item.id === issueId);

  if (issue === undefined) {
    return (
      <Card testID="issue-not-found">
        <EmptyState
          icon="checkmark-circle-outline"
          title="This issue doesn't apply right now"
          description={`We did not find it for ${overview.business.name} in the latest check.`}
          action={<StyledButton label="See all issues" variant="secondary" onPress={() => router.replace('/issues')} />}
        />
      </Card>
    );
  }

  return (
    <Card padding="xl" testID="issue-detail">
      <Stack gap="lg">
        <Row gap="sm" wrap>
          <SeverityBadge severity={issue.severity} />
          <IssueStateBadge state={issue.state} />
          <Text size="sm" tone="muted">{AREA_META[issue.area].label}</Text>
        </Row>

        <Text size="xl" weight="bold" heading={1}>{issue.title}</Text>
        <Text>{issue.explanation}</Text>

        {issue.affected.length > 0 && (
          <DetailSection title="Where we found it">
            {issue.affected.map((item) => (
              <Text key={item} tone="secondary">• {item}</Text>
            ))}
          </DetailSection>
        )}

        <Divider />

        <DetailSection title="Why this matters">
          <Text tone="secondary">{issue.whyItMatters}</Text>
        </DetailSection>

        <DetailSection title="What to do">
          <Text tone="secondary">{issue.recommendation}</Text>
          <View style={styles.steps}>
            {issue.steps.map((step, index) => (
              <Row key={step} gap="sm" align="flex-start">
                <Text weight="semibold" tone="accent" tabular>{index + 1}.</Text>
                <Stack flex={1}><Text>{step}</Text></Stack>
              </Row>
            ))}
          </View>
        </DetailSection>

        <IssueActions issue={issue} />
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH_TARGET, alignSelf: 'flex-start' },
  steps: { gap: spacing.sm, marginTop: spacing.sm },
});
