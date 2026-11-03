import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { BarChart, Divider, EmptyState, SegmentedControl, Stack } from '@/components/primitives';
import { StyledButton } from '@/components/StyledButton';
import { AreaIssues } from '@/components/shared/AreaIssues';
import { SectionCard } from '@/components/shared/SectionCard';
import { UnavailableCard } from '@/components/shared/UnavailableCard';
import type { Overview } from '@/logic/overview';
import { ratingPeriods } from '@/logic/reviewInsights';
import { sectionValue } from '@/logic/scoring';
import { useMonitoringStore } from '@/state/useMonitoringStore';
import type { Review } from '@/types/Monitoring';
import { RatingSummaryCard } from './RatingSummaryCard';
import { ReviewCard } from './ReviewCard';

type ReviewFilter = 'all' | 'needs-reply';

const NO_REPLIES: string[] = [];

export function ReviewsPanel({ overview }: { overview: Overview }) {
  const { areas, business, now, snapshot } = overview;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const replied = useMonitoringStore((state) => state.repliedReviews[state.businessId] ?? NO_REPLIES);
  const markReviewReplied = useMonitoringStore((state) => state.markReviewReplied);
  const data = sectionValue(snapshot.reviews);

  // Replies show right away. The score only changes after the next check.
  const reviews = useMemo<Review[]>(
    () => (data?.recent ?? []).map((review) => (replied.includes(review.id) ? { ...review, replied: true } : review)),
    [data, replied],
  );

  if (data === undefined) {
    return (
      <UnavailableCard
        title="We cannot see your Google reviews"
        reason={areas.reviews.unavailableReason}
        action={
          <StyledButton
            label="See how to connect"
            variant="secondary"
            onPress={() => router.push({ pathname: '/details/[id]', params: { id: 'reviews-not-connected' } })}
            testID="connect-reviews"
          />
        }
      />
    );
  }

  if (data.ratings.length === 0) {
    return (
      <SectionCard title="No reviews yet">
        <EmptyState
          icon="star-outline"
          title="You have no Google reviews yet"
          description="Ask a few happy customers to leave a review. It is one of the quickest ways to build trust."
        />
      </SectionCard>
    );
  }

  const waiting = reviews.filter((review) => review.stars <= 2 && !review.replied);
  const visible = filter === 'all' ? reviews : waiting;

  return (
    <Stack gap="lg">
      <RatingSummaryCard data={data} summary={areas.reviews} now={now} />

      <SectionCard title="Your rating over time" description="Average stars per 30 days. Tap a bar for details." testID="rating-trend">
        <BarChart
          data={ratingPeriods(data, now)}
          max={5}
          summary="Average rating per 30 days over the last 6 periods."
        />
      </SectionCard>

      <SectionCard title="Recent reviews" testID="recent-reviews">
        <Stack gap="md">
          <SegmentedControl<ReviewFilter>
            label="Filter reviews"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `All (${reviews.length})`, testID: 'reviews-filter-all' },
              { value: 'needs-reply', label: `Needs a reply (${waiting.length})`, testID: 'reviews-filter-needs-reply' },
            ]}
          />
          {visible.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="No reviews need a reply"
              description="You are all caught up."
              testID="reviews-empty"
            />
          ) : (
            <Stack gap="md">
              {visible.map((review, index) => (
                <Stack key={review.id} gap="md">
                  {index > 0 && <Divider />}
                  <ReviewCard
                    review={review}
                    businessName={business.name}
                    now={now}
                    onMarkReplied={markReviewReplied}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </SectionCard>

      <AreaIssues overview={overview} area="reviews" title="What to do" emptyTitle="Your reviews look good" />
    </Stack>
  );
}
