import 'server-only';

import {
  SEOUL_RENT_CHECK_DISTRICTS,
  type SeoulDistrictSlug,
  type SeoulLawdCd,
} from '@signedprice/korea-rent/browser';
import seoulDistrictGeometrySource from '../../../../../data/seoul-districts.geojson' with { type: 'json' };

export const SEOUL_DISTRICT_ADJACENCY_VERSION =
  'seoul-district-adjacency-v1' as const;

const GEOJSON_SOURCE =
  'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0), simplified for web display';
const FEATURE_SOURCE = 'KOSTAT 2013 simplified boundary';
const VIEWBOX = { width: 720, height: 560, padding: 18 } as const;

type Point = readonly [number, number];
type ParsedFeature = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  rings: readonly (readonly Point[])[];
}>;

export type SeoulDistrictGeometry = Readonly<{
  lawdCd: SeoulLawdCd;
  slug: SeoulDistrictSlug;
  path: string;
}>;

const ADJACENCY = {
  'jongno-gu': ['jung-gu', 'dongdaemun-gu', 'seongbuk-gu', 'eunpyeong-gu', 'seodaemun-gu'],
  'jung-gu': ['jongno-gu', 'yongsan-gu', 'seongdong-gu', 'seodaemun-gu', 'mapo-gu'],
  'yongsan-gu': ['jung-gu', 'seongdong-gu', 'mapo-gu', 'yeongdeungpo-gu', 'dongjak-gu', 'seocho-gu'],
  'seongdong-gu': ['jung-gu', 'yongsan-gu', 'gwangjin-gu', 'dongdaemun-gu', 'gangnam-gu'],
  'gwangjin-gu': ['seongdong-gu', 'dongdaemun-gu', 'jungnang-gu', 'gangnam-gu', 'songpa-gu', 'gangdong-gu'],
  'dongdaemun-gu': ['jongno-gu', 'seongdong-gu', 'gwangjin-gu', 'jungnang-gu', 'seongbuk-gu'],
  'jungnang-gu': ['gwangjin-gu', 'dongdaemun-gu', 'seongbuk-gu', 'nowon-gu'],
  'seongbuk-gu': ['jongno-gu', 'dongdaemun-gu', 'jungnang-gu', 'gangbuk-gu', 'nowon-gu'],
  'gangbuk-gu': ['seongbuk-gu', 'dobong-gu'],
  'dobong-gu': ['gangbuk-gu', 'nowon-gu'],
  'nowon-gu': ['jungnang-gu', 'seongbuk-gu', 'dobong-gu'],
  'eunpyeong-gu': ['jongno-gu', 'seodaemun-gu', 'mapo-gu'],
  'seodaemun-gu': ['jongno-gu', 'jung-gu', 'eunpyeong-gu', 'mapo-gu'],
  'mapo-gu': ['jung-gu', 'yongsan-gu', 'eunpyeong-gu', 'seodaemun-gu', 'gangseo-gu', 'yeongdeungpo-gu'],
  'yangcheon-gu': ['gangseo-gu', 'guro-gu', 'yeongdeungpo-gu'],
  'gangseo-gu': ['mapo-gu', 'yangcheon-gu', 'yeongdeungpo-gu'],
  'guro-gu': ['yangcheon-gu', 'geumcheon-gu', 'yeongdeungpo-gu', 'gwanak-gu'],
  'geumcheon-gu': ['guro-gu', 'gwanak-gu'],
  'yeongdeungpo-gu': ['yongsan-gu', 'mapo-gu', 'yangcheon-gu', 'gangseo-gu', 'guro-gu', 'dongjak-gu'],
  'dongjak-gu': ['yongsan-gu', 'yeongdeungpo-gu', 'gwanak-gu', 'seocho-gu'],
  'gwanak-gu': ['guro-gu', 'geumcheon-gu', 'dongjak-gu', 'seocho-gu'],
  'seocho-gu': ['yongsan-gu', 'dongjak-gu', 'gwanak-gu', 'gangnam-gu'],
  'gangnam-gu': ['seongdong-gu', 'gwangjin-gu', 'seocho-gu', 'songpa-gu'],
  'songpa-gu': ['gwangjin-gu', 'gangnam-gu', 'gangdong-gu'],
  'gangdong-gu': ['gwangjin-gu', 'songpa-gu'],
} as const satisfies Readonly<Record<SeoulDistrictSlug, readonly SeoulDistrictSlug[]>>;

