import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type RentCheckHousingType,
} from '@signedprice/korea-rent/browser';

import {
  getExplorerBuildings,
  getExplorerNeighborhoods,
} from '../seoul-explorer-data';

const HOUSING_TYPE_LABELS = {
  apartment: 'Apartment',
  officetel: 'Officetel',
  villa: 'Villa',
  detached: 'Detached / multi-unit',
  studio: 'Studio alias',
} as const satisfies Readonly<Record<RentCheckHousingType, string>>;

const HOUSING_TYPES = new Set<RentCheckHousingType>(
  Object.keys(HOUSING_TYPE_LABELS) as RentCheckHousingType[],
);

export type ExplorerRentCheckContext = {
  readonly lawdCd: string;
  readonly districtLabel: string;
  readonly housingType: RentCheckHousingType;
  readonly housingTypeLabel: string;
  readonly neighborhoodId?: string;
  readonly neighborhoodLabel?: string;
  readonly buildingId?: string;
  readonly buildingLabel?: string;
};

function singleString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function resolveExplorerRentCheckContext(
  query: Readonly<Record<string, unknown>>,
): ExplorerRentCheckContext | null {
  const lawdCd = singleString(query.lawdCd);
  const housingType = singleString(query.type);
  if (!lawdCd || !housingType || !HOUSING_TYPES.has(housingType as RentCheckHousingType)) {
    return null;
  }

  const district = SEOUL_RENT_CHECK_DISTRICTS.find((item) => item.lawdCd === lawdCd);
  if (!district) return null;

  const context: ExplorerRentCheckContext = {
    lawdCd: district.lawdCd,
    districtLabel: `${district.nameEn} (${district.nameKo})`,
    housingType: housingType as RentCheckHousingType,
    housingTypeLabel: HOUSING_TYPE_LABELS[housingType as RentCheckHousingType],
  };

  const rawNeighborhoodId = query.dong;
  const rawBuildingId = query.building;
  if (rawNeighborhoodId === undefined && rawBuildingId === undefined) return context;

  const neighborhoodId = singleString(rawNeighborhoodId);
  if (!neighborhoodId) return null;
  const neighborhood = getExplorerNeighborhoods(district.lawdCd).find(
    (item) => item.id === neighborhoodId && item.districtCode === district.lawdCd,
  );
  if (!neighborhood) return null;

  const withNeighborhood: ExplorerRentCheckContext = {
    ...context,
    neighborhoodId: neighborhood.id,
    neighborhoodLabel: `${neighborhood.nameEn} (${neighborhood.nameKo})`,
  };
  if (rawBuildingId === undefined) return withNeighborhood;

  const buildingId = singleString(rawBuildingId);
  if (!buildingId) return null;
  const building = getExplorerBuildings(district.lawdCd, neighborhood.id).find(
    (item) => item.id === buildingId &&
      item.districtCode === district.lawdCd &&
      item.neighborhoodId === neighborhood.id,
  );
  if (!building) return null;

  return {
    ...withNeighborhood,
    buildingId: building.id,
    buildingLabel: `${building.nameEn} (${building.nameKo})`,
  };
}
