import 'server-only';

import {
  HDB_PUBLICATION_MINIMUM,
  HDB_PUBLISHED_SNAPSHOT_VERSION,
  type HdbPropertyRecord,
  type HdbPublishedSnapshot,
} from '@signedprice/singapore-property';
import {
  createInstalledSnapshotRepository,
  resolveInstalledSnapshotObject,
  resolveInstalledSnapshotRegistry,
  checkedInSnapshotsAreEnabled,
  type VerifiedInstalledSnapshot,
} from '../snapshots/installed-snapshot-repository.server';

export type HdbTownSummary = Readonly<{
  town: string;
  resaleCount: number;
  resaleMedianSgd: number | null;
  rentalCount: number;
  rentalMedianSgd: number | null;
}>;

export type HdbBlockSummary = Readonly<{
  blockId: string;
  town: string;
  block: string;
  street: string;
  resaleCount: number;
  resaleMedianSgd: number | null;
  rentalCount: number;
  rentalMedianSgd: number | null;
  property: HdbPropertyRecord | null;
}>;

export type HdbSnapshotRepository = Readonly<{
  getContext(): Readonly<{
    generatedAt: string;
    resalePeriod: string;
    rentalPeriod: string;
    propertyThrough: string;
    resale: number;
    rental: number;
    properties: number;
    publicationMinimum: 5;
  }>;
  listTowns(): readonly HdbTownSummary[];
  listBlocks(town: string): readonly HdbBlockSummary[];
}>;

function validSnapshot(payload: unknown): payload is HdbPublishedSnapshot {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return false;
  const value = payload as Partial<HdbPublishedSnapshot>;
  return value.version === HDB_PUBLISHED_SNAPSHOT_VERSION
    && value.publicationMinimum === HDB_PUBLICATION_MINIMUM
    && Array.isArray(value.towns)
    && Array.isArray(value.blocks)
    && typeof value.digest === 'string';
}

export function createHdbSnapshotRepositoryFromInstalled(
  installed: VerifiedInstalledSnapshot,
): HdbSnapshotRepository {
  if (installed.metadata.marketId !== 'sg-singapore'
    || installed.metadata.dataset !== 'sg-hdb'
    || !validSnapshot(installed.payload)) throw new Error('Verified HDB evidence unavailable.');
  const snapshot = installed.payload;
  const towns = Object.freeze(snapshot.towns.map((town) => Object.freeze({
    town: town.town,
    resaleCount: town.resale.n,
    resaleMedianSgd: town.resale.medianSgd,
    rentalCount: town.rental.n,
    rentalMedianSgd: town.rental.medianSgd,
  })));
  return Object.freeze({
    getContext: () => Object.freeze({
      generatedAt: snapshot.generatedAt,
      resalePeriod: snapshot.periods.resale,
      rentalPeriod: snapshot.periods.rental,
      propertyThrough: snapshot.periods.propertyThrough,
      resale: snapshot.totals.resale,
      rental: snapshot.totals.rental,
      properties: snapshot.totals.properties,
      publicationMinimum: snapshot.publicationMinimum,
    }),
    listTowns: () => towns,
    listBlocks: (selectedTown: string) => Object.freeze(snapshot.blocks
      .filter(({ town }) => town === selectedTown)
      .map((block) => Object.freeze({
        blockId: block.blockId,
        town: block.town,
        block: block.block,
        street: block.street,
        resaleCount: block.resale.n,
        resaleMedianSgd: block.resale.medianSgd,
        rentalCount: block.rental.n,
        rentalMedianSgd: block.rental.medianSgd,
        property: block.property,
      }))),
  });
}

let environmentCache: HdbSnapshotRepository | null | undefined;

export function hdbSnapshotRepositoryFromEnvironment(): HdbSnapshotRepository | null {
  if (environmentCache !== undefined) return environmentCache;
  if (!checkedInSnapshotsAreEnabled()) {
    environmentCache = null;
    return environmentCache;
  }
  try {
    const installed = createInstalledSnapshotRepository({
      registrySource: resolveInstalledSnapshotRegistry(),
      resolveObject: resolveInstalledSnapshotObject,
    }).get('sg-singapore', 'sg-hdb');
    environmentCache = createHdbSnapshotRepositoryFromInstalled(installed);
  } catch {
    environmentCache = null;
  }
  return environmentCache;
}
