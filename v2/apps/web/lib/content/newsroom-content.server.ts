import 'server-only';
import { cache } from 'react';
import { getPortfolioRecord, listPortfolioRecords } from '../../content/portfolio-manifest';
import { isInsightReference, isNeighborhoodEditorial } from '../../content/insight-curation';
import type { EditorialPortfolioRecord } from '../../content/portfolio-types';
import type { ContentLocale, PublishedContentArticle } from './content-types';
import { getPublishedContent, listPublishedContent } from './content-repository.server';

const isNews = (article: PublishedContentArticle) => ['news-brief', 'market-brief', 'data-story'].includes(article.type);
const newestFirst = (a: EditorialPortfolioRecord, b: EditorialPortfolioRecord) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug);

export function storedEditorialRecord(article: PublishedContentArticle): EditorialPortfolioRecord {
  const prefix = article.locale === 'en' ? '' : article.locale === 'ko' ? '/ko' : '/zh-cn';
  return {
    ...article,
    readerQuestion: article.deck,
    evidenceReleaseIds: [],
    revisionNote: 'Published through the editorial workspace.',
    canonicalHref: `${prefix}/news/${article.slug}/`,
    translationGroupId: article.slug.replace(/-(?:ko|en|zh-cn)$/u, ''),
    infographic: null,
  };
}

export const listNewsroomArticles = cache(async (locale: ContentLocale = 'en'): Promise<readonly EditorialPortfolioRecord[]> => {
  // Keep request memoization only. A new publication or failed read must not
  // leave discovery behind the article detail through a separate 15-minute cache.
  const stored = (await listPublishedContent({ locale, limit: 200 })).filter(isNews).map(storedEditorialRecord);
  const slugs = new Set(stored.map(article => article.slug));
  return [...stored, ...listPortfolioRecords(locale).filter(article => !slugs.has(article.slug))].sort(newestFirst);
});

// Localized Insights labels English originals and prefers available translations.
export const listInsightArticles = cache(async (locale: ContentLocale = 'en'): Promise<readonly EditorialPortfolioRecord[]> => {
  if (locale === 'en') return listNewsroomArticles('en');
  const [local, english] = await Promise.all([listNewsroomArticles(locale), listNewsroomArticles('en')]);
  const translated = new Set(local.flatMap(article => [article.slug, article.translationGroupId ?? article.slug]));
  return [...local, ...english.filter(article => article.type !== 'news-brief'
    && !translated.has(article.slug)
    && !translated.has(article.translationGroupId ?? article.slug))].sort(newestFirst);
});

export const getNewsroomArticle = cache(async (slug: string, locale: ContentLocale = 'en'): Promise<EditorialPortfolioRecord | null> => {
  const stored = await getPublishedContent(locale, slug);
  if (stored && isNews(stored)) return storedEditorialRecord(stored);
  const article = getPortfolioRecord(locale, slug);
  return article && (isNews(article) || (locale === 'ko' && article.type === 'policy-update')) ? article : null;
});

/** Shared homepage feed. Publication dates retain their actual publication time. */
export const listLatestInsightArticles = cache(async (locale: ContentLocale = 'en', limit = 4): Promise<readonly EditorialPortfolioRecord[]> => {
  return (await listInsightArticles(locale)).filter(article =>
    ['market-brief', 'data-story'].includes(article.type)
    && !isInsightReference(article.slug)
    && !isNeighborhoodEditorial(article.slug)
    && Date.parse(article.publishedAt) <= Date.now(),
  ).slice(0, Math.min(12, Math.max(1, Math.trunc(limit))));
});
