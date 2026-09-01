import 'server-only';

import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  type KoreaRentEvidence,
} from '@signedprice/korea-rent';

import { encodeArtifact } from './artifact-encoding.server';
import {
  KOREA_RENT_EVIDENCE_ARTIFACT_VERSION,
  parseKoreaRentEvidenceArtifact,
} from './rent-evidence-schema';

export type BuiltKoreaRentEvidenceArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
  recordCount: number;
}>;

const EXCLUSIONS = Object.freeze([
  'Canceled records',
  'Records without a stable building identity',
  'Provider-only fields',
]);

export async function buildKoreaRentEvidenceArtifact(
  input: KoreaRentEvidence,
): Promise<BuiltKoreaRentEvidenceArtifact> {
  const unsigned = Object.freeze({
    artifactVersion: KOREA_RENT_EVIDENCE_ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    provenance: Object.freeze({
      marketId: input.marketId,
      period: input.period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
      sourceComplete: true,
      displayRights: true,
      exclusions: EXCLUSIONS,
    }),
    publicationMinimum: input.publicationMinimum,
    stats: input.stats,
    areaRecords: input.areaRecords,
    buildingRecords: input.buildingRecords,
  });
  const internalDigest = (await encodeArtifact(unsigned)).sha256;
  const artifact = Object.freeze({ ...unsigned, sha256: internalDigest });
  parseKoreaRentEvidenceArtifact(artifact, {
    marketId: 'kr-seoul',
    period: input.period,
  });
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({
    artifact,
    ...encoded,
    recordCount: input.areaRecords.length + input.buildingRecords.length,
  });
}
