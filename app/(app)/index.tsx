import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { useOverview } from '@/hooks/useOverview';
import { getBusiness } from '@/services/monitoringService';
import { useMonitoringStore } from '@/state/useMonitoringStore';

export default function HomeScreen() {
  const state = useOverview();
  const businessId = useMonitoringStore((store) => store.businessId);
  const business = getBusiness(businessId);

  return (
    <PageLayout
      title={business.name}
      description={`${business.category} in ${business.city}`}
      showBusiness={false}
      testID="screen-home"
    >
      <OverviewGate state={state}>{(overview) => <DashboardPanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
