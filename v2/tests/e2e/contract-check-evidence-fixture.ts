import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

export const CONTRACT_CHECK_EVIDENCE_TEST_PERIOD = '2026-02/2026-08';
export const CONTRACT_CHECK_RENT_EVIDENCE_URL = 'installed://kr-rent-check-fixture';
export const CONTRACT_CHECK_SALE_EVIDENCE_URL = 'installed://kr-sale-check-fixture';

const generatedAt = '2026-08-31T00:00:00.000Z';
const areaBands = Object.freeze(['all', 'under-40', '40-60', '60-85', '85-plus']);
const contractGroups = Object.freeze(['all', 'new', 'renewal', 'unknown']);
const housingTypes = Object.freeze([
  'all', 'apartment', 'officetel', 'villa_multifamily', 'detached',
]);
const districtSlugs = Object.freeze([
  'jongno-gu', 'jung-gu', 'yongsan-gu', 'seongdong-gu', 'gwangjin-gu',
  'dongdaemun-gu', 'jungnang-gu', 'seongbuk-gu', 'gangbuk-gu', 'dobong-gu',
  'nowon-gu', 'eunpyeong-gu', 'seodaemun-gu', 'mapo-gu', 'yangcheon-gu',
  'gangseo-gu', 'guro-gu', 'geumcheon-gu', 'yeongdeungpo-gu', 'dongjak-gu',
  'gwanak-gu', 'seocho-gu', 'gangnam-gu', 'songpa-gu', 'gangdong-gu',
]);

const MOLIT_ENDPOINT_VERSION = 'v1';
const MOLIT_PARSER_VERSION = 'kr-molit-rent-parser-v2';
const MOLIT_RIGHTS_POLICY_ID = 'kr-molit-rent-v1';
const MOLIT_SALE_ENDPOINT_VERSION = 'v1';
const MOLIT_SALE_PARSER_VERSION = 'kr-molit-sale-parser-v1';
const MOLIT_SALE_RIGHTS_POLICY_ID = 'kr-molit-sale-v1';
const buildingIdentity = Object.freeze({
  buildingId: 'gangnam-gu-12cc4ko',
  districtSlug: 'gangnam-gu',
  neighborhoodId: 'gangnam-gu-dong-1g2fbdb',
  neighborhoodName: '역삼동',
  officialName: '체크검증아파트',
  housingType: 'apartment',
});

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new TypeError('Fixture value is not serializable.');
    return serialized;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(record[key])}`
  )).join(',')}}`;
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function published(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const percentile = (fraction: number) => {
    const index = (sorted.length - 1) * fraction;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return Math.round(lower === upper
      ? sorted[lower]!
      : sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower));
  };
  return Object.freeze({
    n: sorted.length,
    published: true,
    min: sorted[0]!,
    p25: percentile(0.25),
    med: percentile(0.5),
    p75: percentile(0.75),
    max: sorted.at(-1)!,
    chg3m: null,
  });
}

function withheld(n = 0) {
  return Object.freeze({ n, published: false });
}

const jeonseDeposits = Object.freeze(Array.from(
  { length: 6 },
  (_, index) => 650_000_000 + index * 10_000_000,
));
const monthlyDeposits = Object.freeze(Array.from(
  { length: 6 },
  (_, index) => 50_000_000 + index * 2_000_000,
));
const monthlyRents = Object.freeze(Array.from(
  { length: 6 },
  (_, index) => 2_000_000 + index * 50_000,
));
const salePrices = Object.freeze(Array.from(
  { length: 6 },
  (_, index) => 1_000_000_000 + index * 50_000_000,
));

function isPopulatedArea(districtSlug: string | null, housingType: string): boolean {
  return (districtSlug === null || districtSlug === 'gangnam-gu')
    && (housingType === 'all' || housingType === 'apartment');
}

function distributionForArea(
  populated: boolean,
  areaBand: string,
  contractGroup: string,
  values: readonly number[],
) {
  if (!populated || !['all', 'new'].includes(contractGroup)) return withheld();
  if (areaBand === 'all') return published(values);
  if (areaBand === '60-85') return withheld(4);
  if (areaBand === '85-plus') return withheld(2);
  return withheld();
}

