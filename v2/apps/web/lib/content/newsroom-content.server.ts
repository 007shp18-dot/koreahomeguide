import 'server-only';

import { cache } from 'react';

import { getPortfolioRecord, listPortfolioRecords } from '../../content/portfolio-manifest';
import type { EditorialPortfolioRecord } from '../../content/portfolio-types';

export const listNewsroomArticles = cache(async (): Promise<readonly EditorialPortfolioRecord[]> => {
  return Object.freeze(listPortfolioRecords('en')
    .filter(({ type }) => type === 'market-brief' || type === 'data-story')
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)));
});

export const getNewsroomArticle = cache(async (slug: string): Promise<EditorialPortfolioRecord | null> => {
  const article = getPortfolioRecord('en', slug);
  return article?.type === 'market-brief' || article?.type === 'data-story' ? article : null;
});
