import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  buildKoreaRentEvidence,
  buildKoreaSaleEvidence,
  type KoreaRentEvidence,
  type KoreaRentRecord,
  type KoreaSaleEvidence,
  type KoreaSaleRecord,
} from '../../packages/korea-rent/src/index';

export const CONTRACT_CHECK_EVIDENCE_TEST_PERIOD = '2026-02/2026-08';
export const CONTRACT_CHECK_RENT_EVIDENCE_URL = 'installed://kr-rent-check-fixture';
export const CONTRACT_CHECK_SALE_EVIDENCE_URL = 'installed://kr-sale-check-fixture';

const generatedAt = '2026-08-31T00:00:00.000Z';
const completedMonths = Object.freeze([
  '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08',
]);

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

function rentRecord(
  index: number,
  transaction: 'jeonse' | 'monthly',
): KoreaRentRecord {
  return Object.freeze({
    sourceHousingType: 'apartment',
    areaSqm: 82 + index * 0.8,
    depositWon: transaction === 'jeonse'
      ? 650_000_000 + index * 10_000_000
      : 50_000_000 + index * 2_000_000,
    monthlyRentWon: transaction === 'monthly' ? 2_000_000 + index * 50_000 : 0,
    contractDate: `2026-0${index + 3}-15`,
    contractType: 'new',
    recordStatus: 'active',
    legalDong: '역삼동',
    buildingLabel: '체크검증아파트',
  });
}

function saleRecord(index: number): KoreaSaleRecord {
  return Object.freeze({
    sourceHousingType: 'apartment',
    areaSqm: 82 + index * 0.8,
    priceWon: 1_000_000_000 + index * 50_000_000,
    contractDate: `2026-0${index + 3}-15`,
    recordStatus: 'active',
    legalDong: '역삼동',
    buildingLabel: '체크검증아파트',
  });
}

function wrapRentEvidence(evidence: KoreaRentEvidence) {
  const unsigned = Object.freeze({
    artifactVersion: 'signedprice-korea-rent-evidence-v2',
    generatedAt: evidence.generatedAt,
    provenance: Object.freeze({
      marketId: evidence.marketId,
      period: evidence.period,
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
    publicationMinimum: evidence.publicationMinimum,
    stats: evidence.stats,
    areaRecords: evidence.areaRecords,
    buildingRecords: evidence.buildingRecords,
  });
  const artifact = Object.freeze({ ...unsigned, sha256: digest(unsigned) });
  return Object.freeze({
    artifact,
    sha256: digest(artifact),
    recordCount: evidence.areaRecords.length + evidence.buildingRecords.length,
  });
}

function wrapSaleEvidence(evidence: KoreaSaleEvidence) {
  const unsigned = Object.freeze({
    artifactVersion: 'signedprice-korea-sale-evidence-v1',
    generatedAt: evidence.generatedAt,
    provenance: Object.freeze({
      marketId: evidence.marketId,
      period: evidence.period,
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
    publicationMinimum: evidence.publicationMinimum,
    stats: evidence.stats,
    areaRecords: evidence.areaRecords,
    buildingRecords: evidence.buildingRecords,
  });
  const artifact = Object.freeze({ ...unsigned, sha256: digest(unsigned) });
  return Object.freeze({
    artifact,
    sha256: digest(artifact),
    recordCount: evidence.areaRecords.length + evidence.buildingRecords.length,
  });
}

const rentEvidence = wrapRentEvidence(buildKoreaRentEvidence({
  period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
  completedMonths,
  generatedAt,
  records: Object.freeze([
    ...Array.from({ length: 6 }, (_, index) => Object.freeze({
      districtSlug: 'gangnam-gu' as const,
      record: rentRecord(index, 'jeonse'),
    })),
    ...Array.from({ length: 6 }, (_, index) => Object.freeze({
      districtSlug: 'gangnam-gu' as const,
      record: rentRecord(index, 'monthly'),
    })),
  ]),
}));

const saleEvidence = wrapSaleEvidence(buildKoreaSaleEvidence({
  period: CONTRACT_CHECK_EVIDENCE_TEST_PERIOD,
  completedMonths,
  generatedAt,
  records: Object.freeze(Array.from({ length: 6 }, (_, index) => Object.freeze({
    districtSlug: 'gangnam-gu' as const,
    record: saleRecord(index),
  }))),
}));

export const CONTRACT_CHECK_RENT_EVIDENCE_TEST_GZIP_BASE64 = gzipSync(
  JSON.stringify(rentEvidence.artifact),
).toString('base64');
export const CONTRACT_CHECK_SALE_EVIDENCE_TEST_GZIP_BASE64 = gzipSync(
  JSON.stringify(saleEvidence.artifact),
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
      sha256: rentEvidence.sha256,
      recordCount: rentEvidence.recordCount,
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
      sha256: saleEvidence.sha256,
      recordCount: saleEvidence.recordCount,
    },
  ],
});
