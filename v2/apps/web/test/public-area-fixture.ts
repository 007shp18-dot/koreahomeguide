import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type SeoulDistrictSlug,
} from '@signedprice/korea-rent/browser';

export const PUBLIC_AREA_FIXTURE_PERIOD = '2026-01/2026-07';
export const CITY_MEDIAN_SENTINEL = 987_654_321;

type MutablePublishedSummary = {
  marketId: 'kr-seoul';
  area: string;
  parent: string;
  deal: 'jeonse';
  band: '45-55sqm';
  period: string;
  n: number;
  published: true;
  min: number;
  p25: number;
  med: number;
  p75: number;
  max: number;
  chg3m: number | null;
};

type MutableWithheldSummary = {
  marketId: 'kr-seoul';
  area: string;
  parent: string;
  deal: 'jeonse';
  band: '45-55sqm';
  period: string;
  n: number;
  published: false;
};

export type MutableAreaSummary = MutablePublishedSummary | MutableWithheldSummary;

export type PublishedSummaryOverrides = Readonly<Partial<{
  n: number;
  min: number;
  p25: number;
  med: number;
  p75: number;
  max: number;
  chg3m: number | null;
}>>;

export type PublicAreaFixtureArtifact = {
  artifactVersion: string;
  generatedAt: string;
  provenance: {
    marketId: string;
    period: string;
    provider: string;
    endpointVersion: string;
    parserVersion: string;
    rightsPolicyId: string;
    sourceComplete: boolean;
  };
  citySummary: MutablePublishedSummary;
  districtSummaries: MutableAreaSummary[];
};

export type PublicAreaFixtureOptions = Readonly<{
  publishedMedians?: Readonly<Partial<Record<SeoulDistrictSlug, number>>>;
  withheldCounts?: Readonly<Partial<Record<SeoulDistrictSlug, number>>>;
  publishedOverrides?: Readonly<Partial<Record<SeoulDistrictSlug, PublishedSummaryOverrides>>>;
}>;

function publishedSummary(
  area: string,
  parent: string,
  med: number,
  n: number,
  chg3m: number | null,
): MutablePublishedSummary {
  return {
    marketId: 'kr-seoul',
    area,
    parent,
    deal: 'jeonse',
    band: '45-55sqm',
    period: PUBLIC_AREA_FIXTURE_PERIOD,
    n,
    published: true,
    min: med - 20_000_000,
    p25: med - 10_000_000,
    med,
    p75: med + 10_000_000,
    max: med + 20_000_000,
    chg3m,
  };
}

export function createPublicAreaFixture(
  options: PublicAreaFixtureOptions = {},
): PublicAreaFixtureArtifact {
  const districtSummaries = SEOUL_RENT_CHECK_DISTRICTS.map((district, index) => {
    const configuredMedian = options.publishedMedians?.[district.slug];
    const overrides = options.publishedOverrides?.[district.slug];
    const publishEveryDistrict = options.publishedMedians === undefined;
    if (publishEveryDistrict || configuredMedian !== undefined) {
      return {
        ...publishedSummary(
        district.slug,
        'seoul',
        configuredMedian ?? 100_000_000 + index * 10_000_000,
        5,
        index % 2 === 0 ? null : 1.2,
        ),
        ...overrides,
      } satisfies MutablePublishedSummary;
    }
    return {
      marketId: 'kr-seoul',
      area: district.slug,
      parent: 'seoul',
      deal: 'jeonse',
      band: '45-55sqm',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      n: options.withheldCounts?.[district.slug] ?? 4,
      published: false,
    } satisfies MutableWithheldSummary;
  });
  const cityN = districtSummaries.reduce((sum, summary) => sum + summary.n, 0);

  return {
    artifactVersion: 'signedprice-public-area-summary-v1',
    generatedAt: '2026-08-31T01:13:24.787Z',
    provenance: {
      marketId: 'kr-seoul',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      provider: 'MOLIT',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-rent-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
    },
    citySummary: publishedSummary(
      'seoul',
      'kr',
      CITY_MEDIAN_SENTINEL,
      cityN,
      2.5,
    ),
    districtSummaries,
  };
}
