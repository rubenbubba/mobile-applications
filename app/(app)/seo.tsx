import { SeoPanel } from '@/components/seo/SeoPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { WebsiteSubNav } from '@/components/shell/WebsiteSubNav';
import { useOverview } from '@/hooks/useOverview';

export default function SeoScreen() {
  const state = useOverview();

  return (
    <PageLayout title="Found on Google" subNav={<WebsiteSubNav current="seo" />} testID="screen-seo">
      <OverviewGate state={state}>{(overview) => <SeoPanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
