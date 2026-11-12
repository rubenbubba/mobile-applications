export type Area = 'website' | 'reviews' | 'seo' | 'performance';
export type Status = 'healthy' | 'warning' | 'critical';
export type DataSource = 'live' | 'demo';
export type UnavailableReason = 'not-connected' | 'site-down' | 'not-enough-data';

export type Sourced<T> =
  | { source: DataSource; value: T; checkedAt: string }
  | { source: 'unavailable'; reasonCode: UnavailableReason; reason: string };

export interface UptimeDay {
  date: string;
  uptimePercent: number;
}

export interface WebsiteData {
  url: string;
  isUp: boolean;
  statusCode: number;
  downSince?: string;
  lastSuccessfulCheck: string;
  responseTimeMs: number;
  uptimeDays: UptimeDay[];
  httpsEnabled: boolean;
  // Unknown for real checks: server functions can see that the certificate is valid, but not its end date.
  certificateExpiresInDays?: number;
  redirectsToHttps: boolean;
  mobileFriendly: boolean;
}

export interface SeoPage {
  path: string;
  name: string;
  title?: string;
  metaDescription?: string;
  h1Count: number;
  headingsInOrder: boolean;
  indexable: boolean;
}

export interface BrokenLink {
  fromPath: string;
  target: string;
  statusCode: number;
}

export interface SeoData {
  pages: SeoPage[];
  brokenLinks: BrokenLink[];
  hasSitemap: boolean;
  hasStructuredData: boolean;
}

export interface PageWeightPart {
  id: string;
  label: string;
  sizeMb: number;
}

export interface PerformanceData {
  loadTimeSeconds: number;
  lcpSeconds: number;
  inpMs?: number;
  cls: number;
  weightParts: PageWeightPart[];
}

export interface RatingEvent {
  date: string;
  stars: number;
}

export interface Review {
  id: string;
  author: string;
  stars: number;
  text: string;
  date: string;
  replied: boolean;
}

export interface ReviewsData {
  ratings: RatingEvent[];
  recent: Review[];
}

export interface SnapshotSections {
  website: Sourced<WebsiteData>;
  reviews: Sourced<ReviewsData>;
  seo: Sourced<SeoData>;
  performance: Sourced<PerformanceData>;
}

export interface ScorePoint {
  weekOf: string;
  overall: number;
}

export type ChangeTone = 'good' | 'bad' | 'neutral';

export interface ChangeEntry {
  id: string;
  at: string;
  tone: ChangeTone;
  title: string;
  area?: Area;
}

export interface MonitoringSnapshot extends SnapshotSections {
  businessId: string;
  fetchedAt: string;
  scoreHistory: ScorePoint[];
  changes: ChangeEntry[];
}

export interface ReachabilityResult {
  url: string;
  outcome: 'responded' | 'no-response' | 'timed-out';
  durationMs: number;
  checkedAt: string;
  // Only known when the test ran on the server (signed-in accounts). The browser cannot read it.
  statusCode?: number;
}
