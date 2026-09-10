import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => mocks.sql }));

import { storeBuildingFacts } from '../lib/public-market/building-facts-store.server';

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
