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

  it('keeps reviewed licensed Singapore photos available as a database fallback', () => {
    vi.stubEnv('VERIFIED_BUILDING_PHOTO_REGISTRY', '');
    expect(getPublicPhotoApproval('sg-project:RCR:THE INTERLACE')).toEqual({
      provider: 'licensed-url',
      placeId: null,
      assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/The_Interlace_Singapore.jpg',
      attributionName: 'kallerna · CC BY-SA 4.0',
      attributionUrl: 'https://commons.wikimedia.org/wiki/File:The_Interlace_Singapore.jpg',
      buildingName: 'THE INTERLACE',
      address: 'DEPOT ROAD, Singapore',
      approvedAt: '2026-09-06',
    });
    expect(getPublicPhotoApproval("sg-project:RCR:PEOPLE'S PARK COMPLEX")).toMatchObject({
      provider: 'licensed-url',
      assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Saying_goodbye_to_People%E2%80%99s_Park_Complex_soon.jpg',
      attributionName: 'Rikoshots · CC BY-SA 4.0',
      buildingName: "PEOPLE'S PARK COMPLEX",
    });
    expect(getPublicPhotoApproval('sg-project:CCR:V ON SHENTON')).toMatchObject({
      assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/V_on_Shenton_20250904.jpg',
      attributionName: 'DvTor8303 · CC0',
    });
    expect(getPublicPhotoApproval('sg-project:CCR:MARINA BAY SUITES')).toMatchObject({
      assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Marina_Bay_Suites.jpg',
      attributionName: 'Nicolas Lannuzel · CC BY 2.0',
    });
  });
});
