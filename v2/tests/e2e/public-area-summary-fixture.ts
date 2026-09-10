export const PUBLIC_AREA_SUMMARY_TEST_PERIOD = '2026-01/2026-07';
export const PUBLIC_AREA_PUBLISHED_SLUG = 'jongno-gu';
export const PUBLIC_AREA_WITHHELD_SLUG = 'seongbuk-gu';

export const PUBLIC_AREA_TEST_DISTRICTS = [
  { lawdCd: '11110', slug: 'jongno-gu', nameEn: 'Jongno-gu', nameKo: '종로구' },
  { lawdCd: '11140', slug: 'jung-gu', nameEn: 'Jung-gu', nameKo: '중구' },
  { lawdCd: '11170', slug: 'yongsan-gu', nameEn: 'Yongsan-gu', nameKo: '용산구' },
  { lawdCd: '11200', slug: 'seongdong-gu', nameEn: 'Seongdong-gu', nameKo: '성동구' },
  { lawdCd: '11215', slug: 'gwangjin-gu', nameEn: 'Gwangjin-gu', nameKo: '광진구' },
  { lawdCd: '11230', slug: 'dongdaemun-gu', nameEn: 'Dongdaemun-gu', nameKo: '동대문구' },
  { lawdCd: '11260', slug: 'jungnang-gu', nameEn: 'Jungnang-gu', nameKo: '중랑구' },
  { lawdCd: '11290', slug: 'seongbuk-gu', nameEn: 'Seongbuk-gu', nameKo: '성북구' },
  { lawdCd: '11305', slug: 'gangbuk-gu', nameEn: 'Gangbuk-gu', nameKo: '강북구' },
  { lawdCd: '11320', slug: 'dobong-gu', nameEn: 'Dobong-gu', nameKo: '도봉구' },
  { lawdCd: '11350', slug: 'nowon-gu', nameEn: 'Nowon-gu', nameKo: '노원구' },
  { lawdCd: '11380', slug: 'eunpyeong-gu', nameEn: 'Eunpyeong-gu', nameKo: '은평구' },
  { lawdCd: '11410', slug: 'seodaemun-gu', nameEn: 'Seodaemun-gu', nameKo: '서대문구' },
  { lawdCd: '11440', slug: 'mapo-gu', nameEn: 'Mapo-gu', nameKo: '마포구' },
  { lawdCd: '11470', slug: 'yangcheon-gu', nameEn: 'Yangcheon-gu', nameKo: '양천구' },
  { lawdCd: '11500', slug: 'gangseo-gu', nameEn: 'Gangseo-gu', nameKo: '강서구' },
  { lawdCd: '11530', slug: 'guro-gu', nameEn: 'Guro-gu', nameKo: '구로구' },
  { lawdCd: '11545', slug: 'geumcheon-gu', nameEn: 'Geumcheon-gu', nameKo: '금천구' },
  { lawdCd: '11560', slug: 'yeongdeungpo-gu', nameEn: 'Yeongdeungpo-gu', nameKo: '영등포구' },
  { lawdCd: '11590', slug: 'dongjak-gu', nameEn: 'Dongjak-gu', nameKo: '동작구' },
  { lawdCd: '11620', slug: 'gwanak-gu', nameEn: 'Gwanak-gu', nameKo: '관악구' },
  { lawdCd: '11650', slug: 'seocho-gu', nameEn: 'Seocho-gu', nameKo: '서초구' },
  { lawdCd: '11680', slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' },
  { lawdCd: '11710', slug: 'songpa-gu', nameEn: 'Songpa-gu', nameKo: '송파구' },
  { lawdCd: '11740', slug: 'gangdong-gu', nameEn: 'Gangdong-gu', nameKo: '강동구' },
] as const;

type SeoulDistrictSlug = (typeof PUBLIC_AREA_TEST_DISTRICTS)[number]['slug'];

const medians = {
  'jongno-gu': 500_000_000,
  'jung-gu': 100_000_000,
  'yongsan-gu': 100_000_000,
  'seongdong-gu': 300_000_000,
  'gwangjin-gu': 700_000_000,
  'dongdaemun-gu': 400_000_000,
  'jungnang-gu': 200_000_000,
  'seongbuk-gu': null,
  'gangbuk-gu': 220_000_000,
  'dobong-gu': 240_000_000,
  'nowon-gu': 260_000_000,
  'eunpyeong-gu': 280_000_000,
  'seodaemun-gu': 320_000_000,
  'mapo-gu': 340_000_000,
  'yangcheon-gu': 360_000_000,
  'gangseo-gu': 380_000_000,
  'guro-gu': 420_000_000,
  'geumcheon-gu': 440_000_000,
  'yeongdeungpo-gu': 460_000_000,
  'dongjak-gu': 480_000_000,
  'gwanak-gu': 520_000_000,
  'seocho-gu': 540_000_000,
  'gangnam-gu': 560_000_000,
  'songpa-gu': 580_000_000,
  'gangdong-gu': 600_000_000,
} as const satisfies Readonly<Record<SeoulDistrictSlug, number | null>>;

const districtSummaries = PUBLIC_AREA_TEST_DISTRICTS.map(({ slug }, index) => {
  const median = medians[slug];
  if (median === null) {
    return {
      marketId: 'kr-seoul', area: slug, parent: 'seoul', deal: 'jeonse',
      band: '45-55sqm', period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
      n: 4, published: false,
    } as const;
  }
  return {
    marketId: 'kr-seoul', area: slug, parent: 'seoul', deal: 'jeonse',
    band: '45-55sqm', period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
    n: 5, published: true,
    min: median - 20_000_000,
    p25: median - 10_000_000,
    med: median,
    p75: median + 10_000_000,
    max: median + 20_000_000,
    chg3m: index % 2 === 0 ? null : 1.2,
  } as const;
});

const cityN = districtSummaries.reduce((sum, summary) => sum + summary.n, 0);

const citySummary = {
  marketId: 'kr-seoul', area: 'seoul', parent: 'kr', deal: 'jeonse',
  band: '45-55sqm', period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
  n: cityN, published: true,
  min: 80_000_000,
  p25: 250_000_000,
  med: 410_000_000,
  p75: 550_000_000,
  max: 720_000_000,
  chg3m: null,
} as const;

const cohortDistrictSummaries = districtSummaries.map((summary) => ({
  marketId: summary.marketId,
  area: summary.area,
  parent: summary.parent,
  deal: summary.deal,
  band: summary.band,
  period: summary.period,
  n: 2,
  published: false,
} as const));

function cohortCitySummary(medianOffset: number) {
  return {
    ...citySummary,
    n: cohortDistrictSummaries.reduce((sum, summary) => sum + summary.n, 0),
    min: citySummary.min + medianOffset,
    p25: citySummary.p25 + medianOffset,
    med: citySummary.med + medianOffset,
    p75: citySummary.p75 + medianOffset,
    max: citySummary.max + medianOffset,
  } as const;
}

const unknownDistrictCounts = districtSummaries.map(
  (summary) => summary.n - 4,
);

export const PUBLIC_AREA_SUMMARY_TEST_ARTIFACT = JSON.stringify({
  artifactVersion: 'signedprice-public-area-summary-v2',
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul',
    period: PUBLIC_AREA_SUMMARY_TEST_PERIOD,
    provider: 'MOLIT',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    sourceComplete: true,
  },
  groups: {
    all: { citySummary, districtSummaries },
    new: {
      citySummary: cohortCitySummary(-10_000_000),
      districtSummaries: cohortDistrictSummaries,
    },
    renewal: {
      citySummary: cohortCitySummary(10_000_000),
      districtSummaries: cohortDistrictSummaries,
    },
  },
  unknownContractCounts: {
    city: unknownDistrictCounts.reduce((sum, count) => sum + count, 0),
    districts: unknownDistrictCounts,
  },
});

export const PUBLIC_AREA_TEST_LEGEND_LABELS = [
  '₩100,000,000–₩240,000,000 · 5 districts',
  '₩260,000,000–₩340,000,000 · 5 districts',
  '₩360,000,000–₩440,000,000 · 5 districts',
  '₩460,000,000–₩540,000,000 · 5 districts',
  '₩560,000,000–₩700,000,000 · 4 districts',
] as const;
