import { describe, expect, it } from 'vitest';
import { providerPhotoReady } from '../lib/photos/provider-photo-availability';
import { photoRolloutCapacity } from '../lib/photos/photo-rollout-capacity';

const place = {
  provider: 'google-place', candidate_source: 'google', status: 'review_required',
  rights_status: 'provider-display-only', provider_place_id: 'exact-place',
  provider_checked_at: '2026-09-11', match_policy_version: 'photo-identity-v2',
  match_confidence: 0.97, match_evidence: ['name', 'country', 'address'],
  source_page_url: 'https://maps.google.com/?cid=123',
};

describe('automatic provider place association', () => {
  it('makes strong address or location matches available without asserting visual review', () => {
    expect(providerPhotoReady(place)).toBe(true);
    expect(providerPhotoReady({ ...place, match_confidence: 0.95,
      match_evidence: ['name', 'country', 'locality', 'distance<=250m'] })).toBe(true);
    expect(place.status).toBe('review_required');
  });
  it.each(['rejected', 'broken', 'map_only'])('keeps %s decisions out of automatic display', status => {
    expect(providerPhotoReady({ ...place, status })).toBe(false);
  });
  it('does not publish search-engine images, weak locality matches or arbitrary sources', () => {
    expect(providerPhotoReady({ ...place, candidate_source: 'naver-search' })).toBe(false);
    expect(providerPhotoReady({ ...place, match_evidence: ['name', 'country', 'locality'] })).toBe(false);
    expect(providerPhotoReady({ ...place, match_confidence: 0.75 })).toBe(false);
    expect(providerPhotoReady({ ...place, source_page_url: 'https://maps.google.com.evil.test/' })).toBe(false);
  });
});

describe('whole inventory rollout capacity', () => {
  const limits = { pendingBuildings: 40000, dailyRequestCap: 5, dailySpendCapUsd: 0.16,
    estimatedRequestCostUsd: 0.032, scheduledRequestsPerDay: 4320 };
  it('exposes the actual bottleneck instead of equating candidate count with coverage', () => {
    expect(photoRolloutCapacity(limits)).toMatchObject({ requestsPerDay: 5,
      minimumDaysForOnePass: 8000, estimatedOnePassCostUsd: 1280, photoCoverageGuaranteed: false });
  });
  it('honors both the spend cap and schedule capacity', () => {
    expect(photoRolloutCapacity({ ...limits, dailyRequestCap: 1000 }).requestsPerDay).toBe(5);
    expect(photoRolloutCapacity({ ...limits, dailyRequestCap: 10000, dailySpendCapUsd: 1000 }).requestsPerDay).toBe(4320);
    expect(photoRolloutCapacity({ ...limits, dailySpendCapUsd: 0 }).minimumDaysForOnePass).toBeNull();
  });
});
