import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import nextConfig from '../next.config';
import sitemap from '../app/sitemap';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { NewsroomIndex, resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { PolicyRecordArticle } from '../components/newsroom/policy-record-article';
import { PolicyTracker } from '../components/newsroom/policy-tracker';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import type { PublishedContentArticle } from '../lib/content/content-types';
import type { PolicyRecord } from '../lib/policy/policy-types';

const article: PublishedContentArticle = Object.freeze({
  id: 'story-1', slug: 'seoul-data-story', locale: 'en', marketId: 'kr-seoul',
  type: 'data-story', title: 'Seoul evidence changed', deck: 'A reviewed data story deck.',
  bodyMarkdown: '## First finding\n\nThe first finding.\n\n## Second finding\n\nThe second finding.',
  status: 'published', evidenceState: 'verified', authorName: 'SignedPrice Data Desk',
  reviewedAt: '2025-04-01T00:00:00.000Z', reviewedBy: 'Research editor',
  publishedAt: '2025-04-01T00:00:00.000Z', updatedAt: '2025-04-02T00:00:00.000Z',
  relatedHref: '/kr/seoul/explore/',
  sources: Object.freeze([Object.freeze({
    id: 'source-1', kind: 'primary', publisher: 'MOLIT', title: 'Reported contracts',
    href: 'https://rt.molit.go.kr/', checkedAt: '2025-04-02T00:00:00.000Z',
  })]),
});

const policy: PolicyRecord = Object.freeze({
  id: 'policy-1', slug: 'policy-one', marketId: 'sg-singapore', title: 'Policy one',
  summary: 'A reviewed policy update.', status: 'announced', announcedOn: '2025-03-01',
  enactedOn: null, effectiveOn: null, expiresOn: null, lastCheckedOn: '2025-04-01',
  affectedGroups: ['Buyers'], beforeAfter: null,
  source: Object.freeze({ publisher: 'Official authority', title: 'Official release', href: 'https://example.gov/policy', checkedAt: '2025-04-01' }),
  events: Object.freeze([Object.freeze({ type: 'announcement', date: '2025-03-01', label: 'Announced' })]),
});

const newsArticle: PublishedContentArticle = Object.freeze({
  ...article,
  id: 'news-1',
  slug: 'official-market-release',
  type: 'news-brief',
  title: 'Official market release',
});

describe('public Newsroom routes', () => {
  it('keeps budget comparisons in Insights and Data Stories, with a matching article breadcrumb', () => {
    for (const locale of ['en', 'ko'] as const) {
      const budget = getPortfolioRecord(locale, 'singapore-condo-buying-budget-guide')!;
      for (const type of ['insights', 'data-stories']) {
        const html = renderToStaticMarkup(<NewsroomIndex locale={locale} articles={[]} policies={[]} filters={resolveNewsroomFilters({ type, market: 'singapore' })} headlines={<p>Feed</p>} />);
        expect(html).toContain(budget.canonicalHref.slice(0, -1));
        expect(html).not.toContain('dubai-ready-apartment-buying-budget-guide');
      }
      const detail = renderToStaticMarkup(<NewsroomArticle article={budget} />);
      const breadcrumb = detail.match(/<nav[\s\S]*?<\/nav>/)?.[0] ?? '';
      expect(breadcrumb).toContain(locale === 'ko' ? '/ko/news' : '/news');
      expect(breadcrumb).toContain(locale === 'ko' ? '예산 비교' : 'Budget comparison');
    }
  });
  it('uses one News & Insights surface and keeps analysis types inside Insights', () => {
    const filters = resolveNewsroomFilters({ type: 'market', market: 'seoul' });
    expect(filters.canonicalHref).toBe('/news/?type=market&market=seoul');
    const marketArticle = { ...article, type: 'market-brief' as const };
    const html = renderToStaticMarkup(<NewsroomIndex articles={[marketArticle]} policies={[policy]} filters={filters} headlines={<p>External feed</p>} />);
    expect(html).toContain('<h1>News &amp; Insights</h1>');
    expect(html).toContain(article.title);
    expect(html).not.toContain(policy.title);
    expect(html).not.toContain('External feed');
    expect(html).toContain('href="/news?type=news&amp;market=seoul"');
    expect(html).toContain('Market Insight');
    expect(html).toContain('Data Stories');
    expect(html).toContain('>Insights</a>');
    expect(html).not.toContain('Analysis reports');
  });
  it('normalizes type and market filters into one canonical query URL', () => {
    expect(resolveNewsroomFilters({ type: 'policy', market: 'singapore' })).toEqual({
      type: 'policy', market: 'singapore', canonicalHref: '/news/?type=policy&market=singapore',
    });
    expect(resolveNewsroomFilters({ type: 'analysis', market: 'seoul' })).toEqual({
      type: 'insights', market: 'seoul', canonicalHref: '/news/?market=seoul',
    });
    expect(resolveNewsroomFilters({ type: 'headlines', market: 'dubai' })).toEqual({
      type: 'news', market: 'dubai', canonicalHref: '/news/?type=news&market=dubai',
    });
    expect(resolveNewsroomFilters({ type: 'unknown', market: ['seoul'] })).toEqual({
      type: 'insights', market: 'all', canonicalHref: '/news/',
    });
  });

  it('keeps official news briefs and external headlines together without mixing in analysis', () => {
    const filters = resolveNewsroomFilters({ type: 'news', market: 'seoul' });
    const html = renderToStaticMarkup(<NewsroomIndex
      articles={[newsArticle, article]}
      policies={[policy]}
      filters={filters}
      headlines={<p>External feed</p>}
    />);

    expect(html).toContain(newsArticle.title);
    expect(html).toContain('External feed');
    expect(html).not.toContain(article.title);
    expect(html).not.toContain(policy.title);
  });

  it('renders three hub tabs, five market filters, one lead, and a row list without desk diagnostics', () => {
    const html = renderToStaticMarkup(<NewsroomIndex
      articles={[article, { ...article, id: 'story-2', slug: 'second-story', title: 'Second story' }]}
      policies={[policy]}
      filters={{ type: 'insights', market: 'all', canonicalHref: '/news/' }}
    />);

    for (const label of ['Insights', 'News', 'Policy']) expect(html).toContain(`>${label}</a>`);
    expect(html.match(/aria-label="News and insight types"[\s\S]*?<\/nav>/)?.[0].match(/<a /g)).toHaveLength(3);
    for (const label of ['All insights', 'Market Insight', 'Data Stories']) expect(html).toContain(`>${label}</a>`);
    for (const label of ['All', 'Seoul', 'Singapore', 'Dubai', 'Tokyo']) expect(html).toContain(`>${label}</a>`);
    expect(html).toContain('data-newsroom-layout="research"');
    expect(html).toContain('data-newsroom-filter-bar="true"');
    expect(html).toContain('<h1>News &amp; Insights</h1>');
    expect(html.match(/aria-label="News and insight types"/g)).toHaveLength(1);
    expect(html).not.toContain('SignedPrice Newsroom');
    expect(html).not.toContain('Property change, checked against evidence.');
    expect(html.match(/data-newsroom-lead=/g)).toHaveLength(1);
    expect(html).toContain('data-newsroom-latest-list="rows"');
    expect(html).not.toMatch(/provider|credential|ingestion|500 headlines|Naver News API/i);
  });

  it('shows article provenance and at most three first-viewport takeaways', () => {
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);

    for (const value of [
      'Data Story', 'Seoul', article.title, article.deck, 'Publisher', 'SignedPrice', 'Published', 'Updated', 'Sources',
    ]) expect(html).toContain(value);
    expect(html).not.toContain('Reviewer');
    expect(html).not.toContain(article.reviewedBy!);
    expect(html).not.toContain(article.authorName);
    expect(html).not.toContain('data-article-takeaway=');
    expect(html).toContain('href="#article-sources-title"');
    expect(html).toContain('href="https://rt.molit.go.kr/"');
  });

  it('renders separate policy dates and a confirmed unknown-effective-date state', () => {
    const html = renderToStaticMarkup(<PolicyTracker policies={[policy]} referenceDate="2025-04-01" />);

    expect(html).toContain('Announced');
    expect(html).toContain('Effective');
    expect(html).toContain('Expiry');
    expect(html).toContain('Last checked');
    expect(html).toContain('Date not confirmed');
  });

  it('renders a policy record as a sourced lifecycle rather than legal advice', () => {
    const policyArticle = getPortfolioRecord('en', 'singapore-absd-policy-status')!;
    const html = renderToStaticMarkup(<PolicyRecordArticle policy={policy} article={policyArticle} />);

    expect(html).toContain(policy.title);
    expect(html).toContain('Official source');
    expect(html).toContain('Policy lifecycle');
    expect(html).toContain('Who may be affected');
    expect(html).toContain('not legal advice');
    expect(html).toContain('href="https://example.gov/policy"');
  });

  it('permanently redirects archived legacy Insights routes to the reviewed News index', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: '/insights/:slug/', destination: '/news/', permanent: true,
    });
  });

  it('sends current three-city research aliases to their articles before the archive catch-all', async () => {
    const redirects = (await nextConfig.redirects?.())!;
    const archiveIndex = redirects.findIndex(({ source }) => source === '/insights/:slug/');
    for (const slug of ['korea-foreon-neighbour-price-gap', 'singapore-lentor-launch-resale-divergence', 'dubai-rental-yield-after-costs', 'seoul-84sqm-under-one-billion-2026', 'singapore-condos-under-1-5-million-2026']) {
      const index = redirects.findIndex(({ source }) => source === `/insights/${slug}/`);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(archiveIndex);
      expect(redirects[index]).toEqual({ source: `/insights/${slug}/`, destination: getPortfolioRecord('en', slug)!.canonicalHref, permanent: true });
    }
  });

  it('publishes Newsroom, policy, and migrated story canonicals without legacy English Insights URLs', () => {
    const urls = sitemap().map(({ url }) => url);

    expect(urls).toContain('https://www.signedprice.com/news/');
    expect(urls).toContain('https://www.signedprice.com/news/policy/');
    expect(urls).toContain('https://www.signedprice.com/news/policy/singapore-absd-policy-status/');
    expect(urls).toContain('https://www.signedprice.com/news/seoul-district-price-distribution/');
    expect(urls).not.toContain('https://www.signedprice.com/insights/');
    expect(urls.some((url) => url.startsWith('https://www.signedprice.com/insights/'))).toBe(false);
  });
});
