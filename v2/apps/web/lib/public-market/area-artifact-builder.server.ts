import 'server-only';

import type {
  KoreaPublicAreaSummaryFinalization,
  KoreaPublicAreaSummaryGroup,
} from '@signedprice/korea-rent';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from '@signedprice/korea-rent/browser';

import { encodeArtifact } from './artifact-encoding.server';
import {
  PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
  parsePublicAreaSummaryArtifact,
  type PublicAreaSummaryArtifactInput,
} from './area-summary-schema';

export type BuiltPublicAreaSummaryArtifact = Readonly<{
  artifact: PublicAreaSummaryArtifactInput;
  serialized: string;
  sha256: string;
}>;

function freezeGroup(group: KoreaPublicAreaSummaryGroup) {
  return Object.freeze({
    citySummary: Object.freeze({ ...group.citySummary }),
    districtSummaries: Object.freeze(group.districtSummaries.map((summary) =>
      Object.freeze({ ...summary }))),
  });
}

function freezeArtifact(
  finalization: KoreaPublicAreaSummaryFinalization,
): PublicAreaSummaryArtifactInput {
  return Object.freeze({
    artifactVersion: PUBLIC_AREA_SUMMARY_ARTIFACT_VERSION,
    generatedAt: finalization.generatedAt,
    provenance: Object.freeze({
      marketId: 'kr-seoul',
      period: finalization.period,
      provider: 'MOLIT',
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
      sourceComplete: true,
    }),
    groups: Object.freeze({
      all: freezeGroup(finalization.groups.all),
      new: freezeGroup(finalization.groups.new),
      renewal: freezeGroup(finalization.groups.renewal),
    }),
    unknownContractCounts: Object.freeze({
      city: finalization.unknownContractCounts.city,
      districts: Object.freeze([...finalization.unknownContractCounts.districts]),
    }),
  });
}

export async function buildPublicAreaSummaryArtifact(
  finalization: KoreaPublicAreaSummaryFinalization,
): Promise<BuiltPublicAreaSummaryArtifact> {
  if (
    finalization.completedCoordinates !== 700 ||
    finalization.period !== finalization.groups.all.citySummary.period ||
    finalization.eligibleRecords !== finalization.groups.all.citySummary.n
  ) {
    throw new TypeError('Public area summary finalization is incomplete.');
  }
  const artifact = freezeArtifact(finalization);
  parsePublicAreaSummaryArtifact(artifact, {
    marketId: 'kr-seoul',
    period: finalization.period,
  });
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({ artifact, ...encoded });
}
