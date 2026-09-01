import type { SourceHousingType } from './browser';
import type { SeoulDistrictSlug } from './districts';

export type KoreaBuildingHousingType =
  | 'apartment'
  | 'officetel'
  | 'villa_multifamily'
  | 'detached';

export type KoreaBuildingIdentity = Readonly<{
  buildingId: string;
  districtSlug: SeoulDistrictSlug;
  neighborhoodId: string;
  neighborhoodName: string;
  buildingName: string;
  housingType: KoreaBuildingHousingType;
}>;

export function normalizeKoreaBuildingText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function canonicalHousingType(value: SourceHousingType): KoreaBuildingHousingType {
  return value === 'villa' ? 'villa_multifamily' : value;
}

export function buildKoreaBuildingIdentity(input: Readonly<{
  districtSlug: SeoulDistrictSlug;
  legalDong?: string;
  buildingLabel?: string;
  sourceHousingType: SourceHousingType;
}>): KoreaBuildingIdentity | null {
  if (input.legalDong === undefined || input.buildingLabel === undefined) return null;

  const neighborhoodName = normalizeKoreaBuildingText(input.legalDong);
  const buildingName = normalizeKoreaBuildingText(input.buildingLabel);
  if (neighborhoodName === '' || buildingName === '') return null;

  const housingType = canonicalHousingType(input.sourceHousingType);
  return Object.freeze({
    buildingId: `${input.districtSlug}-${stableHash(
      `${neighborhoodName}\u0000${buildingName}\u0000${housingType}`,
    )}`,
    districtSlug: input.districtSlug,
    neighborhoodId: `${input.districtSlug}-dong-${stableHash(neighborhoodName)}`,
    neighborhoodName,
    buildingName,
    housingType,
  });
}
