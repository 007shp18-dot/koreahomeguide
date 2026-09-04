export type ContentType = 'news-brief' | 'policy-update' | 'market-brief' | 'data-story' | 'guide';
export type EditorialStatus = 'draft' | 'fact-check' | 'review' | 'scheduled' | 'published' | 'archived';
export type EvidenceState = 'verified' | 'partial' | 'not-applicable' | 'withdrawn';
export type ContentLocale = 'en' | 'ko' | 'zh-CN';
export type ContentMarketId = 'kr-seoul' | 'sg-singapore';

export type ContentSource = Readonly<{
  id: string;
  kind: 'primary' | 'secondary';
  publisher: string;
  title: string;
  href: string;
  checkedAt: string;
  publishedAt?: string | null;
}>;

export type PublishedContentArticle = Readonly<{
  id: string;
  slug: string;
  locale: ContentLocale;
  marketId: ContentMarketId | null;
  type: ContentType;
  title: string;
  deck: string;
  bodyMarkdown: string;
  status: EditorialStatus;
  evidenceState: EvidenceState;
  authorName: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  publishedAt: string;
  updatedAt: string;
  relatedHref: string | null;
  sources: readonly ContentSource[];
}>;

export type PublishedContentQuery = Readonly<{
  locale: ContentLocale;
  marketId?: ContentMarketId;
  type?: ContentType;
  limit: number;
}>;

export type ExternalDiscoveryIdentity = Readonly<{
  id: string;
  reviewState: 'new' | 'triaged' | 'linked' | 'rejected';
}>;

/** External discovery records are desk inputs and never canonical public documents. */
export function externalDiscoveryPublicHref(item: ExternalDiscoveryIdentity): null {
  void item;
  return null;
}
