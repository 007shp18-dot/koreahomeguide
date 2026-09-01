import {
  createPublicMarketSummary,
  type PublicMarketSummary,
} from '@signedprice/market-core';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from '@signedprice/korea-rent/browser';

export const PUBLIC_SUMMARY_ARTIFACT_VERSION =
  'signedprice-public-summary-v2' as const;

export type PublicSummaryArtifactProvenanceInput = Readonly<{
  marketId: unknown;
  period: unknown;
  provider: unknown;
  endpointVersion: unknown;
  parserVersion: unknown;
  rightsPolicyId: unknown;
  sourceComplete: unknown;
}>;

export type PublicSummaryArtifactInput = Readonly<{
  artifactVersion: unknown;
  generatedAt: unknown;
  provenance: PublicSummaryArtifactProvenanceInput;
  summaries: unknown;
  readonly [key: string]: unknown;
}>;

export type PublicSummaryArtifactExpectation = Readonly<{
  artifactVersion: typeof PUBLIC_SUMMARY_ARTIFACT_VERSION;
  marketId: 'kr-seoul';
  period: string;
}>;

export type VerifiedPublicSummaryArtifact = Readonly<{
  artifactVersion: typeof PUBLIC_SUMMARY_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  summaries: readonly PublicMarketSummary[];
}>;

const ROOT_KEYS = ['artifactVersion', 'generatedAt', 'provenance', 'summaries'] as const;
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
  throw new TypeError('Invalid public summary artifact.');
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
  expected: PublicSummaryArtifactExpectation,
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

function parseSummary(
  value: unknown,
  expected: PublicSummaryArtifactExpectation,
): PublicMarketSummary {
  if (!isRecord(value) || typeof value.published !== 'boolean') invalidArtifact();
  const keys = value.published ? PUBLISHED_KEYS : IDENTITY_KEYS;
  if (!hasExactKeys(value, keys)) invalidArtifact();
  if (value.marketId !== expected.marketId || value.period !== expected.period) {
    invalidArtifact();
  }
  if (
    value.published && (
      !Number.isInteger(value.n) ||
      (value.n as number) < 5 ||
      (value.chg3m !== null && (
        typeof value.chg3m !== 'number' || !Number.isFinite(value.chg3m)
      ))
    )
  ) {
    invalidArtifact();
  }

  return createPublicMarketSummary({
    marketId: value.marketId,
    area: value.area as string,
    parent: value.parent as string,
    deal: value.deal as string,
    band: value.band as string,
    period: value.period,
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

export function parsePublicSummaryArtifact(
  value: unknown,
  expected: PublicSummaryArtifactExpectation,
): VerifiedPublicSummaryArtifact {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) invalidArtifact();
  if (
    value.artifactVersion !== expected.artifactVersion ||
    !isCanonicalInstant(value.generatedAt)
  ) {
    invalidArtifact();
  }
  assertProvenance(value.provenance, expected);
  if (!Array.isArray(value.summaries) || value.summaries.length === 0) invalidArtifact();

  const summaries = value.summaries.map((summary) => parseSummary(summary, expected));
  const identities = new Set<string>();
  for (const summary of summaries) {
    const identity = JSON.stringify([
      summary.marketId, summary.area, summary.deal, summary.band,
    ]);
    if (identities.has(identity)) invalidArtifact();
    identities.add(identity);
  }

  return Object.freeze({
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: value.generatedAt,
    marketId: expected.marketId,
    period: expected.period,
    summaries: Object.freeze(summaries),
  });
}
