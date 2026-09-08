import 'server-only';

import type { HdbSnapshotRepository } from './hdb-snapshot-repository.server';
import { hdbTownSlug } from './hdb-route-model.server';

export type PublishedHdbRouteParams = Readonly<{
  towns: readonly Readonly<{ town: string }>[];
  blocks: readonly Readonly<{ town: string; blockId: string }>[];
}>;

function hasPublishedDistribution(
  resaleCount: number,
  resaleMedianSgd: number | null,
  rentalCount: number,
  rentalMedianSgd: number | null,
  minimum: number,
): boolean {
  return (resaleCount >= minimum && resaleMedianSgd !== null)
    || (rentalCount >= minimum && rentalMedianSgd !== null);
}

export function listPublishedHdbRouteParams(
  repository: HdbSnapshotRepository,
): PublishedHdbRouteParams {
  const minimum = repository.getContext().publicationMinimum;
  const publishedTowns = repository.listTowns().filter((town) => hasPublishedDistribution(
    town.resaleCount, town.resaleMedianSgd, town.rentalCount, town.rentalMedianSgd, minimum,
  ));
  const towns = Object.freeze(publishedTowns.map(({ town }) => Object.freeze({
    town: hdbTownSlug(town),
  })));
  const blocks = Object.freeze(publishedTowns.flatMap(({ town }) => {
    const townSlug = hdbTownSlug(town);
    return repository.listBlocks(town).flatMap((block) => (
      hasPublishedDistribution(
        block.resaleCount, block.resaleMedianSgd,
        block.rentalCount, block.rentalMedianSgd,
        minimum,
      )
        ? [Object.freeze({ town: townSlug, blockId: block.blockId })]
        : []
    ));
  }));
  return Object.freeze({ towns, blocks });
}

export function isPublishedHdbTown(
  repository: HdbSnapshotRepository,
  town: string,
): boolean {
  const summary = repository.listTowns().find((candidate) => hdbTownSlug(candidate.town) === town);
  const minimum = repository.getContext().publicationMinimum;
  return summary !== undefined && hasPublishedDistribution(
    summary.resaleCount, summary.resaleMedianSgd,
    summary.rentalCount, summary.rentalMedianSgd,
    minimum,
  );
}

export function isPublishedHdbBlock(
  repository: HdbSnapshotRepository,
  town: string,
  blockId: string,
): boolean {
  const summary = repository.listTowns().find((candidate) => hdbTownSlug(candidate.town) === town);
  if (summary === undefined || !isPublishedHdbTown(repository, town)) return false;
  const block = repository.listBlocks(summary.town).find((candidate) => candidate.blockId === blockId);
  const minimum = repository.getContext().publicationMinimum;
  return block !== undefined && hasPublishedDistribution(
    block.resaleCount, block.resaleMedianSgd,
    block.rentalCount, block.rentalMedianSgd,
    minimum,
  );
}
