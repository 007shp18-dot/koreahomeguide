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
    || typeof row.category !== 'string' || typeof row.evidence_line !== 'string'
    || typeof row.source_kind !== 'string') return null;
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
    sourceKind: row.source_kind === 'google-news-rss' ? 'google-news-rss' : 'naver-search',
  });
}

/** Internal desk read. Public routes must use the reviewed content repository. */
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
        source_kind,
        evidence_status,
        evidence_line
      FROM (
        SELECT
          id,
          CASE market_id WHEN 'kr-seoul' THEN 'seoul' WHEN 'sg-singapore' THEN 'singapore' END AS market_key,
          canonical_url,
          title,
          summary,
          publisher,
          source_published_at AS published_at,
          coalesce(category_hint, 'discovery') AS category,
          source_kind,
          'checking'::text AS evidence_status,
          'External discovery item · not reviewed for publication'::text AS evidence_line,
          is_active
        FROM external_news_items
      ) discovery
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
    .filter((item) => (
      (item.market === 'seoul' || item.market === 'singapore')
      && (item.sourceKind === 'naver-search' || item.sourceKind === 'google-news-rss')
    ))
    .map((item) => ({
      market_id: item.market === 'seoul' ? 'kr-seoul' : 'sg-singapore',
      canonical_url: item.url,
      title_hash: createHash('sha256').update(item.title.normalize('NFKC')).digest('hex'),
      title: item.title,
      summary: item.summary,
      publisher: item.publisher,
      source_published_at: item.publishedAt,
      category_hint: item.category,
      source_kind: item.sourceKind,
      raw_metadata: { evidenceStatus: item.evidence, evidenceLine: item.evidenceLine },
    }));
  if (payload.length === 0) return 0;
  const [result] = await sql`
    WITH payload AS (
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(payload)}::jsonb) AS item(
        market_id text,
        canonical_url text,
        title_hash text,
        title text,
        summary text,
        publisher text,
        source_published_at timestamptz,
        category_hint text,
        source_kind text,
        raw_metadata jsonb
      )
    ), stored AS (
      INSERT INTO external_news_items (
        market_id, canonical_url, title_hash, title, summary, publisher,
        source_published_at, category_hint, source_kind, raw_metadata
      )
      SELECT
        item.market_id, item.canonical_url, item.title_hash, item.title, item.summary,
        item.publisher, item.source_published_at, item.category_hint, item.source_kind,
        item.raw_metadata
      FROM payload item
      ON CONFLICT (canonical_url) DO UPDATE SET
        title_hash = excluded.title_hash,
        title = excluded.title,
        summary = excluded.summary,
        publisher = excluded.publisher,
        source_published_at = excluded.source_published_at,
        category_hint = excluded.category_hint,
        source_kind = excluded.source_kind,
        raw_metadata = excluded.raw_metadata,
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
    VALUES ('external-news-discovery', 'running')
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
