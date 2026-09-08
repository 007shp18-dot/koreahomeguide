import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const database = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => database.sql,
  publicContentDatabase: () => database.sql,
}));
import { loadPersistedNewsItems, storeNewsItems } from '../lib/news/news-persistence.server';

type Database = {
  query(sql: string, parameters?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  exec(sql: string): Promise<unknown>;
  close(): Promise<void>;
};
const modulePath = process.env.NEWS_TEST_PGLITE_MODULE ?? process.env.JAPAN_TEST_PGLITE_MODULE;
// Optional PostgreSQL/WASM integration tests. Never connect to a service database.
const suite = modulePath ? describe : describe.skip;

suite('reviewed external headline publication', () => {
  let db: Database;
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    database.sql.mockImplementation(async (parts: TemplateStringsArray, ...parameters: unknown[]) => (
      await db.query(parts.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, ''), parameters)
    ).rows);
    for (const filename of ['0001_persistent_content.sql', '0005_newsroom_content_system.sql', '0016_dubai_editorial_market.sql']) {
      const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
      for (const statement of sql.split(/^\s*-- statement-breakpoint\s*$/m)) if (statement.trim()) await db.exec(statement);
    }
  }, 30_000);
  beforeEach(async () => {
    await db.exec('TRUNCATE external_news_items, content_source_links, content_sources, content_articles RESTART IDENTITY CASCADE');
    await db.exec(`
      INSERT INTO content_articles (slug, title, summary, body_markdown, market_id, editorial_status, evidence_state, reviewed_at, reviewed_by, published_at)
      VALUES ('reviewed-release', 'Reviewed release', 'Summary', 'Body', 'sg-singapore', 'published', 'verified', now(), 'News editor', now() - interval '1 day');
      INSERT INTO content_sources (id, source_kind, publisher, title, canonical_url, checked_at)
      VALUES ('release', 'primary', 'URA', 'Housing release', 'https://www.ura.gov.sg/release', now());
      INSERT INTO content_source_links (content_slug, source_id) VALUES ('reviewed-release', 'release');
      INSERT INTO external_news_items (market_id, canonical_url, title_hash, title, summary, publisher, source_kind, source_published_at, review_state, linked_content_slug)
      VALUES ('sg-singapore', 'https://www.ura.gov.sg/release', repeat('a', 64), 'Singapore housing release', 'Summary', 'URA', 'google-news-rss', now() - interval '2 days', 'linked', 'reviewed-release');
    `);
  });
  afterAll(async () => { await db?.close(); });

  it('publishes a reviewed original URL without inventing a local article route', async () => {
    expect(await loadPersistedNewsItems()).toEqual([expect.objectContaining({
      title: 'Housing release', market: 'singapore', publisher: 'URA',
      url: 'https://www.ura.gov.sg/release', internalHref: null,
    })]);
  });

  async function ingestReviewedSource(overrides: Partial<Parameters<typeof storeNewsItems>[0][number]> = {}) {
    return storeNewsItems([{ id: 'new-release', market: 'singapore', marketLabel: 'Singapore', title: 'Singapore housing release', summary: 'Summary', url: 'https://www.ura.gov.sg/release', internalHref: null, publisher: 'URA', publishedAt: new Date(Date.now() - 86_400_000).toISOString(), category: 'housing', evidence: 'checking', evidenceLine: 'Pending', sourceKind: 'naver-search', ...overrides }]);
  }
  it('keeps public copy in the reviewed source and article after feed changes', async () => {
    const before = await loadPersistedNewsItems();
    expect(before).toEqual([expect.objectContaining({ title: 'Housing release', summary: 'Summary', publisher: 'URA' })]);
    await ingestReviewedSource({ title: 'Unreviewed replacement', summary: 'Unreviewed summary', publisher: 'Changed publisher', publishedAt: '2099-01-01T00:00:00.000Z' });
    expect(await loadPersistedNewsItems()).toEqual([expect.objectContaining({ title: 'Housing release', summary: 'Summary', publisher: 'URA', publishedAt: before?.[0]?.publishedAt })]);
  });
  it('links an exact already-reviewed source during ingestion', async () => {
    await db.exec('TRUNCATE external_news_items');
    expect(await ingestReviewedSource()).toBe(1);
    expect((await db.query('SELECT review_state, linked_content_slug FROM external_news_items')).rows).toEqual([{ review_state: 'linked', linked_content_slug: 'reviewed-release' }]);
    expect(await loadPersistedNewsItems()).toHaveLength(1);
  });
  it.each([
    "UPDATE content_articles SET editorial_status = 'draft'",
    'UPDATE content_articles SET reviewed_at = NULL',
    "UPDATE content_articles SET reviewed_by = '  '",
    "UPDATE content_articles SET evidence_state = 'withdrawn'",
    "UPDATE content_articles SET published_at = now() + interval '1 day'",
    "UPDATE content_sources SET canonical_url = 'https://www.ura.gov.sg/other'",
    "UPDATE content_sources SET source_kind = 'secondary'",
    "UPDATE content_articles SET market_id = 'kr-seoul'",
  ])('never auto-publishes an unreviewed or mismatched discovery: %s', async mutation => {
    await db.exec('TRUNCATE external_news_items');
    await db.exec(mutation);
    await ingestReviewedSource();
    expect((await db.query('SELECT review_state FROM external_news_items')).rows).toEqual([{ review_state: 'new' }]);
    expect(await loadPersistedNewsItems()).toEqual([]);
  });
  it('preserves an explicit rejected decision on re-ingestion', async () => {
    await db.exec("UPDATE external_news_items SET review_state = 'rejected'");
    await ingestReviewedSource();
    expect((await db.query('SELECT review_state FROM external_news_items')).rows).toEqual([{ review_state: 'rejected' }]);
    expect(await loadPersistedNewsItems()).toEqual([]);
  });
  it('allows Dubai editorial content without weakening the reviewed market boundary', async () => {
    await db.exec("UPDATE content_articles SET market_id = 'ae-dubai'");
    expect((await db.query('SELECT market_id FROM content_articles')).rows).toEqual([{ market_id: 'ae-dubai' }]);
    expect(await loadPersistedNewsItems()).toEqual([]);
    await expect(db.exec("UPDATE content_articles SET market_id = 'unsupported'")).rejects.toThrow();
  });

  it.each([
    ['new discovery', "UPDATE external_news_items SET review_state = 'new'"],
    ['triaged discovery', "UPDATE external_news_items SET review_state = 'triaged'"],
    ['rejected discovery', "UPDATE external_news_items SET review_state = 'rejected'"],
    ['inactive discovery', 'UPDATE external_news_items SET is_active = false'],
    ['unlinked discovery', 'UPDATE external_news_items SET linked_content_slug = NULL'],
    ['unpublished article', "UPDATE content_articles SET editorial_status = 'draft'"],
    ['missing review date', 'UPDATE content_articles SET reviewed_at = NULL'],
    ['missing reviewer', 'UPDATE content_articles SET reviewed_by = NULL'],
    ['blank reviewer', "UPDATE content_articles SET reviewed_by = '  '"],
    ['withdrawn evidence', "UPDATE content_articles SET evidence_state = 'withdrawn'"],
    ['future publication', "UPDATE content_articles SET published_at = now() + interval '1 day'"],
    ['unreviewed source URL', "UPDATE content_sources SET canonical_url = 'https://www.ura.gov.sg/another-release'"],
    ['missing primary evidence', "UPDATE content_sources SET source_kind = 'secondary'"],
    ['wrong market', "UPDATE content_articles SET market_id = 'kr-seoul'"],
  ])('withholds %s', async (_reason, mutation) => {
    await db.exec(mutation);
    expect(await loadPersistedNewsItems()).toEqual([]);
  });
});
