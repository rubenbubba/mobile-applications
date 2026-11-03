import { PerformancePanel } from '@/components/performance/PerformancePanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { WebsiteSubNav } from '@/components/shell/WebsiteSubNav';
import { useOverview } from '@/hooks/useOverview';

export default function PerformanceScreen() {
  const state = useOverview();

  return (
    <PageLayout title="Speed" subNav={<WebsiteSubNav current="performance" />} testID="screen-performance">
      <OverviewGate state={state}>{(overview) => <PerformancePanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
