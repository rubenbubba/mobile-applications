import { router } from 'expo-router';
import { Card, Expandable, ProgressBar, Row, Stack, Text } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { SourceBadge, StatusBadge } from '@/components/shared/Badges';
import { RunCheckButton } from '@/components/shared/RunCheckButton';
import { ScoreFigure } from '@/components/shared/ScoreFigure';
import { toneForStatus } from '@/components/shared/statusTone';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatRelativeTime } from '@/logic/format';
import type { Overview } from '@/logic/overview';
import { AREA_WEIGHTS, SITE_DOWN_SCORE_CAP, STATUS_THRESHOLDS } from '@/logic/scoring';

function ScoreExplainer() {
  return (
    <Expandable title="How is this calculated?" testID="score-explainer">
      <Text size="sm" tone="secondary">
        Your score combines four areas: website ({AREA_WEIGHTS.website}%), speed ({AREA_WEIGHTS.performance}%),
        reviews ({AREA_WEIGHTS.reviews}%) and how easily you are found on Google ({AREA_WEIGHTS.seo}%).
      </Text>
      <Text size="sm" tone="secondary">
        {STATUS_THRESHOLDS.healthy} or higher is healthy, {STATUS_THRESHOLDS.warning} to {STATUS_THRESHOLDS.healthy - 1} needs
        work, and below {STATUS_THRESHOLDS.warning} is critical.
      </Text>
      <Text size="sm" tone="secondary">
        If we cannot measure an area, it is left out rather than counted as zero. If your website is down, your score
        cannot go above {SITE_DOWN_SCORE_CAP}, because nothing else matters until customers can reach you.
      </Text>
    </Expandable>
  );
}

export function HealthHero({ overview }: { overview: Overview }) {
  const { isTablet } = useBreakpoint();
  const { overall, status, headline, subline, openIssues, urgentCount, snapshot, now } = overview;
  const firstIssue = openIssues[0];

  const actions = (
    <>
      {firstIssue !== undefined && (
        <StyledButton
          label={urgentCount > 0 ? 'See what to fix first' : 'See what to improve'}
          icon="arrow-forward"
          onPress={() => router.push({ pathname: '/details/[id]', params: { id: firstIssue.id } })}
          testID="fix-first"
        />
      )}
      <RunCheckButton variant={firstIssue !== undefined ? 'secondary' : 'primary'} />
    </>
  );

  return (
    <Card padding="xl" testID="health-hero">
      <Stack gap="lg">
        <Row justify="space-between" align="flex-start" gap="md" wrap>
          <ScoreFigure score={overall} size="display" testID="overall-score" />
          <StatusBadge status={status} />
        </Row>

        {overall !== undefined && (
          <ProgressBar value={overall} tone={toneForStatus(status)} label="Overall score out of 100" height={10} />
        )}

        <Stack gap="xs">
          <Text size="xl" weight="bold" heading={2} testID="health-headline">{headline}</Text>
          <Text tone="secondary">{subline}</Text>
        </Stack>

        {isTablet ? <Row gap="sm" wrap>{actions}</Row> : <Stack gap="sm">{actions}</Stack>}

        <Row gap="sm" wrap>
          {snapshot.website.source !== 'unavailable' && <SourceBadge source={snapshot.website.source} />}
          <Text size="sm" tone="muted" testID="last-checked">
            {snapshot.website.source !== 'unavailable'
              ? `Last checked ${formatRelativeTime(snapshot.fetchedAt, now)}`
              : 'Not checked yet'}
          </Text>
        </Row>

        <ScoreExplainer />
      </Stack>
    </Card>
  );
}
