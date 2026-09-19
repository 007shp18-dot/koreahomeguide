import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { buildInsightItems } from '../components/newsroom/insights-index';
import { NewsroomArticle } from '../components/newsroom/newsroom-article';
import { listPortfolioRecords } from '../content/portfolio-manifest';
const original = listPortfolioRecords('en').find(item => item.type === 'data-story')!;
describe('editorial reading and topics', () => {
  it.each(['singapore-little-india-tekka-campbell-lane', 'dubai-jaddaf-waterfront-jameel-arts-centre'])('classifies %s in both published languages by identity', slug => {
    for (const locale of ['en', 'ko'] as const) {
      const localizedSlug = `${slug}${locale === 'ko' ? '-ko' : ''}`;
      const article = { ...original, id: `${locale}:${localizedSlug}`, slug: localizedSlug, locale, type: 'market-brief' as const, title: 'A local afternoon', canonicalHref: `${locale === 'ko' ? '/ko' : ''}/news/${localizedSlug}/` };
      const item = buildInsightItems([article], 'all', locale, 'neighborhood').find(item => item.slug === localizedSlug);
      expect(item).toMatchObject({ topic: 'Neighborhood living', investment: false });
      expect(buildInsightItems([article], 'all', locale, 'investment').some(item => item.slug === localizedSlug)).toBe(false);
    }
  });
  it('puts source dates and navigable sections beside an authored reading column', () => {
    const article = { ...original, title: 'A reading layout', authorName: 'SignedPrice Data Desk', bodyMarkdown: '## First section\n\nFirst evidence.\n\n## Second section\n\nSecond evidence.\n\n## Third section\n\nThird evidence.' };
    const html = renderToStaticMarkup(<NewsroomArticle article={article} />);
    expect(html).toContain('SignedPrice Data Desk');
    expect(html).toContain('Latest source check');
    expect(html).toContain('href="#section-1"');
    expect(html).toContain('href="#sources"');
    expect(html).not.toMatch(/<details[^>]+id="sources"[^>]+open/);
    expect(html).toContain('<summary>Sources &amp; methodology</summary>');
    expect(html).toContain('Published Sep');
  });
});
