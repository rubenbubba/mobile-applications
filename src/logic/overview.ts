import type { Business } from '../types/Business';
import type { Issue } from '../types/Issue';
import type {
  Area,
  ChangeEntry,
  DataSource,
  MonitoringSnapshot,
  Sourced,
  Status,
  UnavailableReason,
} from '../types/Monitoring';
import {
  formatDayMonth,
  formatDecimal,
  formatDuration,
  pluralize,
} from './format';
import { deriveIssues, type IssueProgress } from './issueRules';
import {
  averageRating,
  computeAreaScores,
  computeOverallScore,
  isSiteDown,
  sectionValue,
  statusForScore,
} from './scoring';

export type AreaStatus = Status | 'unavailable';

export interface TrendPoint {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
}

export interface AreaSummary {
  area: Area;
  score?: number;
  status: AreaStatus;
  source: DataSource | 'unavailable';
  detail: string;
  unavailableReason?: string;
  checkedAt?: string;
}

export interface Overview {
  business: Business;
  snapshot: MonitoringSnapshot;
  now: Date;
  overall?: number;
  status: AreaStatus;
  headline: string;
  subline: string;
  areas: Record<Area, AreaSummary>;
  issues: Issue[];
  openIssues: Issue[];
  urgentCount: number;
  trend: TrendPoint[];
  trendSummary: string;
  changes: ChangeEntry[];
}

const UNAVAILABLE_DETAILS: Record<UnavailableReason, string> = {
  'not-connected': 'Google profile not connected',
  'site-down': 'Could not check while your site is down',
  'not-enough-data': 'Not enough data yet',
};

const MAX_CHANGES = 6;
const NEW_REVIEW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function summarize<T>(
  area: Area,
  section: Sourced<T>,
  score: number | undefined,
  detail: (value: T) => string,
): AreaSummary {
  if (section.source === 'unavailable') {
    return {
      area,
      status: 'unavailable',
      source: 'unavailable',
      detail: UNAVAILABLE_DETAILS[section.reasonCode],
      unavailableReason: section.reason,
    };
  }

  return {
    area,
    score,
    status: score !== undefined ? statusForScore(score) : 'unavailable',
    source: section.source,
    detail: detail(section.value),
    checkedAt: section.checkedAt,
  };
}

function buildHeadline(status: AreaStatus, siteDown: boolean, openIssues: Issue[], urgentCount: number) {
  const smaller = openIssues.length - urgentCount;

  if (siteDown) {
    return {
      headline: 'Your website is down',
      subline: 'Customers cannot reach you online right now. Fix this first.',
    };
  }

  if (status === 'unavailable') {
    return { headline: 'We have no results yet', subline: 'Run a check to see how you are doing online.' };
  }

  if (status === 'healthy') {
    return {
      headline: "You're doing well online",
      subline:
        openIssues.length === 0
          ? 'Nothing needs your attention right now.'
          : `Nothing urgent. ${pluralize(openIssues.length, 'small improvement')} available.`,
    };
  }

  const noun = pluralize(urgentCount, 'thing');
  const headline =
    status === 'critical'
      ? `Needs attention: ${noun} to fix soon`
      : urgentCount === 0
        ? 'Mostly fine, with room to improve'
        : `Mostly fine, ${noun} ${urgentCount === 1 ? 'needs' : 'need'} attention`;

  return {
    headline,
    subline: smaller > 0 ? `Plus ${pluralize(smaller, 'smaller improvement')} when you have time.` : 'Start with the first one below.',
  };
}

export function buildTrend(snapshot: MonitoringSnapshot, overall: number | undefined): TrendPoint[] {
  const past = snapshot.scoreHistory.map((point) => ({
    key: point.weekOf,
    label: `Week of ${formatDayMonth(point.weekOf)}`,
    value: point.overall,
    valueLabel: `${point.overall} / 100`,
  }));

  return overall === undefined
    ? past
    : [...past, { key: 'current', label: 'Now', value: overall, valueLabel: `${overall} / 100` }];
}

function trendSummary(trend: TrendPoint[]): string {
  const first = trend[0];
  const last = trend[trend.length - 1];
  if (first === undefined || last === undefined) return 'No score history yet.';

  return `Overall score over ${trend.length} weeks, from ${first.value} to ${last.value}.`;
}

function reviewChanges(snapshot: MonitoringSnapshot, now: Date): ChangeEntry[] {
  const reviews = sectionValue(snapshot.reviews);
  if (reviews === undefined) return [];

  return reviews.recent
    .filter((review) => now.getTime() - new Date(review.date).getTime() <= NEW_REVIEW_DAYS * DAY_MS)
    .map((review) => ({
      id: `review-${review.id}`,
      at: review.date,
      tone: review.stars >= 4 ? 'good' : review.stars <= 2 ? 'bad' : 'neutral',
      title: `New ${review.stars}-star review from ${review.author}`,
      area: 'reviews',
    }));
}

function mergeChanges(snapshot: MonitoringSnapshot, checkLog: ChangeEntry[], now: Date): ChangeEntry[] {
  return [...checkLog, ...reviewChanges(snapshot, now), ...snapshot.changes]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, MAX_CHANGES);
}

export interface OverviewInput {
  business: Business;
  snapshot: MonitoringSnapshot;
  progress: IssueProgress;
  checkLog: ChangeEntry[];
  now: Date;
}

export function deriveOverview({ business, snapshot, progress, checkLog, now }: OverviewInput): Overview {
  const scores = computeAreaScores(snapshot, now);
  const siteDown = isSiteDown(snapshot);
  const overall = computeOverallScore(scores, siteDown);
  const status: AreaStatus = overall !== undefined ? statusForScore(overall) : 'unavailable';
  const issues = deriveIssues(snapshot, now, progress);
  const openIssues = issues.filter((issue) => issue.state === 'open');
  const urgentCount = openIssues.filter((issue) => issue.severity === 'critical' || issue.severity === 'high').length;
  const trend = buildTrend(snapshot, overall);

  const areas: Record<Area, AreaSummary> = {
    website: summarize('website', snapshot.website, scores.website, (website) =>
      website.isUp ? `Online, responds in ${formatDuration(website.responseTimeMs)}` : `Down (error ${website.statusCode})`,
    ),
    reviews: summarize('reviews', snapshot.reviews, scores.reviews, (reviews) => {
      const average = averageRating(reviews);
      return average === undefined
        ? 'No reviews yet'
        : `${formatDecimal(average)} stars from ${pluralize(reviews.ratings.length, 'review')}`;
    }),
    seo: summarize('seo', snapshot.seo, scores.seo, () => {
      const count = openIssues.filter((issue) => issue.area === 'seo').length;
      return count === 0 ? 'No problems found' : `${pluralize(count, 'thing')} to improve`;
    }),
    performance: summarize('performance', snapshot.performance, scores.performance, (performance) =>
      `Loads in ${formatDecimal(performance.loadTimeSeconds)} s`,
    ),
  };

  return {
    business,
    snapshot,
    now,
    overall,
    status,
    ...buildHeadline(status, siteDown, openIssues, urgentCount),
    areas,
    issues,
    openIssues,
    urgentCount,
    trend,
    trendSummary: trendSummary(trend),
    changes: mergeChanges(snapshot, checkLog, now),
  };
}
