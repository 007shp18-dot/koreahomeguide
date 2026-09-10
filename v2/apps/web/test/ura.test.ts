import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkParam,
  fetchUra,
  getToken,
  isUraService,
  resetTokenCache,
  singaporeDate,
  UraError,
} from '../lib/ura';

const KEY = 'test-access-key';

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  resetTokenCache();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('service allow-list', () => {
  it('accepts only the services the proxy uses', () => {
    expect(isUraService('PMI_Resi_Rental')).toBe(true);
    expect(isUraService('PMI_Resi_Transaction')).toBe(true);
    // An open passthrough would let anyone spend the daily quota elsewhere.
    expect(isUraService('Car_Park_Availability')).toBe(false);
    expect(isUraService('__proto__')).toBe(false);
  });
});

describe('parameter rules', () => {
  it('keeps the two refPeriod formats apart', () => {
    // Rentals are yyqq; developer sales are mmyy. Swapping them silently
    // returns nothing, so the mismatch has to be rejected here.
    expect(checkParam('PMI_Resi_Rental', '25q2').ok).toBe(true);
    expect(checkParam('PMI_Resi_Rental', '0925').ok).toBe(false);
    expect(checkParam('PMI_Resi_Developer_Sales', '0925').ok).toBe(true);
    expect(checkParam('PMI_Resi_Developer_Sales', '25q2').ok).toBe(false);
  });

  it('bounds the transaction batch to the four postal-district groups', () => {
    for (const batch of ['1', '2', '3', '4']) {
      expect(checkParam('PMI_Resi_Transaction', batch).ok).toBe(true);
    }
    expect(checkParam('PMI_Resi_Transaction', '0').ok).toBe(false);
    expect(checkParam('PMI_Resi_Transaction', '5').ok).toBe(false);
    expect(checkParam('PMI_Resi_Transaction', '1; DROP').ok).toBe(false);
  });

  it('requires a parameter where one is due and refuses one where none is', () => {
    expect(checkParam('PMI_Resi_Rental', null).ok).toBe(false);
    expect(checkParam('PMI_Resi_Pipeline', null).ok).toBe(true);
    expect(checkParam('PMI_Resi_Pipeline', '25q2').ok).toBe(false);
  });
});

describe('daily token', () => {
  it('mints once and reuses within the same Singapore day', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ Status: 'Success', Result: 'tok-1' }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getToken(KEY)).toBe('tok-1');
    expect(await getToken(KEY)).toBe('tok-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('mints once for a burst of concurrent callers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ Status: 'Success', Result: 'tok-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const tokens = await Promise.all([getToken(KEY), getToken(KEY), getToken(KEY)]);
    expect(tokens).toEqual(['tok-1', 'tok-1', 'tok-1']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 200 with a non-Success status as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ Status: 'Fail', Message: 'Invalid AccessKey' }),
    ));
    await expect(getToken(KEY)).rejects.toBeInstanceOf(UraError);
  });

  it('never returns an empty token as if it were valid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ Status: 'Success', Result: '' })));
    await expect(getToken(KEY)).rejects.toBeInstanceOf(UraError);
  });
});

describe('singaporeDate', () => {
  it('follows the Singapore day boundary, not the server clock', () => {
    // 17:30 UTC is already the next day in Singapore (UTC+8).
    vi.useFakeTimers().setSystemTime(new Date('2026-03-14T17:30:00Z'));
    expect(singaporeDate()).toBe('2026-03-15');
    vi.setSystemTime(new Date('2026-03-14T10:00:00Z'));
    expect(singaporeDate()).toBe('2026-03-14');
  });
});

describe('data calls', () => {
  it('sends both headers and the right query parameter', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: 'tok-1' }))
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: [{ a: 1 }, { a: 2 }] }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchUra(KEY, 'PMI_Resi_Rental', '25q2');
    expect(out.count).toBe(2);

    const [url, init] = fetchMock.mock.calls[1]!;
    expect(String(url)).toContain('service=PMI_Resi_Rental');
    expect(String(url)).toContain('refPeriod=25q2');
    expect(init.headers.AccessKey).toBe(KEY);
    expect(init.headers.Token).toBe('tok-1');
  });

  it('surfaces a rejection instead of reporting zero rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: 'tok-1' }))
      .mockResolvedValue(jsonResponse({ Status: 'Fail', Message: 'Quota exceeded' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUra(KEY, 'PMI_Resi_Pipeline', null)).rejects.toThrow(/Quota exceeded/);
  });

  it('retries once with a fresh token when the upstream rejects the call', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: 'stale' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'unauthorised' }, 401))
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: 'fresh' }))
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: [{ a: 1 }] }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchUra(KEY, 'PMI_Resi_Pipeline', null);
    expect(out.count).toBe(1);
    expect(fetchMock.mock.calls[3]![1].headers.Token).toBe('fresh');
  });

  it('reports a missing Result as an empty list, not a crash', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success', Result: 'tok-1' }))
      .mockResolvedValueOnce(jsonResponse({ Status: 'Success' }));
    vi.stubGlobal('fetch', fetchMock);

    const out = await fetchUra(KEY, 'PMI_Resi_Pipeline', null);
    expect(out.count).toBe(0);
  });
});
