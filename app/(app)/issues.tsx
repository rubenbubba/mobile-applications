import { IssuesPanel } from '@/components/issues/IssuesPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { useOverview } from '@/hooks/useOverview';

export default function IssuesScreen() {
  const state = useOverview();

  return (
    <PageLayout title="Issues" description="What needs attention, and how to fix it." testID="screen-issues">
      <OverviewGate state={state}>{(overview) => <IssuesPanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
