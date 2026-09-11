import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ sql: vi.fn(), transaction: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => Object.assign(mocks.sql, { transaction: mocks.transaction }),
}));
import { parseEditorialArticleInput } from '../app/api/internal/content-articles/route';
import { saveEditorialArticle } from '../lib/insights/content-article-store.server';
import { TOKYO_RENEWAL_ARTICLES } from '../content/tokyo-renewal-2026-09-11';
import { articleFromRow } from '../lib/content/content-repository.server';
import { buildInsightItems } from '../components/newsroom/insights-index';

beforeEach(() => { vi.clearAllMocks(); mocks.sql.mockReturnValue(Promise.resolve([])); mocks.transaction.mockResolvedValue([]); });

describe('Tokyo editorial publication', () => {
  it('accepts reviewed Tokyo articles and persists Japan identifiers', async () => {
    const a = TOKYO_RENEWAL_ARTICLES[0]!;
    const payload = { slug: a.slug, marketKey: 'tokyo', title: a.title, summary: a.deck, bodyMarkdown: a.bodyMarkdown,
      status: 'published', locale: a.locale, contentType: a.type, evidenceState: a.evidenceState, reviewedBy: a.reviewedBy, sources: a.sources };
    const input = parseEditorialArticleInput(payload);
    expect(input?.marketKey).toBe('tokyo');
    if (!input) throw new Error('Tokyo rejected');
    await saveEditorialArticle(input);
    const calls = mocks.sql.mock.calls;
    expect(calls.find(([parts]) => parts.join('').includes('INSERT INTO markets'))?.slice(1)).toEqual(['tokyo', 'Tokyo', 'JP']);
    expect(calls.find(([parts]) => parts.join('').includes('INSERT INTO content_articles'))?.slice(1)).toContain('jp-tokyo');
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(articleFromRow({ slug: a.slug, locale: a.locale, market_id: 'jp-tokyo', content_type: a.type, title: a.title, summary: a.deck, body_markdown: a.bodyMarkdown, evidence_state: a.evidenceState, reviewed_at: a.reviewedAt, reviewed_by: a.reviewedBy, published_at: a.publishedAt, updated_at: a.updatedAt, sources: a.sources })).toMatchObject({ marketId: 'jp-tokyo', title: a.title });
    expect(parseEditorialArticleInput({ ...payload, sources: [] })).toBeNull();
    expect(parseEditorialArticleInput({ ...payload, marketKey: 'unsupported' })).toBeNull();
  });

  it.each(['en', 'ko', 'zh-CN'] as const)('shows the translated article in Tokyo Investment: %s', locale => {
    const article = TOKYO_RENEWAL_ARTICLES.find(a => a.locale === locale)!;
    const found = buildInsightItems([], 'tokyo', locale, 'investment').find(item => item.href === article.canonicalHref);
    expect(found).toMatchObject({ title: article.title, language: locale, city: 'tokyo', investment: true });
    expect(article.bodyMarkdown.match(/^## /gm)).toHaveLength(4);
  });
});
