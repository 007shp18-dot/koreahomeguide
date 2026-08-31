import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import {
  SEOUL_DISTRICT_ADJACENCY_VERSION,
  listAdjacentDistrictSlugs,
  listSeoulDistrictGeometry,
  parseSeoulDistrictGeometry,
} from '../lib/public-market/seoul-district-geometry.server';

type Coordinate = readonly [number, number];
type SeoulGeoJson = Readonly<{
  source: string;
  features: readonly Readonly<{
    properties: Readonly<{
      districtCode: string;
      slug: string;
      nameEn: string;
      nameKo: string;
      source: string;
    }>;
    geometry: Readonly<{
      type: string;
      coordinates: unknown;
    }>;
  }>[];
}>;

const seoulGeoJson = JSON.parse(readFileSync(
  new URL('../../../../data/seoul-districts.geojson', import.meta.url),
  'utf8',
)) as SeoulGeoJson;

function coordinates(value: unknown, found: Coordinate[] = []): Coordinate[] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  ) {
    found.push(value as unknown as Coordinate);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => coordinates(entry, found));
  }
  return found;
}

function sharedVertexAdjacency() {
  const features = seoulGeoJson.features;
  const pointSets = features.map((feature) => new Set(
    coordinates(feature.geometry.coordinates).map((point) => point.join(',')),
  ));

  return new Map(features.map((feature, leftIndex) => {
    const adjacent = features.flatMap((candidate, rightIndex) => {
      if (leftIndex === rightIndex) return [];
      let shared = 0;
      for (const point of pointSets[leftIndex]!) {
        if (pointSets[rightIndex]!.has(point)) shared += 1;
      }
      return shared >= 2 ? [candidate.properties.slug] : [];
    });
    return [feature.properties.slug, adjacent] as const;
  }));
}

describe('Seoul district geometry', () => {
  it('matches the catalog and checked-in KOSTAT identity exactly', () => {
    expect(seoulGeoJson.source).toBe(
      'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0), simplified for web display',
    );
    expect(seoulGeoJson.features.every(({ properties }) =>
      properties.source === 'KOSTAT 2013 simplified boundary')).toBe(true);

    const geometry = listSeoulDistrictGeometry();
    expect(geometry).toHaveLength(25);
    expect(geometry.map(({ lawdCd, slug }) => ({ lawdCd, slug }))).toEqual(
      SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd, slug }) => ({ lawdCd, slug })),
    );
    for (const district of geometry) {
      expect(district.path).toMatch(/^M[\d. -]+L.+Z$/);
      const values = district.path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      expect(values.length).toBeGreaterThanOrEqual(6);
      values.forEach((value, index) => {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(index % 2 === 0 ? 720 : 560);
      });
      expect(district.latitude).toBeGreaterThan(37.4);
      expect(district.latitude).toBeLessThan(37.8);
      expect(district.longitude).toBeGreaterThan(126.7);
      expect(district.longitude).toBeLessThan(127.3);
    }
  });

  it('rejects source or feature identity drift with one sanitized error', () => {
    expect(() => parseSeoulDistrictGeometry({
      ...seoulGeoJson,
      source: 'changed source',
    })).toThrow('Invalid Seoul district geometry.');
    expect(() => parseSeoulDistrictGeometry({
      ...seoulGeoJson,
      features: seoulGeoJson.features.slice(1),
    })).toThrow('Invalid Seoul district geometry.');
    expect(() => parseSeoulDistrictGeometry({
      ...seoulGeoJson,
      features: seoulGeoJson.features.map((feature, index) => index === 0
        ? {
            ...feature,
            properties: { ...feature.properties, slug: 'changed-gu' },
          }
        : feature),
    })).toThrow('Invalid Seoul district geometry.');
  });

  it('keeps the versioned adjacency table symmetric and equal to shared boundaries', () => {
    expect(SEOUL_DISTRICT_ADJACENCY_VERSION).toBe('seoul-district-adjacency-v1');
    const expected = sharedVertexAdjacency();

    for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
      const actual = listAdjacentDistrictSlugs(district.slug);
      expect(actual).toEqual(expected.get(district.slug));
      for (const adjacent of actual) {
        expect(listAdjacentDistrictSlugs(adjacent)).toContain(district.slug);
      }
    }
  });
});