function invalidGeometry(): never {
  throw new TypeError('Invalid Seoul district geometry.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function parsePoint(value: unknown): Point {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    value.some((coordinate) => typeof coordinate !== 'number' || !Number.isFinite(coordinate))
  ) {
    invalidGeometry();
  }
  return Object.freeze([value[0] as number, value[1] as number]);
}

function parseRings(value: unknown): readonly (readonly Point[])[] {
  if (!Array.isArray(value) || value.length === 0) invalidGeometry();
  return Object.freeze(value.map((ring) => {
    if (!Array.isArray(ring) || ring.length < 4) invalidGeometry();
    const points = ring.map(parsePoint);
    const first = points[0]!;
    const last = points.at(-1)!;
    if (first[0] !== last[0] || first[1] !== last[1]) invalidGeometry();
    return Object.freeze(points);
  }));
}

function parseFeatures(value: unknown): readonly ParsedFeature[] {
  if (!Array.isArray(value) || value.length !== SEOUL_RENT_CHECK_DISTRICTS.length) {
    invalidGeometry();
  }
  return Object.freeze(value.map((feature, index) => {
    if (!isRecord(feature) || !hasExactKeys(feature, ['type', 'properties', 'geometry'])) {
      invalidGeometry();
    }
    if (feature.type !== 'Feature') invalidGeometry();
    const properties = feature.properties;
    const geometry = feature.geometry;
    const district = SEOUL_RENT_CHECK_DISTRICTS[index];
    if (
      district === undefined ||
      !isRecord(properties) ||
      !hasExactKeys(properties, ['districtCode', 'slug', 'nameEn', 'nameKo', 'source']) ||
      properties.districtCode !== district.lawdCd ||
      properties.slug !== district.slug ||
      properties.nameEn !== district.nameEn ||
      properties.nameKo !== district.nameKo ||
      properties.source !== FEATURE_SOURCE ||
      !isRecord(geometry) ||
      !hasExactKeys(geometry, ['type', 'coordinates']) ||
      geometry.type !== 'Polygon'
    ) {
      invalidGeometry();
    }
    return Object.freeze({
      lawdCd: district.lawdCd,
      slug: district.slug,
      rings: parseRings(geometry.coordinates),
    });
  }));
}

function roundCoordinate(value: number): string {
  return String(Number(value.toFixed(2)));
}

function project(features: readonly ParsedFeature[]): readonly SeoulDistrictGeometry[] {
  const points = features.flatMap(({ rings }) => rings.flatMap((ring) => ring));
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  if (
    !Number.isFinite(minLongitude) ||
    !Number.isFinite(maxLongitude) ||
    !Number.isFinite(minLatitude) ||
    !Number.isFinite(maxLatitude) ||
    minLongitude === maxLongitude ||
    minLatitude === maxLatitude
  ) {
    invalidGeometry();
  }

  const point = ([longitude, latitude]: Point): string => {
    const x = VIEWBOX.padding + (
      (longitude - minLongitude) / (maxLongitude - minLongitude)
    ) * (VIEWBOX.width - VIEWBOX.padding * 2);
    const y = VIEWBOX.height - VIEWBOX.padding - (
      (latitude - minLatitude) / (maxLatitude - minLatitude)
    ) * (VIEWBOX.height - VIEWBOX.padding * 2);
    return `${roundCoordinate(x)} ${roundCoordinate(y)}`;
  };

  return Object.freeze(features.map((feature) => Object.freeze({
    lawdCd: feature.lawdCd,
    slug: feature.slug,
    path: feature.rings.map((ring) => (
      `M${point(ring[0]!)}${ring.slice(1).map((value) => `L${point(value)}`).join('')}Z`
    )).join(''),
  })));
}

export function parseSeoulDistrictGeometry(value: unknown): readonly SeoulDistrictGeometry[] {
  try {
    if (
      !isRecord(value) ||
      !hasExactKeys(value, ['type', 'source', 'features']) ||
      value.type !== 'FeatureCollection' ||
      value.source !== GEOJSON_SOURCE
    ) {
      invalidGeometry();
    }
    return project(parseFeatures(value.features));
  } catch {
    invalidGeometry();
  }
}

const geometry = parseSeoulDistrictGeometry(seoulDistrictGeometrySource);

export function listSeoulDistrictGeometry(): readonly SeoulDistrictGeometry[] {
  return geometry;
}

export function listAdjacentDistrictSlugs(
  slug: SeoulDistrictSlug,
): readonly SeoulDistrictSlug[] {
  return ADJACENCY[slug];
}
