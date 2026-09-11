import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { collectSingaporeEvidence } from '../lib/market-data/singapore-collector.server';
import { resetTokenCache } from '../lib/ura';
const sale = [{"project":"Example Residences","street":"Example Road","x":"28900.125","y":"31500.5","marketSegment":"CCR","transaction":[{"area":"100.5","floorRange":"06-10","noOfUnits":"1","contractDate":"0826","typeOfSale":"1","price":"2000000","propertyType":"Condominium","district":"10","typeOfArea":"Strata","tenure":"Freehold"}]}];
const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
afterEach(() => { resetTokenCache(); vi.unstubAllGlobals(); });

describe('Singapore scheduled collection uses the working URA transport', () => {
  it('accepts successful sale envelopes without an optional Message and reads all four batches', async () => {
    const fetcher = vi.fn(async (input: string | URL) => String(input).includes('insertNewToken')
      ? json({ Status: 'Success', Result: 'token' })
      : json({ Status: 'Success', Result: sale }));
    vi.stubGlobal('fetch', fetcher);
    const batch = await collectSingaporeEvidence({job: 'sg-private-sale', accessKey: 'key', reference: new Date('2026-09-11')});
    expect(batch.records).toHaveLength(4);
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(fetcher.mock.calls.slice(1).map(([url]) => new URL(String(url)).searchParams.get('batch'))).toEqual(['1','2','3','4']);
  });
  it('refreshes a rejected token once and preserves rental ranges from both quarters', async () => {
    let rejected = false;
    const fetcher = vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      if (url.pathname.includes('insertNewToken')) return json({ Status: 'Success', Result: rejected ? 'fresh-token' : 'old-token' });
      if (!rejected) { rejected = true; return json({ Status: 'Fail', Message: 'Token expired' }); }
      return json({ Status: 'Success', Result: [{project: 'Example Court', street: 'Example Road', rental: [{
        district: '09', propertyType: 'Non-landed Properties', leaseDate: url.searchParams.get('refPeriod') === '26q2' ? '0626' : '0726',
        areaSqm: '>300', areaSqft: '>3000', noOfBedRoom: 'NA', rent: 7000,
      }]}] });
    });
    vi.stubGlobal('fetch', fetcher);
    const batch = await collectSingaporeEvidence({job: 'sg-private-rent', accessKey: 'key', reference: new Date('2026-09-11')});
    expect(batch.records).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(batch.records.every(r => r.observation?.propertyAreaSqm === null)).toBe(true);
  });
  it('never turns a provider rejection into a successful empty rental refresh', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => String(input).includes('insertNewToken')
      ? json({ Status: 'Success', Result: 'token' }) : json({ Status: 'Fail', Message: 'Unavailable' })));
    await expect(collectSingaporeEvidence({job: 'sg-private-rent', accessKey: 'key', reference: new Date('2026-09-11')})).rejects.toThrow();
  });
});
