import 'server-only';

import type { SeoulDistrictSlug } from '@signedprice/korea-rent/browser';

import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
} from '../snapshots/installed-snapshot-repository.server';

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
    const mutableByDistrict = new Map<SeoulDistrictSlug, ObservedBuildingRecord[]>();
    for (const record of artifact.records) {
      const districtRecords = mutableByDistrict.get(record.districtSlug) ?? [];
      districtRecords.push(record);
      mutableByDistrict.set(record.districtSlug, districtRecords);
    }
    const byDistrict = new Map([...mutableByDistrict].map(([slug, records]) => [
      slug,
      Object.freeze(records),
    ] as const));
    const emptyDistrict = Object.freeze([] as ObservedBuildingRecord[]);
    return Object.freeze({
      listRecords: () => artifact.records,
      listByDistrict: (slug: SeoulDistrictSlug) => byDistrict.get(slug) ?? emptyDistrict,
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
  installedRegistry: string | undefined;
  legacyArtifact: string | undefined;
  period: string;
  useCheckedInSnapshot: boolean;
  resolveObject: (objectUrl: string) => unknown;
  repository: ObservedBuildingRepository | null;
}> | null = null;

export function observedBuildingRepositoryFromEnvironment(
  dependencies: Readonly<{
    resolveObject?: (objectUrl: string) => unknown;
    useCheckedInSnapshot?: boolean;
  }> = Object.freeze({}),
): ObservedBuildingRepository | null {
  const installedRegistry = process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY;
  const legacyArtifact = process.env.SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT;
  const period = process.env.SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD ?? '';
  const useCheckedInSnapshot = dependencies.useCheckedInSnapshot
    ?? process.env.NODE_ENV !== 'test';
  const resolveObject = dependencies.resolveObject ?? resolveInstalledSnapshotObject;
  const current = cached;
  if (current !== null
    && current.installedRegistry === installedRegistry
    && current.legacyArtifact === legacyArtifact
    && current.period === period
    && current.useCheckedInSnapshot === useCheckedInSnapshot
    && current.resolveObject === resolveObject) {
    return current.repository;
  }
  let repository: ObservedBuildingRepository | null = null;
  try {
    if (installedRegistry !== undefined) {
      const installed = createInstalledSnapshotRepository({
        registrySource: JSON.parse(installedRegistry),
        resolveObject,
      }).get('kr-seoul', 'kr-building-registry');
      repository = createObservedBuildingRepository({
        source: installed.payload,
        expected: { marketId: 'kr-seoul', period: installed.metadata.period },
      });
    } else if (legacyArtifact !== undefined) {
      repository = createObservedBuildingRepository({
        source: JSON.parse(legacyArtifact),
        expected: { marketId: 'kr-seoul', period },
      });
    } else if (useCheckedInSnapshot) {
      const installed = createInstalledSnapshotRepository({
        registrySource: resolveInstalledSnapshotRegistry(),
        resolveObject,
      }).get('kr-seoul', 'kr-building-registry');
      repository = createObservedBuildingRepository({
        source: installed.payload,
        expected: { marketId: 'kr-seoul', period: installed.metadata.period },
      });
    }
  } catch {
    repository = null;
  }
  cached = Object.freeze({
    installedRegistry,
    legacyArtifact,
    period,
    useCheckedInSnapshot,
    resolveObject,
    repository,
  });
  return repository;
}
