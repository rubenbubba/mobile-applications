import type { PerformanceData } from './types.ts';

// Google PageSpeed Insights, mobile strategy. The API key is a Supabase secret (PAGESPEED_API_KEY), never in the app.
// Without a key Google allows very few requests, so the speed check may be skipped; the app then says so.

interface Audit {
  numericValue?: number;
  score?: number | null;
  details?: { items?: { resourceType?: string; transferSize?: number }[] };
}

interface PageSpeedResponse {
  lighthouseResult?: { audits?: Record<string, Audit> };
  loadingExperience?: { metrics?: Record<string, { percentile?: number }> };
}

const WEIGHT_GROUPS: Record<string, { id: string; label: string }> = {
  image: { id: 'images', label: 'Images' },
  script: { id: 'scripts', label: 'Scripts' },
  font: { id: 'fonts', label: 'Fonts' },
};

export interface PageSpeedResult {
  performance?: PerformanceData;
  mobileFriendly?: boolean;
}

export async function runPageSpeed(url: string): Promise<PageSpeedResult> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');
  const key = Deno.env.get('PAGESPEED_API_KEY');
  if (key) endpoint.searchParams.set('key', key);

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(70000) });
    if (!response.ok) {
      console.warn(`PageSpeed returned ${response.status}`);
      return {};
    }
    // Google's documented response shape. Every field below is read with a fallback, so a change cannot crash the check.
    const data = (await response.json()) as PageSpeedResponse;
    const audits = data.lighthouseResult?.audits ?? {};
    const seconds = (id: string) => Math.round(((audits[id]?.numericValue ?? 0) / 1000) * 10) / 10;

    const weights = new Map<string, { id: string; label: string; bytes: number }>();
    for (const item of audits['resource-summary']?.details?.items ?? []) {
      const type = item.resourceType ?? 'other';
      if (type === 'total' || type === 'third-party') continue;
      const group = WEIGHT_GROUPS[type] ?? { id: 'other', label: 'Other' };
      const current = weights.get(group.id) ?? { ...group, bytes: 0 };
      current.bytes += item.transferSize ?? 0;
      weights.set(group.id, current);
    }

    const inp = data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;
    const viewportScore = audits['viewport']?.score;

    return {
      performance: {
        loadTimeSeconds: seconds('speed-index'),
        lcpSeconds: seconds('largest-contentful-paint'),
        inpMs: typeof inp === 'number' ? inp : undefined,
        cls: Math.round((audits['cumulative-layout-shift']?.numericValue ?? 0) * 100) / 100,
        weightParts: [...weights.values()].map(({ id, label, bytes }) => ({
          id,
          label,
          sizeMb: Math.round((bytes / 1_000_000) * 100) / 100,
        })),
      },
      mobileFriendly: typeof viewportScore === 'number' ? viewportScore === 1 : undefined,
    };
  } catch (error) {
    console.warn('PageSpeed failed', error);
    return {};
  }
}
