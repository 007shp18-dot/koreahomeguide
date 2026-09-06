import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({ store: vi.fn(), sql: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => mocks.sql }));
vi.mock('../lib/public-market/building-facts-store.server', () => ({
  storeBuildingFacts: mocks.store,
}));
vi.mock('../lib/public-market/kapt-building-facts-snapshot.server', () => ({
  installedKaptBuildingFactsSnapshot: () => ({
    records: () => [{
      buildingId: 'gangnam-gu-54w9ma', districtSlug: 'gangnam-gu', officialName: '개포래미안포레스트',
      facts: {
        status: 'ready', source: { apartment: 'K-apt weekly', register: null, nearby: 'K-apt detail' },
        match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
        apartment: { name: '개포래미안포레스트', legalAddress: '서울 강남구 개포동 1282' },
        register: null, nearby: null,
      },
    }],
  }),
}));

import { enrichOfficialBuildingFacts } from '../lib/public-market/official-building-enrichment.server';

describe('default K-apt snapshot enrichment adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sql.mockImplementation(async (strings: TemplateStringsArray) => strings.join('').includes('SELECT building.key')
      ? [{
          key: 'seoul:gangnam-gu-54w9ma', external_id: 'gangnam-gu-54w9ma', official_name: '개포래미안포레스트',
          local_attributes: { districtSlug: 'gangnam-gu', neighborhoodName: '개포동' },
        }, {
          key: 'seoul:gangnam-gu-unrelated', external_id: 'gangnam-gu-unrelated', official_name: '다른건물',
          local_attributes: { districtSlug: 'gangnam-gu', neighborhoodName: '개포동' },
        }]
      : []);
    mocks.store.mockResolvedValue(undefined);
  });

  test('selects only exact installed identities and stores their official facts', async () => {
    const result = await enrichOfficialBuildingFacts(12);

    expect(result).toEqual({ state: 'ready', checked: 1, stored: 1, unavailable: 0 });
    expect(mocks.store).toHaveBeenCalledWith(
      expect.objectContaining({ buildingId: 'gangnam-gu-54w9ma', neighborhoodName: '개포동' }),
      expect.objectContaining({ match: { kaptCode: 'A10024564', bjdCode: '1168010300' } }),
    );
  });
});
