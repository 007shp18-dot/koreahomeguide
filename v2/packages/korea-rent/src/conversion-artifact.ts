import type { ConversionCurve } from '@signedprice/market-core';

import { assertMolitRights, type MolitRightsLookup } from './rights';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from './versions';

export const KOREA_CONVERSION_ARTIFACT_VERSION = 1 as const;

export type KoreaConversionHousingType = 'apartment' | 'officetel';

export type KoreaConversionArtifactExpectation = Readonly<{
  marketId: 'kr-seoul';
  period: string;
  sha256: string;
  rightsLookup: MolitRightsLookup;
}>;

export type VerifiedKoreaConversionAnchor = Readonly<{
  depositWon: number;
  annualRate: number;
  pairCount: number;
}>;

export type VerifiedKoreaConversionCurve = Readonly<{
  housingType: KoreaConversionHousingType;
  observedMinDepositWon: number;
  observedMaxDepositWon: number;
  anchors: readonly VerifiedKoreaConversionAnchor[];
}>;

export type VerifiedKoreaConversionArtifact = Readonly<{
  artifactVersion: typeof KOREA_CONVERSION_ARTIFACT_VERSION;
  generatedAt: string;
  marketId: 'kr-seoul';
  period: string;
  sha256: string;
  maximumAgeDays: number;
  minimumPairsPerAnchor: number;
  eligiblePairCount: number;
  excluded: Readonly<{
    cancelled: number;
    invalidMoney: number;
    differentBuildingOrArea: number;
  }>;
  curves: readonly VerifiedKoreaConversionCurve[];
}>;

export type KoreaConversionCurveProjection = ConversionCurve<KoreaConversionHousingType> & Readonly<{
  generatedAt: string;
}>;

const ROOT_KEYS = [
  'artifactVersion',
  'generatedAt',
  'provenance',
  'readiness',
  'totals',
  'curves',
] as const;
const PROVENANCE_KEYS = [
  'marketId',
  'period',
  'provider',
  'endpointVersion',
  'parserVersion',
  'rightsPolicyId',
  'sourceComplete',
  'sha256',
] as const;
const READINESS_KEYS = ['state', 'maximumAgeDays', 'minimumPairsPerAnchor'] as const;
const TOTAL_KEYS = ['eligiblePairCount', 'excluded'] as const;
const EXCLUDED_KEYS = ['cancelled', 'invalidMoney', 'differentBuildingOrArea'] as const;
const CURVE_KEYS = [
  'housingType',
  'observedMinDepositWon',
  'observedMaxDepositWon',
  'anchors',
] as const;
const ANCHOR_KEYS = ['depositWon', 'annualRate', 'pairCount'] as const;
const PERIOD_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])\/\d{4}-(?:0[1-9]|1[0-2])$/;
const SHA_PATTERN = /^[a-f0-9]{64}$/;
const DAY_MS = 86_400_000;

function invalidArtifact(): never {
  throw new TypeError('Invalid Korea conversion artifact.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function canonicalInstant(value: unknown): string {
  if (typeof value !== 'string') invalidArtifact();
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== value) invalidArtifact();
  return value;
}

function positiveInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) invalidArtifact();
  return value as number;
}

function nonNegativeInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) invalidArtifact();
  return value as number;
}

function parsePeriod(value: unknown): string {
  if (typeof value !== 'string' || !PERIOD_PATTERN.test(value)) invalidArtifact();
  const [start, end] = value.split('/');
  if (start! > end!) invalidArtifact();
  return value;
}

function parseProvenance(
  value: unknown,
  expected: KoreaConversionArtifactExpectation,
): void {
  if (!isRecord(value) || !hasExactKeys(value, PROVENANCE_KEYS)) invalidArtifact();
  const period = parsePeriod(value.period);
  if (
    value.marketId !== expected.marketId ||
    period !== expected.period ||
    value.provider !== 'MOLIT' ||
    value.endpointVersion !== MOLIT_ENDPOINT_VERSION ||
    value.parserVersion !== MOLIT_PARSER_VERSION ||
    value.rightsPolicyId !== MOLIT_RIGHTS_POLICY_ID ||
    value.sourceComplete !== true ||
    typeof value.sha256 !== 'string' ||
    !SHA_PATTERN.test(value.sha256) ||
    value.sha256 !== expected.sha256
  ) {
    invalidArtifact();
  }

  assertMolitRights({
    lookup: expected.rightsLookup,
    policyId: value.rightsPolicyId,
    operations: ['derive', 'display', 'commercial'],
  });
}

function parseReadiness(value: unknown): Readonly<{
  maximumAgeDays: number;
  minimumPairsPerAnchor: number;
}> {
  if (!isRecord(value) || !hasExactKeys(value, READINESS_KEYS)) invalidArtifact();
  if (value.state !== 'ready') invalidArtifact();
  return Object.freeze({
    maximumAgeDays: positiveInteger(value.maximumAgeDays),
    minimumPairsPerAnchor: positiveInteger(value.minimumPairsPerAnchor),
  });
}

function parseExcluded(value: unknown): VerifiedKoreaConversionArtifact['excluded'] {
  if (!isRecord(value) || !hasExactKeys(value, EXCLUDED_KEYS)) invalidArtifact();
  return Object.freeze({
    cancelled: nonNegativeInteger(value.cancelled),
    invalidMoney: nonNegativeInteger(value.invalidMoney),
    differentBuildingOrArea: nonNegativeInteger(value.differentBuildingOrArea),
  });
}

