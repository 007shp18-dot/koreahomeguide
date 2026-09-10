import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createPublicEvidenceRepository,
  type PublicEvidenceReadEvent,
  type PublicEvidenceSqlPort,
} from '../lib/public-data/public-evidence-repository.server';

function fakePort(overrides: Partial<Record<'release' | 'location' | 'capabilities', readonly Record<string, unknown>[]>> = {}) {
  const calls: Array<{ statement: string; parameters: readonly unknown[] }> = [];
  const rows = {
    release: overrides.release ?? [{
      id: 'release-2026-08',
      market_id: 'kr-seoul',
      dataset_id: 'kr-sale',
      period_start: '2026-01-01',
      period_end: '2026-08-31',
      record_count: '42',
      rights_policy_id: 'kr-open-data',
      display_state: 'published',
      sha256: 'a'.repeat(64),
    }],
    location: overrides.location ?? [{
      entity_id: 'building-1',
      market_id: 'kr-seoul',
      latitude: 37.5665,
      longitude: 126.978,
      precision: 'rooftop',
      provider: 'official-address',
      provider_reference: 'record-1',
      rights_policy_id: 'kr-open-data',
      verification_status: 'verified',
      verified_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    }],
    capabilities: overrides.capabilities ?? [{
      market_id: 'kr-seoul',
      feature: 'explore',
      housing_sector: 'all',
      state: 'available',
      public_href: '/kr/seoul/explore/',
      label: 'Explore',
      limitations: [],
      checked_at: '2026-09-01T00:00:00.000Z',
      evidence_release_id: 'release-2026-08',
    }],
  };
  const port: PublicEvidenceSqlPort = {
    async query(statement, parameters) {
      calls.push({ statement, parameters });
      if (statement.includes('public-evidence:release')) return rows.release;
      if (statement.includes('public-evidence:location')) return rows.location;
      if (statement.includes('public-evidence:capabilities')) return rows.capabilities;
      throw new Error('Unexpected query.');
    },
  };
  return { port, calls };
}

describe('public evidence repository', () => {
  it('returns immutable release, location, and capability records from parameterized reads', async () => {
    const fake = fakePort();
    const repository = createPublicEvidenceRepository(fake.port);

    const release = await repository.getRelease('kr-sale');
    const location = await repository.getLocation('building-1');
    const capabilities = await repository.listCapabilities('kr-seoul');

    expect(release).toEqual({
      id: 'release-2026-08', marketId: 'kr-seoul', datasetId: 'kr-sale',
      periodStart: '2026-01-01', periodEnd: '2026-08-31', recordCount: 42,
      rightsPolicyId: 'kr-open-data', displayState: 'published', sha256: 'a'.repeat(64),
    });
    expect(location).toEqual({
      entityId: 'building-1', marketId: 'kr-seoul', latitude: 37.5665,
      longitude: 126.978, precision: 'rooftop', provider: 'official-address',
      providerReference: 'record-1', rightsPolicyId: 'kr-open-data',
      verificationStatus: 'verified', verifiedAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    expect(capabilities).toEqual([{
      marketId: 'kr-seoul', feature: 'explore', housingSector: 'all',
      state: 'available', publicHref: '/kr/seoul/explore/', label: 'Explore',
      limitations: [], checkedAt: '2026-09-01T00:00:00.000Z',
      evidenceReleaseId: 'release-2026-08',
    }]);
    expect(Object.isFrozen(release)).toBe(true);
    expect(Object.isFrozen(location)).toBe(true);
    expect(Object.isFrozen(capabilities)).toBe(true);
    expect(fake.calls.every(({ statement }) => !statement.includes('building-1'))).toBe(true);
    expect(fake.calls.map(({ parameters }) => parameters)).toEqual([
      ['kr-sale'], ['building-1'], ['kr-seoul'],
    ]);
  });

  it('fails closed on invalid rows so callers can retain the installed release', async () => {
    const repository = createPublicEvidenceRepository(fakePort({
      release: [{
        id: 'bad-release', market_id: 'kr-seoul', dataset_id: 'kr-sale',
        period_start: '2026-08-31', period_end: '2026-01-01', record_count: '-1',
        rights_policy_id: 'kr-open-data', display_state: 'published', sha256: 'not-a-hash',
      }],
      location: [{
        entity_id: 'bad-location', market_id: 'kr-seoul', latitude: 999,
        longitude: 126.978, precision: 'rooftop', provider: 'official-address',
        provider_reference: null, rights_policy_id: 'kr-open-data',
        verification_status: 'verified', verified_at: null, updated_at: 'bad-date',
      }],
      capabilities: [{ market_id: 'kr-seoul', feature: 'unknown', state: 'available' }],
    }).port);

    expect(await repository.getRelease('kr-sale')).toBeNull();
    expect(await repository.getLocation('bad-location')).toBeNull();
    expect(await repository.listCapabilities('kr-seoul')).toEqual([]);
  });

  it('bounds provider failures to sanitized read events and empty fallbacks', async () => {
    const events: PublicEvidenceReadEvent[] = [];
    const port: PublicEvidenceSqlPort = {
      async query() { throw new Error('postgres://secret@db.example address=private amount=900000'); },
    };
    const repository = createPublicEvidenceRepository(port, {
      now: (() => {
        let time = 100;
        return () => time += 5;
      })(),
      onRead: (event) => events.push(event),
    });

    expect(await repository.getRelease('kr-sale')).toBeNull();
    expect(await repository.getLocation('building-1')).toBeNull();
    expect(await repository.listCapabilities('kr-seoul')).toEqual([]);
    expect(events).toEqual([
      { operation: 'release', marketId: null, resultState: 'unavailable', durationMs: 5, cacheState: 'database' },
      { operation: 'location', marketId: null, resultState: 'unavailable', durationMs: 5, cacheState: 'database' },
      { operation: 'capabilities', marketId: 'kr-seoul', resultState: 'unavailable', durationMs: 5, cacheState: 'database' },
    ]);
    expect(JSON.stringify(events)).not.toMatch(/secret|address|amount|building-1|kr-sale/iu);
  });
});
