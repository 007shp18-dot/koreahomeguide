import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { PASSPORT_FX } from '../lib/passport/fx';
import { createPassportFxLoader, fetchPassportFxSnapshot, parsePassportFxResponse } from '../lib/passport/fx.server';

const instant = new Date('2026-09-08T17:00:00.000Z');
const provider = { amount: 1, base: 'EUR', date: '2026-09-07', rates: { KRW: 1600, SGD: 1.5, USD: 1.2 } };

describe('Passport reference rates', () => {
  it('keeps the provider effective date separate from the actual successful check', () => {
    expect(parsePassportFxResponse(provider, instant)).toMatchObject({
      asOf: '2026-09-07', checkedAt: instant.toISOString(), eurKrw: 1600,
      eurSgd: 1.5, eurUsd: 1.2, usdAed: 3.6725, availability: 'reference',
    });
  });

  it.each([
    { ...provider, base: 'USD' }, { ...provider, amount: 100 },
    { ...provider, date: '2026-02-30' }, { ...provider, date: '2026-09-09' },
    { ...provider, date: '2026-08-31' },
    { ...provider, rates: { ...provider.rates, SGD: 0 } },
    { ...provider, rates: { ...provider.rates, USD: Infinity } },
    { ...provider, rates: { ...provider.rates, KRW: '1600' } },
    { ...provider, rates: { KRW: 1600, USD: 1.2 } },
  ])('rejects incomplete, invalid or misdated rate snapshots: %j', invalid => {
    expect(() => parsePassportFxResponse(invalid, instant)).toThrow();
  });

  it('fetches the narrow existing provider response without caching unvalidated JSON', async () => {
    const fetchResponse: typeof fetch = async (url, options) => {
      expect(String(url)).toBe('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,SGD,USD');
      expect(options?.cache).toBe('no-store');
      expect(options?.redirect).toBe('error');
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      return Response.json(provider);
    };
    const result = await fetchPassportFxSnapshot({ fetchResponse, now: () => instant });
    expect(result.asOf).toBe('2026-09-07');
    expect(result.checkedAt).toBe(instant.toISOString());
  });

  it('rejects provider failure, malformed data and oversized decoded responses', async () => {
    for (const response of [new Response('unavailable', { status: 503 }),
      new Response('{bad json'), Response.json({ ...provider, rates: {} }),
      new Response('x'.repeat(17_000))]) {
      await expect(fetchPassportFxSnapshot({ fetchResponse: async () => response, now: () => instant })).rejects.toThrow();
    }
  });

  it('keeps successful rates and their check time after a later failure', async () => {
    let failed = false;
    const snapshot = parsePassportFxResponse(provider, instant);
    const load = createPassportFxLoader({
      readSnapshot: async () => { if (failed) throw new Error('provider offline'); return snapshot; },
      now: () => instant,
    });
    expect((await load()).availability).toBe('reference');
    failed = true;
    expect(await load()).toEqual({ ...snapshot, availability: 'stale' });
  });

  it('labels the bundled fallback on a cold-cache outage without inventing a check time', async () => {
    const load = createPassportFxLoader({ readSnapshot: async () => { throw new Error('offline'); }, now: () => instant });
    expect(await load()).toEqual(PASSPORT_FX);
  });

  it('marks an old cached check as stale instead of restamping it on every request', async () => {
    const snapshot = parsePassportFxResponse(provider, instant);
    const load = createPassportFxLoader({ readSnapshot: async () => snapshot, now: () => new Date('2026-09-12T17:00:00Z') });
    expect(await load()).toEqual({ ...snapshot, availability: 'stale' });
  });
});
