import { afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
const mocks = vi.hoisted(() => ({ query: vi.fn(), database: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ publicContentDatabase: mocks.database }));
import { normalizeTokyoPassport, tokyoPassportEvidence, TOKYO_PASSPORT_SQL } from '../lib/passport/tokyo-evidence.server';
import { TOKYO_CONDOMINIUM_TYPE } from '../lib/japan/query';
afterEach(() => vi.resetAllMocks());
const row = { total_sample: '12', median_psm: 1500000, first_period: 8100, last_period: 8103,
  city: '13113', year: 2025, quarter: 4, neighbourhood: 'Ebisu & Hiroo', sample: '4', median_price: 90000000 };
it('keeps transaction weighting, ward periods and encoded anonymous neighbourhood links', () => {
  const result = normalizeTokyoPassport([row]);
  expect(result).toMatchObject({ currency: 'JPY', sample: 12, priceSample: 12, medianPsm: 1500000,
    priceBasis: 'transactions', period: '2025 Q1–2025 Q4 · latest per ward' });
  expect(result.scopes[0]).toMatchObject({ kind: 'neighbourhood', sample: 4, locationLabel: 'Shibuya · 2025 Q4' });
  const link = new URL(result.scopes[0]!.href, 'https://example.test');
  expect(Object.fromEntries(link.searchParams)).toEqual({ city: '13113', year: '2025', quarter: '4',
    neighbourhood: 'Ebisu & Hiroo', type: TOKYO_CONDOMINIUM_TYPE });
});
it.each([{ ...row, median_psm: 0 }, { ...row, median_price: -1 }, { ...row, city: '99999' },
  { ...row, sample: 'NaN' }, { ...row, first_period: null }])('rejects invalid summaries %j', value => {
  expect(() => normalizeTokyoPassport([value])).toThrow();
});
it('queries latest published ward snapshots with positive condominium observations', async () => {
  mocks.database.mockReturnValue({ query: mocks.query }); mocks.query.mockResolvedValue([row]);
  expect((await tokyoPassportEvidence()).sample).toBe(12);
  expect(mocks.query).toHaveBeenCalledWith(TOKYO_PASSPORT_SQL,
    [TOKYO_CONDOMINIUM_TYPE, expect.arrayContaining(['13101', '13123'])]);
  expect(TOKYO_PASSPORT_SQL).toContain("r.state = 'published'");
  expect(TOKYO_PASSPORT_SQL).toContain('DISTINCT ON (p.city)');
  expect(TOKYO_PASSPORT_SQL).toContain('price > 0 AND area > 0');
});
it('returns Tokyo unavailable on timeout without exposing internal errors', async () => {
  mocks.database.mockReturnValue({ query: mocks.query }); mocks.query.mockRejectedValue(new Error('secret DB timeout'));
  expect(await tokyoPassportEvidence()).toEqual({ id: 'jp-tokyo', city: 'Tokyo', currency: 'JPY', localBudget: 0,
    medianPsm: null, sample: 0, period: 'Unavailable', scopes: [] });
});
