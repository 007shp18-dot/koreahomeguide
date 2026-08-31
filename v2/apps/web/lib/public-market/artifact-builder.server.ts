import 'server-only';

import type { KoreaPublicSummaryFinalization } from '@signedprice/korea-rent';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from '@signedprice/korea-rent/browser';

import {
  PUBLIC_SUMMARY_ARTIFACT_VERSION,
  parsePublicSummaryArtifact,
  type PublicSummaryArtifactInput,
} from './summary-schema';
import { encodeArtifact } from './artifact-encoding.server';

export type BuiltPublicSummaryArtifact = Readonly<{
  artifact: PublicSummaryArtifactInput;
  serialized: string;
  sha256: string;
}>;

function freezeArtifact(
  finalization: KoreaPublicSummaryFinalization,
): PublicSummaryArtifactInput {
  const summary = Object.freeze({ ...finalization.summary });
  const provenance = Object.freeze({
    marketId: 'kr-seoul',
    period: finalization.period,
    provider: 'MOLIT',
    endpointVersion: MOLIT_ENDPOINT_VERSION,
    parserVersion: MOLIT_PARSER_VERSION,
    rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
    sourceComplete: true,
  });
  return Object.freeze({
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    generatedAt: finalization.generatedAt,
    provenance,
    summaries: Object.freeze([summary]),
  });
}

export async function buildPublicSummaryArtifact(
  finalization: KoreaPublicSummaryFinalization,
): Promise<BuiltPublicSummaryArtifact> {
  if (
    finalization.period !== finalization.summary.period ||
    finalization.completedCoordinates !== 700
  ) {
    throw new TypeError('Public summary finalization is incomplete.');
  }
  const artifact = freezeArtifact(finalization);
  parsePublicSummaryArtifact(artifact, {
    artifactVersion: PUBLIC_SUMMARY_ARTIFACT_VERSION,
    marketId: 'kr-seoul',
    period: finalization.period,
  });
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({ artifact, ...encoded });
}
