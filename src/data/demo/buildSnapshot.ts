import { computeAreaScores, computeOverallScore } from '../../logic/scoring';
import { toSections as toSharedSections } from '../../logic/sections';
import type { IssueId } from '../../types/Issue';
import type {
  ChangeEntry,
  MonitoringSnapshot,
  PerformanceData,
  RatingEvent,
  ReviewsData,
  ScorePoint,
  SeoData,
  SnapshotSections,
  WebsiteData,
} from '../../types/Monitoring';
import type { DemoDefinition, RatingSegment } from './businesses';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const HISTORY_WEEKS = 11;
const UPTIME_DAYS = 30;

export interface DemoInput {
  verifiedFixes: IssueId[];
  repliedReviewIds: string[];
}

interface DemoRaw {
  website: WebsiteData;
  seo: SeoData;
  performance: PerformanceData;
  reviews: ReviewsData;
  reviewsConnected: boolean;
}

// A small seeded generator (mulberry32) so the demo numbers are the same on every run.
function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

function pickStars(random: () => number, weights: RatingSegment['weights']): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;

  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index] ?? 0;
    if (roll <= 0) return 5 - index;
  }

  return 1;
}

function buildRatings(definition: DemoDefinition, now: Date): RatingEvent[] {
  const random = createRandom(definition.seed);
  const ratings: RatingEvent[] = [];

  for (const segment of definition.reviews.segments) {
    for (let index = 0; index < segment.count; index += 1) {
      const age = segment.fromDaysAgo + random() * (segment.toDaysAgo - segment.fromDaysAgo);
      ratings.push({ date: daysAgo(now, age), stars: pickStars(random, segment.weights) });
    }
  }

  for (const review of definition.reviews.recent) {
    ratings.push({ date: daysAgo(now, review.daysAgo), stars: review.stars });
  }

  return ratings;
}

function buildUptimeDays(definition: DemoDefinition, now: Date): WebsiteData['uptimeDays'] {
  const days: WebsiteData['uptimeDays'] = [];

  for (let age = UPTIME_DAYS - 1; age >= 0; age -= 1) {
    const dip = definition.website.uptimeDips.find((item) => item.daysAgo === age);
    days.push({ date: daysAgo(now, age), uptimePercent: dip?.uptimePercent ?? 100 });
  }

  return days;
}

function buildRaw(definition: DemoDefinition, now: Date): DemoRaw {
  const { website } = definition;
  const lastSuccess = website.isUp ? now.getTime() : now.getTime() - website.downForHours * HOUR_MS;

  return {
    website: {
      url: definition.business.websiteUrl,
      isUp: website.isUp,
      statusCode: website.statusCode,
      downSince: website.isUp ? undefined : new Date(lastSuccess).toISOString(),
      lastSuccessfulCheck: new Date(lastSuccess).toISOString(),
      responseTimeMs: website.responseTimeMs,
      uptimeDays: buildUptimeDays(definition, now),
      httpsEnabled: website.httpsEnabled,
      certificateExpiresInDays: website.certificateExpiresInDays,
      redirectsToHttps: website.redirectsToHttps,
      mobileFriendly: website.mobileFriendly,
    },
    seo: definition.seo,
    performance: definition.performance,
    reviews: {
      ratings: buildRatings(definition, now),
      recent: definition.reviews.recent.map((review) => ({
        id: review.id,
        author: review.author,
        stars: review.stars,
        text: review.text,
        date: daysAgo(now, review.daysAgo),
        replied: review.replied,
      })),
    },
    reviewsConnected: definition.reviews.connected,
  };
}

// Simulates what a new check would find after each fix has really been carried out.
function applyFix(raw: DemoRaw, id: IssueId, now: Date, definition: DemoDefinition): DemoRaw {
  const { seo, website, performance, reviews } = raw;

  switch (id) {
    case 'site-down':
      return {
        ...raw,
        website: {
          ...website,
          isUp: true,
          statusCode: 200,
          downSince: undefined,
          lastSuccessfulCheck: now.toISOString(),
        },
      };
    case 'not-mobile-friendly':
      return { ...raw, website: { ...website, mobileFriendly: true } };
    case 'certificate-expiring':
      return { ...raw, website: { ...website, certificateExpiresInDays: 90 } };
    case 'no-https-redirect':
      return { ...raw, website: { ...website, redirectsToHttps: true } };
    case 'slow-server':
      return { ...raw, website: { ...website, responseTimeMs: 360 } };
    case 'uptime-dips':
      return {
        ...raw,
        website: {
          ...website,
          uptimeDays: website.uptimeDays.map((day, index, days) =>
            index >= days.length - 7 ? { ...day, uptimePercent: 100 } : day,
          ),
        },
      };
    case 'reviews-not-connected':
      return { ...raw, reviewsConnected: true };
    case 'unanswered-negative-reviews':
      return {
        ...raw,
        reviews: {
          ...reviews,
          recent: reviews.recent.map((review) => (review.stars <= 2 ? { ...review, replied: true } : review)),
        },
      };
    case 'few-recent-reviews':
      return {
        ...raw,
        reviews: {
          ...reviews,
          ratings: [
            ...reviews.ratings,
            ...[3, 8, 15, 21].map((age) => ({ date: daysAgo(now, age), stars: 5 })),
          ],
        },
      };
    case 'missing-page-titles':
      return {
        ...raw,
        seo: {
          ...seo,
          pages: seo.pages.map((page) => ({
            ...page,
            title: page.title ?? `${page.name} | ${definition.business.name}`,
          })),
        },
      };
    case 'missing-meta-descriptions':
      return {
        ...raw,
        seo: {
          ...seo,
          pages: seo.pages.map((page) => ({
            ...page,
            metaDescription: page.metaDescription ?? `${page.name} at ${definition.business.name} in ${definition.business.city}.`,
          })),
        },
      };
    case 'pages-hidden-from-google':
      return { ...raw, seo: { ...seo, pages: seo.pages.map((page) => ({ ...page, indexable: true })) } };
    case 'heading-structure':
      return {
        ...raw,
        seo: { ...seo, pages: seo.pages.map((page) => ({ ...page, h1Count: 1, headingsInOrder: true })) },
      };
    case 'broken-links':
      return { ...raw, seo: { ...seo, brokenLinks: [] } };
    case 'no-sitemap':
      return { ...raw, seo: { ...seo, hasSitemap: true } };
    case 'no-structured-data':
      return { ...raw, seo: { ...seo, hasStructuredData: true } };
    case 'slow-main-content':
      return { ...raw, performance: { ...performance, lcpSeconds: Math.min(performance.lcpSeconds, 2.3) } };
    case 'heavy-images':
      return {
        ...raw,
        performance: {
          ...performance,
          loadTimeSeconds: Math.max(2.4, performance.loadTimeSeconds - 2),
          lcpSeconds: Math.max(2.1, performance.lcpSeconds - 1),
          weightParts: performance.weightParts.map((part) =>
            part.id === 'images' ? { ...part, sizeMb: 0.8 } : part,
          ),
        },
      };
    case 'slow-interaction':
      return { ...raw, performance: { ...performance, inpMs: 160 } };
    case 'layout-shift':
      return { ...raw, performance: { ...performance, cls: 0.04 } };
    case 'rating-dropping':
      return raw;
  }
}

