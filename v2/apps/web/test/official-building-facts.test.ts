import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { loadOfficialBuildingFacts } from '../lib/public-market/official-building-facts.server';

function json(value: unknown): Response {
  return Response.json(value);
}

describe('official Korea building facts join', () => {
  test('joins apartment list, basic facts and building register only through exact keys', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ response: { header: { resultCode: '00' }, body: { items: [
        { kaptCode: 'A10000001', kaptName: '래미안 역삼', bjdCode: '1168010100' },
      ] } } }))
      .mockResolvedValueOnce(json({ response: { header: { resultCode: '00' }, body: { item: {
        kaptCode: 'A10000001', kaptName: '래미안 역삼', bjdCode: '1168010100',
        kaptAddr: '서울특별시 강남구 역삼동 123-4 래미안 역삼', doroJuso: '서울특별시 강남구 테헤란로 1',
        codeHeatNm: '지역난방', codeHallNm: '계단식', codeSaleNm: '분양',
        hoCnt: '480', kaptDongCnt: '6', kaptUsedate: '20190510', kaptTarea: '52340.5',
      } } } }))
      .mockResolvedValueOnce(json({ response: { header: { resultCode: '00' }, body: { items: { item: [{
        mgmBldrgstPk: '11680-123', platPlc: '서울특별시 강남구 역삼동 123-4',
        mainPurpsCdNm: '공동주택', strctCdNm: '철근콘크리트구조',
        totArea: '52340.5', archArea: '3100.2', grndFlrCnt: '25', ugrndFlrCnt: '3',
        useAprDay: '20190510', totPkngCnt: '612',
      }] } } } }));

    const result = await loadOfficialBuildingFacts({
      serviceKey: 'server%2Bsecret%2Fvalue', fetch,
      districtLawdCd: '11680', neighborhoodName: '역삼동',
      officialName: '래미안 역삼', housingType: 'apartment',
    });

    expect(result).toEqual(expect.objectContaining({
      status: 'ready', match: { kaptCode: 'A10000001', bjdCode: '1168010100' },
      apartment: expect.objectContaining({ households: 480, buildings: 6, heating: '지역난방' }),
      register: expect.objectContaining({ mainUse: '공동주택', parkingSpaces: 612 }),
    }));
    expect(fetch).toHaveBeenCalledTimes(3);
    const urls = fetch.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls[0]?.pathname).toContain('/AptListService3/getSigunguAptList');
    expect(urls[1]?.pathname).toBe('/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4');
    expect(urls[1]?.searchParams.get('kaptCode')).toBe('A10000001');
    expect(urls[2]?.searchParams.get('sigunguCd')).toBe('11680');
    expect(urls[2]?.searchParams.get('bjdongCd')).toBe('10100');
    expect(urls[2]?.searchParams.get('bun')).toBe('0123');
    expect(urls[2]?.searchParams.get('ji')).toBe('0004');
    expect(urls.every((url) => url.searchParams.get('serviceKey') === 'server+secret/value')).toBe(true);
    expect(JSON.stringify(result)).not.toContain('server-secret');
  });

  test('fails closed when a normalized complex name is ambiguous', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValueOnce(json({
      response: { header: { resultCode: '00' }, body: { items: [
        { kaptCode: 'A10000001', kaptName: '한빛아파트', bjdCode: '1168010100' },
        { kaptCode: 'A10000002', kaptName: '한빛 아파트', bjdCode: '1168010100' },
      ] } },
    }));

    await expect(loadOfficialBuildingFacts({
      serviceKey: 'secret', fetch, districtLawdCd: '11680', neighborhoodName: '역삼동',
      officialName: '한빛 아파트', housingType: 'apartment',
    })).resolves.toEqual({ status: 'unavailable', reason: 'ambiguous_apartment_match' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('does not pretend the apartment service covers non-apartment buildings', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    await expect(loadOfficialBuildingFacts({
      serviceKey: 'secret', fetch, districtLawdCd: '11680', neighborhoodName: '역삼동',
      officialName: '역삼 오피스텔', housingType: 'officetel',
    })).resolves.toEqual({ status: 'unavailable', reason: 'unsupported_housing_type' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
