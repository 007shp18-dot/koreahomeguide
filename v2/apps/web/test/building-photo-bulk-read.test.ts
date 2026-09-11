import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ database: vi.fn(), seed: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({
  contentDatabase: () => { throw new Error('Public reads must not use the longer administration deadline'); },
  publicContentDatabase: dependencies.database,
}));
vi.mock('../lib/photos/verified-building-photo-registry.server', () => ({ getPublicPhotoApproval: dependencies.seed }));

import { createStoredPublicPhotoApprovalReader } from '../lib/photos/building-photo-store.server';

beforeEach(() => { vi.clearAllMocks(); vi.resetModules(); });

describe('stored public photo approval bulk reader', () => {
  it('does not restore a revoked seed when the configured database fails', async () => {
    dependencies.database.mockReturnValue({ query: async () => { throw new Error('offline'); } });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { listStoredPublicPhotoApprovals } = await import('../lib/photos/building-photo-store.server');
    const result = await listStoredPublicPhotoApprovals(['revoked-key']);
    expect(result.databaseReadFailed).toBe(true);
    expect(result.approvals.size).toBe(0);
    expect(dependencies.seed).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('treats an empty live approval list as authoritative', async () => {
    dependencies.database.mockReturnValue({ query: async () => [] });
    const { listStoredPublicPhotoApprovals } = await import('../lib/photos/building-photo-store.server');
    const result = await listStoredPublicPhotoApprovals(['revoked-key']);
    expect(result.databaseReadFailed).toBe(false);
    expect(result.approvals.size).toBe(0);
    expect(dependencies.seed).not.toHaveBeenCalled();
  });

  it('reads the first approved photo for a bounded set of registry keys in one query', async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const reader = createStoredPublicPhotoApprovalReader({
      async query(statement, parameters) {
        calls.push({ statement, parameters });
        return [{
          registry_key: 'kr-seoul:building-a',
          provider: 'google-place',
          subject_kind: 'building-exterior',
          provider_place_id: 'place-a',
          asset_url: null,
          attribution_name: null,
          attribution_url: null,
          official_name: 'Building A',
          address: 'Seoul, Korea',
          approved_at: '2026-09-06T00:00:00.000Z',
        }];
      },
    });

    const approvals = await reader.list(['kr-seoul:building-a', 'kr-seoul:building-b']);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.statement).toContain('building-photo-store:public-approvals');
    expect(calls[0]?.parameters).toEqual([[
      'kr-seoul:building-a',
      'kr-seoul:building-b',
    ]]);
    expect(approvals.get('kr-seoul:building-a')).toMatchObject({
      provider: 'google-place',
      placeId: 'place-a',
      subjectKind: 'building-exterior',
      buildingName: 'Building A',
    });
    expect(approvals.has('kr-seoul:building-b')).toBe(false);
  });

  it('publishes an approved estate context photo with its subject kind', async () => {
    const reader = createStoredPublicPhotoApprovalReader({
      async query() {
        return [{
          registry_key: 'sg-project:ocr:Toh Estate',
          provider: 'licensed-url',
          provider_place_id: null,
          asset_url: 'https://upload.wikimedia.org/toh-estate.jpg',
          attribution_name: 'Photographer',
          attribution_url: 'https://commons.wikimedia.org/toh-estate',
          subject_kind: 'site-aerial',
          official_name: 'Toh Estate',
          address: 'Singapore',
          approved_at: '2026-09-06T00:00:00.000Z',
        }];
      },
    });

    await expect(reader.list(['sg-project:ocr:Toh Estate'])).resolves.toEqual(new Map([[
      'sg-project:ocr:Toh Estate',
      expect.objectContaining({ subjectKind: 'site-aerial' }),
    ]]));
  });
  it('returns strong provider matches without fabricating a visual review and rejects a withdrawn match', async () => {
    const candidate = {
      registry_key: 'kr-seoul:matched', official_name: 'Matched building', address: 'Seoul',
      publication_basis: 'provider-identity', provider: 'google-place', candidate_source: 'google',
      status: 'review_required', rights_status: 'provider-display-only', provider_place_id: 'place-matched',
      provider_checked_at: '2026-09-11', approved_at: '2026-09-11', subject_kind: 'building-exterior',
      match_policy_version: 'photo-identity-v2', match_confidence: 0.97,
      match_evidence: ['name', 'country', 'address'], source_page_url: 'https://maps.google.com/?cid=123',
    };
    const reader = createStoredPublicPhotoApprovalReader({ query: async () => [candidate] });
    expect((await reader.list(['kr-seoul:matched'])).get('kr-seoul:matched')).toMatchObject({
      publicationBasis: 'provider-identity', placeId: 'place-matched',
    });
    const withdrawn = createStoredPublicPhotoApprovalReader({ query: async () => [{ ...candidate, status: 'rejected' }] });
    expect((await withdrawn.list(['kr-seoul:matched'])).size).toBe(0);
  });

});
