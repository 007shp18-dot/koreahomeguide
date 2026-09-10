export const REVIEW_SURFACES = ['home', 'content', 'check', 'explore'] as const;

export type ReviewSurface = (typeof REVIEW_SURFACES)[number];
export type ReviewLocale = 'en' | 'zh-CN';
export type ReviewState = 'ready' | 'insufficient' | 'error';
export type ReviewAdState = 'loaded' | 'empty';

export type ReviewQuery = Readonly<{
  locale: ReviewLocale;
  state: ReviewState;
  ad: ReviewAdState;
}>;

function scalar(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function resolveReviewQuery(
  input: Readonly<Record<string, string | readonly string[] | undefined>>,
): ReviewQuery {
  const locale = scalar(input.locale);
  const state = scalar(input.state);
  const ad = scalar(input.ad);

  return Object.freeze({
    locale: locale === 'zh-CN' ? 'zh-CN' : 'en',
    state: state === 'insufficient' || state === 'error' ? state : 'ready',
    ad: ad === 'loaded' ? 'loaded' : 'empty',
  });
}

export type ReviewMetric = Readonly<{
  label: string;
  value: string;
  context: string;
}>;

export type ReviewArticle = Readonly<{
  title: string;
  summary: string;
  market: string;
  published: string;
  updated: string;
  readMinutes: number;
  sections: readonly Readonly<{ heading: string; body: string }>[];
}>;

export type ReviewGuideSummary = Readonly<{
  title: string;
  summary: string;
  stage: string;
  updated: string;
  href: string;
}>;

export type ReviewCheck = Readonly<{
  state: ReviewState;
  verdict: string;
  scope: string;
  metrics: readonly ReviewMetric[];
  disclosure: string;
}>;

export type ReviewExploreRow = Readonly<{
  id: string;
  name: string;
  district: string;
  primaryValue: string;
  sample: string;
  period: string;
  selected: boolean;
}>;

export type ReviewMapDistrict = Readonly<{
  id: string;
  name: string;
  path: string;
  selected: boolean;
  evidenceState: 'published' | 'withheld';
}>;

export type EditorialGrowthReviewModel = Readonly<{
  locale: ReviewLocale;
  state: ReviewState;
  ad: ReviewAdState;
  seoulStatus: string;
  headlineMetric: ReviewMetric | null;
  article: ReviewArticle;
  articles: readonly ReviewArticle[];
  guides: readonly ReviewGuideSummary[];
  check: ReviewCheck;
  exploreRows: readonly ReviewExploreRow[];
  exploreDistricts: readonly ReviewMapDistrict[];
}>;
