import type { PublishedContentArticle } from '../lib/content/content-types';
import type { InfographicSpec } from '../lib/infographics/infographic-types';

export type PortfolioContentType = 'policy-update' | 'market-brief' | 'data-story' | 'guide';

export type EditorialPortfolioRecord = PublishedContentArticle & Readonly<{
  type: PortfolioContentType;
  readerQuestion: string;
  evidenceReleaseIds: readonly string[];
  revisionNote: string;
  canonicalHref: string;
  translationGroupId: string | null;
  infographic: InfographicSpec | null;
}>;

