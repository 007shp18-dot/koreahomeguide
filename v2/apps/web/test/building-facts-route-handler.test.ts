import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createBuildingFactsGetHandler } from '../lib/public-market/building-facts-route-handler.server';
import { OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT } from '../../../tests/e2e/observed-building-inventory-fixture';
import { PUBLIC_AREA_SUMMARY_TEST_PERIOD } from '../../../tests/e2e/public-area-summary-fixture';
import { PUBLIC_BUILDING_TEST_ID } from '../../../tests/e2e/public-building-summary-fixture';

describe('building facts API handler', () => {
  test('resolves trusted installed identity before calling official providers', async () => {
    const load = vi.fn().mockResolvedValue({
      status: 'ready', match: { kaptCode: 'A1', bjdCode: '1168010100' },
      apartment: { name: '래미안 역삼' }, register: null,
    });
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'server-secret', load,
      resolveIdentity: () => ({
        districtLawdCd: '11680', neighborhoodName: '역삼동',
        officialName: '래미안 역삼', housingType: 'apartment',
      }),
    });

    const response = await handler(new Request(
      'https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=gangnam-gu&building=alpha',
    ));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(load).toHaveBeenCalledWith(expect.objectContaining({
      serviceKey: 'server-secret', officialName: '래미안 역삼',
    }));
    expect(await response.text()).not.toContain('server-secret');
  });

  test('rejects repeated, unknown and uninstalled building identifiers', async () => {
    const load = vi.fn();
    const handler = createBuildingFactsGetHandler({
      serviceKey: 'secret', load, resolveIdentity: () => null,
    });
    for (const url of [
      'https://x.test/api?district=a&district=b&building=c',
      'https://x.test/api?district=gangnam-gu&building=unknown',
      'https://x.test/api?district=gangnam-gu&building=bad%2Fid',
    ]) {
      const response = await handler(new Request(url));
      expect([400, 404]).toContain(response.status);
    }
    expect(load).not.toHaveBeenCalled();
  });

  test('accepts an observed public building even when price repositories are fixture-isolated', async () => {
    vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
    vi.stubEnv('SIGNEDPRICE_OBSERVED_BUILDING_ARTIFACT', OBSERVED_BUILDING_INVENTORY_TEST_ARTIFACT);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_SUMMARY_TEST_PERIOD);
    vi.stubEnv('SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY', '');
    vi.stubEnv('DATA_GO_KR_SERVICE_KEY', '');
    vi.resetModules();

    const { GET } = await import('../app/api/markets/kr-seoul/building-facts/route');
    const response = await GET(new Request(
      `https://www.signedprice.com/api/markets/kr-seoul/building-facts?district=jongno-gu&building=${PUBLIC_BUILDING_TEST_ID}`,
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      facts: { status: 'unavailable', reason: 'configuration_missing' },
    });
  });
});
