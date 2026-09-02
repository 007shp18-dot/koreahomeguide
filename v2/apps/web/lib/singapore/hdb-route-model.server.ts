import type { HdbSnapshotRepository } from './hdb-snapshot-repository.server';

const number = new Intl.NumberFormat('en-SG');
const currency = (value: number) => `SGD ${number.format(value)}`;

export type HdbTownDisplay = Readonly<{
  town: string;
  href: `/sg/singapore/hdb/${string}/`;
  resaleCount: number;
  resaleCountLabel: string;
  resaleMedianSgd: number | null;
  resaleMedianLabel: string | null;
  rentalCount: number;
  rentalCountLabel: string;
  rentalMedianSgd: number | null;
  rentalMedianLabel: string | null;
}>;

export type HdbBlockDisplay = Readonly<{
  blockId: string;
  href: `/sg/singapore/hdb/${string}/${string}/`;
  address: string;
  resaleCountLabel: string;
  resaleMedianLabel: string | null;
  rentalCountLabel: string;
  rentalMedianLabel: string | null;
  property: Readonly<{
    yearCompleted: number;
    maxFloorLevel: number;
    totalDwellingUnits: number;
    residential: boolean;
    commercial: boolean;
    multistoreyCarpark: boolean;
  }> | null;
}>;

export type HdbTownModel = Readonly<{
  town: string;
  townSlug: string;
  blocks: readonly HdbBlockDisplay[];
}>;

export function hdbTownSlug(town: string): string {
  return town.toLocaleLowerCase('en-SG').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export type HdbExploreModel = Readonly<{
  status: 'ready';
  resalePeriod: string;
  rentalPeriod: string;
  propertyThrough: string;
  resaleTotalLabel: string;
  rentalTotalLabel: string;
  propertyTotalLabel: string;
  publicationMinimum: 5;
  towns: readonly HdbTownDisplay[];
  featuredResale: readonly HdbTownDisplay[];
  featuredRental: readonly HdbTownDisplay[];
}> | Readonly<{ status: 'unavailable' }>;

function featured(
  towns: readonly HdbTownDisplay[],
  kind: 'resale' | 'rental',
): readonly HdbTownDisplay[] {
  const count = kind === 'resale' ? 'resaleCount' : 'rentalCount';
  const median = kind === 'resale' ? 'resaleMedianSgd' : 'rentalMedianSgd';
  return Object.freeze([...towns]
    .filter((town) => town[median] !== null)
    .sort((left, right) => right[count] - left[count] || left.town.localeCompare(right.town))
    .slice(0, 8));
}

export function buildHdbExploreModel(repository: HdbSnapshotRepository | null): HdbExploreModel {
  if (repository === null) return Object.freeze({ status: 'unavailable' });
  const context = repository.getContext();
  const towns = Object.freeze(repository.listTowns().map((town) => Object.freeze({
    ...town,
    href: `/sg/singapore/hdb/${hdbTownSlug(town.town)}/` as const,
    resaleCountLabel: number.format(town.resaleCount),
    resaleMedianLabel: town.resaleMedianSgd === null ? null : currency(town.resaleMedianSgd),
    rentalCountLabel: number.format(town.rentalCount),
    rentalMedianLabel: town.rentalMedianSgd === null ? null : currency(town.rentalMedianSgd),
  })));
  return Object.freeze({
    status: 'ready',
    resalePeriod: context.resalePeriod,
    rentalPeriod: context.rentalPeriod,
    propertyThrough: context.propertyThrough,
    resaleTotalLabel: number.format(context.resale),
    rentalTotalLabel: number.format(context.rental),
    propertyTotalLabel: number.format(context.properties),
    publicationMinimum: context.publicationMinimum,
    towns,
    featuredResale: featured(towns, 'resale'),
    featuredRental: featured(towns, 'rental'),
  });
}

export function buildHdbTownModel(
  repository: HdbSnapshotRepository,
  townSlug: string,
): HdbTownModel | null {
  const identity = repository.listTowns().find((town) => hdbTownSlug(town.town) === townSlug);
  if (identity === undefined) return null;
  const blocks = repository.listBlocks(identity.town).map((block) => Object.freeze({
    blockId: block.blockId,
    href: `/sg/singapore/hdb/${townSlug}/${block.blockId}/` as const,
    address: `${block.block} ${block.street}`,
    resaleCountLabel: number.format(block.resaleCount),
    resaleMedianLabel: block.resaleMedianSgd === null ? null : currency(block.resaleMedianSgd),
    rentalCountLabel: number.format(block.rentalCount),
    rentalMedianLabel: block.rentalMedianSgd === null ? null : currency(block.rentalMedianSgd),
    property: block.property === null ? null : Object.freeze({
      yearCompleted: block.property.yearCompleted,
      maxFloorLevel: block.property.maxFloorLevel,
      totalDwellingUnits: block.property.totalDwellingUnits,
      residential: block.property.residential,
      commercial: block.property.commercial,
      multistoreyCarpark: block.property.multistoreyCarpark,
    }),
  }));
  return Object.freeze({ town: identity.town, townSlug, blocks: Object.freeze(blocks) });
}
