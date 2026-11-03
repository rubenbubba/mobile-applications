import { buildDemoSnapshot } from '../../src/data/demo/buildSnapshot';
import { DEMO_DEFINITIONS, type DemoDefinition } from '../../src/data/demo/businesses';
import { deriveIssues } from '../../src/logic/issueRules';
import { deriveOverview } from '../../src/logic/overview';
import { ratingPeriods } from '../../src/logic/reviewInsights';
import {
  averageRating,
  computeOverallScore,
  METRIC_THRESHOLDS,
  metricScore,
  performanceScore,
  ratingForMetric,
  reviewsScore,
  SITE_DOWN_SCORE_CAP,
  statusForScore,
} from '../../src/logic/scoring';
import { normalizeWebsiteUrl } from '../../src/logic/url';
import { darkTheme, lightTheme, type Theme } from '../../src/theme/tokens';
import type { IssueId } from '../../src/types/Issue';
import type { ReviewsData } from '../../src/types/Monitoring';

const NOW = new Date('2026-11-03T12:00:00.000Z');

function definition(id: string): DemoDefinition {
  const found = DEMO_DEFINITIONS.find((item) => item.business.id === id);
  if (found === undefined) throw new Error(`Unknown business ${id}`);
  return found;
}

function overviewFor(id: string, verifiedFixes: IssueId[] = []) {
  const item = definition(id);
  return deriveOverview({
    business: item.business,
    snapshot: buildDemoSnapshot(item, { verifiedFixes, repliedReviewIds: [] }, NOW),
    progress: { markedFixed: [], verifiedFixes },
    checkLog: [],
    now: NOW,
  });
}

describe('Scoring', () => {
  it('uses the status thresholds', () => {
    expect(statusForScore(80)).to.equal('healthy');
    expect(statusForScore(79)).to.equal('warning');
    expect(statusForScore(50)).to.equal('warning');
    expect(statusForScore(49)).to.equal('critical');
  });

  it('applies the Core Web Vitals thresholds', () => {
    expect(ratingForMetric(2.5, METRIC_THRESHOLDS.lcp)).to.equal('good');
    expect(ratingForMetric(4, METRIC_THRESHOLDS.lcp)).to.equal('needs-work');
    expect(ratingForMetric(4.1, METRIC_THRESHOLDS.lcp)).to.equal('poor');
    expect(ratingForMetric(200, METRIC_THRESHOLDS.inp)).to.equal('good');
    expect(ratingForMetric(0.25, METRIC_THRESHOLDS.cls)).to.equal('needs-work');
    expect(metricScore(2.5, METRIC_THRESHOLDS.lcp)).to.equal(1);
    expect(metricScore(4, METRIC_THRESHOLDS.lcp)).to.equal(0.5);
    expect(metricScore(6, METRIC_THRESHOLDS.lcp)).to.equal(0);
  });

  it('rebalances weights instead of counting a missing section as zero', () => {
    expect(computeOverallScore({ website: 80, performance: 80 }, false)).to.equal(80);
    expect(computeOverallScore({ website: 100, reviews: 100, seo: 100, performance: 100 }, false)).to.equal(100);
    expect(computeOverallScore({}, false)).to.equal(undefined);
  });

  it('caps the overall score while the website is down', () => {
    expect(computeOverallScore({ website: 0, reviews: 100, seo: 100, performance: 100 }, true)).to.be.at.most(SITE_DOWN_SCORE_CAP);
  });

  it('does not punish a site for missing interaction data', () => {
    const data = definition('praktijk-lindenhof').performance;
    expect(data.inpMs).to.equal(undefined);
    expect(performanceScore(data)).to.equal(100);
  });

  it('gives no review score when there are no reviews yet', () => {
    const empty: ReviewsData = { ratings: [], recent: [] };
    expect(averageRating(empty)).to.equal(undefined);
    expect(reviewsScore(empty, NOW)).to.equal(undefined);
  });
});

