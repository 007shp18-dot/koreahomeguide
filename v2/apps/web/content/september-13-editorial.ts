import type { EditorialPortfolioRecord } from './portfolio-types';
import stories from './september-13-stories';

const checkedAt = '2026-09-13T12:00:00Z';

export const SEPTEMBER_13_EDITORIAL: readonly EditorialPortfolioRecord[] = stories.flatMap(story => (['en', 'ko'] as const).map(locale => {
  const [title, deck, bodyMarkdown] = story[locale];
  const prefix = locale === 'en' ? '' : '/ko';
  return {
    id: `${locale}-${story.slug}`, slug: story.slug, locale, marketId: story.marketId,
    type: 'market-brief', title, deck, bodyMarkdown, status: 'published', evidenceState: 'verified',
    authorName: 'SignedPrice Editorial', reviewedBy: 'SignedPrice source check (AI-assisted)',
    reviewedAt: checkedAt, publishedAt: checkedAt, updatedAt: checkedAt,
    readerQuestion: title,
    revisionNote: 'Expanded bilingual editorial edition: original analysis and neighbourhood essays. Observed data and illustrative calculations are labelled separately; references checked 13 September 2026.',
    sources: story.sources.map(source => ({ ...source, checkedAt: checkedAt.slice(0, 10) })),
    evidenceReleaseIds: story.sources.map(source => source.id),
    canonicalHref: `${prefix}/news/${story.slug}/`, translationGroupId: story.slug,
    relatedHref: `${prefix}/news/`, infographic: null,
  };
}));
