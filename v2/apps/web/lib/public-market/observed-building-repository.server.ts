import 'server-only';

import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  parseObservedBuildingArtifact,
  type ObservedBuildingArtifactExpectation,
  type ObservedBuildingRecord,
  type VerifiedObservedBuildingArtifact,
} from './observed-building-schema';

export type ObservedBuildingRepository = Readonly<{
  listRecords(): readonly ObservedBuildingRecord[];
  listByDistrict(slug: SeoulDistrictSlug): readonly ObservedBuildingRecord[];
  getById(buildingId: string): ObservedBuildingRecord;
  getArtifact(): VerifiedObservedBuildingArtifact;
}>;

export class ObservedBuildingInventoryUnavailableError extends Error {
  readonly code = 'observed_building_inventory_unavailable' as const;

  constructor() {
    super('Verified observed building inventory is unavailable.');
    this.name = 'ObservedBuildingInventoryUnavailableError';
  }
}

export function createObservedBuildingRepository(input: Readonly<{
  source: unknown;
  expected: ObservedBuildingArtifactExpectation;
}>): ObservedBuildingRepository {
  try {
    const artifact = parseObservedBuildingArtifact(input.source, input.expected);
    const byId = new Map(artifact.records.map((record) => [record.buildingId, record]));
    return Object.freeze({
      listRecords: () => artifact.records,
      listByDistrict: (slug: SeoulDistrictSlug) => Object.freeze(
        artifact.records.filter(({ districtSlug }) => districtSlug === slug),
      ),
      getById(buildingId: string) {
        const record = byId.get(buildingId);
        if (record === undefined) throw new ObservedBuildingInventoryUnavailableError();
        return record;
      },
      getArtifact: () => artifact,
    });
  } catch (error) {
    if (error instanceof ObservedBuildingInventoryUnavailableError) throw error;
    throw new ObservedBuildingInventoryUnavailableError();
  }
}

let cached: Readonly<{
  serialized: string | undefined;
  period: string;
  repository: ObservedBuildingRepository | null;
}> | null = null;

export function observedBuildingRepositoryFromEnvironment(): ObservedBuildingRepository | null {
  const serialized = process.env.SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT;
  const period = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '';
  const current = cached;
  if (current !== null && current.serialized === serialized && current.period === period) {
    return current.repository;
  }
  let repository: ObservedBuildingRepository | null = null;
  try {
    repository = createObservedBuildingRepository({
      source: serialized === undefined ? undefined : JSON.parse(serialized),
      expected: { marketId: 'kr-seoul', period },
    });
  } catch {
    repository = null;
  }
  cached = Object.freeze({ serialized, period, repository });
  return repository;
}
