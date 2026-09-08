import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const database = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => database.sql,
  publicContentDatabase: () => database.sql,
}));
import { loadPersistedNewsItems } from '../lib/news/news-persistence.server';

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
    for (const filename of ['0001_persistent_content.sql', '0005_newsroom_content_system.sql']) {
      const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
      for (const statement of sql.split(/^\s*-- statement-breakpoint\s*$/m)) if (statement.trim()) await db.exec(statement);
    }
  }, 30_000);
  beforeEach(async () => {
    await db.exec('TRUNCATE external_news_items, content_source_links, content_sources, content_articles RESTART IDENTITY CASCADE');
    await db.exec(`
      INSERT INTO content_articles (slug, title, summary, body_markdown, editorial_status, evidence_state, reviewed_at, reviewed_by, published_at)
      VALUES ('reviewed-release', 'Reviewed release', 'Summary', 'Body', 'published', 'verified', now(), 'News editor', now() - interval '1 day');
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
      title: 'Singapore housing release', market: 'singapore', publisher: 'URA',
      url: 'https://www.ura.gov.sg/release', internalHref: null,
    })]);
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
  ])('withholds %s', async (_reason, mutation) => {
    await db.exec(mutation);
    expect(await loadPersistedNewsItems()).toEqual([]);
  });
});
