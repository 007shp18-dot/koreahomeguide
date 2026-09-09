import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
vi.mock('server-only', () => ({}));
import { createPhotoReviewStore } from '../lib/photos/photo-review-store.server';
import { createStoredPublicPhotoApprovalReader } from '../lib/photos/building-photo-store.server';

type Row = Record<string, unknown>;
type Database = { query(sql: string, parameters?: unknown[]): Promise<{ rows: Row[] }>; exec(sql: string): Promise<unknown>; close(): Promise<void> };
const local = '/workspace/scratch/c926a5a3f09d/japan-coverage-harness/node_modules/@electric-sql/pglite/dist/index.cjs';
const modulePath = process.env.PHOTO_REVIEW_TEST_PGLITE_MODULE ?? (existsSync(local) ? local : null);
const suite = modulePath === null ? describe.skip : describe;

suite('photo review PostgreSQL workflow', () => {
  let db: Database;
  let store: ReturnType<typeof createPhotoReviewStore>;
  let legacy: Row[];
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(modulePath!) as { PGlite: new () => Database };
    db = new PGlite();
    await db.exec(`
      CREATE TABLE buildings (key text PRIMARY KEY, market_key text, official_name text,
        identity_status text, legal_address text, road_address text, latitude float8, longitude float8);
      INSERT INTO buildings VALUES ('sg:a','singapore','Example','verified','Example road',NULL,1.3,103.8),
        ('sg:b','singapore','Other building','verified','Other road',NULL,1.4,103.9);
      CREATE TABLE building_photos (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        building_key text REFERENCES buildings(key), registry_key text UNIQUE, provider text,
        provider_place_id text, asset_url text, attribution_name text, attribution_url text,
        status text, position integer DEFAULT 0, approved_at timestamptz, approved_by text,
        checked_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
        subject_kind text, rights_status text, source_page_url text, visual_reviewed_at timestamptz,
        match_policy_version text, match_confidence numeric, match_evidence jsonb DEFAULT '[]',
        provider_source_uri text, provider_checked_at timestamptz);
      INSERT INTO building_photos(building_key,registry_key,provider,status,match_policy_version)
        VALUES ('sg:a','public-approved','licensed-url','approved','manual'),
          ('sg:b','public-pending','licensed-url','review_required','naver-image-candidate-v1');
    `);
    const migration = await readFile(new URL('../db/migrations/0019_building_photo_review_queue.sql', import.meta.url), 'utf8');
    for (const statement of migration.split(/^\s*-- statement-breakpoint\s*$/m)) if (statement.trim()) await db.exec(statement);
    legacy = (await db.query('SELECT registry_key, publication_registry_key, candidate_source FROM building_photos ORDER BY id')).rows;
    store = createPhotoReviewStore({ query: async (sql, parameters) => (await db.query(sql, [...parameters])).rows });
  }, 30_000);
  beforeEach(async () => {
    await db.exec(`TRUNCATE building_photo_review_events, building_photos RESTART IDENTITY;
      INSERT INTO building_photos(building_key,registry_key,publication_registry_key,candidate_source,
        provider,asset_url,attribution_name,attribution_url,status,subject_kind,rights_status,
        source_page_url,checked_at)
      VALUES
        ('sg:a','candidate:naver-search:sg:a','public-a','naver-search','licensed-url','https://images.example/a.jpg',
          'NAVER Image Search','https://images.example/a.jpg','review_required','building-exterior','review-required',
          'https://images.example/a.jpg','2026-09-09 12:00:00.123456+00'),
        ('sg:a','candidate:wikimedia:sg:a','public-a','wikimedia','licensed-url','https://upload.wikimedia.org/wikipedia/commons/a.jpg',
          'Photographer · CC BY 4.0','https://creativecommons.org/licenses/by/4.0','review_required','building-exterior','licensed',
          'https://commons.wikimedia.org/wiki/File:A.jpg','2026-09-09 12:00:00.123456+00'),
        ('sg:b','candidate:wikimedia:sg:b','public-b','wikimedia','licensed-url','https://upload.wikimedia.org/wikipedia/commons/a.jpg',
          'Photographer · CC BY 4.0','https://creativecommons.org/licenses/by/4.0','review_required','building-exterior','licensed',
          'https://commons.wikimedia.org/wiki/File:A.jpg','2026-09-09 12:00:00.123456+00');
      INSERT INTO building_photos(building_key,registry_key,publication_registry_key,candidate_source,
        provider,provider_place_id,status,rights_status,source_page_url,checked_at)
      VALUES ('sg:a','candidate:google:sg:a','public-a','google','google-place','place-a','review_required',
        'provider-display-only','https://maps.google.com/?cid=123','2026-09-09 12:00:00.123456+00');
    `);
  });
  afterAll(async () => { await db?.close(); });
  const decision = (candidateId: string) => ({ candidateId, checkedAt: '2026-09-09 12:00:00.123456+00',
    decision: 'approve' as const, visualReviewed: true as const, subjectKind: 'building-exterior' as const,
    note: 'Integration fixture: exterior identity and license were reviewed.' });

  it('preserves public keys and gives private candidates independent provider identities', () => {
    expect(legacy).toEqual([
      { registry_key: 'public-approved', publication_registry_key: 'public-approved', candidate_source: 'manual' },
      { registry_key: 'candidate:naver-search:sg:b', publication_registry_key: 'public-pending', candidate_source: 'naver-search' },
    ]);
  });
  it('pages old candidates and exposes duplicate uses without approving other buildings', async () => {
    const first = await store.list({ limit: 1, source: 'wikimedia' });
    expect(first.items[0]).toMatchObject({ candidateId: '2', assetUseCount: 2 });
    expect(first.nextCursor).toBe('2');
    const next = await store.list({ limit: 1, source: 'wikimedia', afterId: first.nextCursor! });
    expect(next.items[0]?.candidateId).toBe('3');
    expect(next.nextCursor).toBeNull();
  });
  it('approves only a stored licensed candidate and resolves it using the unchanged public key', async () => {
    expect((await store.review(decision('1'))).state).toBe('rights-evidence-required');
    expect((await store.review(decision('2'))).state).toBe('reviewed');
    const reader = createStoredPublicPhotoApprovalReader({ query: async (sql, parameters) => (await db.query(sql, [...parameters])).rows });
    expect((await reader.list(['public-a'])).get('public-a')).toMatchObject({ buildingKey: 'sg:a', provider: 'licensed-url' });
    expect((await db.query('SELECT status FROM building_photos WHERE id=3')).rows[0]?.status).toBe('review_required');
    expect((await db.query('SELECT decision, evidence FROM building_photo_review_events')).rows[0]).toMatchObject({
      decision: 'approve', evidence: { buildingKey: 'sg:a', visualReviewed: true },
    });
  });
  it('prevents competing providers from claiming the same publication key', async () => {
    await store.review(decision('2'));
    expect((await store.review(decision('4'))).state).toBe('conflict');
    expect((await db.query("SELECT count(*)::integer n FROM building_photos WHERE status='approved'")).rows[0]?.n).toBe(1);
  });
  it('refuses a stale decision and lets a reviewed rejection remove a public approval', async () => {
    expect((await store.review({ ...decision('2'), checkedAt: '2026-09-09T12:00:00.123Z' })).state).toBe('conflict');
    await store.review(decision('2'));
    const checked = (await db.query('SELECT checked_at::text AS stamp FROM building_photos WHERE id=2')).rows[0]?.stamp as string;
    expect((await store.review({ candidateId: '2', checkedAt: checked, decision: 'reject', note: 'Wrong building found during subsequent visual review.' })).state).toBe('reviewed');
    expect((await db.query('SELECT status,approved_at,visual_reviewed_at FROM building_photos WHERE id=2')).rows[0]).toEqual({ status: 'rejected', approved_at: null, visual_reviewed_at: null });
    expect((await db.query('SELECT count(*)::integer n FROM building_photo_review_events')).rows[0]?.n).toBe(2);
  });
});
