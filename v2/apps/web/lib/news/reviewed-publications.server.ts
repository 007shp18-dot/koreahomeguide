import 'server-only';
import { publicContentDatabase } from '../db/postgres.server';
import type { NewsWorkspaceItem } from './news-workspace-model';

const markets = { 'kr-seoul': ['seoul', 'Seoul'], 'sg-singapore': ['singapore', 'Singapore'], 'ae-dubai': ['dubai', 'Dubai'], 'jp-tokyo': ['tokyo', 'Tokyo'] } as const;
type Publications = { items: readonly NewsWorkspaceItem[]; excluded: readonly string[] };
const empty = (): Publications => ({ items: [], excluded: [] });

/** Only explicitly reviewed snapshots; ingestion has no write path to this table. */
export async function loadReviewedNewsPublications(): Promise<Publications | null> {
  const sql = publicContentDatabase();
  if (sql === null) return empty();
  try {
    const rows = await sql`SELECT * FROM external_news_publications
      WHERE publication_state = 'withdrawn' OR (
        publication_state = 'published' AND source_published_at <= now()
        AND source_checked_at <= now() AND reviewed_at <= now()
        AND nullif(btrim(reviewed_by), '') IS NOT NULL
      ) ORDER BY source_published_at DESC`;
    const items: NewsWorkspaceItem[] = [];
    const excluded: string[] = [];
    for (const row of rows) {
      if (typeof row.canonical_url !== 'string') continue;
      if (row.publication_state === 'withdrawn') { excluded.push(row.canonical_url); continue; }
      if (typeof row.market_id !== 'string' || !(row.market_id in markets)) continue;
      const [market, marketLabel] = markets[row.market_id as keyof typeof markets];
      const date = new Date(String(row.source_published_at));
      if (!Number.isFinite(date.getTime()) || typeof row.title !== 'string' || typeof row.summary !== 'string' || typeof row.publisher !== 'string') continue;
      items.push({
        id: `publication-${row.canonical_url}`, market, marketLabel, title: row.title, summary: row.summary,
        url: row.canonical_url, publisher: row.publisher, publishedAt: date.toISOString(),
        internalHref: null, category: 'News', evidence: 'checking', evidenceLine: 'Original source reviewed by SignedPrice', sourceKind: 'reviewed-source',
        ...(typeof row.title_ko === 'string' ? { titleKo: row.title_ko } : {}),
        ...(typeof row.summary_ko === 'string' ? { summaryKo: row.summary_ko } : {}),
        ...(typeof row.buyer_note === 'string' ? { buyerNote: row.buyer_note } : {}),
        ...(typeof row.buyer_note_ko === 'string' ? { buyerNoteKo: row.buyer_note_ko } : {}),
      });
    }
    return { items, excluded };
  } catch (error) {
    // Preview deploys intentionally skip migrations. Only this specific missing
    // additive table is optional; timeouts/permission failures must fail closed.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '42P01') return empty();
    return null;
  }
}
