import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createBuildingFactsGetHandler } from '../lib/public-market/building-facts-route-handler.server';

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
});
