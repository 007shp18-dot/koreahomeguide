import 'server-only';

import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';

import { observedBuildingRepositoryFromEnvironment } from './observed-building-repository.server';

export type HomeFeaturedBuilding = Readonly<{
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  addressQuery: string;
  observationLabel: string;
  periodLabel: string;
  href: `/kr/seoul/explore/${string}/${string}/`;
}>;

export function buildHomeFeaturedBuildings(): readonly HomeFeaturedBuilding[] {
  try {
    const repository = observedBuildingRepositoryFromEnvironment();
    if (repository === null) return Object.freeze([]);
    const records = repository.listRecords()
      .filter((record) => record.housingType === 'apartment' && !/^\(/.test(record.officialName))
      .sort((left, right) => right.observationCount - left.observationCount)
      .slice(0, 3);

    return Object.freeze(records.map((record) => {
      const district = getSeoulDistrictBySlug(record.districtSlug);
      if (district === null) throw new TypeError('Unknown Seoul district.');
      const lotNumber = /^\((산?\d+(?:-\d+)?)\)$/.exec(record.officialName.trim())?.[1];
      return Object.freeze({
        id: record.buildingId,
        name: record.officialName,
        location: `${record.neighborhoodName} · ${district.nameEn}`,
        ...(record.coordinate.state === 'ready'
          ? {
              latitude: record.coordinate.latitude,
              longitude: record.coordinate.longitude,
            }
          : {}),
        addressQuery: [
          '서울특별시',
          district.nameKo,
          record.neighborhoodName,
          lotNumber ?? record.officialName.trim(),
        ].join(' '),
        observationLabel: `${record.observationCount.toLocaleString('en-US')} reported contracts`,
        periodLabel: `${record.firstObservedMonth}–${record.lastObservedMonth}`,
        href: `/kr/seoul/explore/${record.districtSlug}/${record.buildingId}/` as const,
      });
    }));
  } catch {
    return Object.freeze([]);
  }
}
