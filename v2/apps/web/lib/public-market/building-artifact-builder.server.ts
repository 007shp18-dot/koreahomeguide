import 'server-only';

import type { KoreaPublicBuildingRecord } from '@signedprice/korea-rent';

import { encodeArtifact } from './artifact-encoding.server';
import {
  PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
  parsePublicBuildingSummaryArtifact,
} from './building-summary-schema';

export type BuiltPublicBuildingSummaryArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
}>;

function freezeDistribution(value: KoreaPublicBuildingRecord['groups']['all']) {
  return Object.freeze({ ...value });
}

function freezeRecord(record: KoreaPublicBuildingRecord) {
  return Object.freeze({
    buildingId: record.buildingId,
    districtSlug: record.districtSlug,
    neighborhoodId: record.neighborhoodId,
    neighborhoodName: record.neighborhoodName,
    name: record.name,
    housingType: record.housingType,
    latitude: record.latitude,
    longitude: record.longitude,
    period: record.period,
    generatedAt: record.generatedAt,
    publicationMinimum: record.publicationMinimum,
    groups: Object.freeze({
      all: freezeDistribution(record.groups.all),
      new: freezeDistribution(record.groups.new),
      renewal: freezeDistribution(record.groups.renewal),
    }),
    unknownContractCount: record.unknownContractCount,
    areaBands: Object.freeze(record.areaBands.map((areaBand) => Object.freeze({
      band: areaBand.band,
      summary: freezeDistribution(areaBand.summary),
    }))),
    recentContracts: Object.freeze(record.recentContracts.map((contract) => Object.freeze({
      filedMonth: contract.filedMonth,
      areaSqm: contract.areaSqm,
      contractType: contract.contractType,
      depositWon: contract.depositWon,
    }))),
  });
}

export async function buildPublicBuildingSummaryArtifact(input: Readonly<{
  period: string;
  generatedAt: string;
  records: readonly KoreaPublicBuildingRecord[];
}>): Promise<BuiltPublicBuildingSummaryArtifact> {
  if (input.records.some((record) => (
    record.period !== input.period || record.generatedAt !== input.generatedAt
  ))) {
    throw new TypeError('Public building summary is incomplete.');
  }
  const records = Object.freeze(input.records.map(freezeRecord));
  const unsigned = Object.freeze({
    artifactVersion: PUBLIC_BUILDING_SUMMARY_ARTIFACT_VERSION,
    generatedAt: input.generatedAt,
    provenance: Object.freeze({
      marketId: 'kr-seoul',
      period: input.period,
      provider: 'MOLIT',
      dataset: 'reported rent contracts',
      endpointVersion: 'v1',
      parserVersion: 'kr-molit-building-parser-v2',
      rightsPolicyId: 'kr-molit-rent-v1',
      sourceComplete: true,
      displayRights: true,
      exclusions: Object.freeze(['Canceled records', 'Private fields']),
    }),
    totalRecordCount: records.length,
    records,
  });
  const internalDigest = (await encodeArtifact(unsigned)).sha256;
  const artifact = Object.freeze({ ...unsigned, sha256: internalDigest });
  parsePublicBuildingSummaryArtifact(artifact, { marketId: 'kr-seoul', period: input.period });
  const encoded = await encodeArtifact(artifact);
  return Object.freeze({ artifact, ...encoded });
}
