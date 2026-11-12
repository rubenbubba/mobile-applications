import type { Issue, IssueId, IssueState, Severity } from '../types/Issue';
import type {
  Area,
  PerformanceData,
  ReviewsData,
  SeoData,
  SnapshotSections,
  WebsiteData,
} from '../types/Monitoring';
import { formatDayMonth, pluralize } from './format';
import {
  METRIC_THRESHOLDS,
  ratingsInWindow,
  reviewsNeedingReply,
  sectionValue,
} from './scoring';

interface RuleContext {
  sections: SnapshotSections;
  website?: WebsiteData;
  reviews?: ReviewsData;
  seo?: SeoData;
  performance?: PerformanceData;
  now: Date;
}

interface Detection {
  severity: Severity;
  explanation: string;
  affected?: string[];
}

interface IssueRule {
  id: IssueId;
  area: Area;
  title: string;
  defaultSeverity: Severity;
  fallbackExplanation: string;
  whyItMatters: string;
  recommendation: string;
  steps: string[];
  canMarkFixed: boolean;
  detect: (context: RuleContext) => Detection | undefined;
}

const HEAVY_IMAGES_MB = 1.5;

function ratingMean(ratings: { stars: number }[]): number {
  return ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length;
}

export const ISSUE_RULES: IssueRule[] = [
  {
    id: 'site-down',
    area: 'website',
    title: 'Your website is down',
    defaultSeverity: 'critical',
    fallbackExplanation: 'Your website was not responding and people saw an error page.',
    whyItMatters:
      'While it is down, customers cannot find your opening hours or contact you, and they may go to a competitor instead.',
    recommendation: 'Contact whoever manages your website and tell them it is showing an error.',
    steps: [
      'Open your website on your phone to confirm the problem.',
      'Contact your web host or developer and mention the error code shown here.',
      'When the site is back, mark this as fixed and run a new check.',
    ],
    canMarkFixed: true,
    detect: ({ website }) =>
      website !== undefined && !website.isUp
        ? {
            severity: 'critical',
            explanation: `Your website is not responding (error ${website.statusCode}). Anyone trying to visit sees an error page.`,
          }
        : undefined,
  },
  {
    id: 'not-mobile-friendly',
    area: 'website',
    title: 'Your website is hard to use on a phone',
    defaultSeverity: 'high',
    fallbackExplanation: 'Text and buttons were too small to use comfortably on a phone.',
    whyItMatters: 'Most people look up local businesses on their phone. If the site is awkward to use, many of them leave.',
    recommendation: 'Ask your web developer to make the site adapt to phone screens.',
    steps: [
      'Open your website on your own phone and try to find your phone number.',
      'Share what felt difficult with your web developer.',
      'Ask them to use a layout that adapts to small screens.',
    ],
    canMarkFixed: true,
    detect: ({ website }) =>
      website?.isUp === true && !website.mobileFriendly
        ? { severity: 'high', explanation: 'Text and buttons are too small to use comfortably on a phone.' }
        : undefined,
  },
  {
    id: 'certificate-expiring',
    area: 'website',
    title: 'Your security certificate is about to expire',
    defaultSeverity: 'high',
    fallbackExplanation: 'Your security certificate was close to its expiry date.',
    whyItMatters:
      'Once it expires, browsers warn visitors that your site is not safe. Most people leave straight away, and online orders stop working.',
    recommendation: 'Ask your web host to renew it and switch on automatic renewal.',
    steps: [
      'Contact your web host and ask them to renew the SSL certificate.',
      'Ask them to turn on automatic renewal so this does not happen again.',
    ],
    canMarkFixed: true,
    detect: ({ website }) => {
      const days = website?.certificateExpiresInDays;
      return website?.isUp === true && website.httpsEnabled && days !== undefined && days < 30
        ? {
            severity: days < 14 ? 'high' : 'medium',
            explanation: `Your site's security certificate expires in ${pluralize(days, 'day')}. After that, browsers warn visitors that your site is not safe.`,
          }
        : undefined;
    },
  },
  {
    id: 'no-https-redirect',
    area: 'website',
    title: 'Visitors can land on an insecure version of your site',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Visitors using the old http:// address were not sent to the secure version.',
    whyItMatters: 'Browsers mark the insecure version as "Not secure", which makes people trust your business less.',
    recommendation: 'Ask your web host to send all visitors to the secure https:// address.',
    steps: ['Ask your web host to turn on a redirect from http to https.'],
    canMarkFixed: true,
    detect: ({ website }) =>
      website?.isUp === true && !website.redirectsToHttps
        ? {
            severity: 'medium',
            explanation: 'People who use the old http:// address are not sent to the secure version of your site.',
          }
        : undefined,
  },
  {
    id: 'slow-server',
    area: 'website',
    title: 'Your web server responds slowly',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Your web server took a long time to respond.',
    whyItMatters: 'Every page starts with this wait, so a slow server makes your whole site feel slow.',
    recommendation: 'Ask your web host whether caching can be turned on or a faster plan is available.',
    steps: [
      'Ask your web host why the server is slow to respond.',
      'Ask whether caching can be turned on.',
      'If that does not help, compare with a faster hosting plan.',
    ],
    canMarkFixed: true,
    detect: ({ website }) =>
      website?.isUp === true && website.responseTimeMs > 800
        ? {
            severity: website.responseTimeMs > 1500 ? 'high' : 'medium',
            explanation: `Your server takes ${website.responseTimeMs} ms to respond. Under 400 ms is good.`,
          }
        : undefined,
  },
  {
    id: 'uptime-dips',
    area: 'website',
    title: 'Your website had short outages this week',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Your website was briefly unreachable during the week.',
    whyItMatters: 'Short outages are easy to miss, but they turn away anyone trying to visit at that moment.',
    recommendation: 'Share the dates with your web host and ask what caused the outages.',
    steps: ['Send the dates listed here to your web host.', 'Ask what caused the outages and how they will prevent them.'],
    canMarkFixed: true,
    detect: ({ website }) => {
      if (website?.isUp !== true) return undefined;
      const lastWeek = website.uptimeDays.slice(-7);
      const dips = lastWeek.filter((day) => day.uptimePercent < 99.5);
      if (dips.length === 0) return undefined;

      return {
        severity: 'medium',
        explanation: `Your website had short outages on ${pluralize(dips.length, 'day')} in the last week.`,
        affected: dips.map((day) => formatDayMonth(day.date)),
      };
    },
  },
  {
    id: 'reviews-not-connected',
    area: 'reviews',
    title: 'Your Google reviews are not connected',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Your Google Business Profile was not connected.',
    whyItMatters: 'Reviews are often the first thing a new customer sees, and you cannot respond to feedback you do not see.',
    recommendation: 'Connect your Google Business Profile so reviews can be tracked here.',
    steps: [
      'Find or claim your business at business.google.com.',
      'Connect the profile, then mark this as fixed and run a new check.',
    ],
    canMarkFixed: true,
    detect: ({ sections }) =>
      sections.reviews.source === 'unavailable' && sections.reviews.reasonCode === 'not-connected'
        ? { severity: 'medium', explanation: 'We cannot see your Google reviews because your profile is not connected yet.' }
        : undefined,
  },
  {
    id: 'unanswered-negative-reviews',
    area: 'reviews',
    title: 'Unhappy customers are waiting for a reply',
    defaultSeverity: 'high',
    fallbackExplanation: 'Some negative reviews had no reply yet.',
    whyItMatters:
      'Future customers read how you respond. A calm reply shows you care, and can matter more than the review itself.',
    recommendation: 'Reply to each of these reviews in a friendly way and offer to put things right.',
    steps: [
      'Open each review on the Reviews screen and read the suggested reply.',
      'Adapt it in your own words and post it on Google.',
      'Mark the review as replied.',
    ],
    canMarkFixed: true,
    detect: ({ reviews }) => {
      if (reviews === undefined) return undefined;
      const waiting = reviewsNeedingReply(reviews);
      if (waiting.length === 0) return undefined;

      return {
        severity: 'high',
        explanation: `${pluralize(waiting.length, 'negative review')} still ${waiting.length === 1 ? 'has' : 'have'} no reply.`,
        affected: waiting.map((review) => `${review.author} (${review.stars} star)`),
      };
    },
  },
  {
    id: 'rating-dropping',
    area: 'reviews',
    title: 'Your average rating is going down',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Recent reviews were lower than the ones before them.',
    whyItMatters: 'A falling rating often points to a real problem in the business, and customers notice it when comparing.',
    recommendation: 'Read your recent low reviews and look for a pattern you can fix.',
    steps: [
      'Read your low reviews from the last three months.',
      'Look for a repeated complaint.',
      'Fix the cause, then ask happy customers to leave a review.',
    ],
    canMarkFixed: false,
    detect: ({ reviews, now }) => {
      if (reviews === undefined) return undefined;
      const recent = ratingsInWindow(reviews, now, 0, 90);
      const previous = ratingsInWindow(reviews, now, 90, 180);
      if (recent.length < 5 || previous.length < 5) return undefined;

      const drop = ratingMean(previous) - ratingMean(recent);
      return drop >= 0.2
        ? {
            severity: 'medium',
            explanation: `Reviews from the last 3 months average ${ratingMean(recent).toFixed(1)} stars, compared with ${ratingMean(previous).toFixed(1)} the 3 months before.`,
          }
        : undefined;
    },
  },
  {
    id: 'few-recent-reviews',
    area: 'reviews',
    title: 'You have few recent reviews',
    defaultSeverity: 'low',
    fallbackExplanation: 'You had received few reviews recently.',
    whyItMatters: 'People trust recent reviews more than old ones, and steady reviews help you show up in local search.',
    recommendation: 'Ask happy customers to leave a review, for example with a QR code at the till.',
    steps: ['Create a review link in your Google Business Profile.', 'Share it at the till or in your order emails.'],
    canMarkFixed: true,
    detect: ({ reviews, now }) => {
      if (reviews === undefined || reviews.ratings.length === 0) return undefined;
      const recent = ratingsInWindow(reviews, now, 0, 90).length;

      return recent < 3
        ? { severity: 'low', explanation: `You received ${pluralize(recent, 'review')} in the last 3 months.` }
        : undefined;
    },
  },
  {
    id: 'missing-page-titles',
    area: 'seo',
    title: 'Some pages have no title for Google',
    defaultSeverity: 'high',
    fallbackExplanation: 'Some pages had no title.',
    whyItMatters: 'The title is the blue link people click in Google. Without one, Google guesses, and fewer people click.',
    recommendation: 'Give every page a short title that says what it is and where you are.',
    steps: [
      'Open the page settings in your website editor.',
      'Write a title under 60 characters, such as "Bike repairs in Mechelen".',
    ],
    canMarkFixed: true,
    detect: ({ seo }) => {
      const pages = seo?.pages.filter((page) => page.title === undefined) ?? [];
      return pages.length > 0
        ? {
            severity: 'high',
            explanation: `${pluralize(pages.length, 'page')} ${pages.length === 1 ? 'has' : 'have'} no title.`,
            affected: pages.map((page) => page.name),
          }
        : undefined;
    },
  },
  {
    id: 'pages-hidden-from-google',
    area: 'seo',
    title: 'Some pages are hidden from Google',
    defaultSeverity: 'high',
    fallbackExplanation: 'Some pages were set to stay out of Google.',
    whyItMatters: 'People cannot find these pages through search. This is often switched on by accident.',
    recommendation: 'Check the visibility setting of these pages and allow search engines.',
    steps: [
      'Open the page settings in your website editor.',
      'Turn off "Hide from search engines" (also called "noindex").',
    ],
    canMarkFixed: true,
    detect: ({ seo }) => {
      const pages = seo?.pages.filter((page) => !page.indexable) ?? [];
      return pages.length > 0
        ? {
            severity: 'high',
            explanation: `${pluralize(pages.length, 'page')} ${pages.length === 1 ? 'is' : 'are'} set to stay out of Google search results.`,
            affected: pages.map((page) => page.name),
          }
        : undefined;
    },
  },
  {
    id: 'missing-meta-descriptions',
    area: 'seo',
    title: 'Some pages have no description for Google',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Some pages had no description.',
    whyItMatters: 'The description is the short text under your link in Google. A good one convinces people to click.',
    recommendation: 'Write one or two inviting sentences for each page.',
    steps: [
      'Open the page settings in your website editor.',
      'Add a description under 155 characters that says what visitors will find.',
    ],
    canMarkFixed: true,
    detect: ({ seo }) => {
      const pages = seo?.pages.filter((page) => page.metaDescription === undefined) ?? [];
      return pages.length > 0
        ? {
            severity: 'medium',
            explanation: `${pluralize(pages.length, 'page')} ${pages.length === 1 ? 'has' : 'have'} no description.`,
            affected: pages.map((page) => page.name),
          }
        : undefined;
    },
  },
  {
    id: 'broken-links',
    area: 'seo',
    title: 'Some links on your site lead nowhere',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Some links led to pages that no longer exist.',
    whyItMatters: 'Visitors hit a dead end and lose trust, and search engines see it as a sign of a neglected site.',
    recommendation: 'Update these links or remove them.',
    steps: ['Open the page listed next to each link.', 'Point the link to the right page, or remove it.'],
    canMarkFixed: true,
    detect: ({ seo }) =>
      seo !== undefined && seo.brokenLinks.length > 0
        ? {
            severity: 'medium',
            explanation: `${pluralize(seo.brokenLinks.length, 'link')} ${seo.brokenLinks.length === 1 ? 'leads' : 'lead'} to a page that no longer exists.`,
            affected: seo.brokenLinks.map((link) => `${link.target} (on ${link.fromPath})`),
          }
        : undefined,
  },
  {
    id: 'heading-structure',
    area: 'seo',
    title: 'Some pages have confusing headings',
    defaultSeverity: 'low',
    fallbackExplanation: 'Some pages had confusing headings.',
    whyItMatters: 'Clear headings help visitors scan a page and help Google understand what it is about.',
    recommendation: 'Give each page one main heading, with smaller headings below it in order.',
    steps: ['Make sure each page has exactly one main heading (H1).', 'Use smaller headings in order below it.'],
    canMarkFixed: true,
    detect: ({ seo }) => {
      const pages = seo?.pages.filter((page) => page.h1Count !== 1 || !page.headingsInOrder) ?? [];
      return pages.length > 0
        ? {
            severity: 'low',
            explanation: `${pluralize(pages.length, 'page')} ${pages.length === 1 ? 'has' : 'have'} missing, repeated or out-of-order headings.`,
            affected: pages.map((page) => page.name),
          }
        : undefined;
    },
  },
  {
    id: 'no-sitemap',
    area: 'seo',
    title: 'Google has no list of your pages',
    defaultSeverity: 'low',
    fallbackExplanation: 'Your site had no sitemap.',
    whyItMatters: 'A sitemap helps Google find all your pages, including new ones, more quickly.',
    recommendation: 'Turn on the sitemap in your website editor, or ask your developer to add one.',
    steps: ['Turn on the sitemap option in your website editor.', 'Submit it in Google Search Console.'],
    canMarkFixed: true,
    detect: ({ seo }) =>
      seo !== undefined && !seo.hasSitemap
        ? { severity: 'low', explanation: 'Your site has no sitemap, the list of pages that search engines read.' }
        : undefined,
  },
  {
    id: 'no-structured-data',
    area: 'seo',
    title: 'Google cannot read your business details',
    defaultSeverity: 'low',
    fallbackExplanation: 'Your site had no structured business details.',
    whyItMatters: 'With structured details, Google can show your opening hours and address directly in the search results.',
    recommendation: 'Add business details to your site in a format Google can read.',
    steps: ['Ask your developer to add "LocalBusiness" structured data with your hours and address.'],
    canMarkFixed: true,
    detect: ({ seo }) =>
      seo !== undefined && !seo.hasStructuredData
        ? { severity: 'low', explanation: 'Your opening hours and address are not in a format Google can read directly.' }
        : undefined,
  },
  {
    id: 'slow-main-content',
    area: 'performance',
    title: 'Your main content appears slowly',
    defaultSeverity: 'medium',
    fallbackExplanation: 'The main content of your homepage took a long time to appear.',
    whyItMatters: 'People often leave a page that takes more than a few seconds, especially on a phone.',
    recommendation: 'Start with the biggest image on your homepage and make it smaller.',
    steps: ['Find the largest image on your homepage.', 'Resize and compress it, then check again.'],
    canMarkFixed: true,
    detect: ({ performance }) =>
      performance !== undefined && performance.lcpSeconds > METRIC_THRESHOLDS.lcp.good
        ? {
            severity: performance.lcpSeconds > METRIC_THRESHOLDS.lcp.poor ? 'high' : 'medium',
            explanation: `It takes ${performance.lcpSeconds.toFixed(1)} seconds before your main content appears. Under ${METRIC_THRESHOLDS.lcp.good} seconds is good.`,
          }
        : undefined,
  },
  {
    id: 'heavy-images',
    area: 'performance',
    title: 'Your images are too large',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Images made up most of your page size.',
    whyItMatters: 'Large images are the most common reason for slow pages, and they use up visitors\' mobile data.',
    recommendation: 'Compress your images. This is usually the quickest way to speed up a site.',
    steps: [
      'Run your images through a free tool such as Squoosh.',
      'Upload the smaller versions to your website.',
      'Keep photos under about 200 KB where possible.',
    ],
    canMarkFixed: true,
    detect: ({ performance }) => {
      const images = performance?.weightParts.find((part) => part.id === 'images');
      return images !== undefined && images.sizeMb > HEAVY_IMAGES_MB
        ? { severity: 'medium', explanation: `Images add ${images.sizeMb.toFixed(1)} MB to your homepage.` }
        : undefined;
    },
  },
  {
    id: 'slow-interaction',
    area: 'performance',
    title: 'Your site reacts slowly to taps and clicks',
    defaultSeverity: 'medium',
    fallbackExplanation: 'Your site reacted slowly when people tapped or clicked.',
    whyItMatters: 'When a button seems to do nothing, people tap again or give up.',
    recommendation: 'Remove plugins and scripts you no longer use.',
    steps: ['List the plugins and tracking scripts on your site.', 'Remove what you no longer need.'],
    canMarkFixed: true,
    detect: ({ performance }) =>
      performance?.inpMs !== undefined && performance.inpMs > METRIC_THRESHOLDS.inp.good
        ? {
            severity: performance.inpMs > METRIC_THRESHOLDS.inp.poor ? 'high' : 'medium',
            explanation: `Your site takes about ${performance.inpMs} ms to react to a tap. Under ${METRIC_THRESHOLDS.inp.good} ms is good.`,
          }
        : undefined,
  },
  {
    id: 'layout-shift',
    area: 'performance',
    title: 'Your pages jump around while loading',
    defaultSeverity: 'low',
    fallbackExplanation: 'Content moved around while your pages were loading.',
    whyItMatters: 'When content jumps, people lose their place or tap the wrong thing.',
    recommendation: 'Ask your developer to reserve space for images and banners.',
    steps: ['Ask your developer to set a fixed size for images and banners.'],
    canMarkFixed: true,
    detect: ({ performance }) =>
      performance !== undefined && performance.cls > METRIC_THRESHOLDS.cls.good
        ? {
            severity: performance.cls > METRIC_THRESHOLDS.cls.poor ? 'medium' : 'low',
            explanation: 'Content moves around while the page loads, because images and banners appear late.',
          }
        : undefined,
  },
];

