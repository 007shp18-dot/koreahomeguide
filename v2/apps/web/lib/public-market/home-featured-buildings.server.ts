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

// Official road-address identities for the verified homepage media pool.
// Contract artifacts do not currently include coordinates, and NAVER's geocoder
// resolves street addresses more reliably than apartment marketing names.
const FEATURED_BUILDING_ADDRESSES: Readonly<Record<string, string>> = Object.freeze({
  'songpa-gu-1j88w6f': '서울특별시 송파구 송파대로 345',
  'nowon-gu-823r30': '서울특별시 노원구 동일로227길 26',
  'songpa-gu-1m34gty': '서울특별시 송파구 올림픽로 435',
  'guro-gu-1jsjo0i': '서울특별시 구로구 경인로43길 49',
  'guro-gu-af5u5i': '서울특별시 구로구 경인로 302',
  'yongsan-gu-mgd3lz': '서울특별시 용산구 원효로97길 15',
  'mapo-gu-1y1skjv': '서울특별시 마포구 양화로 72',
  'gangnam-gu-1b0e8qz': '서울특별시 강남구 자곡로11길 28',
  'songpa-gu-13t34fi': '서울특별시 송파구 올림픽로 135',
  'jungnang-gu-ddlwil': '서울특별시 중랑구 신내로 267',
  'songpa-gu-1lqiba6': '서울특별시 송파구 올림픽로 99',
  'jungnang-gu-vnejzd': '서울특별시 중랑구 신내역로 165',
});

export function homeFeaturedAddressFor(buildingId: string, fallback: string): string {
  return FEATURED_BUILDING_ADDRESSES[buildingId] ?? fallback;
}

export function buildHomeFeaturedBuildings(): readonly HomeFeaturedBuilding[] {
  try {
    const repository = observedBuildingRepositoryFromEnvironment();
    if (repository === null) return Object.freeze([]);
    const records = repository.listRecords()
      .filter((record) => record.housingType === 'apartment' && !/^\(/.test(record.officialName))
      .sort((left, right) => {
        const addressPriority = Number(right.buildingId in FEATURED_BUILDING_ADDRESSES)
          - Number(left.buildingId in FEATURED_BUILDING_ADDRESSES);
        return addressPriority || right.observationCount - left.observationCount;
      })
      .slice(0, 60);

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
        addressQuery: homeFeaturedAddressFor(record.buildingId, [
          '서울특별시', district.nameKo, record.neighborhoodName,
          lotNumber ?? record.officialName.trim(),
        ].join(' ')),
        observationLabel: `${record.observationCount.toLocaleString('en-US')} reported contracts`,
        periodLabel: `${record.firstObservedMonth}–${record.lastObservedMonth}`,
        href: `/kr/seoul/explore/${record.districtSlug}/${record.buildingId}/` as const,
      });
    }));
  } catch {
    return Object.freeze([]);
  }
}