describe('Demo businesses', () => {
  it('shows a different situation for each business', () => {
    expect(overviewFor('bakkerij-zonneveld').status).to.equal('warning');
    expect(overviewFor('praktijk-lindenhof').status).to.equal('healthy');
    expect(overviewFor('fietsatelier-de-spaak').status).to.equal('critical');
  });

  it('marks sections it could not measure as unavailable', () => {
    const { areas } = overviewFor('fietsatelier-de-spaak');
    expect(areas.reviews.status).to.equal('unavailable');
    expect(areas.seo.status).to.equal('unavailable');
    expect(areas.performance.status).to.equal('unavailable');
    expect(areas.website.score).to.equal(0);
  });

  it('labels all demo sections as demo, never as live', () => {
    for (const item of DEMO_DEFINITIONS) {
      const snapshot = buildDemoSnapshot(item, { verifiedFixes: [], repliedReviewIds: [] }, NOW);
      for (const section of [snapshot.website, snapshot.reviews, snapshot.seo, snapshot.performance]) {
        expect(section.source).to.not.equal('live');
      }
    }
  });

  it('builds the same numbers on every run', () => {
    const first = overviewFor('bakkerij-zonneveld');
    const second = overviewFor('bakkerij-zonneveld');
    expect(first.overall).to.equal(second.overall);
    expect(first.trend).to.deep.equal(second.trend);
  });
});

describe('Derived data stays consistent', () => {
  it('works out the review count and average from the raw ratings', () => {
    const snapshot = buildDemoSnapshot(definition('bakkerij-zonneveld'), { verifiedFixes: [], repliedReviewIds: [] }, NOW);
    if (snapshot.reviews.source === 'unavailable') throw new Error('Expected reviews');

    const { ratings, recent } = snapshot.reviews.value;
    const mean = ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length;

    expect(averageRating(snapshot.reviews.value)).to.be.closeTo(mean, 0.0001);
    expect(ratings.length).to.be.greaterThan(recent.length);
    expect(recent.every((review) => ratings.some((rating) => rating.date === review.date && rating.stars === review.stars))).to.equal(true);
  });

  it('ends the trend on the current score', () => {
    const { trend, overall } = overviewFor('bakkerij-zonneveld');
    expect(trend).to.have.length(12);
    expect(trend[trend.length - 1]?.value).to.equal(overall);
  });

  it('never counts a rating twice across the 30-day periods', () => {
    const snapshot = buildDemoSnapshot(definition('bakkerij-zonneveld'), { verifiedFixes: [], repliedReviewIds: [] }, NOW);
    if (snapshot.reviews.source === 'unavailable') throw new Error('Expected reviews');

    const points = ratingPeriods(snapshot.reviews.value, NOW);
    expect(points).to.have.length(6);
    expect(points.every((point) => point.value >= 0 && point.value <= 5)).to.equal(true);
  });
});

