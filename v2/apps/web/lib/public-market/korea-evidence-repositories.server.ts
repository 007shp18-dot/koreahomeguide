import 'server-only';

import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  checkedInSnapshotsAreEnabled,
} from '../snapshots/installed-snapshot-repository.server';
import {
  createKoreaRentEvidenceRepository,
  type KoreaRentEvidenceRepository,
} from './rent-evidence-repository.server';
import {
  createKoreaSaleEvidenceRepository,
  type KoreaSaleEvidenceRepository,
} from './sale-evidence-repository.server';

export type KoreaEvidenceRepositories = Readonly<{
  rent: KoreaRentEvidenceRepository | null;
  sale: KoreaSaleEvidenceRepository | null;
}>;

export type KoreaEvidenceRepositoryLoader = Readonly<{
  load(input: Readonly<{
    registrySource: unknown;
    resolveObject(objectUrl: string): unknown;
  }>): KoreaEvidenceRepositories;
}>;

export function createKoreaEvidenceRepositoryLoader(): KoreaEvidenceRepositoryLoader {
  let rent: KoreaRentEvidenceRepository | null = null;
  let sale: KoreaSaleEvidenceRepository | null = null;

  return Object.freeze({
    load(input): KoreaEvidenceRepositories {
      let installed;
      try {
        installed = createInstalledSnapshotRepository(input);
      } catch {
        return Object.freeze({ rent, sale });
      }
      try {
        const snapshot = installed.get('kr-seoul', 'kr-rent');
        rent = createKoreaRentEvidenceRepository({
          source: snapshot.payload,
          expected: {
            marketId: 'kr-seoul',
            period: snapshot.metadata.period,
            outerDigestVerified: true,
          },
        });
      } catch {
        // Retain the last verified rent artifact independently of sale activation.
      }
      try {
        const snapshot = installed.get('kr-seoul', 'kr-sale');
        sale = createKoreaSaleEvidenceRepository({
          source: snapshot.payload,
          expected: {
            marketId: 'kr-seoul',
            period: snapshot.metadata.period,
            outerDigestVerified: true,
          },
        });
      } catch {
        // Retain the last verified sale artifact independently of rent activation.
      }
      return Object.freeze({ rent, sale });
    },
  });
}

const environmentLoader = createKoreaEvidenceRepositoryLoader();
let cachedEnvironmentRepositories: Readonly<{
  registrySource: unknown;
  resolveObject: (objectUrl: string) => unknown;
  repositories: KoreaEvidenceRepositories;
}> | null = null;
let cachedSerializedRegistry: Readonly<{ source: string; parsed: unknown }> | null = null;

function unavailableSnapshotObject(): undefined {
  return undefined;
}

export function koreaEvidenceRepositoriesFromEnvironment(
  dependencies: Readonly<{
    registrySource?: unknown;
    resolveObject?: (objectUrl: string) => unknown;
    useCheckedInSnapshot?: boolean;
    retainLastVerified?: boolean;
  }> = Object.freeze({}),
): KoreaEvidenceRepositories {
  let registrySource = dependencies.registrySource;
  if (registrySource === undefined && process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined) {
    const serialized = process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY;
    if (cachedSerializedRegistry?.source === serialized) {
      registrySource = cachedSerializedRegistry.parsed;
    } else {
      try {
        registrySource = JSON.parse(serialized);
      } catch {
        registrySource = null;
      }
      cachedSerializedRegistry = Object.freeze({ source: serialized, parsed: registrySource });
    }
  }
  const useCheckedInSnapshot = dependencies.useCheckedInSnapshot
    ?? (process.env.NODE_ENV !== 'test' && checkedInSnapshotsAreEnabled());
  if (registrySource === undefined && useCheckedInSnapshot) {
    registrySource = resolveInstalledSnapshotRegistry();
  }
  const resolveObject = dependencies.resolveObject
    ?? (useCheckedInSnapshot
      ? resolveInstalledSnapshotObject
      : unavailableSnapshotObject);
  const retainLastVerified = dependencies.retainLastVerified !== false;
  if (retainLastVerified
    && cachedEnvironmentRepositories !== null
    && cachedEnvironmentRepositories.registrySource === registrySource
    && cachedEnvironmentRepositories.resolveObject === resolveObject) {
    return cachedEnvironmentRepositories.repositories;
  }
  const repositories = (retainLastVerified
    ? environmentLoader
    : createKoreaEvidenceRepositoryLoader())
    .load({ registrySource, resolveObject });
  if (retainLastVerified) {
    cachedEnvironmentRepositories = Object.freeze({
      registrySource,
      resolveObject,
      repositories,
    });
  }
  return repositories;
}
