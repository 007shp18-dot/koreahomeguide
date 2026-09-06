import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createStoredPublicPhotoApprovalReader } from '../lib/photos/building-photo-store.server';

describe('stored public photo approval bulk reader', () => {
  it('reads the first approved photo for a bounded set of registry keys in one query', async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const reader = createStoredPublicPhotoApprovalReader({
      async query(statement, parameters) {
        calls.push({ statement, parameters });
        return [{
          registry_key: 'kr-seoul:building-a',
          provider: 'google-place',
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
      buildingName: 'Building A',
    });
    expect(approvals.has('kr-seoul:building-b')).toBe(false);
  });
});
