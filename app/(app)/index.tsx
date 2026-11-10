import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { useCurrentBusiness } from '@/hooks/useBusiness';
import { useOverview } from '@/hooks/useOverview';
import { describeBusiness } from '@/logic/business';

export default function HomeScreen() {
  const state = useOverview();
  const business = useCurrentBusiness();

  return (
    <PageLayout
      title={business?.name ?? ''}
      description={business !== undefined ? describeBusiness(business) : undefined}
      showBusiness={false}
      testID="screen-home"
    >
      <OverviewGate state={state}>{(overview) => <DashboardPanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
