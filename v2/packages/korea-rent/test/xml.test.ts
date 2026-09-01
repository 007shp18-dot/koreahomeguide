import { describe, expect, test } from 'vitest';

import {
  MOLIT_RENT_ENDPOINTS,
  MolitSourceError,
  fetchMolitRentalMonth,
  parseMolitRentalPage,
  type MolitFetch,
  type ProviderCallBudget,
} from '../src/index';

const PAGE_ONE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <dealSn>APT-202608-001</dealSn>
        <dealYear>2026</dealYear>
        <dealMonth>8</dealMonth>
        <dealDay>15</dealDay>
        <deposit>1,000</deposit>
        <monthlyRent>90</monthlyRent>
        <excluUseAr>25.00</excluUseAr>
        <aptNm>한강 &amp; 서울</aptNm>
        <umdNm>여의도동</umdNm>
        <contractType>신규</contractType>
        <cdealDay>20260820</cdealDay>
        <cdealType>O</cdealType>
      </item>
    </items>
    <numOfRows>1</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>2</totalCount>
  </body>
</response>`;

const PAGE_TWO = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <dealYear>2026</dealYear>
        <dealMonth>08</dealMonth>
        <dealDay>03</dealDay>
        <deposit>2,500</deposit>
        <monthlyRent>0</monthlyRent>
        <excluUseAr>31.75</excluUseAr>
        <aptNm>서울빌라</aptNm>
        <contractType>갱신</contractType>
      </item>
    </items>
    <numOfRows>1</numOfRows>
    <pageNo>2</pageNo>
    <totalCount>2</totalCount>
  </body>
</response>`;

const ZERO_PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items></items>
    <numOfRows>100</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>0</totalCount>
  </body>
</response>`;

const RETRY_WRONG_PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <dealSn>APT-202608-001</dealSn>
        <dealYear>2026</dealYear>
        <dealMonth>8</dealMonth>
        <dealDay>15</dealDay>
        <deposit>1,000</deposit>
        <monthlyRent>90</monthlyRent>
        <excluUseAr>25.00</excluUseAr>
        <aptNm>한강 &amp; 서울</aptNm>
        <contractType>신규</contractType>
        <cdealDay>20260820</cdealDay>
        <cdealType>O</cdealType>
      </item>
    </items>
    <numOfRows>1</numOfRows>
    <pageNo>9</pageNo>
    <totalCount>2</totalCount>
  </body>
</response>`;

const DUPLICATE_NO_ID_PAGE_ONE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <dealYear>2026</dealYear><dealMonth>08</dealMonth><dealDay>03</dealDay>
        <deposit>2,500</deposit><monthlyRent>0</monthlyRent><excluUseAr>31.75</excluUseAr>
        <aptNm>서울빌라</aptNm><contractType>갱신</contractType>
      </item>
    </items>
    <numOfRows>1</numOfRows><pageNo>1</pageNo><totalCount>2</totalCount>
  </body>
</response>`;

const DUPLICATE_NO_ID_PAGE_TWO = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <dealYear>2026</dealYear><dealMonth>08</dealMonth><dealDay>03</dealDay>
        <deposit>2,500</deposit><monthlyRent>0</monthlyRent><excluUseAr>31.75</excluUseAr>
        <aptNm>서울빌라</aptNm><contractType>갱신</contractType>
      </item>
    </items>
    <numOfRows>1</numOfRows><pageNo>2</pageNo><totalCount>2</totalCount>
  </body>
</response>`;

const DUPLICATE_ID_PAGE_TWO = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <dealSn>APT-202608-001</dealSn>
        <dealYear>2026</dealYear><dealMonth>8</dealMonth><dealDay>15</dealDay>
        <deposit>1,000</deposit><monthlyRent>90</monthlyRent><excluUseAr>25.00</excluUseAr>
        <aptNm>한강 &amp; 서울</aptNm><contractType>신규</contractType>
        <umdNm>여의도동</umdNm>
        <cdealDay>20260820</cdealDay><cdealType>O</cdealType>
      </item>
    </items>
    <numOfRows>1</numOfRows><pageNo>2</pageNo><totalCount>2</totalCount>
  </body>
