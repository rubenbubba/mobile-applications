// The raw result shapes the app expects (mirrors src/types/Monitoring.ts). Scores are calculated in the app.

export interface WebsiteData {
  url: string;
  isUp: boolean;
  statusCode: number;
  downSince?: string;
  lastSuccessfulCheck: string;
  responseTimeMs: number;
  uptimeDays: { date: string; uptimePercent: number }[];
  httpsEnabled: boolean;
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

export interface SeoData {
  pages: SeoPage[];
  brokenLinks: { fromPath: string; target: string; statusCode: number }[];
  hasSitemap: boolean;
  hasStructuredData: boolean;
}

export interface PerformanceData {
  loadTimeSeconds: number;
  lcpSeconds: number;
  inpMs?: number;
  cls: number;
  weightParts: { id: string; label: string; sizeMb: number }[];
}
