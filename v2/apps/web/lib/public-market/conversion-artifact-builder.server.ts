import 'server-only';

import {
  DEFAULT_CONVERSION_PAIR_OPTIONS,
  KOREA_CONVERSION_ARTIFACT_VERSION,
  KR_MOLIT_RENT_RIGHTS,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  buildKoreaConversionCurves,
  parseKoreaConversionArtifact,
  type ConversionPairOptions,
  type KoreaRentRecord,
  type MolitRightsLookup,
} from '@signedprice/korea-rent';

import { encodeArtifact } from './artifact-encoding.server';

const MAXIMUM_AGE_DAYS = 45;

export type BuiltKoreaConversionArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  objectSha256: string;
  sha256: string;
  eligiblePairCount: number;
}>;

type BuildInput = Readonly<{
  records: readonly KoreaRentRecord[];
  period: string;
  generatedAt: string;
  options?: Partial<ConversionPairOptions>;
}>;

const rightsLookup: MolitRightsLookup = (policyId) => (
  policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined
);

function normalizedSource(records: readonly KoreaRentRecord[]) {
  return records.map((record) => Object.freeze({
    areaSqm: record.areaSqm,
    buildingLabel: record.buildingLabel ?? null,
    contractDate: record.contractDate,
    contractType: record.contractType,
    depositWon: record.depositWon,
    legalDong: record.legalDong ?? null,
    monthlyRentWon: record.monthlyRentWon,
    recordStatus: record.recordStatus,
    sourceHousingType: record.sourceHousingType,
    sourceRecordId: record.sourceRecordId ?? null,
  })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

export async function buildKoreaConversionArtifact(
  input: BuildInput,
): Promise<BuiltKoreaConversionArtifact> {
  const options: ConversionPairOptions = Object.freeze({
    ...DEFAULT_CONVERSION_PAIR_OPTIONS,
    ...input.options,
    bandFloorsWon: input.options?.bandFloorsWon
      ?? DEFAULT_CONVERSION_PAIR_OPTIONS.bandFloorsWon,
  });
  const build = buildKoreaConversionCurves(input.records, options);
  const required = new Set(build.curves.map(({ housingType }) => housingType));
  if (!required.has('apartment') || !required.has('officetel')) {
    throw new TypeError('Source data did not meet the publication floor for required conversion curves.');
  }

  const sourceDigest = (await encodeArtifact(normalizedSource(input.records))).sha256;
  const artifact = Object.freeze({
    artifactVersion: KOREA_CONVERSION_ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    provenance: Object.freeze({
      marketId: 'kr-seoul',
      period: input.period,
      provider: 'MOLIT',
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
      sourceComplete: true,
      sha256: sourceDigest,
    }),
    readiness: Object.freeze({
      state: 'ready',
      maximumAgeDays: MAXIMUM_AGE_DAYS,
      minimumPairsPerAnchor: options.minimumPairsPerAnchor,
    }),
    totals: Object.freeze({
      eligiblePairCount: build.eligiblePairCount,
      excluded: build.excluded,
    }),
    curves: build.curves,
  });

  parseKoreaConversionArtifact(artifact, {
    marketId: 'kr-seoul',
    period: input.period,
    sha256: sourceDigest,
    rightsLookup,
  }, input.generatedAt);
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({
    artifact,
    serialized: encoded.serialized,
    objectSha256: encoded.sha256,
    sha256: sourceDigest,
    eligiblePairCount: build.eligiblePairCount,
  });
}
