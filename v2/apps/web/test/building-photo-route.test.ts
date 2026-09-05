import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const storeMocks = vi.hoisted(() => ({
  getStoredPublicPhotoApproval: vi.fn(),
}));

vi.mock('../lib/photos/building-photo-store.server', () => ({
  getStoredPublicPhotoApproval: storeMocks.getStoredPublicPhotoApproval,
}));

import { GET } from '../app/api/building-photo/route';

beforeEach(() => vi.clearAllMocks());

describe('public building photo route', () => {
  it('does not cache an unverified result that may be approved moments later', async () => {
    storeMocks.getStoredPublicPhotoApproval.mockResolvedValue(null);

    const response = await GET(new Request('https://www.signedprice.com/api/building-photo/?key=sg-project%3ACCR%3AExample'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ state: 'unverified' });
  });
});