function toSections(raw: DemoRaw, checkedAt: string): SnapshotSections {
  return toSharedSections(
    {
      website: raw.website,
      seo: raw.seo,
      performance: raw.performance,
      reviews: raw.reviewsConnected ? raw.reviews : undefined,
    },
    'demo',
    checkedAt,
  );
}

function rawAtWeek(definition: DemoDefinition, raw: DemoRaw, weeksAgo: number, weekEnd: Date): DemoRaw {
  const random = createRandom(definition.seed + weeksAgo);
  const progress = weeksAgo / HISTORY_WEEKS;
  const wobble = 1 + (random() - 0.5) * 0.08;
  const drift = (current: number, past: number) => (current + (past - current) * progress) * wobble;
  const { past } = definition;
  let extraMissing = Math.round(past.pagesWithoutDescription * progress);

  return {
    website: {
      ...raw.website,
      isUp: true,
      statusCode: 200,
      responseTimeMs: drift(definition.website.responseTimeMs, past.responseTimeMs),
      certificateExpiresInDays: 200,
      uptimeDays: [{ date: weekEnd.toISOString(), uptimePercent: Math.min(100, past.uptimePercent + random() * 0.2) }],
    },
    seo: {
      ...raw.seo,
      pages: raw.seo.pages.map((page) => {
        if (extraMissing > 0 && page.metaDescription !== undefined) {
          extraMissing -= 1;
          return { ...page, metaDescription: undefined };
        }
        return page;
      }),
    },
    performance: {
      ...raw.performance,
      loadTimeSeconds: drift(raw.performance.loadTimeSeconds, past.loadTimeSeconds),
      lcpSeconds: drift(raw.performance.lcpSeconds, past.lcpSeconds),
      inpMs: raw.performance.inpMs !== undefined ? drift(raw.performance.inpMs, past.inpMs) : undefined,
      cls: drift(raw.performance.cls, past.cls),
    },
    reviews: {
      ratings: raw.reviews.ratings.filter((rating) => new Date(rating.date).getTime() <= weekEnd.getTime()),
      recent: raw.reviews.recent.filter((review) => new Date(review.date).getTime() <= weekEnd.getTime()),
    },
    reviewsConnected: raw.reviewsConnected,
  };
}

// Past weeks run through the same scoring as today, so the chart cannot disagree with the numbers.
function buildScoreHistory(definition: DemoDefinition, raw: DemoRaw, now: Date): ScorePoint[] {
  const points: ScorePoint[] = [];

  for (let weeksAgo = HISTORY_WEEKS; weeksAgo >= 1; weeksAgo -= 1) {
    const weekEnd = new Date(now.getTime() - weeksAgo * 7 * DAY_MS);
    const sections = toSections(rawAtWeek(definition, raw, weeksAgo, weekEnd), weekEnd.toISOString());
    const overall = computeOverallScore(computeAreaScores(sections, weekEnd), false);

    if (overall !== undefined) {
      points.push({ weekOf: weekEnd.toISOString(), overall });
    }
  }

  return points;
}

export function buildDemoSnapshot(definition: DemoDefinition, input: DemoInput, now: Date): MonitoringSnapshot {
  const baseline = buildRaw(definition, now);

  const fixed = input.verifiedFixes.reduce((raw, id) => applyFix(raw, id, now, definition), baseline);
  const withReplies: DemoRaw = {
    ...fixed,
    reviews: {
      ...fixed.reviews,
      recent: fixed.reviews.recent.map((review) =>
        input.repliedReviewIds.includes(review.id) ? { ...review, replied: true } : review,
      ),
    },
  };

  const changes: ChangeEntry[] = definition.changes.map((change) => ({
    id: change.id,
    at: daysAgo(now, change.daysAgo),
    tone: change.tone,
    title: change.title,
    area: change.area,
  }));

  return {
    businessId: definition.business.id,
    fetchedAt: now.toISOString(),
    ...toSections(withReplies, now.toISOString()),
    scoreHistory: buildScoreHistory(definition, baseline, now),
    changes,
  };
}
