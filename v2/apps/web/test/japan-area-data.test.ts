import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { collectJapanSnapshot, MAX_JAPAN_RECORDS, parseJapanSnapshot } from '../lib/japan/source.server';
import { japanPageQuery, parseJapanFilters, TOKYO_WARDS } from '../lib/japan/query';
import { refreshJapan, scheduledJapanScope } from '../lib/japan/refresh.server';
import type { createJapanRepository } from '../lib/japan/repository.server';

// Representative disclosed input, not a live dataset or a building identity.
export const disclosed = { Type: 'Pre-owned Condominiums, etc.', MunicipalityCode: '13103',
  Municipality: 'Minato Ward', DistrictName: 'Azabu', TradePrice: '85000000', Area: '70',
  FloorPlan: '2LDK', BuildingYear: '2010', Period: '4th quarter 2025', PriceCategory: 'Real estate transaction prices' };
const scope = { city: '13103', year: '2025', quarter: '4' };
const instant = '2026-09-08T00:00:00.000Z';
const snapshot = (rows: Record<string, unknown>[]) => parseJapanSnapshot(JSON.stringify({ status: 'OK', data: rows }), scope, instant);

describe('Japan source precision and complete snapshots', () => {
  it('repeated source and reordered rows have identical multiset membership and hash', () => {
    const a = snapshot([disclosed, { ...disclosed, TradePrice: '90000000' }]);
    const b = snapshot([{ ...disclosed, TradePrice: '90000000' }, disclosed]);
    expect(a.snapshotHash).toBe(b.snapshotHash);
    expect(a.records.map(r => r.recordReference).sort()).toEqual(b.records.map(r => r.recordReference).sort());
  });
  it('preserves genuinely separate but identically disclosed records', () => {
    const data = snapshot([disclosed, disclosed]);
    expect(data.records).toHaveLength(2);
    expect(new Set(data.records.map(r => r.recordReference)).size).toBe(2);
    expect(data.records.map(r => r.occurrence)).toEqual([1, 2]);
  });
  it('missing building name and quarter-only period never create a building ID or exact contract date', () => {
    const row = snapshot([{ ...disclosed, Area: '2000 or greater' }]).records[0];
    expect(row).toMatchObject({ currency: 'JPY', price: 85000000, period: '4th quarter 2025', periodPrecision: 'quarter', areaSqm: null, areaLabel: '2000 or greater' });
    expect(row).not.toHaveProperty('buildingId'); expect(row).not.toHaveProperty('observedAt');
  });
  it('keeps all 2001 records, and rejects beyond the hard limit instead of truncating', () => {
    expect(snapshot(Array.from({ length: 2001 }, () => disclosed)).records).toHaveLength(2001);
    expect(() => snapshot(Array.from({ length: MAX_JAPAN_RECORDS + 1 }, () => disclosed))).toThrow('source_incomplete');
    expect(() => parseJapanSnapshot(JSON.stringify({ status: 'OK', data: [disclosed], total: 2 }), scope, instant)).toThrow('source_incomplete');
  });
  it('blocks wrong ward, wrong quarter, unknown period and invalid prices before any staging', () => {
    for (const row of [{ ...disclosed, MunicipalityCode: '13102' }, { ...disclosed, Period: '3rd quarter 2025' },
      { ...disclosed, Period: '' }, { ...disclosed, TradePrice: 'NaN' }]) expect(() => snapshot([row])).toThrow();
  });
  it('never restamps cached provider data: ingestion explicitly bypasses caches and retains its retrieval instant', async () => {
    const fetchResponse = vi.fn(async () => Response.json({ status: 'OK', data: [disclosed] }, { headers: { etag: 'source-v1' } }));
    const result = await collectJapanSnapshot(scope, 'test-secret', fetchResponse);
    expect(fetchResponse.mock.calls[0]).toBeDefined();
    const call = fetchResponse.mock.calls[0] as unknown as [URL, RequestInit];
    expect(call[1]).toMatchObject({ cache: 'no-store', redirect: 'error' });
    expect(result.responseMetadata.etag).toBe('source-v1');
    expect(result.rawPayload).not.toContain('test-secret');
  });
  it('rejects duplicate/unknown filters and preserves q and area filter scope', () => {
    expect(() => parseJapanFilters(new URLSearchParams('city=13103&city=13102'))).toThrow();
    expect(() => parseJapanFilters(new URLSearchParams('url=https://example.com'))).toThrow();
    expect(parseJapanFilters(new URLSearchParams('q=Azabu&minArea=60&page=2'))).toMatchObject({ q: 'Azabu', minArea: 60, page: 2 });
  });
  it('strips recognized marketing attribution on page URLs while retaining real filters and invalid unknown keys', () => {
    const query = japanPageQuery({ city: '13103', q: 'Azabu', utm_source: ['search', 'ad'], utm_campaign: 'launch', gclid: 'click', fbclid: 'click' });
    expect([...query.keys()]).toEqual(['city', 'q']);
    expect(parseJapanFilters(query).q).toBe('Azabu');
    expect(() => parseJapanFilters(japanPageQuery({ unexpected: 'value' }))).toThrow();
    expect(() => parseJapanFilters(new URLSearchParams('utm_source=search'))).toThrow();
  });
  it('visits every Tokyo ward in each aligned 23-hour block and every ward-quarter in 184 hours', () => {
    const start = Date.parse('2026-07-04T16:00:00Z');
    const scopes = Array.from({ length: 184 }, (_, hour) => scheduledJapanScope(new Date(start + hour * 3_600_000)));
    expect(new Set(scopes.map(s => `${s.city}:${s.year}:Q${s.quarter}`)).size).toBe(184);
    expect(new Set(scopes.map(s => `${s.year}-Q${s.quarter}`))).toEqual(new Set([
      '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2',
    ]));
    for (let offset = 0; offset < scopes.length; offset += 23) {
      expect(scopes.slice(offset, offset + 23).map(s => s.city).sort()).toEqual(TOKYO_WARDS.map(([city]) => city));
    }
  });
  it('keeps one scope for the whole UTC hour and advances to a different ward in the next hour', () => {
    const first = scheduledJapanScope(new Date('2026-09-09T02:00:00Z'));
    expect(scheduledJapanScope(new Date('2026-09-09T02:59:59Z'))).toEqual(first);
    expect(scheduledJapanScope(new Date('2026-09-09T03:00:00Z')).city).not.toBe(first.city);
  });
  it('never schedules an unfinished quarter at year and quarter boundaries', () => {
    for (const date of ['2025-12-31T23:40:00Z', '2026-01-01T00:40:00Z', '2026-06-30T23:40:00Z', '2026-07-01T00:40:00Z']) {
      const now = new Date(date);
      const selected = scheduledJapanScope(now);
      const period = Number(selected.year) * 4 + Number(selected.quarter) - 1;
      const current = now.getUTCFullYear() * 4 + Math.floor(now.getUTCMonth() / 3);
      expect(period).toBeLessThan(current);
      expect(period).toBeGreaterThanOrEqual(current - 8);
      expect(TOKYO_WARDS.some(([city]) => city === selected.city)).toBe(true);
    }
  });
  it('bounds early rollout dates to completed quarters from 2024 onward', () => {
    const scopes = Array.from({ length: 23 }, (_, hour) => scheduledJapanScope(new Date(Date.UTC(2024, 3, 10, hour))));
    expect(new Set(scopes.map(s => `${s.year}-Q${s.quarter}`))).toEqual(new Set(['2024-Q1']));
    expect(() => scheduledJapanScope(new Date('2024-03-31T23:00:00Z'))).toThrow('invalid_scope');
    expect(() => scheduledJapanScope(new Date('invalid'))).toThrow('invalid_scope');
  });
});

