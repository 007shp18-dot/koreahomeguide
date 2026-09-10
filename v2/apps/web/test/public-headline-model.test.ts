import { describe, expect, it } from 'vitest';
import { mergeReviewedHeadlines, portfolioHeadlines } from '../lib/news/public-headline-model';
import { listPortfolioRecords } from '../content/portfolio-manifest';
import type { NewsWorkspaceItem } from '../lib/news/news-workspace-model';

const now = Date.parse('2026-09-09T00:00:00Z');
const item: NewsWorkspaceItem = { id: 'checked', market: 'tokyo', marketLabel: 'Tokyo', title: 'Market update', summary: 'An attributed update.', url: 'https://publisher.example/article', internalHref: null, publisher: 'Publisher', publishedAt: '2026-09-01T00:00:00Z', category: 'Market', evidence: 'checking', evidenceLine: 'Source reviewed', sourceKind: 'reviewed-source' };

describe('reviewed public news catalog', () => {
  it('publishes independently reviewed originals even when the DB queue has no linked articles', () => {
    expect(mergeReviewedHeadlines([], [item], [], now)).toEqual([item]);
  });
  it('never revives blocked URLs through a file fallback', () => {
    expect(mergeReviewedHeadlines([], [item], [item.url], now)).toEqual([]);
  });
  it('deduplicates URLs, prefers current DB review and excludes future/non-HTTPS records', () => {
    const current = { ...item, title: 'Updated review' };
    expect(mergeReviewedHeadlines([current], [item, { ...item, url: 'http://publisher.example/unsafe' }, { ...item, url: 'https://publisher.example/future', publishedAt: '2099-01-01' }], [], now)).toEqual([current]);
  });
  it('uses original publication dates and excludes undated reference portals', () => {
    const base = listPortfolioRecords('en').find(record => record.type === 'news-brief')!;
    const article = { ...base, sources: [{ id: 'one', kind: 'primary' as const, publisher: 'Publisher', title: 'Original', href: item.url, checkedAt: '2026-09-08T00:00:00Z', publishedAt: '2026-08-20T00:00:00Z' }] };
    expect(portfolioHeadlines([article], now)[0]).toMatchObject({ publishedAt: '2026-08-20T00:00:00Z', url: item.url });
    expect(portfolioHeadlines([{ ...article, sources: [{ ...article.sources[0]!, publishedAt: null }] }], now)).toEqual([]);
    expect(portfolioHeadlines([{ ...article, evidenceState: 'withdrawn' }], now)).toEqual([]);
    expect(portfolioHeadlines([{ ...article, reviewedAt: '2099-01-01' }], now)).toEqual([]);
  });
});