</response>`;

const API_ERROR_PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>20</resultCode>
    <resultMsg>SERVICE ACCESS DENIED</resultMsg>
  </header>
  <body>
    <items></items>
    <numOfRows>100</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>0</totalCount>
  </body>
</response>`;

const MISSING_BODY_PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>000</resultCode>
    <resultMsg>OK</resultMsg>
  </header>
</response>`;

type TextResponse = Awaited<ReturnType<MolitFetch>> & { readonly reads: () => number };

function response(xml: string, status = 200): TextResponse {
  let bodyReads = 0;
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      bodyReads += 1;
      if (bodyReads > 1) throw new Error('response body read more than once');
      return xml;
    },
    reads: () => bodyReads,
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

describe('MOLIT XML registry and parser', () => {
  test('publishes the four official rental endpoints', () => {
    expect(MOLIT_RENT_ENDPOINTS).toEqual({
      apartment: {
        dataset: 'Apartment rental contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
      },
      officetel: {
        dataset: 'Officetel rental contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
      },
      villa: {
        dataset: 'Villa and row-house rental contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
      },
      detached: {
        dataset: 'Detached and multi-unit rental contracts',
        url: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent',
      },
    });
  });

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'validates a complete page and normalizes 만원, contract type, cancellation, and absent status',
    () => {
      const first = parseMolitRentalPage(PAGE_ONE, {
        sourceHousingType: 'apartment',
        expectedPageNo: 1,
        expectedPageSize: 1,
      });
      const second = parseMolitRentalPage(PAGE_TWO, {
        sourceHousingType: 'apartment',
        expectedPageNo: 2,
        expectedPageSize: 1,
      });

      expect(first).toMatchObject({ pageNo: 1, pageSize: 1, totalCount: 2 });
      expect(first.rows).toEqual([
        {
          sourceHousingType: 'apartment',
          sourceRecordId: 'APT-202608-001',
          buildingLabel: '한강 & 서울',
          legalDong: '여의도동',
          areaSqm: 25,
          depositWon: 10_000_000,
          monthlyRentWon: 900_000,
          contractDate: '2026-08-15',
          contractType: 'new',
          recordStatus: 'cancelled',
        },
      ]);
      expect(second.rows[0]).toMatchObject({
        depositWon: 25_000_000,
        monthlyRentWon: 0,
        contractType: 'renewal',
        recordStatus: 'unknown',
      });
    },
  );

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS)).each([
    ['rejected result code', API_ERROR_PAGE],
    ['missing response body', MISSING_BODY_PAGE],
    ['truncated XML', '<response><header><resultCode>000</resultCode></header><body>'],
    ['text outside the document root', `${ZERO_PAGE}unexpected trailing text`],
    ['unterminated opening attribute', ZERO_PAGE.replace('<response>', '<response data-id="unterminated>')],
    ['unquoted opening attribute', ZERO_PAGE.replace('<response>', '<response data-id=value>')],
    ['duplicate opening attribute', ZERO_PAGE.replace('<response>', '<response data-id="a" data-id="b">')],
    ['raw less-than in an attribute', ZERO_PAGE.replace('<response>', '<response data-id="raw<value">')],
    ['unknown entity', ZERO_PAGE.replace('<resultMsg>OK</resultMsg>', '<resultMsg>&unknown;</resultMsg>')],
    ['forbidden null entity', ZERO_PAGE.replace('<resultMsg>OK</resultMsg>', '<resultMsg>&#0;</resultMsg>')],
    ['forbidden surrogate entity', ZERO_PAGE.replace('<resultMsg>OK</resultMsg>', '<resultMsg>&#xD800;</resultMsg>')],
    ['external entity declaration', `<!DOCTYPE response [<!ENTITY x SYSTEM "file:///etc/passwd">]>${ZERO_PAGE}`],
    ['malformed totalCount', ZERO_PAGE.replace('<totalCount>0</totalCount>', '<totalCount>x</totalCount>')],
    ['wrong page number', ZERO_PAGE.replace('<pageNo>1</pageNo>', '<pageNo>2</pageNo>')],
    ['wrong page size', ZERO_PAGE.replace('<numOfRows>100</numOfRows>', '<numOfRows>99</numOfRows>')],
  ])('rejects a %s page as malformed', (_label, xml) => {
    expect(() =>
      parseMolitRentalPage(xml, {
        sourceHousingType: 'apartment',
        expectedPageNo: 1,
        expectedPageSize: 100,
      }),
    ).toThrow(MolitSourceError);
  });

  test('classifies a provider error envelope without exposing its message or payload', () => {
    expect.assertions(3);
    try {
      parseMolitRentalPage(API_ERROR_PAGE, {
        sourceHousingType: 'apartment',
        expectedPageNo: 1,
        expectedPageSize: 100,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: 'source_malformed',
        diagnostic: 'provider_access_denied',
      });
      expect(JSON.stringify(error)).not.toContain('SERVICE ACCESS DENIED');
      expect(JSON.stringify(error)).not.toContain(API_ERROR_PAGE);
    }
  });

  test('classifies a contract month mismatch at the field boundary', () => {
    const wrongMonth = PAGE_ONE
      .replace('<dealMonth>8</dealMonth>', '<dealMonth>7</dealMonth>')
      .replace('<totalCount>2</totalCount>', '<totalCount>1</totalCount>');

    expect(() => parseMolitRentalPage(wrongMonth, {
      sourceHousingType: 'apartment',
      expectedPageNo: 1,
      expectedPageSize: 1,
      expectedDealYmd: '202608',
      expectedLawdCd: '11590',
    })).toThrow(expect.objectContaining({
      code: 'source_malformed',
      diagnostic: 'contract_month_mismatch',
    }));
  });

  test('accepts whitespace before a self-closing slash', () => {
    const page = parseMolitRentalPage(ZERO_PAGE.replace('<items></items>', '<items />'), {
      sourceHousingType: 'apartment',
      expectedPageNo: 1,
      expectedPageSize: 100,
    });

    expect(page).toMatchObject({ pageNo: 1, pageSize: 100, totalCount: 0, rows: [] });
  });

  test('accepts an escaped less-than entity in an XML attribute', () => {
    const page = parseMolitRentalPage(
      ZERO_PAGE.replace('<response>', '<response data-note="safe&lt;value">'),
      {
        sourceHousingType: 'apartment',
        expectedPageNo: 1,
        expectedPageSize: 100,
      },
    );

    expect(page).toMatchObject({ pageNo: 1, pageSize: 100, totalCount: 0, rows: [] });
  });
});

describe('fetchMolitRentalMonth', () => {
  test.each(['202600', '202613'])(
    'rejects invalid calendar DEAL_YMD=%s before fetching',
    async (dealYmd) => {
      let fetchRuns = 0;

      await expect(
        fetchMolitRentalMonth(
          {
            serviceKey: 'top-secret-test-key',
            sourceHousingType: 'apartment',
            lawdCd: '11590',
            dealYmd,
          },
          {
            fetch: async () => {
              fetchRuns += 1;
              return response(ZERO_PAGE);
            },
            budget: budget(),
            deadlineSignal: NEVER_ABORTS,
            attemptSignal: () => NEVER_ABORTS,
            now: () => new Date('2026-09-01T00:00:00.000Z'),
          },
        ),
      ).rejects.toMatchObject({ code: 'source_unavailable' });
      expect(fetchRuns).toBe(0);
    },
  );

  test('rejects a complete response containing a contract from another month', async () => {
    const wrongMonth = PAGE_ONE
      .replace('<dealMonth>8</dealMonth>', '<dealMonth>7</dealMonth>')
      .replace('<totalCount>2</totalCount>', '<totalCount>1</totalCount>');

    await expect(
      fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(wrongMonth),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      ),
    ).rejects.toMatchObject({
      code: 'source_malformed',
      diagnostic: 'contract_month_mismatch',
    });
  });

  test('rejects a complete response whose supplied district identity mismatches LAWD_CD', async () => {
    const wrongDistrict = PAGE_ONE
      .replace('<dealSn>', '<sggCd>11680</sggCd>\n        <dealSn>')
      .replace('<totalCount>2</totalCount>', '<totalCount>1</totalCount>');

    await expect(
      fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(wrongDistrict),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      ),
    ).rejects.toMatchObject({ code: 'source_malformed' });
  });

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'fetches every validated page through totalCount and reads each body exactly once',
    async () => {
      const responses = [response(PAGE_ONE), response(PAGE_TWO)];
      const urls: URL[] = [];
      const calls = budget();
      const attemptTimeouts: number[] = [];
      const fetcher: MolitFetch = async (input, init) => {
        expect(init?.cache).toBe('no-store');
        urls.push(new URL(String(input)));
        return responses.shift()!;
      };

      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: fetcher,
          budget: calls,
          deadlineSignal: NEVER_ABORTS,
          attemptSignal(timeoutMs) {
            attemptTimeouts.push(timeoutMs);
            return NEVER_ABORTS;
          },
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      );

      expect(result).toMatchObject({ totalCount: 2, retrievedAt: '2026-09-01T00:00:00.000Z' });
      expect(result.pages.map((page) => page.pageNo)).toEqual([1, 2]);
      expect(result.records).toHaveLength(2);
      expect(urls.map((url) => url.searchParams.get('pageNo'))).toEqual(['1', '2']);
      expect(urls.every((url) => url.searchParams.get('LAWD_CD') === '11590')).toBe(true);
      expect(urls.every((url) => url.searchParams.get('DEAL_YMD') === '202608')).toBe(true);
      expect(calls.used()).toBe(2);
      expect(attemptTimeouts).toEqual([5_000, 5_000]);
      expect(responses).toHaveLength(0);
    },
  );

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'retries by replacing a failed page attempt instead of double-appending it',
    async () => {
      const bodies = [RETRY_WRONG_PAGE, PAGE_ONE, PAGE_TWO];
      const calls = budget();

      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(bodies.shift()!),
          budget: calls,
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      );

      expect(result.records.map((row) => row.contractDate)).toEqual([
        '2026-08-15',
        '2026-08-03',
      ]);
      expect(result.pages).toHaveLength(2);
      expect(calls.used()).toBe(3);
    },
  );

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'deduplicates a cross-page stable source ID',
    async () => {
      const bodies = [PAGE_ONE, DUPLICATE_ID_PAGE_TWO];

      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(bodies.shift()!),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      );

      expect(result.records).toHaveLength(1);
      expect(result.records[0]?.sourceRecordId).toBe('APT-202608-001');
    },
  );

  test('rejects conflicting content for the same stable source ID across pages', async () => {
    const conflictingPage = DUPLICATE_ID_PAGE_TWO.replace(
      '<monthlyRent>90</monthlyRent>',
      '<monthlyRent>91</monthlyRent>',
    );
    const bodies = [PAGE_ONE, conflictingPage];

    await expect(
      fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(bodies.shift()!),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      ),
    ).rejects.toMatchObject({
      code: 'source_malformed',
      diagnostic: 'record_id_conflict',
    });
  });

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'preserves exact anonymous rows because redacted contracts can be publicly identical',
    async () => {
      const bodies = [DUPLICATE_NO_ID_PAGE_ONE, DUPLICATE_NO_ID_PAGE_TWO];

      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 1,
        },
        {
          fetch: async () => response(bodies.shift()!),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      );

      expect(result.totalCount).toBe(2);
      expect(result.records).toHaveLength(2);
      expect(result.records[0]).toEqual(result.records[1]);
      expect(result.pages[0]?.rowFingerprintDigests).toEqual(
        result.pages[1]?.rowFingerprintDigests,
      );
    },
  );

  test('accepts normalized-identical anonymous rows when the exact raw items differ', async () => {
    const rawDistinctSecondPage = DUPLICATE_NO_ID_PAGE_TWO.replace(
      '<dealMonth>08</dealMonth>',
      '<dealMonth>8</dealMonth>',
    );
    const bodies = [DUPLICATE_NO_ID_PAGE_ONE, rawDistinctSecondPage];

    const result = await fetchMolitRentalMonth(
      {
        serviceKey: 'top-secret-test-key',
        sourceHousingType: 'apartment',
        lawdCd: '11590',
        dealYmd: '202608',
        pageSize: 1,
      },
      {
        fetch: async () => response(bodies.shift()!),
        budget: budget(),
        deadlineSignal: NEVER_ABORTS,
        attemptSignal: () => NEVER_ABORTS,
        now: () => new Date('2026-09-01T00:00:00.000Z'),
      },
    );

    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual(result.records[1]);
  });

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'counts all three failed attempts and never exposes the key or endpoint in its error',
    async () => {
      const calls = budget();
      const serviceKey = 'secret-never-report-this';

      const thrown = await fetchMolitRentalMonth(
        {
          serviceKey,
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 100,
        },
        {
          fetch: async () => {
            throw new Error('network rejected request');
          },
          budget: calls,
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      ).catch((error: unknown) => error);

      expect(thrown).toBeInstanceOf(MolitSourceError);
      expect(calls.used()).toBe(3);
      expect(String(thrown)).not.toContain(serviceKey);
      expect(String(thrown)).not.toContain('apis.data.go.kr');
    },
  );

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'normalizes budget exhaustion before starting another provider attempt',
    async () => {
      const calls = budget(0);
      let fetchRuns = 0;

      const thrown = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
          pageSize: 100,
        },
        {
          fetch: async () => {
            fetchRuns += 1;
            return response(ZERO_PAGE);
          },
          budget: calls,
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      ).catch((error: unknown) => error);

      expect(thrown).toMatchObject({ code: 'source_unavailable' });
      expect(fetchRuns).toBe(0);
      expect(calls.used()).toBe(1);
    },
  );

  test('allows provider attempt 48 and rejects attempt 49 without fetching', async () => {
    const calls = budget(48);
    let fetchRuns = 0;
    const dependencies = {
      fetch: async () => {
        fetchRuns += 1;
        return response(ZERO_PAGE);
      },
      budget: calls,
      deadlineSignal: NEVER_ABORTS,
      attemptSignal: () => NEVER_ABORTS,
      now: () => new Date('2026-09-01T00:00:00.000Z'),
    } as const;

    for (let attempt = 1; attempt <= 48; attempt += 1) {
      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
        },
        dependencies,
      );
      expect(result.totalCount).toBe(0);
    }
    await expect(
      fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'apartment',
          lawdCd: '11590',
          dealYmd: '202608',
        },
        dependencies,
      ),
    ).rejects.toMatchObject({ code: 'source_unavailable' });
    expect(fetchRuns).toBe(48);
    expect(calls.used()).toBe(49);
  });

  test.runIf(Boolean(MOLIT_RENT_ENDPOINTS))(
    'accepts a complete zero-row month',
    async () => {
      const result = await fetchMolitRentalMonth(
        {
          serviceKey: 'top-secret-test-key',
          sourceHousingType: 'detached',
          lawdCd: '11590',
          dealYmd: '202608',
        },
        {
          fetch: async () => response(ZERO_PAGE),
          budget: budget(),
          deadlineSignal: NEVER_ABORTS,
          attemptSignal: () => NEVER_ABORTS,
          now: () => new Date('2026-09-01T00:00:00.000Z'),
        },
      );

      expect(result).toMatchObject({ totalCount: 0, records: [], pages: [{ pageNo: 1, rows: [] }] });
    },
  );
});