describe('Japan service failure isolation', () => {
  const run = { runId: '1', leaseToken: 'lease-1', releaseId: 'release-1' };
  function repository() { return { start: vi.fn(async () => run), stage: vi.fn(async () => {}), activate: vi.fn(async () => {}), fail: vi.fn(async () => {}) } satisfies ReturnType<typeof createJapanRepository>; }
  it('provider failure never stages or activates an empty replacement', async () => {
    const repo = repository();
    expect(await refreshJapan(repo, scope, 'secret', { fetchResponse: async () => new Response('', { status: 503 }) })).toMatchObject({ state: 'failed', code: 'provider_unavailable' });
    expect(repo.stage).not.toHaveBeenCalled(); expect(repo.activate).not.toHaveBeenCalled(); expect(repo.fail).toHaveBeenCalled();
  });
  it('partial write or expired lease never reports publication success', async () => {
    for (const phase of ['stage','activate'] as const) {
      const repo = repository(); repo[phase].mockRejectedValue(new Error(phase === 'stage' ? 'second chunk failed' : 'lease expired'));
      expect(await refreshJapan(repo, scope, 'secret', { fetchResponse: async () => Response.json({ status: 'OK', data: [disclosed] }) })).toMatchObject({ state: 'failed' });
      if (phase === 'stage') expect(repo.activate).not.toHaveBeenCalled();
      expect(repo.fail).toHaveBeenCalled();
    }
  });
});
