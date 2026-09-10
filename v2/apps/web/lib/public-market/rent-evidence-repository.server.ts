import 'server-only';

import type {
  KoreaRentEvidenceAreaRecord,
  KoreaRentEvidenceBuildingRecord,
} from '@signedprice/korea-rent';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  parseKoreaRentEvidenceArtifact,
  type KoreaRentEvidenceArtifactExpectation,
  type VerifiedKoreaRentEvidenceArtifact,
} from './rent-evidence-schema';

export type KoreaRentEvidenceRepository = Readonly<{
  getArtifact(): VerifiedKoreaRentEvidenceArtifact;
  listAreaRecords(): readonly KoreaRentEvidenceAreaRecord[];
  getAreaRecord(areaId: string): KoreaRentEvidenceAreaRecord;
  listBuildingRecords(): readonly KoreaRentEvidenceBuildingRecord[];
  getBuilding(
    districtSlug: SeoulDistrictSlug,
    buildingId: string,
  ): KoreaRentEvidenceBuildingRecord;
}>;

export class KoreaRentEvidenceUnavailableError extends Error {
  readonly code = 'korea_rent_evidence_unavailable' as const;

  constructor() {
    super('Verified Korea rent evidence is unavailable.');
    this.name = 'KoreaRentEvidenceUnavailableError';
  }
}

export function createKoreaRentEvidenceRepository(input: Readonly<{
  source: unknown;
  expected: KoreaRentEvidenceArtifactExpectation;
}>): KoreaRentEvidenceRepository {
  try {
    const artifact = parseKoreaRentEvidenceArtifact(input.source, input.expected);
    const areas = new Map(artifact.areaRecords.map((record) => [record.areaId, record] as const));
    const buildings = new Map(artifact.buildingRecords.map((record) => [
      `${record.districtSlug}/${record.buildingId}`,
      record,
    ] as const));
    return Object.freeze({
      getArtifact: () => artifact,
      listAreaRecords: () => artifact.areaRecords,
      getAreaRecord(areaId: string) {
        const record = areas.get(areaId);
        if (record === undefined) throw new KoreaRentEvidenceUnavailableError();
        return record;
      },
      listBuildingRecords: () => artifact.buildingRecords,
      getBuilding(districtSlug: SeoulDistrictSlug, buildingId: string) {
        const record = buildings.get(`${districtSlug}/${buildingId}`);
        if (record === undefined) throw new KoreaRentEvidenceUnavailableError();
        return record;
      },
    });
  } catch (error) {
    if (error instanceof KoreaRentEvidenceUnavailableError) throw error;
    throw new KoreaRentEvidenceUnavailableError();
  }
}
