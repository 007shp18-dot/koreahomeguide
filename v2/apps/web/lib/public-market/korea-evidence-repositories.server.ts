import 'server-only';

import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
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
          expected: { marketId: 'kr-seoul', period: snapshot.metadata.period },
        });
      } catch {
        // Retain the last verified rent artifact independently of sale activation.
      }
      try {
        const snapshot = installed.get('kr-seoul', 'kr-sale');
        sale = createKoreaSaleEvidenceRepository({
          source: snapshot.payload,
          expected: { marketId: 'kr-seoul', period: snapshot.metadata.period },
        });
      } catch {
        // Retain the last verified sale artifact independently of rent activation.
      }
      return Object.freeze({ rent, sale });
    },
  });
}

const environmentLoader = createKoreaEvidenceRepositoryLoader();

export function koreaEvidenceRepositoriesFromEnvironment(
  dependencies: Readonly<{
    registrySource?: unknown;
    resolveObject?: (objectUrl: string) => unknown;
    useCheckedInSnapshot?: boolean;
  }> = Object.freeze({}),
): KoreaEvidenceRepositories {
  let registrySource = dependencies.registrySource;
  if (registrySource === undefined && process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined) {
    try {
      registrySource = JSON.parse(process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY);
    } catch {
      registrySource = null;
    }
  }
  const useCheckedInSnapshot = dependencies.useCheckedInSnapshot ?? process.env.NODE_ENV !== 'test';
  if (registrySource === undefined && useCheckedInSnapshot) {
    registrySource = resolveInstalledSnapshotRegistry();
  }
  return environmentLoader.load({
    registrySource,
    resolveObject: dependencies.resolveObject ?? resolveInstalledSnapshotObject,
  });
}
