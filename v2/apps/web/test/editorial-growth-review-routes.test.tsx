import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EditorialGrowthReviewShell } from '../components/design-review/editorial-growth-review-shell';
import type {
  EditorialGrowthReviewModel,
  ReviewCheck,
  ReviewSurface,
} from '../lib/design-review/editorial-growth-review-model';

vi.mock('server-only', () => ({}));

const REVIEW_MODEL = Object.freeze({
  locale: 'en',
  state: 'ready',
  ad: 'empty',
  seoulStatus: 'Updated 2026-08',
  headlineMetric: { label: 'Reported contracts', value: '120', context: '2026-08' },
  article: {
    title: 'A median is a boundary, not a home valuation',
    summary: 'A district median is useful context, but it cannot price one home.',
    market: 'Global',
    published: 'Sep 4, 2026',
    updated: 'Sep 4, 2026',
    readMinutes: 5,
    sections: [{ heading: 'Start with the cohort', body: 'A median describes a defined group.' }],
  },
  articles: [{
    title: 'How SignedPrice reads reported contracts',
    summary: 'The publication boundary behind the evidence.',
    market: 'Seoul',
    published: 'Sep 1, 2026',
    updated: 'Sep 3, 2026',
    readMinutes: 6,
    sections: [{ heading: 'Reported evidence', body: 'Each cohort starts with compatible contracts.' }],
  }],
  guides: [{
    title: 'Read district evidence',
    summary: 'Understand the comparison boundary.',
    stage: 'Market research',
    updated: '2026-09-04',
    href: '/kr/seoul/guide/read-district-evidence/',
  }],
  check: {
    state: 'ready',
    verdict: 'Typical range',
    scope: 'Gangnam-gu',
    metrics: [{ label: 'Median', value: '₩1,000,000,000', context: '2026-08' }],
    disclosure: 'Five compatible reported contracts.',
  },
  exploreRows: [{
    id: 'verified-1',
    name: 'Verified building',
    district: 'Gangnam-gu',
    primaryValue: '₩1,000,000,000',
    sample: '8 contracts',
    period: '2026-08',
    selected: true,
  }],
  exploreDistricts: [{
    id: 'gangnam-gu',
    name: 'Gangnam-gu',
    path: 'M0 0L10 0L10 10Z',
    selected: true,
    evidenceState: 'published',
  }],
} satisfies EditorialGrowthReviewModel);

async function renderReview(
  surface: ReviewSurface,
  overrides: Partial<Pick<EditorialGrowthReviewModel, 'locale' | 'state' | 'ad'>> = {},
) {
  const state = overrides.state ?? REVIEW_MODEL.state;
  const nonReadyCheck: ReviewCheck = {
    state,
    verdict: state === 'insufficient' ? 'Insufficient evidence' : 'Unavailable',
    scope: 'Seoul',
    metrics: [],
    disclosure: state === 'insufficient'
      ? 'Not enough compatible reported contracts for a distribution.'
      : 'Official evidence is temporarily unavailable.',
  };

  return renderToStaticMarkup(
    <EditorialGrowthReviewShell
      surface={surface}
      model={{
        ...REVIEW_MODEL,
        ...overrides,
        state,
        check: state === 'ready' ? REVIEW_MODEL.check : nonReadyCheck,
        exploreRows: state === 'ready' ? REVIEW_MODEL.exploreRows : [],
        exploreDistricts: state === 'ready' ? REVIEW_MODEL.exploreDistricts : [],
      }}
    />,
  );
}

