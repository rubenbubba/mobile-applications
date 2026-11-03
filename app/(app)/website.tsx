import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { WebsiteSubNav } from '@/components/shell/WebsiteSubNav';
import { WebsitePanel } from '@/components/website/WebsitePanel';
import { useOverview } from '@/hooks/useOverview';

export default function WebsiteScreen() {
  const state = useOverview();

  return (
    <PageLayout title="Website" subNav={<WebsiteSubNav current="website" />} testID="screen-website">
      <OverviewGate state={state}>{(overview) => <WebsitePanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
