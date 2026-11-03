import { ReviewsPanel } from '@/components/reviews/ReviewsPanel';
import { OverviewGate } from '@/components/shared/OverviewGate';
import { PageLayout } from '@/components/shell/PageLayout';
import { useOverview } from '@/hooks/useOverview';

export default function ReviewsScreen() {
  const state = useOverview();

  return (
    <PageLayout title="Reviews" testID="screen-reviews">
      <OverviewGate state={state}>{(overview) => <ReviewsPanel overview={overview} />}</OverviewGate>
    </PageLayout>
  );
}
