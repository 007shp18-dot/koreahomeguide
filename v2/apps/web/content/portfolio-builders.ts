import type { ContentLocale, ContentMarketId, ContentSource } from '../lib/content/content-types';
import type { InfographicSpec, InfographicTemplate } from '../lib/infographics/infographic-types';
import { validateInfographicSpec } from '../lib/infographics/infographic-validator';
import type { EditorialPortfolioRecord, PortfolioContentType } from './portfolio-types';

export const RELEASES = Object.freeze({
  publicBuildingSummary: 'public-kr-building-summary-2026-09-01',
  rent: 'installed-kr-rent-2026-09-02',
  sale: 'installed-kr-sale-2026-09-02',
  conversion: 'installed-kr-conversion-2026-09-02',
  singapore: 'installed-sg-private-sale-2026-09-02',
  policyKorea: 'official-kr-policy-2026-09-04',
  policySingapore: 'official-sg-policy-2026-09-04',
});

export const SOURCES = Object.freeze({
  koreaLeaseLaw: source('kr-lease-law', 'Korea National Law Information Center', 'Housing Lease Protection Act', 'https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=258519&viewCls=engLsInfoR', '2026-09-04'),
  koreaTransactions: source('kr-transactions', 'Ministry of Land, Infrastructure and Transport', 'Real Estate Transaction Management System', 'https://rt.molit.go.kr/', '2026-09-04'),
  koreaForeignReporting: source('kr-foreign-reporting-2026', 'Ministry of Land, Infrastructure and Transport', 'Expanded foreign real-estate transaction reporting', 'https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95091684&lcmspage=1', '2026-09-04'),
  seoulPermit: source('seoul-land-permit-registry', 'Seoul Metropolitan Government', 'Land transaction permission designation status', 'https://land.seoul.go.kr/land/other/appointStatusSeoul.do', '2026-09-04'),
  koreaFinance: source('kr-finance-2026', 'Financial Services Commission', 'Housing finance measures effective July 2026', 'https://www.fsc.go.kr/no010101/87222', '2026-09-04'),
  singaporeAbsd: source('sg-iras-absd', 'Inland Revenue Authority of Singapore', 'Additional Buyer’s Stamp Duty', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29', '2026-09-04'),
  singaporeHdb: source('sg-hdb-waitout-2026', 'Housing & Development Board', 'Removal of the 15-month wait-out period', 'https://www.hdb.gov.sg/hdb-pulse/news/2026/removal-of-the-15-month-wait-out-period-for-private-residential-property-owners', '2026-09-04'),
  singaporeUra: source('sg-ura-q2-2026', 'Urban Redevelopment Authority', 'Release of 2nd Quarter 2026 real estate statistics', 'https://www.ura.gov.sg/news/media/pr26-57/', '2026-09-04'),
});

function source(id: string, publisher: string, title: string, href: string, checkedAt: string): ContentSource {
  return Object.freeze({ id, kind: 'primary', publisher, title, href, checkedAt, publishedAt: null });
}

type RecordInput = Readonly<{
  slug: string;
  locale: ContentLocale;
  type: PortfolioContentType;
  marketId: ContentMarketId;
  title: string;
  deck: string;
  question: string;
  points: readonly [readonly [string, string], readonly [string, string], readonly [string, string]];
  boundary: string;
  sources: readonly ContentSource[];
  evidenceReleaseIds: readonly string[];
  relatedHref: string | null;
  translationGroupId?: string | null;
  infographic?: InfographicSpec | null;
  publishedAt?: string;
}>;

function route(input: Pick<RecordInput, 'locale' | 'type' | 'slug'>): string {
  const prefix = input.locale === 'zh-CN' ? '/zh-cn' : '';
  if (input.type === 'guide') return `${prefix}/guides/${input.slug}/`;
  if (input.type === 'policy-update') return `${prefix}/news/policy/${input.slug}/`;
  return `${prefix}/news/${input.slug}/`;
}

export function portfolioRecord(input: RecordInput): EditorialPortfolioRecord {
  const [first, second, third] = input.points;
  return Object.freeze({
    id: `${input.locale}:${input.slug}`,
    slug: input.slug,
    locale: input.locale,
    marketId: input.marketId,
    type: input.type,
    title: input.title,
    deck: input.deck,
    readerQuestion: input.question,
    bodyMarkdown: `## ${first[0]}\n\n${first[1]}\n\n## ${second[0]}\n\n${second[1]}\n\n## ${third[0]}\n\n${third[1]}\n\n## Evidence boundary\n\n${input.boundary}`,
    status: 'published',
    evidenceState: 'verified',
    authorName: 'SignedPrice Data Desk',
    reviewedAt: '2026-09-04T00:00:00.000Z',
    reviewedBy: input.locale === 'zh-CN' ? 'SignedPrice Chinese Editorial Review' : 'SignedPrice Research Editor',
    publishedAt: input.publishedAt ?? '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    relatedHref: input.relatedHref,
    sources: Object.freeze([...input.sources]),
    evidenceReleaseIds: Object.freeze([...input.evidenceReleaseIds]),
    revisionNote: 'Launch review reconciled claims, dates, links and evidence boundaries against the cited primary sources.',
    canonicalHref: route(input),
    translationGroupId: input.translationGroupId ?? null,
    infographic: input.infographic ?? null,
  });
}

export function infographic(input: Readonly<{
  id: string;
  locale: ContentLocale;
  template: InfographicTemplate;
  title: string;
  summary: string;
  releases: readonly string[];
  period: InfographicSpec['period'];
  unit: string;
  source: string;
  sample: string;
  relatedHref: string;
  series: readonly Readonly<{ id: string; label: string; values: readonly Readonly<{ label: string; value: number; release?: string }>[] }>[];
}>): InfographicSpec {
  return validateInfographicSpec({
    id: input.id,
    template: input.template,
    locale: input.locale,
    title: input.title,
    accessibleSummary: input.summary,
    evidenceReleaseIds: input.releases,
    unit: input.unit,
    period: input.period,
    series: input.series.map((series) => ({
      id: series.id,
      label: series.label,
      values: series.values.map((datum) => ({
        label: datum.label,
        value: datum.value,
        evidenceReleaseId: datum.release ?? input.releases[0],
      })),
    })),
    sourceLabel: input.source,
    sampleLabel: input.sample,
    relatedHref: input.relatedHref,
    conversionProvenance: null,
  });
}
