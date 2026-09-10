import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => mocks.sql, publicContentDatabase: () => mocks.sql }));

import { storeBuildingFacts, loadStoredBuildingProximity } from '../lib/public-market/building-facts-store.server';

describe('building facts database provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sql.mockResolvedValue([]);
  });

  test('stores the actual snapshot sources and does not label K-apt fields as Building HUB data', async () => {
    await storeBuildingFacts({
      districtSlug: 'gangnam-gu', buildingId: 'gangnam-gu-54w9ma', districtLawdCd: '11680',
      neighborhoodName: '개포동', officialName: '개포래미안포레스트', housingType: 'apartment',
    }, {
      status: 'ready',
      source: { apartment: 'K-apt weekly apartment profile (2026-09-04)', register: null, nearby: 'K-apt complex detail (2026-09-04)' },
      match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
      apartment: {
        name: '개포래미안포레스트', legalAddress: '서울 강남구 개포동 1282', roadAddress: null,
        households: 2296, buildings: 31, heating: null, corridorType: null, saleType: null,
        approvalDate: null, totalAreaSqm: null,
      },
      register: null,
      nearby: null,
    });

    const [strings, ...values] = mocks.sql.mock.calls[0]!;
    const statement = (strings as TemplateStringsArray).join('');
    expect(statement).not.toContain('MOLIT Building HUB');
    expect(statement).toContain('apartment_source = excluded.apartment_source');
    expect(statement).toContain('register_source = excluded.register_source');
    expect(values).toContain('K-apt weekly apartment profile (2026-09-04)');
    expect(values).toContain(null);
  });
});


describe('nearby evidence for existing legacy buildings', () => {
  test('retrieves verified school and station distances without requiring a new entity mapping', async () => {
    mocks.sql.mockResolvedValue([
      { kind: 'school', provider_id: 'school-1', name: 'Local school', distance_meters: 400, lines: [] },
      { kind: 'station', provider_id: 'station-1', name: 'Local station', distance_meters: 210, lines: ['6', '7'] },
    ]);
    const result = await loadStoredBuildingProximity({ districtSlug: 'jungnang-gu', buildingId: 'jungnang-gu-1giu390', districtLawdCd: '11260', neighborhoodName: '묵동', officialName: '세이지움태릉입구역', housingType: 'apartment' });
    expect(result).toMatchObject({ nearestSchool: { name: 'Local school', distanceMeters: 400 }, nearestStation: { name: 'Local station', distanceMeters: 210, lines: ['6', '7'] } });
    const [strings, ...values] = mocks.sql.mock.calls.at(-1)!;
    expect((strings as TemplateStringsArray).join('')).toContain('SELECT DISTINCT ON (kind)');
    expect((strings as TemplateStringsArray).join('')).not.toContain('property_entities');
    expect(values).toEqual(['seoul:jungnang-gu-1giu390']);
  });

  test('does not turn invalid distances into nearby claims', async () => {
    mocks.sql.mockResolvedValue([{ kind: 'station', provider_id: 'bad', name: 'Bad coordinates', distance_meters: -200 }]);
    const result = await loadStoredBuildingProximity({ districtSlug: 'jungnang-gu', buildingId: 'jungnang-gu-1giu390', districtLawdCd: '11260', neighborhoodName: '묵동', officialName: 'Example', housingType: 'apartment' });
    expect(result).toBeNull();
  });
});
