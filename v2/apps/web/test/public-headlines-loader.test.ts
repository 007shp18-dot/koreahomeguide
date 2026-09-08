import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ configured: true, sql: vi.fn(), stored: vi.fn(), files: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (read: unknown) => read }));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: () => state.configured ? state.sql : null }));
vi.mock('../lib/news/news-persistence.server', () => ({ loadPersistedNewsItems: state.stored }));
vi.mock('../content/portfolio-manifest', () => ({ listPortfolioRecords: state.files }));
vi.mock('../content/reviewed-news', () => ({ REVIEWED_NEWS: [], REVIEWED_NEWS_CHECKED_AT: '2020-01-01' }));
import { readPublicHeadlines, loadPublicHeadlines } from '../lib/news/public-headlines.server';
const article = { slug: 'published-file', locale: 'en', marketId: 'sg-singapore', status: 'published', evidenceState: 'verified', reviewedBy: 'Editor', reviewedAt: '2020-01-03', publishedAt: '2020-01-03', sources: [{ id: 'release', kind: 'primary', href: 'https://www.ura.gov.sg/release', title: 'Release', publisher: 'URA', publishedAt: '2020-01-01', checkedAt: '2020-01-03' }] };
beforeEach(() => { state.configured = true; state.sql.mockReset().mockResolvedValue([]); state.stored.mockReset().mockResolvedValue([]); state.files.mockReturnValue([article]); });
describe('review state precedence in the public headline loader', () => {
  it('publishes checked file sources when no database is configured', async () => {
    state.configured = false; state.stored.mockResolvedValue(null);
    expect(await readPublicHeadlines()).toHaveLength(1);
  });
  it('does not revive the file version of a database-owned article', async () => {
    state.sql.mockImplementation((query: TemplateStringsArray) => Promise.resolve(query[0]!.includes('SELECT slug') ? [{ slug: article.slug }] : []));
    expect(await readPublicHeadlines()).toEqual([]);
  });
  it('does not let an unrelated draft suppress an already-reviewed source', async () => {
    state.sql.mockImplementation((query: TemplateStringsArray) => Promise.resolve(query[0]!.includes('SELECT slug') ? [{ slug: 'unrelated-draft' }] : []));
    expect(await readPublicHeadlines()).toHaveLength(1);
  });
  it('honours an explicit source rejection globally', async () => {
    state.sql.mockImplementation((query: TemplateStringsArray) => Promise.resolve(query[0]!.includes('canonical_url') ? [{ canonical_url: article.sources[0]!.href }] : []));
    expect(await readPublicHeadlines()).toEqual([]);
  });
  it('fails closed when publication decisions cannot be read', async () => {
    state.sql.mockRejectedValue(new Error('Unavailable'));
    expect(await loadPublicHeadlines()).toBeNull();
  });
  it('does not substitute file headlines for a configured storage failure', async () => {
    state.stored.mockResolvedValue(null);
    expect(await readPublicHeadlines()).toBeNull();
  });
});

it('uses separately reviewed database publications and still honours discovery rejection', async () => {
  const publication = { canonical_url: 'https://publisher.example/fresh', market_id: 'jp-tokyo', title: 'Reviewed fresh report', summary: 'Checked summary', publisher: 'Publisher', source_published_at: '2020-01-01', publication_state: 'published' };
  state.files.mockReturnValue([]);
  let rejected = false;
  state.sql.mockImplementation((query: TemplateStringsArray) => Promise.resolve(query[0]!.includes('SELECT * FROM external_news_publications') ? [publication] : query[0]!.includes('SELECT canonical_url') && rejected ? [{ canonical_url: publication.canonical_url }] : []));
  expect(await readPublicHeadlines()).toEqual([expect.objectContaining({ market: 'tokyo', title: publication.title })]);
  rejected = true;
  expect(await readPublicHeadlines()).toEqual([]);
});
