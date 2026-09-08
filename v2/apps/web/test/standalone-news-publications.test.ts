import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const state = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: () => state.sql }));
import { loadReviewedNewsPublications } from '../lib/news/reviewed-publications.server';
const modulePath = process.env.NEWS_TEST_PGLITE_MODULE;
const suite = modulePath ? describe : describe.skip;
suite('standalone reviewed news publications', () => {
  let db: { query(sql: string, values?: unknown[]): Promise<{rows: Record<string, unknown>[]}>; exec(sql: string): Promise<unknown>; close(): Promise<void> };
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!);
    db = new PGlite();
    // Minimal discovery table for the migration's additive taxonomy change.
    await db.exec("CREATE TABLE external_news_items (market_id text CONSTRAINT external_news_items_market_id_check CHECK (market_id IN ('kr-seoul', 'sg-singapore', 'ae-dubai')))");
    await db.exec(await readFile(new URL('../db/migrations/0017_reviewed_external_news.sql', import.meta.url), 'utf8'));
    state.sql.mockImplementation(async (parts: TemplateStringsArray, ...values: unknown[]) => (await db.query(parts.reduce((sql, part, i) => sql + (i ? `$${i}` : '') + part, ''), values)).rows);
  }, 30000);
  beforeEach(async () => {
    await db.exec('TRUNCATE external_news_publications');
    await db.exec(`INSERT INTO external_news_publications (canonical_url, market_id, title, summary, publisher, source_published_at, source_checked_at, reviewed_at, reviewed_by)
      VALUES ('https://example.org/tokyo', 'jp-tokyo', 'Reviewed Tokyo news', 'Editorial summary', 'Original publisher', now() - interval '1 day', now(), now(), 'SignedPrice editor')`);
  });
  afterAll(async () => { await db?.close(); });
  it('publishes a reviewed original without an internal article or discovery item', async () => {
    expect(await loadReviewedNewsPublications()).toEqual({ items: [expect.objectContaining({ market: 'tokyo', title: 'Reviewed Tokyo news', sourceKind: 'reviewed-source', url: 'https://example.org/tokyo' })], excluded: [] });
  });
  it.each(['reviewed_at', 'source_checked_at', 'source_published_at'])('withholds future %s', async field => {
    await db.exec(`UPDATE external_news_publications SET ${field} = now() + interval '1 day'`);
    expect((await loadReviewedNewsPublications())?.items).toEqual([]);
  });
  it('withdrawal suppresses the same URL from older catalogs', async () => {
    await db.exec("UPDATE external_news_publications SET publication_state = 'withdrawn'");
    expect(await loadReviewedNewsPublications()).toEqual({ items: [], excluded: ['https://example.org/tokyo'] });
  });
  it('rejects a missing reviewer and unsupported market', async () => {
    await expect(db.exec("UPDATE external_news_publications SET reviewed_by = ' '")).rejects.toThrow();
    await expect(db.exec("UPDATE external_news_publications SET market_id = 'unknown'")).rejects.toThrow();
  });
});
it('preserves existing reviewed content only when the additive table is not yet deployed', async () => {
  state.sql.mockRejectedValueOnce(Object.assign(new Error('missing table'), {code: '42P01'}));
  expect(await loadReviewedNewsPublications()).toEqual({ items: [], excluded: [] });
  state.sql.mockRejectedValueOnce(Object.assign(new Error('read failed'), {code: '57014'}));
  expect(await loadReviewedNewsPublications()).toBeNull();
});
