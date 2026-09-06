import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPhotoCoverageStore,
  type PhotoCoverageSqlPort,
} from '../lib/photos/photo-coverage-store.server';

describe('photo coverage store', () => {
  it('syncs a bounded market slice and reports its updated row count', async () => {
    const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
    const port: PhotoCoverageSqlPort = {
      async query(statement, parameters = []) {
        calls.push({ statement, parameters });
        return [{ updated: '2' }];
      },
    };

    const result = await createPhotoCoverageStore(port).sync(2, 'kr-seoul');

    expect(result).toEqual({ checked: 2, updated: 2 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.statement).toContain('photo-coverage:sync');
    expect(calls[0]?.statement).toContain("'photo-naver-search'");
    expect(calls[0]?.statement).toContain("'unavailable'");
    expect(calls[0]?.statement).toContain('IS DISTINCT FROM');
    expect(calls[0]?.statement).toContain("photo.subject_kind = 'site-aerial'");
    expect(calls[0]?.statement).toContain("'photo-identity-v2'");
    expect(calls[0]?.parameters).toEqual(['kr-seoul', 2]);
  });

  it('reports exact and visual coverage separately', async () => {
    const port: PhotoCoverageSqlPort = {
      async query(statement) {
        if (!statement.includes('photo-coverage:summary')) throw new Error('Unexpected query.');
        return [{
          total: '3', exact_photo: '1', provider_photo: '1', parent_photo: '0',
          street_view: '0', unavailable: '1', complete: '3',
        }];
      },
    };

    await expect(createPhotoCoverageStore(port).readSummary()).resolves.toEqual({
      total: 3,
      exactPhoto: 1,
      providerPhoto: 1,
      parentPhoto: 0,
      streetView: 0,
      unavailable: 1,
      complete: 3,
    });
  });

  it('rejects unsafe limits before querying Postgres', async () => {
    const query = vi.fn<PhotoCoverageSqlPort['query']>();
    const store = createPhotoCoverageStore({ query });

    await expect(store.sync(0, 'kr-seoul')).rejects.toThrow('Photo coverage limit must be between 1 and 300.');
    await expect(store.sync(301, 'sg-singapore')).rejects.toThrow('Photo coverage limit must be between 1 and 300.');
    expect(query).not.toHaveBeenCalled();
  });
});
