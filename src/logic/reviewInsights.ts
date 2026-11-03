import type { Review, ReviewsData } from '../types/Monitoring';
import { formatDayMonth, formatDecimal, pluralize } from './format';
import { ratingsInWindow } from './scoring';
import type { TrendPoint } from './overview';

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30;

export interface RatingBucket {
  stars: number;
  count: number;
}

export function ratingDistribution(data: ReviewsData): RatingBucket[] {
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: data.ratings.filter((rating) => rating.stars === stars).length,
  }));
}

export function ratingChange(data: ReviewsData, now: Date): number | undefined {
  const recent = ratingsInWindow(data, now, 0, 90);
  const previous = ratingsInWindow(data, now, 90, 180);
  if (recent.length === 0 || previous.length === 0) return undefined;

  const mean = (items: { stars: number }[]) => items.reduce((sum, item) => sum + item.stars, 0) / items.length;
  return mean(recent) - mean(previous);
}

// Rolling 30-day periods, because a calendar month with only a few days in it would mislead.
export function ratingPeriods(data: ReviewsData, now: Date, periods = 6): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let index = periods - 1; index >= 0; index -= 1) {
    const fromDaysAgo = index * PERIOD_DAYS;
    const toDaysAgo = fromDaysAgo + PERIOD_DAYS;
    const inPeriod = ratingsInWindow(data, now, fromDaysAgo, toDaysAgo);
    const average = inPeriod.length === 0 ? 0 : inPeriod.reduce((sum, rating) => sum + rating.stars, 0) / inPeriod.length;
    const end = new Date(now.getTime() - fromDaysAgo * DAY_MS).toISOString();
    const start = new Date(now.getTime() - toDaysAgo * DAY_MS).toISOString();

    points.push({
      key: end,
      label: `${formatDayMonth(start)} to ${formatDayMonth(end)}`,
      value: average,
      valueLabel:
        inPeriod.length === 0
          ? 'No reviews'
          : `${formatDecimal(average)} stars from ${pluralize(inPeriod.length, 'review')}`,
    });
  }

  return points;
}

export function suggestReply(review: Review, businessName: string): string {
  const firstName = review.author.split(' ')[0] ?? review.author;

  if (review.stars <= 2) {
    return `Hi ${firstName}, I'm sorry to hear this and thank you for letting us know. This isn't the experience we want to give you. Could you contact us directly so we can put it right? Kind regards, ${businessName}`;
  }

  if (review.stars === 3) {
    return `Hi ${firstName}, thank you for your honest feedback. We'd love to do better next time, so please tell us what would have made your visit great. Kind regards, ${businessName}`;
  }

  return `Thank you so much, ${firstName}! We're really glad you had a good experience and hope to see you again soon. Kind regards, ${businessName}`;
}
