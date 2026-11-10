// Reads the few things the app needs from a page's HTML. Simple patterns are enough for these checks.

export interface PageFacts {
  title?: string;
  metaDescription?: string;
  h1Count: number;
  headingsInOrder: boolean;
  indexable: boolean;
  hasStructuredData: boolean;
  hasViewport: boolean;
  links: string[];
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function clean(text: string): string | undefined {
  const value = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
  return value === '' ? undefined : value;
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z-:]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? '';
  }
  return result;
}

function metaTags(html: string): Record<string, string>[] {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributes(match[0]));
}

const SKIPPED_FILES = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mp3)$/i;

export function readPage(html: string, pageUrl: URL, robotsHeader = ''): PageFacts {
  const head = html.slice(0, 300_000);
  const metas = metaTags(head);
  const named = (name: string) => metas.find((meta) => (meta.name ?? '').toLowerCase() === name)?.content;

  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  // Headers and menus often hold small headings before the main title, so the order is judged from the first h1:
  // after it, headings should not skip a level (an h2 followed by an h4 is confusing for screen readers and Google).
  const fromMainTitle = levels.slice(Math.max(0, levels.indexOf(1)));
  const headingsInOrder =
    levels.includes(1) && fromMainTitle.every((level, index) => index === 0 || level <= fromMainTitle[index - 1] + 1);

  const robots = `${named('robots') ?? ''} ${robotsHeader}`.toLowerCase();

  const links = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const href = match[2] ?? match[3] ?? '';
    try {
      const target = new URL(href, pageUrl);
      if (target.host !== pageUrl.host || !target.protocol.startsWith('http') || SKIPPED_FILES.test(target.pathname)) continue;
      target.hash = '';
      links.add(target.toString());
    } catch {
      // Not a usable link, such as "javascript:" or a broken href.
    }
  }

  return {
    title: clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? ''),
    metaDescription: clean(named('description') ?? ''),
    h1Count: levels.filter((level) => level === 1).length,
    headingsInOrder,
    indexable: !robots.includes('noindex'),
    hasStructuredData: /<script\b[^>]*type\s*=\s*["']application\/ld\+json["']/i.test(html),
    hasViewport: (named('viewport') ?? '').includes('width=device-width'),
    links: [...links],
  };
}

// "/opening-hours" becomes "Opening hours", so the app can name each page.
export function pageName(path: string): string {
  if (path === '/' || path === '') return 'Home';
  const last = path.replace(/\/$/, '').split('/').pop() ?? path;
  const words = decodeURIComponent(last).replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ').trim();
  return words === '' ? path : words.charAt(0).toUpperCase() + words.slice(1);
}
