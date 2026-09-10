import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  canonicalOneMapStreet,
  fetchOneMapLocation,
  requestOneMapToken,
  reviewOneMapLocationCandidate,
  runOneMapLocationCollection,
  selectOneMapLocationCandidate,
} from '../lib/data-operations/onemap-locations.server';

const target = {
  providerKey: '["123A","ANG MO KIO AVE 1"]',
  entityId: 'sg-singapore:block:123a-ang-mo-kio-ave-1',
  block: '123A',
  street: 'ANG MO KIO AVE 1',
};

const result = {
  SEARCHVAL: '123A ANG MO KIO AVENUE 1',
  BLK_NO: '123A',
  ROAD_NAME: 'ANG MO KIO AVENUE 1',
  BUILDING: 'HDB-ANG MO KIO',
  ADDRESS: '123A ANG MO KIO AVENUE 1 SINGAPORE 561123',
  POSTAL: '561123',
  LATITUDE: '1.369',
  LONGITUDE: '103.845',
};

const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('OneMap HDB location collection', () => {
  it('expands only deterministic HDB road abbreviations', () => {
    expect(canonicalOneMapStreet('Ang Mo Kio Ave 1')).toBe('ANG MO KIO AVENUE 1');
    expect(canonicalOneMapStreet('Bedok Nth Rd')).toBe('BEDOK NORTH ROAD');
    expect(canonicalOneMapStreet('Hougang St 21')).toBe('HOUGANG STREET 21');
    expect(canonicalOneMapStreet("St George's Rd")).toBe('ST GEORGE S ROAD');
  });

  it('accepts one exact block and canonical-street result without auto-approving it', () => {
    const selected = selectOneMapLocationCandidate(target, { results: [
      { ...result, BLK_NO: '123' },
      result,
    ] }, '2026-09-10T00:00:00.000Z');
    expect(selected.status).toBe('exact');
    if (selected.status !== 'exact') throw new Error('expected exact result');
    expect(selected.candidate).toMatchObject({
      entityId: target.entityId,
      postalCode: '561123',
      latitude: 1.369,
      longitude: 103.845,
    });
    expect(selected.candidate).not.toHaveProperty('status', 'approved');
  });

  it('quarantines conflicting exact matches as ambiguous', () => {
    expect(selectOneMapLocationCandidate(target, { results: [
      result,
      { ...result, POSTAL: '561124', ADDRESS: '123A OTHER ADDRESS', LATITUDE: '1.370' },
    ] })).toMatchObject({ status: 'ambiguous', resultCount: 2 });
  });

  it('reads every bounded search page and sends the raw token header', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get('pageNum'));
      expect(init?.headers).toEqual({ Authorization: 'raw-token-value' });
      return jsonResponse({
        totalNumPages: 2,
        pageNum: page,
        results: page === 1 ? [{ ...result, BLK_NO: '999' }] : [result],
      });
    });
    const outcome = await fetchOneMapLocation(target, 'raw-token-value', fetcher as typeof fetch);
    expect(outcome.status).toBe('exact');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('authenticates with server credentials and validates a future expiry', async () => {
    const expiry = Math.floor((Date.now() + 86_400_000) / 1_000);
    const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toEqual({ email: 'owner@example.com', password: 'secret-value' });
      return jsonResponse({ access_token: 't'.repeat(64), expiry_timestamp: String(expiry) });
    });
    await expect(requestOneMapToken(fetcher as typeof fetch, {
      email: 'owner@example.com',
      password: 'secret-value',
    })).resolves.toBe('t'.repeat(64));
  });

  it('fails safely when runtime credentials are absent and never calls Search', async () => {
    const fetcher = vi.fn();
    await expect(requestOneMapToken(fetcher as typeof fetch, {})).rejects.toThrow('runtime_credential_unavailable');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not authenticate when no building is due', async () => {
    const query = vi.fn(async (statement: string) => {
      if (statement.startsWith('UPDATE data_collection_state')) return [{ last_hash: null }];
      if (statement.includes('FROM hdb_building_current')) return [];
      if (statement.includes("UPDATE data_collection_runs SET status='unchanged'")) return [{ id: 'run' }];
      return [];
    });
    const fetcher = vi.fn();
    await expect(runOneMapLocationCollection({ query }, { fetcher: fetcher as typeof fetch, credentials: {} }))
      .resolves.toMatchObject({ status: 'unchanged', attemptedCount: 0 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('records a safe collection failure without exposing credentials', async () => {
    const query = vi.fn(async (statement: string) => {
      if (statement.startsWith('UPDATE data_collection_state')) return [{ last_hash: null }];
      if (statement.includes('FROM hdb_building_current')) return [{
        provider_key: target.providerKey,
        entity_id: target.entityId,
        block: target.block,
        street: target.street,
        previous_hash: null,
      }];
      return [];
    });
    const collected = await runOneMapLocationCollection({ query }, { fetcher: vi.fn() as unknown as typeof fetch, credentials: {} });
    expect(collected).toEqual({ sourceId: 'sg-onemap-building', status: 'failed', error: 'runtime_credential_unavailable' });
    expect(JSON.stringify(collected)).not.toContain('owner@example.com');
  });

  it('fences approval on current version, reviewed rights and an existing-provider conflict', async () => {
    const query = vi.fn(async (_statement: string) => [{
      id: '11111111-1111-4111-8111-111111111111',
      version: 2,
      status: 'approved',
      entity_id: target.entityId,
      published: true,
      withdrawn: false,
    }]);
    await expect(reviewOneMapLocationCandidate({ query }, {
      id: '11111111-1111-4111-8111-111111111111',
      version: 1,
      status: 'approved',
      reason: 'exact official match',
      actor: 'operator',
    })).resolves.toMatchObject({ status: 'approved', published: true });
    const statement = String(query.mock.calls[0]?.[0]);
    expect(statement).toContain('candidate.version=$2');
    expect(statement).toContain('location.provider<>$7');
    expect(statement).toContain('rights.can_store AND rights.can_display AND rights.can_use_commercially');
    expect(statement).toContain("'street'");
  });
});
