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

export type BuiltPublicSummaryArtifact = Readonly<{
  artifact: PublicSummaryArtifactInput;
  serialized: string;
  sha256: string;
}>;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`;
}

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
  const serialized = canonicalJson(artifact);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(serialized),
  );
  const sha256 = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  return Object.freeze({ artifact, serialized, sha256 });
}
