import { Banner, Grid, Row, Stack } from '@/components/primitives';
import { AREA_ORDER } from '@/components/shared/areaMeta';
import { useIsLiveAccount } from '@/hooks/useAccount';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { Overview } from '@/logic/overview';
import { AreaTile } from './AreaTile';
import { AttentionCard } from './AttentionCard';
import { HealthHero } from './HealthHero';
import { RecentChangesCard } from './RecentChangesCard';
import { ScoreTrendCard } from './ScoreTrendCard';

export function DashboardPanel({ overview }: { overview: Overview }) {
  const { isWide, isTablet } = useBreakpoint();
  const isLive = useIsLiveAccount();

  const tiles = (
    <Grid columns={isTablet ? 4 : 2}>
      {AREA_ORDER.map((area) => (
        <AreaTile key={area} summary={overview.areas[area]} />
      ))}
    </Grid>
  );

  const details = isWide ? (
    <Row gap="lg" align="flex-start">
      <Stack flex={1}><AttentionCard overview={overview} /></Stack>
      <Stack flex={1} gap="lg">
        <ScoreTrendCard overview={overview} />
        <RecentChangesCard overview={overview} />
      </Stack>
    </Row>
  ) : (
    <>
      <AttentionCard overview={overview} />
      <ScoreTrendCard overview={overview} />
      <RecentChangesCard overview={overview} />
    </>
  );

  return (
    <Stack gap="lg">
      <HealthHero overview={overview} />
      {tiles}
      {details}
      {!isLive && (
        <Banner
          icon="flask-outline"
          message="You are viewing demo data for a fictional business. See Settings for which data sources are connected."
          testID="demo-data-note"
        />
      )}
    </Stack>
  );
}
