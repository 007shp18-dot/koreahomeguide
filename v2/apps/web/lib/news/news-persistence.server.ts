import 'server-only';

import { createHash } from 'node:crypto';

import { contentDatabase } from '../db/postgres.server';
import type { NewsWorkspaceItem } from './news-workspace-model';

type NewsRow = Readonly<Record<string, unknown>>;

function isoDate(value: unknown): string | null {
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
  return date !== null && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function workspaceItem(row: NewsRow): NewsWorkspaceItem | null {
  const publishedAt = isoDate(row.published_at);
  if (publishedAt === null || typeof row.id !== 'string' || typeof row.market_key !== 'string'
    || typeof row.title !== 'string' || typeof row.summary !== 'string'
    || typeof row.canonical_url !== 'string' || typeof row.publisher !== 'string'
    || typeof row.category !== 'string' || typeof row.evidence_line !== 'string') return null;
  if (!['seoul', 'singapore', 'dubai'].includes(row.market_key)) return null;
  if (!['matched', 'no-change', 'checking', 'insufficient'].includes(String(row.evidence_status))) return null;
  return Object.freeze({
    id: row.id,
    market: row.market_key as NewsWorkspaceItem['market'],
    marketLabel: row.market_key === 'seoul' ? 'Seoul' : row.market_key === 'singapore' ? 'Singapore' : 'Dubai',
    title: row.title,
    summary: row.summary,
    url: row.canonical_url,
    internalHref: null,
    publisher: row.publisher,
    publishedAt,
    category: row.category,
    evidence: row.evidence_status as NewsWorkspaceItem['evidence'],
    evidenceLine: row.evidence_line,
    sourceKind: 'naver-search',
  });
}

export async function loadPersistedNewsItems(limit = 600): Promise<readonly NewsWorkspaceItem[] | null> {
  const sql = contentDatabase();
  if (sql === null) return null;
  try {
    const rows = await sql`
      SELECT
        concat('stored-', id::text) AS id,
        market_key,
        canonical_url,
        title,
        summary,
        publisher,
        published_at,
        category,
        evidence_status,
        evidence_line
      FROM news_articles
      WHERE is_active = true
      ORDER BY published_at DESC
      LIMIT ${Math.min(Math.max(limit, 1), 1_500)}
    `;
    return Object.freeze(rows.flatMap((row) => {
      const item = workspaceItem(row);
      return item === null ? [] : [item];
    }));
  } catch (error) {
    console.error('SignedPrice news database read failed.', error);
    return null;
  }
}

export async function storeNewsItems(items: readonly NewsWorkspaceItem[]): Promise<number> {
  const sql = contentDatabase();
  if (sql === null || items.length === 0) return 0;
  const payload = items
    .filter((item) => item.sourceKind === 'naver-search')
    .map((item) => ({
      market_key: item.market,
      market_name: item.marketLabel,
      canonical_url: item.url,
      title_hash: createHash('sha256').update(item.title.normalize('NFKC')).digest('hex'),
      title: item.title,
      summary: item.summary,
      publisher: item.publisher,
      published_at: item.publishedAt,
      category: item.category,
      evidence_status: item.evidence,
      evidence_line: item.evidenceLine,
    }));
  if (payload.length === 0) return 0;
  const [result] = await sql`
    WITH payload AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS item(
        market_key text,
        market_name text,
        canonical_url text,
        title_hash text,
        title text,
        summary text,
        publisher text,
        published_at timestamptz,
        category text,
        evidence_status text,
        evidence_line text
      )
    ), market_upserts AS (
      INSERT INTO markets (key, name, country_code)
      SELECT DISTINCT
        market_key,
        market_name,
        CASE market_key WHEN 'seoul' THEN 'KR' WHEN 'singapore' THEN 'SG' ELSE 'AE' END
      FROM payload
      ON CONFLICT (key) DO UPDATE SET name = excluded.name, updated_at = now()
      RETURNING key
    ), stored AS (
      INSERT INTO news_articles (
        market_key, canonical_url, title_hash, title, summary, publisher,
        published_at, category, source_kind, evidence_status, evidence_line
      )
      SELECT
        item.market_key, item.canonical_url, item.title_hash, item.title, item.summary,
        item.publisher, item.published_at, item.category, 'naver-search',
        item.evidence_status, item.evidence_line
      FROM payload item
      LEFT JOIN market_upserts ON market_upserts.key = item.market_key
      ON CONFLICT (canonical_url) DO UPDATE SET
        title_hash = excluded.title_hash,
        title = excluded.title,
        summary = excluded.summary,
        publisher = excluded.publisher,
        published_at = excluded.published_at,
        category = excluded.category,
        last_seen_at = now(),
        is_active = true,
        updated_at = now()
      RETURNING id
    )
    SELECT count(*)::integer AS stored_count FROM stored
  `;
  return Number(result?.stored_count ?? 0);
}

export async function startNewsIngestionRun(): Promise<string | null> {
  const sql = contentDatabase();
  if (sql === null) return null;
  const [row] = await sql`
    INSERT INTO ingestion_runs (pipeline, status)
    VALUES ('naver-news', 'running')
    RETURNING id::text AS id
  `;
  return typeof row?.id === 'string' ? row.id : null;
}

export async function finishNewsIngestionRun(input: Readonly<{
  id: string | null;
  status: 'succeeded' | 'partial' | 'failed';
  fetchedCount: number;
  storedCount: number;
  diagnostic?: string;
}>): Promise<void> {
  const sql = contentDatabase();
  if (sql === null || input.id === null) return;
  await sql`
    UPDATE ingestion_runs
    SET status = ${input.status},
        finished_at = now(),
        fetched_count = ${input.fetchedCount},
        stored_count = ${input.storedCount},
        diagnostic = ${input.diagnostic ?? null}
    WHERE id = ${input.id}::bigint
  `;
}

