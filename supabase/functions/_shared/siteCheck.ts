import { pageName, readPage, type PageFacts } from './html.ts';
import { runPageSpeed } from './pagespeed.ts';
import { mapLimited, probe, redirectsToHttps } from './probe.ts';
import { parseSafeUrl } from './safeUrl.ts';
import type { PerformanceData, SeoData, SeoPage, WebsiteData } from './types.ts';

const EXTRA_PAGES = 5;
const LINKS_TO_TEST = 20;

export interface FullCheck {
  checkedAt: string;
  website: WebsiteData;
  seo?: SeoData;
  performance?: PerformanceData;
}

export interface DownHistory {
  lastSuccess: string;
  downSince?: string;
}

async function hasSitemap(origin: string): Promise<boolean> {
  const sitemap = await probe(`${origin}/sitemap.xml`, { timeoutMs: 8000 });
  if (sitemap.isUp) return true;
  try {
    const robots = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    return robots.ok && /^\s*sitemap:/im.test(await robots.text());
  } catch {
    return false;
  }
}

function toSeoPage(url: URL, facts: PageFacts): SeoPage {
  return {
    path: url.pathname,
    name: pageName(url.pathname),
    title: facts.title,
    metaDescription: facts.metaDescription,
    h1Count: facts.h1Count,
    headingsInOrder: facts.headingsInOrder,
    indexable: facts.indexable,
  };
}

// The homepage plus a few pages it links to, and whether the links on them still work.
async function checkSeo(homeUrl: URL, homeHtml: string, robotsHeader: string): Promise<{ seo: SeoData; home: PageFacts }> {
  const home = readPage(homeHtml, homeUrl, robotsHeader);
  const foundOn = new Map<string, string>(home.links.map((link) => [link, homeUrl.pathname]));

  const candidates = home.links.filter((link) => new URL(link).pathname !== homeUrl.pathname).slice(0, EXTRA_PAGES);
  const extraPages = await mapLimited(candidates, 3, async (link) => {
    const result = await probe(link, { readBody: true, timeoutMs: 10000 });
    if (!result.isUp || result.html === undefined) return undefined;
    const url = new URL(result.finalUrl);
    const facts = readPage(result.html, url, result.headers?.get('x-robots-tag') ?? '');
    for (const target of facts.links) if (!foundOn.has(target)) foundOn.set(target, url.pathname);
    return { url, facts };
  });
  const pages = [{ url: homeUrl, facts: home }, ...extraPages.filter((page) => page !== undefined)];

  const linksToTest = [...foundOn.keys()].slice(0, LINKS_TO_TEST);
  const linkResults = await mapLimited(linksToTest, 5, async (link) => {
    let result = await probe(link, { method: 'HEAD', timeoutMs: 8000 });
    if (result.statusCode === 405 || result.statusCode === 501) result = await probe(link, { timeoutMs: 8000 });
    return { link, statusCode: result.statusCode };
  });

  return {
    home,
    seo: {
      // The first page is always the homepage, even when the site redirects it (for example to /nl).
      pages: pages.map(({ url, facts }, index) => ({ ...toSeoPage(url, facts), name: index === 0 ? 'Home' : pageName(url.pathname) })),
      // Only real error answers count. A timeout can be a one-off and would cause false alarms.
      brokenLinks: linkResults
        .filter(({ statusCode }) => statusCode >= 400)
        .map(({ link, statusCode }) => ({ fromPath: foundOn.get(link) ?? '/', target: new URL(link).pathname, statusCode })),
      hasSitemap: await hasSitemap(homeUrl.origin),
      hasStructuredData: pages.some(({ facts }) => facts.hasStructuredData),
    },
  };
}

export async function runFullCheck(websiteUrl: string, history: DownHistory): Promise<FullCheck> {
  const url = parseSafeUrl(websiteUrl);
  if (url === undefined) throw new Error('This website address cannot be checked.');

  const checkedAt = new Date().toISOString();
  const [home, httpsRedirect, speed] = await Promise.all([
    probe(url.toString(), { readBody: true }),
    redirectsToHttps(url),
    runPageSpeed(url.toString()),
  ]);

  const seoResult =
    home.isUp && home.html !== undefined
      ? await checkSeo(new URL(home.finalUrl), home.html, home.headers?.get('x-robots-tag') ?? '')
      : undefined;

  return {
    checkedAt,
    website: {
      url: url.toString(),
      isUp: home.isUp,
      statusCode: home.statusCode,
      downSince: home.isUp ? undefined : history.downSince ?? checkedAt,
      lastSuccessfulCheck: home.isUp ? checkedAt : history.lastSuccess,
      responseTimeMs: home.responseTimeMs,
      // Filled in by the app from the uptime_checks table.
      uptimeDays: [],
      httpsEnabled: home.isUp ? home.finalUrl.startsWith('https://') : url.protocol === 'https:',
      redirectsToHttps: httpsRedirect,
      mobileFriendly: speed.mobileFriendly ?? seoResult?.home.hasViewport ?? true,
    },
    seo: seoResult?.seo,
    performance: home.isUp ? speed.performance : undefined,
  };
}
