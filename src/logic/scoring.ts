import type {
  Area,
  PerformanceData,
  ReviewsData,
  SeoData,
  SnapshotSections,
  Sourced,
  Status,
  WebsiteData,
} from '../types/Monitoring';

export type MetricRating = 'good' | 'needs-work' | 'poor';

export interface MetricThreshold {
  good: number;
  poor: number;
}

export type AreaScores = Partial<Record<Area, number>>;

const DAY_MS = 24 * 60 * 60 * 1000;

export const STATUS_THRESHOLDS = { healthy: 80, warning: 50 };
export const AREA_WEIGHTS: Record<Area, number> = { website: 30, performance: 25, reviews: 25, seo: 20 };
export const SITE_DOWN_SCORE_CAP = 35;
export const FRESH_REVIEW_WINDOW_DAYS = 90;
export const FRESH_REVIEW_TARGET = 6;

// Google's published Core Web Vitals thresholds. Load time uses a common rule of thumb.
export const METRIC_THRESHOLDS: Record<'lcp' | 'inp' | 'cls' | 'load', MetricThreshold> = {
  lcp: { good: 2.5, poor: 4 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  load: { good: 3, poor: 6 },
};

export function sectionValue<T>(section: Sourced<T>): T | undefined {
  return section.source === 'unavailable' ? undefined : section.value;
}

export function statusForScore(score: number): Status {
  if (score >= STATUS_THRESHOLDS.healthy) return 'healthy';
  if (score >= STATUS_THRESHOLDS.warning) return 'warning';
  return 'critical';
}

export function ratingForMetric(value: number, threshold: MetricThreshold): MetricRating {
  if (value <= threshold.good) return 'good';
  return value <= threshold.poor ? 'needs-work' : 'poor';
}

// Good scores 1, the poor threshold scores 0.5, and 1.5 times poor or worse scores 0.
export function metricScore(value: number, { good, poor }: MetricThreshold): number {
  if (value <= good) return 1;
  if (value <= poor) return 1 - ((value - good) / (poor - good)) * 0.5;
  const worst = poor * 1.5;
  return value >= worst ? 0 : 0.5 - ((value - poor) / (worst - poor)) * 0.5;
}

// Maps a value onto ThresholdBar's three equal zones.
export function thresholdPosition(value: number, { good, poor }: MetricThreshold): number {
  if (value <= good) return (value / good) / 3;
  if (value <= poor) return 1 / 3 + ((value - good) / (poor - good)) / 3;
  return Math.min(1, 2 / 3 + ((value - poor) / (poor * 0.5)) / 3);
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function share(matching: number, total: number): number {
  return total === 0 ? 1 : matching / total;
}

export function averageUptime(data: WebsiteData): number {
  if (data.uptimeDays.length === 0) return 100;
  return data.uptimeDays.reduce((sum, day) => sum + day.uptimePercent, 0) / data.uptimeDays.length;
}

function uptimePenalty(uptime: number): number {
  if (uptime >= 99.9) return 0;
  if (uptime >= 99.5) return 5;
  if (uptime >= 99) return 15;
  return uptime >= 95 ? 30 : 50;
}

function responsePenalty(responseTimeMs: number): number {
  if (responseTimeMs <= 400) return 0;
  if (responseTimeMs <= 800) return 5;
  return responseTimeMs <= 1500 ? 15 : 30;
}

function certificatePenalty(data: WebsiteData): number {
  if (!data.httpsEnabled) return 30;
  if (data.certificateExpiresInDays === undefined) return 0;
  if (data.certificateExpiresInDays < 14) return 20;
  return data.certificateExpiresInDays < 30 ? 5 : 0;
}

export function websiteScore(data: WebsiteData): number {
  if (!data.isUp) return 0;

  return clampScore(
    100 -
      uptimePenalty(averageUptime(data)) -
      responsePenalty(data.responseTimeMs) -
      certificatePenalty(data) -
      (data.redirectsToHttps ? 0 : 10) -
      (data.mobileFriendly ? 0 : 20),
  );
}

export function seoScore(data: SeoData): number {
  const total = data.pages.length;
  const titles = data.pages.filter((page) => page.title !== undefined).length;
  const descriptions = data.pages.filter((page) => page.metaDescription !== undefined).length;
  const headings = data.pages.filter((page) => page.h1Count === 1 && page.headingsInOrder).length;
  const indexable = data.pages.filter((page) => page.indexable).length;

  return clampScore(
    share(titles, total) * 25 +
      share(descriptions, total) * 20 +
      share(headings, total) * 10 +
      share(indexable, total) * 25 +
      Math.max(0, 10 - data.brokenLinks.length * 2) +
      (data.hasSitemap ? 5 : 0) +
      (data.hasStructuredData ? 5 : 0),
  );
}

export function performanceScore(data: PerformanceData): number {
  const parts = [
    { weight: 40, score: metricScore(data.lcpSeconds, METRIC_THRESHOLDS.lcp) },
    { weight: 15, score: metricScore(data.cls, METRIC_THRESHOLDS.cls) },
    { weight: 15, score: metricScore(data.loadTimeSeconds, METRIC_THRESHOLDS.load) },
  ];

  if (data.inpMs !== undefined) {
    parts.push({ weight: 30, score: metricScore(data.inpMs, METRIC_THRESHOLDS.inp) });
  }

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  return clampScore((parts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight) * 100);
}

export function averageRating(data: ReviewsData): number | undefined {
  if (data.ratings.length === 0) return undefined;
  return data.ratings.reduce((sum, rating) => sum + rating.stars, 0) / data.ratings.length;
}

export function ratingsInWindow(data: ReviewsData, now: Date, fromDaysAgo: number, toDaysAgo: number) {
  const newest = now.getTime() - fromDaysAgo * DAY_MS;
  const oldest = now.getTime() - toDaysAgo * DAY_MS;

  return data.ratings.filter((rating) => {
    const time = new Date(rating.date).getTime();
    return time <= newest && time > oldest;
  });
}

export function reviewsNeedingReply(data: ReviewsData) {
  return data.recent.filter((review) => review.stars <= 2 && !review.replied);
}

// Undefined when there are no reviews yet, so a new business isn't punished for having none.
export function reviewsScore(data: ReviewsData, now: Date): number | undefined {
  const average = averageRating(data);
  if (average === undefined) return undefined;

  const ratingPart = Math.max(0, Math.min(1, (average - 3) / 1.8));
  const negative = data.recent.filter((review) => review.stars <= 2);
  const replyPart = share(negative.filter((review) => review.replied).length, negative.length);
  const fresh = ratingsInWindow(data, now, 0, FRESH_REVIEW_WINDOW_DAYS).length;
  const freshnessPart = Math.min(1, fresh / FRESH_REVIEW_TARGET);

  return clampScore((ratingPart * 0.6 + replyPart * 0.25 + freshnessPart * 0.15) * 100);
}

export function computeAreaScores(sections: SnapshotSections, now: Date): AreaScores {
  const website = sectionValue(sections.website);
  const reviews = sectionValue(sections.reviews);
  const seo = sectionValue(sections.seo);
  const performance = sectionValue(sections.performance);

  return {
    website: website !== undefined ? websiteScore(website) : undefined,
    reviews: reviews !== undefined ? reviewsScore(reviews, now) : undefined,
    seo: seo !== undefined ? seoScore(seo) : undefined,
    performance: performance !== undefined ? performanceScore(performance) : undefined,
  };
}

// Sections without a score drop out and the remaining weights rebalance. They never count as 0.
export function computeOverallScore(scores: AreaScores, isSiteDown: boolean): number | undefined {
  const areas: Area[] = ['website', 'reviews', 'seo', 'performance'];
  let weighted = 0;
  let totalWeight = 0;

  for (const area of areas) {
    const score = scores[area];
    if (score !== undefined) {
      weighted += score * AREA_WEIGHTS[area];
      totalWeight += AREA_WEIGHTS[area];
    }
  }

  if (totalWeight === 0) return undefined;

  const overall = Math.round(weighted / totalWeight);
  return isSiteDown ? Math.min(overall, SITE_DOWN_SCORE_CAP) : overall;
}

export function isSiteDown(sections: SnapshotSections): boolean {
  const website = sectionValue(sections.website);
  return website !== undefined && !website.isUp;
}

export function overallForSections(sections: SnapshotSections, now: Date): number | undefined {
  return computeOverallScore(computeAreaScores(sections, now), isSiteDown(sections));
}
