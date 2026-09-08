import type { PublishedContentArticle } from '../content/content-types';
import type { NewsWorkspaceItem } from './news-workspace-model';

const marketNames = { 'kr-seoul': ['seoul', 'Seoul'], 'sg-singapore': ['singapore', 'Singapore'], 'ae-dubai': ['dubai', 'Dubai'] } as const;
const notFuture = (date: string | null | undefined, now: number) => typeof date === 'string' && Number.isFinite(Date.parse(date)) && Date.parse(date) <= now;

/** Reference portals have no publication date and must never become fresh news. */
export function portfolioHeadlines(articles: readonly PublishedContentArticle[], now = Date.now()): readonly NewsWorkspaceItem[] {
  return articles.flatMap(article => {
    if (article.locale !== 'en' || article.status !== 'published' || article.evidenceState === 'withdrawn'
      || !article.reviewedBy?.trim() || !notFuture(article.reviewedAt, now) || !notFuture(article.publishedAt, now)
      || !article.marketId || !(article.marketId in marketNames)
      || (article.evidenceState !== 'not-applicable' && !article.sources.some(source => source.kind === 'primary' && notFuture(source.checkedAt, now)))) return [];
    const [market, marketLabel] = marketNames[article.marketId];
    return article.sources.flatMap(source => !notFuture(source.publishedAt, now) || !notFuture(source.checkedAt, now) ? [] : [{
      id: `source-${source.id}`, market, marketLabel, title: source.title, summary: '', url: source.href,
      internalHref: null, publisher: source.publisher, publishedAt: source.publishedAt!, category: 'Official update',
      evidence: 'checking' as const, evidenceLine: 'Source checked for published editorial content', sourceKind: 'reviewed-source' as const,
    }]);
  });
}

export function mergeReviewedHeadlines(stored: readonly NewsWorkspaceItem[], catalog: readonly NewsWorkspaceItem[], excludedUrls: readonly string[], now = Date.now()): readonly NewsWorkspaceItem[] {
  const excluded = new Set(excludedUrls);
  const unique = new Map<string, NewsWorkspaceItem>();
  for (const item of [...catalog, ...stored]) {
    if (excluded.has(item.url) || !notFuture(item.publishedAt, now)) continue;
    try { if (new URL(item.url).protocol !== 'https:') continue; } catch { continue; }
    unique.set(item.url, item);
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id)).slice(0, 1500);
}
