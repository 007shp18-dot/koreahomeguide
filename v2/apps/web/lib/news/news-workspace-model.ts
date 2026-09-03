export type NewsWorkspaceMarket = 'all' | 'seoul' | 'singapore' | 'dubai';
export type NewsWorkspaceEvidence = 'matched' | 'no-change' | 'checking' | 'insufficient';

export type NewsWorkspaceItem = Readonly<{
  id: string;
  market: Exclude<NewsWorkspaceMarket, 'all'>;
  marketLabel: string;
  title: string;
  summary: string;
  url: string;
  internalHref: string | null;
  publisher: string;
  publishedAt: string;
  category: string;
  evidence: NewsWorkspaceEvidence;
  evidenceLine: string;
  sourceKind: 'naver-search' | 'signedprice-brief';
}>;

export type NewsWorkspaceModel = Readonly<{
  items: readonly NewsWorkspaceItem[];
  naverState: 'ready' | 'not-configured' | 'unavailable';
  naverDiagnostic?: 'credentials-rejected' | 'permission-denied' | 'rate-limited' | 'upstream-error' | 'network-error';
}>;
