import 'server-only';

import type {
  KoreaSaleEvidenceAreaRecord,
  KoreaSaleEvidenceBuildingRecord,
} from '@signedprice/korea-rent';
import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  parseKoreaSaleEvidenceArtifact,
  type KoreaSaleEvidenceArtifactExpectation,
  type VerifiedKoreaSaleEvidenceArtifact,
} from './sale-evidence-schema';

export type KoreaSaleEvidenceRepository = Readonly<{
  getArtifact(): VerifiedKoreaSaleEvidenceArtifact;
  listAreaRecords(): readonly KoreaSaleEvidenceAreaRecord[];
  getAreaRecord(areaId: string): KoreaSaleEvidenceAreaRecord;
  listBuildingRecords(): readonly KoreaSaleEvidenceBuildingRecord[];
  getBuilding(
    districtSlug: SeoulDistrictSlug,
    buildingId: string,
  ): KoreaSaleEvidenceBuildingRecord;
}>;

export class KoreaSaleEvidenceUnavailableError extends Error {
  readonly code = 'korea_sale_evidence_unavailable' as const;

  constructor() {
    super('Verified Korea sale evidence is unavailable.');
    this.name = 'KoreaSaleEvidenceUnavailableError';
  }
}

export function createKoreaSaleEvidenceRepository(input: Readonly<{
  source: unknown;
  expected: KoreaSaleEvidenceArtifactExpectation;
}>): KoreaSaleEvidenceRepository {
  try {
    const artifact = parseKoreaSaleEvidenceArtifact(input.source, input.expected);
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
        if (record === undefined) throw new KoreaSaleEvidenceUnavailableError();
        return record;
      },
      listBuildingRecords: () => artifact.buildingRecords,
      getBuilding(districtSlug: SeoulDistrictSlug, buildingId: string) {
        const record = buildings.get(`${districtSlug}/${buildingId}`);
        if (record === undefined) throw new KoreaSaleEvidenceUnavailableError();
        return record;
      },
    });
  } catch (error) {
    if (error instanceof KoreaSaleEvidenceUnavailableError) throw error;
    throw new KoreaSaleEvidenceUnavailableError();
  }
}
