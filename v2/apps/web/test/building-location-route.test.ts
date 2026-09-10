import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../lib/db/postgres.server', () => ({ contentDatabase: () => db.query }));
import { GET } from '../app/api/building-location/route';
beforeEach(() => vi.clearAllMocks());

describe('verified building locations', () => {
  it('identifies an official stored address even before coordinates are resolved', async () => {
    db.query.mockResolvedValue([{ key: 'seoul:a', address: '서울특별시 용산구 서빙고로 17', verified_address: true, latitude: null, longitude: null }]);
    const response = await GET(new Request('https://www.signedprice.com/api/building-location/?keys=seoul:a'));
    expect(await response.json()).toMatchObject({ locations: [{ key: 'seoul:a', verifiedAddress: true }] });
  });
  it('returns a bounded batch of verified identities, preserving unresolved addresses', async () => {
    db.query.mockResolvedValue([
      { key: 'seoul:a', address: '서울특별시 강남구 역삼동 1', latitude: 37.5, longitude: 127.03 },
      { key: 'seoul:b', address: '서울특별시 강남구 역삼동 2', latitude: null, longitude: null },
    ]);
    const response = await GET(new Request('https://www.signedprice.com/api/building-location/?keys=seoul:a,seoul:b'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ locations: [
      { key: 'seoul:a', address: '서울특별시 강남구 역삼동 1', latitude: 37.5, longitude: 127.03 },
      { key: 'seoul:b', address: '서울특별시 강남구 역삼동 2', latitude: null, longitude: null },
    ] });
  });
  it('rejects excessive and mixed single/batch requests before querying', async () => {
    for (const query of ['key=seoul:a&keys=seoul:b', `keys=${Array.from({ length: 51 }, (_, i) => `seoul:${i}`).join(',')}`, 'keys=sg:a']) {
      expect((await GET(new Request(`https://www.signedprice.com/api/building-location/?${query}`))).status).toBe(400);
    }
    expect(db.query).not.toHaveBeenCalled();
  });
  it('never exposes an out-of-market coordinate pair', async () => {
    db.query.mockResolvedValue([{ key: 'seoul:a', address: '서울특별시 강남구', latitude: 1.3, longitude: 103.8 }]);
    const response = await GET(new Request('https://www.signedprice.com/api/building-location/?key=seoul:a'));
    expect(await response.json()).toEqual({ address: '서울특별시 강남구', latitude: null, longitude: null });
  });
});
