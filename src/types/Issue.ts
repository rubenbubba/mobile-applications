import type { Area } from './Monitoring';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IssueState = 'open' | 'marked-fixed' | 'resolved';

export type IssueId =
  | 'site-down'
  | 'certificate-expiring'
  | 'no-https-redirect'
  | 'slow-server'
  | 'uptime-dips'
  | 'not-mobile-friendly'
  | 'reviews-not-connected'
  | 'unanswered-negative-reviews'
  | 'rating-dropping'
  | 'few-recent-reviews'
  | 'missing-page-titles'
  | 'missing-meta-descriptions'
  | 'pages-hidden-from-google'
  | 'heading-structure'
  | 'broken-links'
  | 'no-sitemap'
  | 'no-structured-data'
  | 'slow-main-content'
  | 'heavy-images'
  | 'slow-interaction'
  | 'layout-shift';

export interface Issue {
  id: IssueId;
  area: Area;
  severity: Severity;
  title: string;
  explanation: string;
  whyItMatters: string;
  recommendation: string;
  steps: string[];
  affected: string[];
  canMarkFixed: boolean;
  state: IssueState;
}
