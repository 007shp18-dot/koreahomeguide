import { describe, expect, test } from 'vitest';
import { seoulBuildingLocationHref } from '../lib/public-market/seoul-building-location';

describe('Seoul detail to map', () => {
  test('preserves the exact selected building, neighbourhood, transaction and locale', () => {
    const result = new URL(seoulBuildingLocationHref('/ko/kr/seoul/explore/?transaction=sale&area=all&propertyType=apartment&district=jungnang-gu&neighborhood=jungnang-gu-dong-11guh4b&buildingId=jungnang-gu-1giu390'), 'https://signedprice.com');
    expect(result.pathname).toBe('/ko/kr/seoul/explore/');
    expect(Object.fromEntries(result.searchParams)).toEqual({ transaction: 'sale', area: 'all', propertyType: 'apartment', district: 'jungnang-gu', neighborhood: 'jungnang-gu-dong-11guh4b', buildingId: 'jungnang-gu-1giu390', view: 'map' });
  });
});