function parseTotals(value: unknown): Readonly<{
  eligiblePairCount: number;
  excluded: VerifiedKoreaConversionArtifact['excluded'];
}> {
  if (!isRecord(value) || !hasExactKeys(value, TOTAL_KEYS)) invalidArtifact();
  return Object.freeze({
    eligiblePairCount: positiveInteger(value.eligiblePairCount),
    excluded: parseExcluded(value.excluded),
  });
}

function parseAnchor(
  value: unknown,
  minimumPairsPerAnchor: number,
): VerifiedKoreaConversionAnchor {
  if (!isRecord(value) || !hasExactKeys(value, ANCHOR_KEYS)) invalidArtifact();
  const depositWon = nonNegativeInteger(value.depositWon);
  if (
    typeof value.annualRate !== 'number' ||
    !Number.isFinite(value.annualRate) ||
    value.annualRate <= 0 ||
    value.annualRate >= 1
  ) {
    invalidArtifact();
  }
  const pairCount = positiveInteger(value.pairCount);
  if (pairCount < minimumPairsPerAnchor) invalidArtifact();
  return Object.freeze({ depositWon, annualRate: value.annualRate, pairCount });
}

function parseCurve(
  value: unknown,
  minimumPairsPerAnchor: number,
): VerifiedKoreaConversionCurve {
  if (!isRecord(value) || !hasExactKeys(value, CURVE_KEYS)) invalidArtifact();
  if (value.housingType !== 'apartment' && value.housingType !== 'officetel') {
    invalidArtifact();
  }
  if (!Array.isArray(value.anchors) || value.anchors.length < 2) invalidArtifact();
  const anchors = Object.freeze(value.anchors.map((anchor) =>
    parseAnchor(anchor, minimumPairsPerAnchor),
  ));
  for (let index = 1; index < anchors.length; index += 1) {
    if (anchors[index]!.depositWon <= anchors[index - 1]!.depositWon) invalidArtifact();
  }
  const observedMinDepositWon = nonNegativeInteger(value.observedMinDepositWon);
  const observedMaxDepositWon = nonNegativeInteger(value.observedMaxDepositWon);
  if (
    observedMinDepositWon !== anchors[0]!.depositWon ||
    observedMaxDepositWon !== anchors.at(-1)!.depositWon
  ) {
    invalidArtifact();
  }
  return Object.freeze({
    housingType: value.housingType,
    observedMinDepositWon,
    observedMaxDepositWon,
    anchors,
  });
}

function parseArtifact(
  source: unknown,
  expected: KoreaConversionArtifactExpectation,
  referenceInstant: string,
): VerifiedKoreaConversionArtifact {
  if (!isRecord(source) || !hasExactKeys(source, ROOT_KEYS)) invalidArtifact();
  if (source.artifactVersion !== KOREA_CONVERSION_ARTIFACT_VERSION) invalidArtifact();
  if (!SHA_PATTERN.test(expected.sha256)) invalidArtifact();
  const period = parsePeriod(expected.period);
  const generatedAt = canonicalInstant(source.generatedAt);
  const reference = canonicalInstant(referenceInstant);
  parseProvenance(source.provenance, expected);
  const readiness = parseReadiness(source.readiness);
  const generatedMs = new Date(generatedAt).getTime();
  const referenceMs = new Date(reference).getTime();
  if (
    generatedMs > referenceMs ||
    referenceMs - generatedMs > readiness.maximumAgeDays * DAY_MS
  ) {
    invalidArtifact();
  }
  const totals = parseTotals(source.totals);
  if (!Array.isArray(source.curves) || source.curves.length === 0 || source.curves.length > 2) {
    invalidArtifact();
  }
  const curves = Object.freeze(source.curves.map((curve) =>
    parseCurve(curve, readiness.minimumPairsPerAnchor),
  ));
  if (new Set(curves.map((curve) => curve.housingType)).size !== curves.length) {
    invalidArtifact();
  }
  const pairTotal = curves.reduce(
    (sum, curve) => sum + curve.anchors.reduce((curveSum, anchor) => curveSum + anchor.pairCount, 0),
    0,
  );
  if (pairTotal !== totals.eligiblePairCount) invalidArtifact();

  return Object.freeze({
    artifactVersion: KOREA_CONVERSION_ARTIFACT_VERSION,
    generatedAt,
    marketId: expected.marketId,
    period,
    sha256: expected.sha256,
    maximumAgeDays: readiness.maximumAgeDays,
    minimumPairsPerAnchor: readiness.minimumPairsPerAnchor,
    eligiblePairCount: totals.eligiblePairCount,
    excluded: totals.excluded,
    curves,
  });
}

export function parseKoreaConversionArtifact(
  source: unknown,
  expected: KoreaConversionArtifactExpectation,
  referenceInstant: string,
): VerifiedKoreaConversionArtifact {
  try {
    return parseArtifact(source, expected, referenceInstant);
  } catch {
    invalidArtifact();
  }
}

export function toBrowserConversionCurves(
  artifact: VerifiedKoreaConversionArtifact,
): readonly KoreaConversionCurveProjection[] {
  return Object.freeze(artifact.curves.map((curve) => Object.freeze({
    housingType: curve.housingType,
    period: artifact.period,
    generatedAt: artifact.generatedAt,
    anchors: Object.freeze(curve.anchors.map((anchor) => Object.freeze({
      deposit: anchor.depositWon,
      annualRate: anchor.annualRate,
      pairCount: anchor.pairCount,
    }))),
  })));
}
