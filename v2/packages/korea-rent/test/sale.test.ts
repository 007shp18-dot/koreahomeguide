import { describe, expect, test } from 'vitest';

import {
  MOLIT_SALE_ENDPOINTS,
  MolitSourceError,
  fetchMolitSaleMonth,
  parseMolitSalePage,
  type MolitFetch,
  type ProviderCallBudget,
  type SourceHousingType,
} from '../src/index';

function salePage(input: {
  readonly pageNo?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly resultCode?: string;
  readonly item?: string;
} = {}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>${input.resultCode ?? '000'}</resultCode>
    <resultMsg>${input.resultCode === undefined ? 'OK' : 'ERROR'}</resultMsg>
  </header>
  <body>
    <items>${input.item ?? ''}</items>
    <numOfRows>${input.pageSize ?? 100}</numOfRows>
    <pageNo>${input.pageNo ?? 1}</pageNo>
    <totalCount>${input.totalCount ?? (input.item === undefined ? 0 : 1)}</totalCount>
  </body>
</response>`;
}

const ACTIVE_APARTMENT = `<item>
  <dealSn>APT-SALE-202607-001</dealSn>
  <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>15</dealDay>
  <dealAmount>146,500</dealAmount><excluUseAr>59.97</excluUseAr>
  <aptNm>한강 &amp; 서울</aptNm><umdNm>여의도동</umdNm><sggCd>11110</sggCd>
  <floor>12</floor><buildYear>2018</buildYear>
</item>`;

const CANCELLED_OFFICETEL = `<item>
  <transactionId>OFFI-SALE-202607-001</transactionId>
  <dealYear>2026</dealYear><dealMonth>07</dealMonth><dealDay>03</dealDay>
  <dealAmount>39,500</dealAmount><excluUseAr>51.02</excluUseAr>
  <offiNm>경희궁의 아침</offiNm><umdNm>내수동</umdNm><sggCd>11110</sggCd>
  <floor>3</floor><buildYear>2004</buildYear><cdealDay>20260720</cdealDay><cdealType>O</cdealType>
</item>`;

type TextResponse = Awaited<ReturnType<MolitFetch>>;

function response(xml: string, status = 200): TextResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return xml;
    },
  };
}

function budget(limit = 48): ProviderCallBudget & { readonly used: () => number } {
  let attempts = 0;
  return {
    consume() {
      attempts += 1;
      if (attempts > limit) throw new Error('provider call budget exhausted');
    },
    used: () => attempts,
  };
}

const NEVER_ABORTS = new AbortController().signal;

describe('MOLIT sale source', () => {
  test('registers all four official housing sale endpoints independently', () => {
    expect(MOLIT_SALE_ENDPOINTS).toEqual({
      apartment: {
        dataset: 'Apartment sale contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
      },
      officetel: {
        dataset: 'Officetel sale contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
      },
      villa: {
        dataset: 'Villa and row-house sale contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade',
      },
      detached: {
        dataset: 'Detached and multi-unit sale contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade',
      },
    });
  });

  test('normalizes 만원 to integer won and retains building evidence', () => {
    const page = parseMolitSalePage(salePage({
      pageSize: 1,
      totalCount: 1,
      item: ACTIVE_APARTMENT,
    }), {
      sourceHousingType: 'apartment',
      expectedPageNo: 1,
      expectedPageSize: 1,
      expectedDealYmd: '202607',
      expectedLawdCd: '11110',
    });

    expect(page.rows).toEqual([{
      sourceHousingType: 'apartment',
      buildingLabel: '한강 & 서울',
      legalDong: '여의도동',
      sourceRecordId: 'APT-SALE-202607-001',
      areaSqm: 59.97,
      priceWon: 1_465_000_000,
      contractDate: '2026-07-15',
      recordStatus: 'unknown',
      floor: 12,
      buildYear: 2018,
    }]);
  });

  test('retains cancellation state and accepts the officetel name field', () => {
    const page = parseMolitSalePage(salePage({
      pageSize: 1,
      totalCount: 1,
      item: CANCELLED_OFFICETEL,
    }), {
      sourceHousingType: 'officetel',
      expectedPageNo: 1,
      expectedPageSize: 1,
      expectedDealYmd: '202607',
      expectedLawdCd: '11110',
    });

    expect(page.rows[0]).toMatchObject({
      buildingLabel: '경희궁의 아침',
      priceWon: 395_000_000,
      recordStatus: 'cancelled',
      floor: 3,
      buildYear: 2004,
    });
  });

  test.each([
    ['villa', 'mhouseNm', '청운빌라'],
    ['detached', 'houseType', '단독'],
  ] as const)('normalizes %s identity without inventing a named building', (
    sourceHousingType,
    nameField,
    nameValue,
  ) => {
    const item = `<item>
      <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>9</dealDay>
      <dealAmount>90,000</dealAmount><totalFloorAr>120.25</totalFloorAr>
      <${nameField}>${nameValue}</${nameField}><umdNm>청운동</umdNm><sggCd>11110</sggCd>
    </item>`;
    const page = parseMolitSalePage(salePage({ pageSize: 1, totalCount: 1, item }), {
      sourceHousingType,
      expectedPageNo: 1,
      expectedPageSize: 1,
      expectedDealYmd: '202607',
      expectedLawdCd: '11110',
    });

    expect(page.rows[0]).toMatchObject({
      sourceHousingType,
      buildingLabel: nameValue,
      legalDong: '청운동',
      areaSqm: 120.25,
      priceWon: 900_000_000,
    });
  });

  test.each([
    ['wrong month', ACTIVE_APARTMENT.replace('<dealMonth>7</dealMonth>', '<dealMonth>6</dealMonth>'), 'contract_month_mismatch'],
    ['wrong district', ACTIVE_APARTMENT.replace('<sggCd>11110</sggCd>', '<sggCd>11680</sggCd>'), 'district_mismatch'],
    ['zero price', ACTIVE_APARTMENT.replace('<dealAmount>146,500</dealAmount>', '<dealAmount>0</dealAmount>'), 'sale_price'],
    ['invalid area', ACTIVE_APARTMENT.replace('<excluUseAr>59.97</excluUseAr>', '<excluUseAr>-1</excluUseAr>'), 'area'],
  ] as const)('rejects %s instead of publishing it', (_label, item, diagnostic) => {
    expect(() => parseMolitSalePage(salePage({ pageSize: 1, totalCount: 1, item }), {
      sourceHousingType: 'apartment',
      expectedPageNo: 1,
      expectedPageSize: 1,
      expectedDealYmd: '202607',
      expectedLawdCd: '11110',
    })).toThrowError(expect.objectContaining({
      code: 'source_malformed',
      diagnostic,
    }));
  });

  test('classifies provider access denial rather than retrying into fake empty data', async () => {
    const calls = budget();
    await expect(fetchMolitSaleMonth({
      serviceKey: 'test-key',
      sourceHousingType: 'apartment',
      lawdCd: '11110',
      dealYmd: '202607',
    }, {
      fetch: async () => response(salePage({ resultCode: '20' })),
      budget: calls,
      deadlineSignal: NEVER_ABORTS,
      attemptSignal: () => NEVER_ABORTS,
      now: () => new Date('2026-08-01T00:00:00.000Z'),
    })).rejects.toEqual(expect.objectContaining({
      code: 'source_malformed',
      diagnostic: 'provider_access_denied',
    }));
    expect(calls.used()).toBe(3);
  });

  test('fetches every page and preserves duplicate rows when no stable provider id exists', async () => {
    const calls = budget();
    const noId = ACTIVE_APARTMENT.replace(/\s*<dealSn>[^<]+<\/dealSn>/, '');
    const fetch: MolitFetch = async (input) => {
      const pageNo = new URL(String(input)).searchParams.get('pageNo');
      return response(salePage({
        pageNo: Number(pageNo),
        pageSize: 1,
        totalCount: 2,
        item: noId,
      }));
    };

    const month = await fetchMolitSaleMonth({
      serviceKey: 'test-key',
      sourceHousingType: 'apartment',
      lawdCd: '11110',
      dealYmd: '202607',
      pageSize: 1,
    }, {
      fetch,
      budget: calls,
      deadlineSignal: NEVER_ABORTS,
      attemptSignal: () => NEVER_ABORTS,
      now: () => new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(month.records).toHaveLength(2);
    expect(month.pages).toHaveLength(2);
    expect(month.records.every((row) => row.priceWon === 1_465_000_000)).toBe(true);
    expect(calls.used()).toBe(2);
  });

  test('rejects a stable provider id whose exact source row changes across pages', async () => {
    const fetch: MolitFetch = async (input) => {
      const pageNo = Number(new URL(String(input)).searchParams.get('pageNo'));
      return response(salePage({
        pageNo,
        pageSize: 1,
        totalCount: 2,
        item: pageNo === 1
          ? ACTIVE_APARTMENT
          : ACTIVE_APARTMENT.replace('<dealAmount>146,500</dealAmount>', '<dealAmount>147,000</dealAmount>'),
      }));
    };

    await expect(fetchMolitSaleMonth({
      serviceKey: 'test-key',
      sourceHousingType: 'apartment',
      lawdCd: '11110',
      dealYmd: '202607',
      pageSize: 1,
    }, {
      fetch,
      budget: budget(),
      deadlineSignal: NEVER_ABORTS,
      attemptSignal: () => NEVER_ABORTS,
      now: () => new Date('2026-08-01T00:00:00.000Z'),
    })).rejects.toEqual(expect.objectContaining({
      code: 'source_malformed',
      diagnostic: 'record_id_conflict',
    }));
  });

  test('rejects total-count changes between pages', async () => {
    const fetch: MolitFetch = async (input) => {
      const pageNo = Number(new URL(String(input)).searchParams.get('pageNo'));
      return response(salePage({
        pageNo,
        pageSize: 1,
        totalCount: pageNo === 1 ? 2 : 3,
        item: ACTIVE_APARTMENT.replace('APT-SALE-202607-001', `APT-${pageNo}`),
      }));
    };

    await expect(fetchMolitSaleMonth({
      serviceKey: 'test-key',
      sourceHousingType: 'apartment',
      lawdCd: '11110',
      dealYmd: '202607',
      pageSize: 1,
    }, {
      fetch,
      budget: budget(),
      deadlineSignal: NEVER_ABORTS,
      attemptSignal: () => NEVER_ABORTS,
      now: () => new Date('2026-08-01T00:00:00.000Z'),
    })).rejects.toEqual(expect.objectContaining({
      code: 'source_malformed',
      diagnostic: 'page_total_changed',
    }));
  });

  test('maps an exhausted deadline to source_timeout', async () => {
    const deadline = new AbortController();
    deadline.abort();
    await expect(fetchMolitSaleMonth({
      serviceKey: 'test-key',
      sourceHousingType: 'apartment',
      lawdCd: '11110',
      dealYmd: '202607',
    }, {
      fetch: async () => response(salePage()),
      budget: budget(),
      deadlineSignal: deadline.signal,
      now: () => new Date('2026-08-01T00:00:00.000Z'),
    })).rejects.toEqual(expect.objectContaining({ code: 'source_timeout' }));
  });

  test.each(['apartment', 'officetel', 'villa', 'detached'] as const)(
    'uses the exact %s endpoint and canonical query names',
    async (sourceHousingType: SourceHousingType) => {
      let captured: URL | undefined;
      await fetchMolitSaleMonth({
        serviceKey: 'decoded-key',
        sourceHousingType,
        lawdCd: '11110',
        dealYmd: '202607',
      }, {
        fetch: async (input) => {
          captured = new URL(String(input));
          return response(salePage());
        },
        budget: budget(),
        deadlineSignal: NEVER_ABORTS,
        attemptSignal: () => NEVER_ABORTS,
        now: () => new Date('2026-08-01T00:00:00.000Z'),
      });

      expect(`${captured?.origin}${captured?.pathname}`).toBe(
        MOLIT_SALE_ENDPOINTS[sourceHousingType].url,
      );
      expect(Object.fromEntries(captured?.searchParams ?? [])).toEqual({
        serviceKey: 'decoded-key',
        LAWD_CD: '11110',
        DEAL_YMD: '202607',
        numOfRows: '100',
        pageNo: '1',
      });
    },
  );

  test('uses the existing fail-closed source error type', () => {
    expect(new MolitSourceError('source_unavailable')).toBeInstanceOf(Error);
  });
});
