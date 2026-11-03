import type { SeoData, SeoPage } from '../types/Monitoring';

export interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
}

function pageCount(pages: SeoPage[], matches: (page: SeoPage) => boolean): string {
  return `${pages.filter(matches).length} of ${pages.length} pages`;
}

export function pageHasGoodHeadings(page: SeoPage): boolean {
  return page.h1Count === 1 && page.headingsInOrder;
}

export function pageProblems(page: SeoPage): string[] {
  const problems: string[] = [];
  if (page.title === undefined) problems.push('No title');
  if (page.metaDescription === undefined) problems.push('No description');
  if (!pageHasGoodHeadings(page)) problems.push('Confusing headings');
  if (!page.indexable) problems.push('Hidden from Google');
  return problems;
}

export function seoChecklist(data: SeoData): ChecklistItem[] {
  const { pages, brokenLinks } = data;

  return [
    {
      id: 'titles',
      label: 'Page titles',
      detail: pageCount(pages, (page) => page.title !== undefined),
      passed: pages.every((page) => page.title !== undefined),
    },
    {
      id: 'descriptions',
      label: 'Descriptions',
      detail: pageCount(pages, (page) => page.metaDescription !== undefined),
      passed: pages.every((page) => page.metaDescription !== undefined),
    },
    {
      id: 'headings',
      label: 'Clear headings',
      detail: pageCount(pages, pageHasGoodHeadings),
      passed: pages.every(pageHasGoodHeadings),
    },
    {
      id: 'indexable',
      label: 'Visible in Google',
      detail: pageCount(pages, (page) => page.indexable),
      passed: pages.every((page) => page.indexable),
    },
    {
      id: 'links',
      label: 'Working links',
      detail: brokenLinks.length === 0 ? 'No broken links found' : `${brokenLinks.length} broken`,
      passed: brokenLinks.length === 0,
    },
    {
      id: 'sitemap',
      label: 'Sitemap',
      detail: data.hasSitemap ? 'Found' : 'Missing',
      passed: data.hasSitemap,
    },
    {
      id: 'structured',
      label: 'Business details for Google',
      detail: data.hasStructuredData ? 'Found' : 'Missing',
      passed: data.hasStructuredData,
    },
  ];
}