describe('Fixes', () => {
  it('raises the score once a check has confirmed the fix', () => {
    const before = overviewFor('bakkerij-zonneveld');
    const after = overviewFor('bakkerij-zonneveld', ['certificate-expiring']);

    expect(after.overall ?? 0).to.be.greaterThan(before.overall ?? 0);
    expect(after.issues.find((issue) => issue.id === 'certificate-expiring')?.state).to.equal('resolved');
  });

  it('does not change the score when an issue is only marked as fixed', () => {
    const item = definition('bakkerij-zonneveld');
    const snapshot = buildDemoSnapshot(item, { verifiedFixes: [], repliedReviewIds: [] }, NOW);
    const marked = deriveOverview({
      business: item.business,
      snapshot,
      progress: { markedFixed: ['certificate-expiring'], verifiedFixes: [] },
      checkLog: [],
      now: NOW,
    });

    expect(marked.overall).to.equal(overviewFor('bakkerij-zonneveld').overall);
    expect(marked.issues.find((issue) => issue.id === 'certificate-expiring')?.state).to.equal('marked-fixed');
  });

  it('runs the checks that were blocked once the website is back', () => {
    const after = overviewFor('fietsatelier-de-spaak', ['site-down']);

    expect(after.areas.website.score ?? 0).to.be.greaterThan(0);
    expect(after.areas.seo.status).to.not.equal('unavailable');
    expect(after.issues.some((issue) => issue.area === 'seo' && issue.state === 'open')).to.equal(true);
  });

  it('can fix every issue that can be marked as fixed', () => {
    for (const item of DEMO_DEFINITIONS) {
      const snapshot = buildDemoSnapshot(item, { verifiedFixes: [], repliedReviewIds: [] }, NOW);
      const fixable = deriveIssues(snapshot, NOW, { markedFixed: [], verifiedFixes: [] })
        .filter((issue) => issue.canMarkFixed)
        .map((issue) => issue.id);
      const fixed = buildDemoSnapshot(item, { verifiedFixes: fixable, repliedReviewIds: [] }, NOW);
      const remaining = deriveIssues(fixed, NOW, { markedFixed: [], verifiedFixes: fixable }).filter(
        (issue) => fixable.includes(issue.id) && issue.state !== 'resolved',
      );

      expect(remaining.map((issue) => issue.id), item.business.name).to.deep.equal([]);
    }
  });
});

describe('Website addresses', () => {
  it('accepts normal addresses and adds https', () => {
    expect(normalizeWebsiteUrl('www.example.com')).to.deep.equal({ ok: true, url: 'https://www.example.com' });
    expect(normalizeWebsiteUrl(' https://example.be/contact ')).to.deep.equal({ ok: true, url: 'https://example.be/contact' });
  });

  it('rejects empty, insecure and invalid addresses', () => {
    expect(normalizeWebsiteUrl('').ok).to.equal(false);
    expect(normalizeWebsiteUrl('http://example.com').ok).to.equal(false);
    expect(normalizeWebsiteUrl('not a website').ok).to.equal(false);
    expect(normalizeWebsiteUrl('javascript://alert(1)').ok).to.equal(false);
  });
});

describe('Colour contrast', () => {
  function channel(value: number): number {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  }

  function luminance(hex: string): number {
    const red = parseInt(hex.slice(1, 3), 16);
    const green = parseInt(hex.slice(3, 5), 16);
    const blue = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  }

  function contrast(first: string, second: string): number {
    const lighter = Math.max(luminance(first), luminance(second));
    const darker = Math.min(luminance(first), luminance(second));
    return (lighter + 0.05) / (darker + 0.05);
  }

  function pairs({ colors }: Theme): [string, string, string][] {
    const tones = Object.entries(colors.tones).map(([name, tone]): [string, string, string] => [
      `${name} text on ${name} background`,
      tone.text,
      tone.background,
    ]);

    return [
      ['text on background', colors.text, colors.background],
      ['text on surface', colors.text, colors.surface],
      ['secondary on surface', colors.textSecondary, colors.surface],
      ['secondary on background', colors.textSecondary, colors.background],
      ['secondary on muted surface', colors.textSecondary, colors.surfaceMuted],
      ['muted on surface', colors.textMuted, colors.surface],
      ['muted on background', colors.textMuted, colors.background],
      ['on-accent on accent', colors.onAccent, colors.accent],
      ['toast text on toast', colors.onScrim, colors.scrim],
      ['count on critical mark', colors.onCriticalMark, colors.tones.critical.mark],
      ['accent text on surface', colors.accentText, colors.surface],
      ['accent text on accent soft', colors.accentText, colors.accentSoft],
      ...tones,
    ];
  }

  const themes: [string, Theme][] = [['light', lightTheme], ['dark', darkTheme]];

  for (const [name, theme] of themes) {
    it(`meets 4.5:1 for all text in ${name} mode`, () => {
      for (const [label, foreground, background] of pairs(theme)) {
        expect(contrast(foreground, background), `${name}: ${label}`).to.be.at.least(4.5);
      }
    });
  }
});