function rentCohorts(districtSlug: string | null, housingType: string, includeEmpty: boolean) {
  const populated = isPopulatedArea(districtSlug, housingType);
  return Object.freeze(['jeonse', 'monthly'].flatMap((transaction) => (
    areaBands.flatMap((areaBand) => contractGroups.flatMap((contractGroup) => {
      const primary = distributionForArea(
        populated,
        areaBand,
        contractGroup,
        transaction === 'jeonse' ? jeonseDeposits : monthlyRents,
      );
      if (!includeEmpty && primary.n === 0) return [];
      return [Object.freeze({
        transaction,
        areaBand,
        contractGroup,
        primaryMetric: transaction === 'jeonse' ? 'deposit' : 'monthly-rent',
        primary,
        filedDeposit: transaction === 'monthly'
          ? distributionForArea(
              populated,
              areaBand,
              contractGroup,
              monthlyDeposits,
            )
          : null,
      })];
    }))
  )));
}

function saleCohorts(districtSlug: string | null, housingType: string, includeEmpty: boolean) {
  const populated = isPopulatedArea(districtSlug, housingType);
  return Object.freeze(areaBands.flatMap((areaBand) => {
    const price = distributionForArea(populated, areaBand, 'all', salePrices);
    return !includeEmpty && price.n === 0
      ? []
      : [Object.freeze({ areaBand, price })];
  }));
}

function areaRecords(cohorts: (
  districtSlug: string | null,
  housingType: string,
  includeEmpty: boolean,
) => readonly unknown[]) {
  const city = housingTypes.map((housingType) => Object.freeze({
    scope: 'city',
    areaId: `seoul:${housingType}`,
    districtSlug: null,
    housingType,
    cohorts: cohorts(null, housingType, true),
  }));
  const districts = districtSlugs.flatMap((districtSlug) => (
    housingTypes.map((housingType) => Object.freeze({
      scope: 'district',
      areaId: `${districtSlug}:${housingType}`,
      districtSlug,
      housingType,
      cohorts: cohorts(districtSlug, housingType, true),
    }))
  ));
  return Object.freeze([...city, ...districts]);
}

const rentAreaRecords = areaRecords(rentCohorts);
const saleAreaRecords = areaRecords(saleCohorts);
const rentBuildingCohorts = rentCohorts('gangnam-gu', 'apartment', false);
const saleBuildingCohorts = saleCohorts('gangnam-gu', 'apartment', false);

const recentTransactions = Object.freeze(Array.from({ length: 6 }, (_, offset) => {
  const index = 5 - offset;
  return ['monthly', 'jeonse'].map((transaction) => Object.freeze({
    filedMonth: `2026-0${index + 3}`,
    areaSqm: 82 + index * 0.8,
    transaction,
    depositWon: transaction === 'jeonse' ? jeonseDeposits[index]! : monthlyDeposits[index]!,
    monthlyRentWon: transaction === 'monthly' ? monthlyRents[index]! : 0,
    contractType: 'new',
  }));
}).flat());
const recentSales = Object.freeze(Array.from({ length: 6 }, (_, offset) => {
  const index = 5 - offset;
  return Object.freeze({
    filedMonth: `2026-0${index + 3}`,
    areaSqm: 82 + index * 0.8,
    priceWon: salePrices[index]!,
  });
}));

function artifactWithDigest(unsigned: Readonly<Record<string, unknown>>) {
  return Object.freeze({ ...unsigned, sha256: digest(unsigned) });
}

