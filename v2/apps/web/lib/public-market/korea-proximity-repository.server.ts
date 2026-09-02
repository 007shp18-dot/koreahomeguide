import 'server-only';

import {
  parseKoreaProximityArtifact,
  type KoreaProximityArtifactExpectation,
  type VerifiedKoreaProximityArtifact,
} from './korea-proximity-schema';
import type { ObservedBuildingRepository } from './observed-building-repository.server';
import { observedBuildingRepositoryFromEnvironment } from './observed-building-repository.server';
import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  checkedInSnapshotsAreEnabled,
} from '../snapshots/installed-snapshot-repository.server';

import {
  compareKoreaProximityText,
  type KoreaProximityRecord,
} from '@signedprice/korea-rent';
import { parseInstalledSnapshotRegistry } from '@signedprice/market-core';

export type KoreaProximityRepository = Readonly<{
  listRecords(): readonly KoreaProximityRecord[];
  findByBuildingId(buildingId: string): KoreaProximityRecord | null;
  getByBuildingId(buildingId: string): KoreaProximityRecord;
  getArtifact(): VerifiedKoreaProximityArtifact;
}>;

export type KoreaProximityRepositoryState =
  | Readonly<{ state: 'missing' }>
  | Readonly<{ state: 'invalid' }>
  | Readonly<{ state: 'ready'; repository: KoreaProximityRepository }>;

export type KoreaProximityRepositoryExpectation = Readonly<
  Pick<KoreaProximityArtifactExpectation, 'marketId' | 'period'>
>;

export class KoreaProximityEvidenceUnavailableError extends Error {
  readonly code = 'korea_proximity_evidence_unavailable' as const;

  constructor() {
    super('Verified Korea proximity evidence is unavailable.');
    this.name = 'KoreaProximityEvidenceUnavailableError';
  }
}

export function createKoreaProximityRepository(input: Readonly<{
  source: unknown;
  expected: KoreaProximityRepositoryExpectation;
  observedBuildingRepository: ObservedBuildingRepository | null;
}>): KoreaProximityRepositoryState {
  if (input.source === undefined || input.source === null) return Object.freeze({ state: 'missing' });
  try {
    if (input.observedBuildingRepository === null) throw new KoreaProximityEvidenceUnavailableError();
    const observedBuildingIds = input.observedBuildingRepository.listRecords()
      .map((record) => record.buildingId)
      .sort(compareKoreaProximityText);
    const artifact = parseKoreaProximityArtifact(input.source, {
      ...input.expected,
      observedBuildingIds,
    });
    const byBuildingId = new Map(artifact.records.map((record) => [record.buildingId, record]));
    const repository = Object.freeze({
      listRecords: () => artifact.records,
      findByBuildingId: (buildingId: string) => byBuildingId.get(buildingId) ?? null,
      getByBuildingId(buildingId: string) {
        const record = byBuildingId.get(buildingId);
        if (record === undefined) throw new KoreaProximityEvidenceUnavailableError();
        return record;
      },
      getArtifact: () => artifact,
    });
    return Object.freeze({ state: 'ready', repository });
  } catch {
    return Object.freeze({ state: 'invalid' });
  }
}

export function koreaProximityRepositoryFromEnvironment(
  dependencies: Readonly<{
    registrySource?: unknown;
    resolveObject?: (objectUrl: string) => unknown;
    observedBuildingRepository?: ObservedBuildingRepository | null;
    useCheckedInSnapshot?: boolean;
  }> = Object.freeze({}),
): KoreaProximityRepositoryState {
  const useCheckedInSnapshot = dependencies.useCheckedInSnapshot
    ?? (process.env.NODE_ENV !== 'test' && checkedInSnapshotsAreEnabled());
  let registrySource = dependencies.registrySource;
  if (registrySource === undefined && process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined) {
    try { registrySource = JSON.parse(process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY); } catch { return Object.freeze({ state: 'invalid' }); }
  }
  if (registrySource === undefined && useCheckedInSnapshot) registrySource = resolveInstalledSnapshotRegistry();
  if (registrySource === undefined) return Object.freeze({ state: 'missing' });
  if (typeof registrySource !== 'object' || registrySource === null
    || !Array.isArray((registrySource as { snapshots?: unknown }).snapshots)) {
    return Object.freeze({ state: 'invalid' });
  }
  try {
    parseInstalledSnapshotRegistry(registrySource);
  } catch {
    return Object.freeze({ state: 'invalid' });
  }
  const configured = (registrySource as { snapshots: unknown[] }).snapshots.some((snapshot) => (
      typeof snapshot === 'object' && snapshot !== null
      && (snapshot as { marketId?: unknown }).marketId === 'kr-seoul'
      && (snapshot as { dataset?: unknown }).dataset === 'kr-proximity'
  ));
  try {
    const snapshot = createInstalledSnapshotRepository({
      registrySource,
      resolveObject: dependencies.resolveObject ?? resolveInstalledSnapshotObject,
    }).get('kr-seoul', 'kr-proximity');
    return createKoreaProximityRepository({
      source: snapshot.payload,
      expected: { marketId: 'kr-seoul', period: snapshot.metadata.period },
      observedBuildingRepository: dependencies.observedBuildingRepository ?? observedBuildingRepositoryFromEnvironment({ useCheckedInSnapshot }),
    });
  } catch {
    return Object.freeze({ state: configured ? 'invalid' : 'missing' });
  }
}
