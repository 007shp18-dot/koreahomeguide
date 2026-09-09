import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createPhotoReviewStore, parsePhotoReviewDecision, photoCandidateHasRightsEvidence } from '../lib/photos/photo-review-store.server';

const candidate = {
  candidateId: '12', source: 'wikimedia', provider: 'licensed-url', identityStatus: 'verified',
  assetUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Example.jpg',
  sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  attributionName: 'Example photographer · CC BY 4.0', attributionUrl: 'https://creativecommons.org/licenses/by/4.0/',
  rightsStatus: 'licensed', checkedAt: '2026-09-09 12:00:00.123456+00',
};
const approval = {
  candidateId: '12', checkedAt: candidate.checkedAt, decision: 'approve' as const,
  visualReviewed: true as const, subjectKind: 'building-exterior' as const,
  note: 'Exterior visually matches the canonical building and source page.',
};
const query = vi.fn();
beforeEach(() => query.mockReset());

describe('stored photo review decisions', () => {
  it('requires an explicit visual decision about a stored version, never caller supplied URLs or identity', () => {
    expect(parsePhotoReviewDecision(approval)).toEqual(approval);
    expect(parsePhotoReviewDecision({ ...approval, assetUrl: 'https://evil.example/new.jpg' })).toBeNull();
    expect(parsePhotoReviewDecision({ ...approval, buildingKey: 'different' })).toBeNull();
    expect(parsePhotoReviewDecision({ ...approval, visualReviewed: false })).toBeNull();
    expect(parsePhotoReviewDecision({ ...approval, checkedAt: 'not-a-date' })).toBeNull();
  });

  it('separates reusable source evidence from search results or noncommercial licenses', () => {
    expect(photoCandidateHasRightsEvidence(candidate)).toBe(true);
    expect(photoCandidateHasRightsEvidence({ ...candidate, source: 'naver-search', rightsStatus: 'review-required' })).toBe(false);
    expect(photoCandidateHasRightsEvidence({ ...candidate, attributionUrl: 'https://creativecommons.org/licenses/by-nc/4.0/' })).toBe(false);
    expect(photoCandidateHasRightsEvidence({ ...candidate, sourcePageUrl: candidate.assetUrl })).toBe(false);
    expect(photoCandidateHasRightsEvidence({ ...candidate, identityStatus: 'ambiguous' })).toBe(false);
  });

  it('returns the next oldest cursor and supplies bounded source and market filters', async () => {
    query.mockResolvedValue([{ candidateId: '12' }, { candidateId: '13' }]);
    const page = await createPhotoReviewStore({ query }).list({ source: 'wikimedia', market: 'singapore', limit: 1, afterId: '11' });
    expect(page).toEqual({ items: [{ candidateId: '12' }], nextCursor: '12' });
    expect(query.mock.calls[0]?.[1]).toEqual(['11', 'wikimedia', 'singapore', 2, 'pending']);
  });

  it('does not execute a write when stored rights evidence is missing', async () => {
    query.mockResolvedValue([{ ...candidate, source: 'naver-search', rightsStatus: 'review-required' }]);
    await expect(createPhotoReviewStore({ query }).review(approval)).resolves.toEqual({ state: 'rights-evidence-required' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('passes the exact microsecond version to the atomic decision and reports concurrent changes', async () => {
    query.mockResolvedValueOnce([candidate]).mockResolvedValueOnce([]);
    await expect(createPhotoReviewStore({ query }).review(approval)).resolves.toEqual({ state: 'conflict' });
    expect(query.mock.calls[1]?.[1]).toEqual(['12', candidate.checkedAt, 'approve', approval.note, 'building-exterior']);
  });
});
