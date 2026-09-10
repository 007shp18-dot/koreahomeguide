import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createCollectionRepository } from '../lib/data-operations/repository.server';

describe('OneMap collection status', () => {
  it('reports candidate backlog separately from verified publication', async () => {
    const query = vi.fn(async (statement: string) => {
      if (statement.includes('FROM data_collection_state')) {
        return [{
          source_id: 'sg-onemap-building',
          last_success_at: new Date('2026-09-10T01:00:00Z'),
          last_attempt_at: new Date('2026-09-10T01:00:00Z'),
          next_due_at: new Date('2026-09-11T01:00:00Z'),
          new_count: 12,
          changed_count: 2,
          pending_count: 0,
        }];
      }
      if (statement.includes('FROM data_collection_probes')) return [];
      if (statement.includes('FROM hdb_building_candidates')) {
        return [{ pending: 4, records: 13_357, published_at: null }];
      }
      if (statement.includes('FROM onemap_location_candidates')) {
        return [{
          pending: 14,
          records: 100,
          published_at: new Date('2026-09-10T02:00:00Z'),
        }];
      }
      return [];
    });

    const statuses = await createCollectionRepository({ query }).status();
    const onemap = statuses.find(({ sourceId }) => sourceId === 'sg-onemap-building');

    expect(onemap).toMatchObject({
      newCount: 12,
      changedCount: 2,
      pendingCandidateCount: 14,
      recordCount: 100,
      lastPublishedAt: '2026-09-10T02:00:00.000Z',
    });
    expect(query.mock.calls.some(([statement]) => statement.includes("rights_policy_id='sg-onemap-search-v1'"))).toBe(true);
  });
});