describe('editorial growth design-review route', () => {
  it('is noindex with no canonical or language alternates', async () => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');

    expect(route.metadata).toEqual({
      title: 'SignedPrice editorial growth design review',
      robots: { index: false, follow: false },
    });
    expect(route.metadata).not.toHaveProperty('alternates');
  });

  it('prebuilds exactly the four closed review surfaces', async () => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');

    expect(route.generateStaticParams()).toEqual([
      { surface: 'home' },
      { surface: 'content' },
      { surface: 'check' },
      { surface: 'explore' },
    ]);
  });

  it.each(['home', 'content', 'check', 'explore'])('renders the %s review surface', async (surface) => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');
    const page = await route.default({
      params: Promise.resolve({ surface }),
      searchParams: Promise.resolve({ locale: 'en', state: 'ready', ad: 'empty' }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain(`data-review-surface="${surface}"`);
    expect(markup).toContain('aria-label="Design review surfaces"');
    expect(markup).toContain('aria-label="Design review languages"');
    expect(markup).toContain('Design review · not a public page');
  });

  it('retains locale, evidence state, and ad state in review navigation', async () => {
    const route = await import('../app/(en)/design-review/editorial-growth/[surface]/page');
    const page = await route.default({
      params: Promise.resolve({ surface: 'home' }),
      searchParams: Promise.resolve({ locale: 'zh-CN', state: 'insufficient', ad: 'loaded' }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('locale=zh-CN&amp;state=insufficient&amp;ad=loaded');
    expect(markup).toContain('locale=en&amp;state=insufficient&amp;ad=loaded');
  });

  it('is absent from public sitemap and navigation sources', () => {
    const sitemapSource = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
    const siteCopySource = readFileSync(new URL('../lib/site-copy.ts', import.meta.url), 'utf8');

    expect(sitemapSource).not.toContain('/design-review/');
    expect(siteCopySource).not.toContain('/design-review/');
  });

  it('gives Homepage one global promise and one primary action before editorial content', async () => {
    const markup = await renderReview('home', { locale: 'en' });

    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('See the market before you make the move.');
    expect(markup).toContain('data-primary-action="explore"');
    expect(markup.indexOf('data-primary-action="explore"'))
      .toBeLessThan(markup.indexOf('data-home-section="insight"'));
    expect(markup).toContain('data-market-id="kr-seoul"');
    expect(markup).toContain('data-market-id="sg-singapore"');
    expect(markup).toContain('data-market-id="ae-dubai"');
    expect(markup).not.toMatch(/🇰🇷|🇸🇬|🇦🇪/);
  });

  it('keeps Content readable and advertising outside evidence', async () => {
    const markup = await renderReview('content', { locale: 'en', ad: 'loaded' });

    expect(markup).toContain('data-content-region="article"');
    expect(markup).toContain('Advertisement');
    expect(markup.indexOf('data-ad-slot="article-1"'))
      .toBeGreaterThan(markup.indexOf('data-article-paragraph="1"'));
    expect(markup).toContain('SignedPrice');
    expect(markup).not.toContain('SignedPrice Data Desk');
    expect(markup).toMatch(/Updated/);
  });

  it('renders independent Simplified Chinese copy', async () => {
    const markup = await renderReview('content', { locale: 'zh-CN' });

    expect(markup).toContain('在韩国租房前，先看真实成交依据');
    expect(markup).not.toContain('Property evidence, explained.');
  });

  it('orders Check as input, verdict, figures, evidence, disclosure', async () => {
    const markup = await renderReview('check', { locale: 'en', state: 'ready' });
    const order = ['input', 'verdict', 'figures', 'evidence', 'disclosure']
      .map((name) => markup.indexOf(`data-check-region="${name}"`));

    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(markup).not.toContain('Advertisement');
  });

  it('renders insufficient Check without invented figures', async () => {
    const markup = await renderReview('check', { state: 'insufficient' });

    expect(markup).toContain('data-result-state="insufficient"');
    expect(markup).not.toMatch(/₩0|0 contracts|data-check-region="figures"/);
  });

  it('keeps Explore filter count and selected evidence bounded', async () => {
    const markup = await renderReview('explore', { state: 'ready' });

    expect(markup.match(/data-default-filter=/g)).toHaveLength(4);
    expect(markup).toContain('data-explore-layout="rail-map"');
    expect(markup).toContain('data-explore-rail="420"');
    expect(markup).toContain('data-selected-building="true"');
    expect(markup).not.toContain('Advertisement');
  });

  it.each([
    ['insufficient', 'Not enough compatible reported contracts for a distribution.'],
    ['error', 'Official evidence is temporarily unavailable.'],
  ] as const)('keeps %s Explore states non-numeric', async (state, message) => {
    const markup = await renderReview('explore', { state });

    expect(markup).toContain(`data-result-state="${state}"`);
    expect(markup).toContain(message);
    expect(markup).not.toMatch(/₩|data-selected-building="true"/);
  });
});
