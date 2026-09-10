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
  'signedprice-public-area-summary-v2' as const;
export const PUBLIC_AREA_SUMMARY_ARTIFACT_V1_VERSION =
  'signedprice-public-area-summary-v1' as const;

export type PublicAreaSummaryContractGroup = 'all' | 'new' | 'renewal';

export type PublicAreaSummaryArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
}>;

export type PublicAreaSummaryArtifactInput = Readonly<{
  artifactVersion: unknown;
  generatedAt: unknown;
  provenance: unknown;
  groups: unknown;
  unknownContractCounts: unknown;
  readonly [key: string]: unknown;
}>;

export type VerifiedPublicAreaSummaryGroup = Readonly<{
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[];
}>;

export type VerifiedPublicAreaSummaryArtifact = Readonly<{
  artifactVersion: typeof PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  groups: Readonly<Record<PublicAreaSummaryContractGroup, VerifiedPublicAreaSummaryGroup>>;
  unknownContractCounts: Readonly<{
    city: number;
    districts: readonly number[];
  }>;
}>;

export type VerifiedPublicAreaSummaryArtifactV1 = Readonly<{
  artifactVersion: typeof PUBLIC_AREA_SUMMARY_ARTIFACT_V1_VERSION;
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
  'groups',
  'unknownContractCounts',
] as const;
const V1_ROOT_KEYS = [
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
const GROUP_KEYS = ['all', 'new', 'renewal'] as const;
const SUMMARY_GROUP_KEYS = ['citySummary', 'districtSummaries'] as const;
const UNKNOWN_COUNT_KEYS = ['city', 'districts'] as const;
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

function parseGroup(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryGroup {
  if (!isRecord(value) || !hasExactKeys(value, SUMMARY_GROUP_KEYS)) invalidArtifact();
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
  if (citySummary.n !== districtSummaries.reduce((sum, summary) => sum + summary.n, 0)) {
    invalidArtifact();
  }
  return Object.freeze({ citySummary, districtSummaries });
}

function parseGroups(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryArtifact['groups'] {
  if (!isRecord(value) || !hasExactKeys(value, GROUP_KEYS)) invalidArtifact();
  return Object.freeze({
    all: parseGroup(value.all, expected),
    new: parseGroup(value.new, expected),
    renewal: parseGroup(value.renewal, expected),
  });
}

function parseUnknownContractCounts(
  value: unknown,
): VerifiedPublicAreaSummaryArtifact['unknownContractCounts'] {
  if (!isRecord(value) || !hasExactKeys(value, UNKNOWN_COUNT_KEYS)) invalidArtifact();
  if (!Number.isSafeInteger(value.city) || (value.city as number) < 0) invalidArtifact();
  if (
    !Array.isArray(value.districts) ||
    value.districts.length !== SEOUL_RENT_CHECK_DISTRICTS.length ||
    value.districts.some((count) => !Number.isSafeInteger(count) || count < 0)
  ) {
    invalidArtifact();
  }
  const districts = Object.freeze([...(value.districts as number[])]);
  if (value.city !== districts.reduce((sum, count) => sum + count, 0)) invalidArtifact();
  return Object.freeze({ city: value.city as number, districts });
}

function assertGroupReconciliation(
  groups: VerifiedPublicAreaSummaryArtifact['groups'],
  unknownContractCounts: VerifiedPublicAreaSummaryArtifact['unknownContractCounts'],
): void {
  if (
    groups.all.citySummary.n !==
      groups.new.citySummary.n +
      groups.renewal.citySummary.n +
      unknownContractCounts.city
  ) {
    invalidArtifact();
  }
  for (let index = 0; index < SEOUL_RENT_CHECK_DISTRICTS.length; index += 1) {
    if (
      groups.all.districtSummaries[index]!.n !==
        groups.new.districtSummaries[index]!.n +
        groups.renewal.districtSummaries[index]!.n +
        unknownContractCounts.districts[index]!
    ) {
      invalidArtifact();
    }
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
  const groups = parseGroups(value.groups, expected);
  const unknownContractCounts = parseUnknownContractCounts(value.unknownContractCounts);
  assertGroupReconciliation(groups, unknownContractCounts);
  return Object.freeze({
    artifactVersion: PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
    generatedAt: value.generatedAt,
    marketId: expected.marketId,
    period: expected.period,
    groups,
    unknownContractCounts,
  });
}

function parseV1Artifact(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryArtifactV1 {
  if (!isRecord(value) || !hasExactKeys(value, V1_ROOT_KEYS)) invalidArtifact();
  if (
    value.artifactVersion !== PUBLIC_AREA_SUMMARY_ARTIFACT_V1_VERSION ||
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
  if (citySummary.n !== districtSummaries.reduce((sum, summary) => sum + summary.n, 0)) {
    invalidArtifact();
  }
  return Object.freeze({
    artifactVersion: PUBLIC_AREA_SUMMARY_ARTIFACT_V1_VERSION,
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

export function parsePublicAreaSummaryArtifactV1(
  value: unknown,
  expected: PublicAreaSummaryArtifactExpectation,
): VerifiedPublicAreaSummaryArtifactV1 {
  try {
    return parseV1Artifact(value, expected);
  } catch {
    invalidArtifact();
  }
}
