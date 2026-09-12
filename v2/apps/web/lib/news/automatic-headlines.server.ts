import 'server-only';

import { publicContentDatabase } from '../db/postgres.server';
import { plainFeedText } from './plain-feed-text';
import type { NewsWorkspaceItem } from './news-workspace-model';

const markets = {
  'kr-seoul': ['seoul', 'Seoul', /seoul|서울/i],
  'sg-singapore': ['singapore', 'Singapore', /singapore|싱가포르|hdb|ura/i],
  'ae-dubai': ['dubai', 'Dubai', /dubai|두바이|دب[يى]/i],
  'jp-tokyo': ['tokyo', 'Tokyo', /tokyo|도쿄|東京/i],
} as const;
const housing = /property|properties|housing|real estate|residential|condo|apartment|home prices|hdb|rental|mortgage|부동산|주택|아파트|전세|월세|재건축|不動産|住宅|マンション|家賃|賃貸|分譲|عقار|شقق|شقة|سكن|إيجار|ايجار/i;

/** Feed metadata is an external reading link, never a reviewed SignedPrice claim. */
export function automaticHeadline(row: Readonly<Record<string, unknown>>, now = Date.now()): NewsWorkspaceItem | null {
  if (typeof row.market_id !== 'string' || !(row.market_id in markets)
    || row.is_active !== true || !['new', 'triaged'].includes(String(row.review_state))
    || !['naver-search', 'google-news-rss'].includes(String(row.source_kind))) return null;
  const [market, marketLabel, location] = markets[row.market_id as keyof typeof markets];
  if (typeof row.title !== 'string' || typeof row.publisher !== 'string' || typeof row.canonical_url !== 'string') return null;
  const title = plainFeedText(row.title).trim();
  const publisher = plainFeedText(row.publisher).trim();
  const published = new Date(String(row.source_published_at)).getTime();
  if (title.length < 10 || title.length > 400 || !publisher || !location.test(title) || !housing.test(title)
    || !Number.isFinite(published) || published > now || now - published > 90 * 86_400_000) return null;
  try {
    const url = new URL(row.canonical_url);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    // Only source-controlled Google RSS redirects or HTTPS Naver original links.
    if (row.source_kind === 'google-news-rss' && url.hostname !== 'news.google.com') return null;
  } catch { return null; }
  return {
    id: `automatic-${String(row.id)}`, market, marketLabel, title, summary: '',
    url: row.canonical_url, publisher, publishedAt: new Date(published).toISOString(),
    internalHref: null, category: 'External headline', evidence: 'checking',
    evidenceLine: 'Automatically collected source headline; claims have not been verified by SignedPrice.',
    sourceKind: row.source_kind as 'naver-search' | 'google-news-rss',
  };
}

export async function loadAutomaticHeadlines(): Promise<readonly NewsWorkspaceItem[] | null> {
  const sql = publicContentDatabase();
  if (sql === null) return [];
  try {
    // Per-city caps keep a prolific feed from displacing all other markets.
    const rows = await sql`SELECT * FROM (
      SELECT id, market_id, title, publisher, canonical_url, source_published_at,
        source_kind, review_state, is_active,
        row_number() OVER (PARTITION BY market_id ORDER BY source_published_at DESC, id DESC) AS city_rank
      FROM external_news_items
      WHERE is_active = true AND review_state IN ('new', 'triaged')
        AND source_kind IN ('naver-search', 'google-news-rss')
        AND source_published_at <= now() AND source_published_at >= now() - interval '90 days'
    ) candidates WHERE city_rank <= 100 ORDER BY source_published_at DESC`;
    return rows.flatMap(row => { const item = automaticHeadline(row); return item === null ? [] : [item]; });
  } catch { return null; }
}
