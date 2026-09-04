import { describe, expect, it } from 'vitest';

import { resolvePropertyMedia } from '../lib/photos/property-media-resolver.server';
import type { PropertyMediaCandidate } from '../lib/photos/property-media-model';

const exactOwned = Object.freeze({
  id: 'media-exact',
  subjectEntityId: 'building-1',
  relationship: 'exact',
  provider: 'owned-object',
  rightsStatus: 'owned',
  reviewStatus: 'approved',
  identityStatus: 'verified',
  assetUrl: 'https://assets.signedprice.com/building-1.jpg',
  placeId: null,
  sourcePageUrl: 'https://www.signedprice.com/media/building-1',
  attribution: 'SignedPrice field photography',
  checkedAt: '2026-09-01',
  visualReviewedAt: '2026-09-02',
} as const satisfies PropertyMediaCandidate);

describe('property media resolver', () => {
  it('prefers an approved exact photo over parent and editorial media', () => {
    const result = resolvePropertyMedia({
      entityId: 'building-1',
      parentEntityIds: ['project-1'],
      candidates: [
        { ...exactOwned, id: 'parent', subjectEntityId: 'project-1', relationship: 'parent' },
        exactOwned,
      ],
      editorial: { city: 'Seoul', src: '/assets/markets/seoul-residential.jpg' },
      mapHref: '/kr/seoul/explore/',
    });
    expect(result).toMatchObject({ kind: 'exact_photo', mediaId: 'media-exact' });
  });

  it('uses approved parent media before a clearly labelled city photograph', () => {
    const parent = { ...exactOwned, id: 'parent', subjectEntityId: 'project-1', relationship: 'parent' } as const;
    expect(resolvePropertyMedia({
      entityId: 'building-1', parentEntityIds: ['project-1'], candidates: [parent],
      editorial: { city: 'Singapore', src: '/assets/markets/singapore-residential.jpg' },
      mapHref: '/sg/singapore/explore/',
    })).toMatchObject({ kind: 'parent_photo', subjectLabel: 'Parent project photograph · not the exact property' });
  });

  it('rejects unreviewed, unverified, unattributed, or rights-incomplete candidates', () => {
    const invalid = [
      { ...exactOwned, id: 'review', reviewStatus: 'review_required' },
      { ...exactOwned, id: 'identity', identityStatus: 'ambiguous' },
      { ...exactOwned, id: 'source', sourcePageUrl: null },
      { ...exactOwned, id: 'review-date', visualReviewedAt: null },
    ] as readonly PropertyMediaCandidate[];
    expect(resolvePropertyMedia({
      entityId: 'building-1', parentEntityIds: [], candidates: invalid,
      editorial: { city: 'Dubai', src: '/assets/markets/dubai-skyline.jpg' },
      mapHref: '/ae/dubai/',
    })).toMatchObject({ kind: 'editorial_photo', subjectLabel: 'Dubai editorial city photograph · not this exact property' });
  });

  it('stores only an approved place ID for provider-display photos and never accepts Street View', () => {
    const google = {
      ...exactOwned,
      id: 'google',
      provider: 'google-place',
      rightsStatus: 'provider-display-only',
      assetUrl: null,
      placeId: 'ChIJ-approved',
      attribution: 'Google Maps',
    } as const satisfies PropertyMediaCandidate;
    expect(resolvePropertyMedia({
      entityId: 'building-1', parentEntityIds: [], candidates: [google], editorial: null,
      mapHref: '/kr/seoul/explore/',
    })).toMatchObject({ kind: 'provider_photo', placeId: 'ChIJ-approved' });

    const streetView = { ...google, id: 'street', provider: 'street-view' } as const as PropertyMediaCandidate;
    expect(resolvePropertyMedia({
      entityId: 'building-1', parentEntityIds: [], candidates: [streetView], editorial: null,
      mapHref: '/kr/seoul/explore/',
    }).kind).toBe('neutral_location');
  });
});