const rentArtifact = artifactWithDigest(Object.freeze({
  artifactVersion: 'signedprice-korea-rent-evidence-v2',
  generatedAt,
  provenance: Object.freeze({
    marketId: 'kr-seoul',
    period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
    provider: 'MOLIT',
    dataset: 'reported rent contracts',
    endpointVersion: MOLIT_ENDPOINT_VERSION,
    parserVersion: MOLIT_PARSER_VERSION,
    rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
    sourceComplete: true,
    displayRights: true,
    exclusions: Object.freeze([
      'Canceled records',
      'Active records with no filed payment',
      'Records without a stable building identity',
      'Provider-only fields',
    ]),
  }),
  publicationMinimum: 5,
  stats: Object.freeze({
    sourceRecordCount: 12,
    eligibleRecordCount: 12,
    jeonseRecordCount: 6,
    monthlyRecordCount: 6,
    cancelledRecordCount: 0,
    invalidPaymentRecordCount: 0,
    missingIdentityRecordCount: 0,
    observedBuildingCount: 1,
    areaCohortCount: rentAreaRecords.length * 40,
    buildingCohortCount: rentBuildingCohorts.length,
    publishedCohortCount: 20,
    withheldCohortCount: rentAreaRecords.length * 40 + rentBuildingCohorts.length - 20,
  }),
  areaRecords: rentAreaRecords,
  buildingRecords: Object.freeze([Object.freeze({
    ...buildingIdentity,
    cohorts: rentBuildingCohorts,
    recentTransactions,
  })]),
}));

const saleArtifact = artifactWithDigest(Object.freeze({
  artifactVersion: 'signedprice-korea-sale-evidence-v1',
  generatedAt,
  provenance: Object.freeze({
    marketId: 'kr-seoul',
    period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
    provider: 'MOLIT',
    dataset: 'reported sale contracts',
    endpointVersion: MOLIT_SALE_ENDPOINT_VERSION,
    parserVersion: MOLIT_SALE_PARSER_VERSION,
    rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID,
    sourceComplete: true,
    displayRights: true,
    exclusions: Object.freeze([
      'Canceled records',
      'Records without a stable building identity',
      'Provider-only fields',
    ]),
  }),
  publicationMinimum: 5,
  stats: Object.freeze({
    sourceRecordCount: 6,
    eligibleRecordCount: 6,
    cancelledRecordCount: 0,
    missingIdentityRecordCount: 0,
    observedBuildingCount: 1,
    areaCohortCount: saleAreaRecords.length * 5,
    buildingCohortCount: saleBuildingCohorts.length,
    publishedCohortCount: 5,
    withheldCohortCount: saleAreaRecords.length * 5 + saleBuildingCohorts.length - 5,
  }),
  areaRecords: saleAreaRecords,
  buildingRecords: Object.freeze([Object.freeze({
    ...buildingIdentity,
    cohorts: saleBuildingCohorts,
    recentSales,
  })]),
}));

export const CONTRACT_CHECK_RENT_EVIDENCE_TEST_GZIP_BASE64 = gzipSync(
  JSON.stringify(rentArtifact),
).toString('base64');
export const CONTRACT_CHECK_SALE_EVIDENCE_TEST_GZIP_BASE64 = gzipSync(
  JSON.stringify(saleArtifact),
).toString('base64');
export const CONTRACT_CHECK_INSTALLED_REGISTRY_TEST_ARTIFACT = JSON.stringify({
  registryVersion: 'signedprice-installed-snapshots-v1',
  snapshots: [
    {
      marketId: 'kr-seoul',
      dataset: 'kr-rent',
      schemaVersion: 'signedprice-korea-rent-evidence-v2',
      sourceVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
      period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
      generatedAt,
      objectUrl: CONTRACT_CHECK_RENT_EVIDENCE_URL,
      sha256: digest(rentArtifact),
      recordCount: rentAreaRecords.length + 1,
    },
    {
      marketId: 'kr-seoul',
      dataset: 'kr-sale',
      schemaVersion: 'signedprice-korea-sale-evidence-v1',
      sourceVersion: MOLIT_SALE_ENDPOINT_VERSION,
      parserVersion: MOLIT_SALE_PARSER_VERSION,
      rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID,
      period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
      generatedAt,
      objectUrl: CONTRACT_CHECK_SALE_EVIDENCE_URL,
      sha256: digest(saleArtifact),
      recordCount: saleAreaRecords.length + 1,
    },
  ],
});