export const ISSUE_IDS: IssueId[] = ISSUE_RULES.map((rule) => rule.id);

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const STATE_RANK: Record<IssueState, number> = { open: 2, 'marked-fixed': 1, resolved: 0 };

export interface IssueProgress {
  markedFixed: IssueId[];
  verifiedFixes: IssueId[];
}

export function deriveIssues(sections: SnapshotSections, now: Date, progress: IssueProgress): Issue[] {
  const context: RuleContext = {
    sections,
    website: sectionValue(sections.website),
    reviews: sectionValue(sections.reviews),
    seo: sectionValue(sections.seo),
    performance: sectionValue(sections.performance),
    now,
  };

  const issues: Issue[] = [];

  for (const rule of ISSUE_RULES) {
    const detection = rule.detect(context);
    const isVerified = progress.verifiedFixes.includes(rule.id);
    if (detection === undefined && !isVerified) continue;

    const state: IssueState =
      detection === undefined ? 'resolved' : progress.markedFixed.includes(rule.id) ? 'marked-fixed' : 'open';

    issues.push({
      id: rule.id,
      area: rule.area,
      severity: detection?.severity ?? rule.defaultSeverity,
      title: rule.title,
      explanation: detection?.explanation ?? rule.fallbackExplanation,
      whyItMatters: rule.whyItMatters,
      recommendation: rule.recommendation,
      steps: rule.steps,
      affected: detection?.affected ?? [],
      canMarkFixed: rule.canMarkFixed,
      state,
    });
  }

  return issues.sort(
    (a, b) => STATE_RANK[b.state] - STATE_RANK[a.state] || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
  );
}

export function detectedIssueIds(sections: SnapshotSections, now: Date): IssueId[] {
  return deriveIssues(sections, now, { markedFixed: [], verifiedFixes: [] }).map((issue) => issue.id);
}

export function issueTitle(id: IssueId): string {
  return ISSUE_RULES.find((rule) => rule.id === id)?.title ?? id;
}

export function isIssueId(value: string): value is IssueId {
  return ISSUE_RULES.some((rule) => rule.id === value);
}
