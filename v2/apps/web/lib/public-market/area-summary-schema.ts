import 'server-only';

import {
  createPublicMarketSummary,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  SEOUL_RENT_CHECK_DISTRICTS,
} from '@signedprice/korea-rent/browser';

export const PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION =
  'signedprice-public-area-summary-v1' as const;

export type PublicAreaSummaryArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
}>;

export type PublicAreaSummaryArtifactInput = Readonly<{
  artifactVersion: unknown;
  generatedAt: unknown;
  provenance: unknown;
  citySummary: unknown;
  districtSummaries: unknown;
  readonly [key: string]: unknown;
}>;

export type VerifiedPublicAreaSummaryArtifact = Readonly<{
  artifactVersion: typeof PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[];
}>;

const ROOT_KEYS = [
  'artifactVersion',
  'generatedAt',
  'provenance',
  'citySummary',
  'districtSummaries',
] as const;
const PROVENANCE_KEYS = [
  'marketId',
  'period',
  'provider',
  'endpointVersion',
  'parserVersion',
  'rightsPolicyId',
  'sourceComplete',
] as const;
const IDENTITY_KEYS = [
  'marketId', 'area', 'parent', 'deal', 'band', 'period', 'n', 'published',
] as const;
const PUBLISHED_KEYS = [
  ...IDENTITY_KEYS, 'min', 'p25', 'med', 'p75', 'max', 'chg3m',
] as const;

function invalidArtifact(): never {
  throw new TypeError('Invalid public area summary artifact.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function assertProvenance(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): void {
  if (!isRecord(value) || !hasExactKeys(value, PROVENANCE_KEYS)) invalidArtifact();
  if (
    value.marketId !== expected.marketId ||
    value.period !== expected.period ||
    value.provider !== 'MOLIT' ||
    value.endpointVersion !== MOLIT_ENDPOINT_VERSION ||
    value.parserVersion !== MOLIT_PARSER_VERSION ||
    value.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID ||
    value.sourceComplete !== true
  ) {
    invalidArtifact();
  }
}

function validChange(value: unknown): value is number | null {
  return value === null || (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > -100 &&
    Number.isInteger(value * 10)
  );
}

function parseSummary(value: unknown): PublicMarketSummary {
  if (!isRecord(value) || typeof value.published !== 'boolean') invalidArtifact();
  const keys = value.published ? PUBLISHED_KEYS : IDENTITY_KEYS;
  if (!hasExactKeys(value, keys)) invalidArtifact();
  if (
    value.published && (
      !Number.isInteger(value.n) ||
      (value.n as number) < 5 ||
      !validChange(value.chg3m)
    )
  ) {
    invalidArtifact();
  }
  return createPublicMarketSummary({
    marketId: value.marketId as 'kr-seoul',
    area: value.area as string,
    parent: value.parent as string,
    deal: value.deal as string,
    band: value.band as string,
    period: value.period as string,
    n: value.n as number,
    ...(value.published
      ? {
          min: value.min as number,
          p25: value.p25 as number,
          med: value.med as number,
          p75: value.p75 as number,
          max: value.max as number,
          chg3m: value.chg3m as number | null,
        }
      : {}),
  });
}

function assertIdentity(
  summary: PublicMarketSummary,
  expected: PublicAreaSummaryArtifactExpectation,
  area: string,
  parent: string,
): void {
  if (
    summary.marketId !== expected.marketId ||
    summary.area !== area ||
    summary.parent !== parent ||
    summary.deal !== 'jeonse' ||
    summary.band !== '45-55sqm' ||
    summary.period !== expected.period
  ) {
    invalidArtifact();
  }
}

function parseArtifact(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryArtifact {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) invalidArtifact();
  if (
    value.artifactVersion !== PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION ||
    !isCanonicalInstant(value.generatedAt)
  ) {
    invalidArtifact();
  }
  assertProvenance(value.provenance, expected);
  const citySummary = parseSummary(value.citySummary);
  assertIdentity(citySummary, expected, 'seoul', 'kr');
  if (
    !Array.isArray(value.districtSummaries) ||
    value.districtSummaries.length !== SEOUL_RENT_CHECK_DISTRICTS.length
  ) {
    invalidArtifact();
  }
  const districtSummaries = Object.freeze(value.districtSummaries.map((item, index) => {
    const district = SEOUL_RENT_CHECK_DISTRICTS[index];
    if (district === undefined) invalidArtifact();
    const summary = parseSummary(item);
    assertIdentity(summary, expected, district.slug, 'seoul');
    return summary;
  }));
  if (
    new Set(districtSummaries.map(({ area }) => area)).size !== districtSummaries.length ||
    citySummary.n !== districtSummaries.reduce((sum, summary) => sum + summary.n, 0)
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    artifactVersion: PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
    generatedAt: value.generatedAt,
    marketId: expected.marketId,
    period: expected.period,
    citySummary,
    districtSummaries,
  });
}

export function parsePublicAreaSummaryArtifact(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryArtifact {
  try {
    return parseArtifact(value, expected);
  } catch {
    invalidArtifact();
  }
}
