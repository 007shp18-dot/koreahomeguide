import 'server-only';
import { unstable_cache } from 'next/cache';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import { REVIEWED_NEWS, REVIEWED_NEWS_CHECKED_AT } from '../../content/reviewed-news';
import { publicContentDatabase } from '../db/postgres.server';
import { loadReviewedNewsPublications } from './reviewed-publications.server';
import { loadAutomaticHeadlines } from './automatic-headlines.server';
import { loadPersistedNewsItems } from './news-persistence.server';
import { mergeReviewedHeadlines, portfolioHeadlines } from './public-headline-model';

/** Database records own their article slug; only explicit URL rejection is global. */
async function publicationOverrides(): Promise<{ excluded: readonly string[]; slugs: readonly string[] } | null> {
  const sql = publicContentDatabase();
  if (sql === null) return { excluded: [], slugs: [] };
  try {
    const [decisions, articles] = await Promise.all([
      sql`SELECT canonical_url FROM external_news_items WHERE review_state = 'rejected' OR is_active = false`,
      sql`SELECT slug FROM content_articles WHERE locale = 'en'`,
    ]);
    return {
      excluded: decisions.flatMap(row => typeof row.canonical_url === 'string' ? [row.canonical_url] : []),
      slugs: articles.flatMap(row => typeof row.slug === 'string' ? [row.slug] : []),
    };
  } catch { return null; }
}

export async function readPublicHeadlines() {
  const configured = publicContentDatabase() !== null;
  const [stored, overrides, publications, automatic] = await Promise.all([loadPersistedNewsItems(1500), publicationOverrides(), loadReviewedNewsPublications(), loadAutomaticHeadlines()]);
  if (automatic === null || publications === null || overrides === null || (configured && stored === null)) return null;
  const now = Date.now();
  const checked = Date.parse(REVIEWED_NEWS_CHECKED_AT) <= now ? REVIEWED_NEWS : [];
  const files = listPortfolioRecords('en').filter(article => !overrides.slugs.includes(article.slug));
  return mergeReviewedHeadlines([...automatic, ...(stored ?? []), ...publications.items], [...portfolioHeadlines(files, now), ...checked], [...overrides.excluded, ...publications.excluded], now);
}

// Throw on failed review reads so a successful cache entry is not replaced with
// an empty/error snapshot. Request callers can preserve their last good result.
const cachedHeadlines = unstable_cache(async () => {
  const items = await readPublicHeadlines();
  if (items === null) throw new Error('Public headline review state unavailable');
  return items;
}, ['public-headlines-v4-automatic'], { revalidate: 900 });

export async function loadPublicHeadlines() {
  try { return await cachedHeadlines(); } catch { return null; }
}
