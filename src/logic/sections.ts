import type {
  DataSource,
  PerformanceData,
  ReviewsData,
  SeoData,
  SnapshotSections,
  Sourced,
  WebsiteData,
} from '../types/Monitoring';

// Raw results from one check, before any scoring. Demo data and real checks both arrive in this shape.
// A missing area means that part of the check could not run (or, for reviews, is not connected).
export interface RawResults {
  website: WebsiteData;
  seo?: SeoData;
  performance?: PerformanceData;
  reviews?: ReviewsData;
}

const SITE_DOWN_REASON = 'Your website was not responding, so this check could not run.';
const CHECK_FAILED_REASON = 'This check could not run this time. It will try again at the next check.';

export function toSections(raw: RawResults, source: DataSource, checkedAt: string): SnapshotSections {
  // Search and speed checks need the site to answer, so a site that is down explains their absence.
  function fromSite<T>(value: T | undefined): Sourced<T> {
    if (!raw.website.isUp) return { source: 'unavailable', reasonCode: 'site-down', reason: SITE_DOWN_REASON };
    if (value === undefined) return { source: 'unavailable', reasonCode: 'not-enough-data', reason: CHECK_FAILED_REASON };
    return { source, value, checkedAt };
  }

  return {
    website: { source, value: raw.website, checkedAt },
    reviews:
      raw.reviews !== undefined
        ? { source, value: raw.reviews, checkedAt }
        : { source: 'unavailable', reasonCode: 'not-connected', reason: 'Your Google Business Profile is not connected yet.' },
    seo: fromSite(raw.seo),
    performance: fromSite(raw.performance),
  };
}
