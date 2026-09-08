import { listPortfolioRecords } from './portfolio-manifest';
import type { StoryLocale } from './city-stories';

// These interactive transaction comparisons keep their established URLs, but
// belong to Insights rather than the practical reference directory.
export const BUDGET_ANALYSIS_SLUGS = new Set([
  'seoul-apartment-buying-budget-guide',
  'singapore-condo-buying-budget-guide',
  'dubai-ready-apartment-buying-budget-guide',
]);

export function isBudgetAnalysis(slug: string) {
  return BUDGET_ANALYSIS_SLUGS.has(slug);
}

export function isPracticalGuide(article: { type: string; slug: string }) {
  return article.type === 'guide' && !isBudgetAnalysis(article.slug)
    && article.slug !== 'compare-seoul-district-prices';
}

export function listPracticalGuides(locale: StoryLocale) {
  return listPortfolioRecords(locale).filter(isPracticalGuide);
}
