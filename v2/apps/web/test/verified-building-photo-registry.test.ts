import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getPublicPhotoApproval } from '../lib/photos/verified-building-photo-registry.server';

afterEach(() => vi.unstubAllEnvs());

describe('verified building photo registry', () => {
  it('fails closed when no approval registry exists', () => {
    vi.stubEnv('VERIFIED_BUILDING_PHOTO_REGISTRY', '');
    expect(getPublicPhotoApproval('kr-seoul:building-1')).toBeNull();
  });

  it('returns only complete approved records without exposing the reviewer', () => {
    vi.stubEnv('VERIFIED_BUILDING_PHOTO_REGISTRY', JSON.stringify({
      'kr-seoul:building-1': {
        placeId: 'place-1',
        buildingName: 'Example Apartments',
        address: 'Mapo-gu, Seoul',
        approvedAt: '2026-09-03',
        approvedBy: 'editor',
      },
      broken: { placeId: 'missing-fields' },
    }));
    expect(getPublicPhotoApproval('kr-seoul:building-1')).toEqual({
      placeId: 'place-1',
      buildingName: 'Example Apartments',
      address: 'Mapo-gu, Seoul',
      approvedAt: '2026-09-03',
    });
    expect(getPublicPhotoApproval('broken')).toBeNull();
  });
});
