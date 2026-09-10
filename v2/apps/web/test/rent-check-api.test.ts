import { describe, expect, test } from 'vitest';

import {
  KoreaRentServiceError,
  type KoreaRentCheckServiceResult,
  type SeoulRentCheckEnvelope,
  type SeoulRentCheckErrorCode,
  type SeoulRentCheckService,
} from '@signedprice/korea-rent';

import {
  createRentCheckGetHandler,
  methodNotAllowed,
} from '../lib/rent-check/route-handler';
import { createAllowedRentCheckHosts } from '../lib/rent-check/request-security';

const NO_STORE = 'private, no-store';
const VALID_URL =
  'https://www.signedprice.com/api/markets/kr-seoul/rent-check' +
  '?lawdCd=11590&type=studio&deposit=10000000&rent=900000&area=28';

const successEnvelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'studio',
  sourceHousingType: 'detached',
  typeMapping: {
    applied: true,
    explanation: 'Studio is compared with detached/multi-unit source records.',
  },
  source: {
    provider: 'MOLIT',
    dataset: 'Detached house rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport'],
  },
  coverage: {
    basis: 'contract_date',
    timezone: 'Asia/Seoul',
    coverageThroughMonth: '2026-07',
    latestContractMonth: '2026-07',
    sourceRetrievedAt: {
      earliest: '2026-08-01T00:00:00.000Z',
      latest: '2026-08-01T00:05:00.000Z',
    },
    responseGeneratedAt: '2026-08-01T00:06:00.000Z',
    monthsUsed: 3,
  },
  methodology: {
    policyId: 'kr-rent-check-quote-normalization',
    version: 1,
    annualDepositRate: 0.05,
    verdictBasis: 'typical-range',
    contractSelection: 'new_only',
    eligibleContractTypeCounts: { new: 5, renewal: 1, unknown: 1 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 6, cancelled: 1, unknown: 1 },
  },
  result: {
    rating: 'fair',
    comparisonMode: 'monthly-rent',
    comparisonBasis: 'deposit-adjusted-monthly-rent',
    askingValueWon: 900_000,
    medianValueWon: 910_000,
    minValueWon: 800_000,
    p25ValueWon: 850_000,
    p75ValueWon: 950_000,
    maxValueWon: 1_000_000,
    differencePct: -1.1,
    percentileRank: 40,
    verdictBasis: 'typical-range',
    confidence: 'medium',
    comparableCount: 5,
    monthsUsed: 3,
    tier: 1,
  },
  comparables: [
    {
      buildingLabel: 'Sample building',
      areaSqm: 28,
      depositWon: 10_000_000,
      monthlyRentWon: 900_000,
      contractDate: '2026-07-15',
      contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: ['Official contracts do not describe every property feature.'],
} satisfies SeoulRentCheckEnvelope;

function serviceResult(
  envelope: SeoulRentCheckEnvelope = successEnvelope,
  cacheStatus: KoreaRentCheckServiceResult['cacheStatus'] = 'hit',
): KoreaRentCheckServiceResult {
  return { envelope, cacheStatus };
}

function createHarness(options: {
  readonly result?: KoreaRentCheckServiceResult;
  readonly error?: unknown;
  readonly allowedHosts?: ReadonlySet<string>;
  readonly serviceKey?: string;
} = {}) {
  let serviceCreations = 0;
  let checks = 0;
  const service: SeoulRentCheckService = {
    async check() {
      checks += 1;
      if (options.error !== undefined) throw options.error;
      return options.result ?? serviceResult();
    },
  };
  const handler = createRentCheckGetHandler({
    allowedHosts: options.allowedHosts ?? new Set(['www.signedprice.com']),
    serviceKey: options.serviceKey ?? 'server-only-test-key',
    createService() {
      serviceCreations += 1;
      return service;
    },
  });

  return {
    handler,
    counts: () => ({ serviceCreations, checks }),
  };
}

async function expectNoStore(response: Response): Promise<void> {
  expect(response.headers.get('Cache-Control')).toBe(NO_STORE);
  expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
}

describe('Seoul Rent Check GET handler', () => {
  test('returns the service success envelope with a validated cache status', async () => {
    const { handler, counts } = createHarness({ result: serviceResult(successEnvelope, 'hit') });

    const response = await handler(new Request(VALID_URL));

    expect(response.status).toBe(200);
    await expectNoStore(response);
    expect(response.headers.get('X-Signedprice-Cache')).toBe('hit');
    expect(await response.json()).toEqual(successEnvelope);
    expect(counts()).toEqual({ serviceCreations: 1, checks: 1 });
  });

  test('returns an insufficient official-evidence envelope as HTTP 200', async () => {
    const insufficient = {
      ...successEnvelope,
      status: 'insufficient',
      result: {
        ...successEnvelope.result,
        rating: 'insufficient',
        comparableCount: 0,
      },
      comparables: [],
    } satisfies SeoulRentCheckEnvelope;
    const { handler } = createHarness({ result: serviceResult(insufficient, 'miss') });

    const response = await handler(new Request(VALID_URL));

    expect(response.status).toBe(200);
    await expectNoStore(response);
    expect(response.headers.get('X-Signedprice-Cache')).toBe('miss');
    expect(await response.json()).toEqual(insufficient);
  });

  test.each([
    [
      'repeated query input',
      `${VALID_URL}&area=29`,
    ],
    [
      'invalid query input',
      VALID_URL.replace('area=28', 'area=0'),
    ],
  ])('returns 400 for %s before service creation', async (_case, url) => {
    const { handler, counts } = createHarness();

    const response = await handler(new Request(url));

    expect(response.status).toBe(400);
    await expectNoStore(response);
    expect(await response.json()).toMatchObject({
      status: 'error',
      error: { code: 'invalid_request', retryable: false, retryAfterSeconds: null },
    });
    expect(counts()).toEqual({ serviceCreations: 0, checks: 0 });
  });

  test.each([
    ['untrusted URL host', 'https://attacker.example' + new URL(VALID_URL).pathname + new URL(VALID_URL).search, {}],
    ['mismatched Origin', VALID_URL, { Origin: 'https://attacker.example' }],
    ['mismatched Referer', VALID_URL, { Referer: 'https://attacker.example/path' }],
    ['cross-site fetch metadata', VALID_URL, { 'Sec-Fetch-Site': 'cross-site' }],
  ])('returns 403 for %s before service creation', async (_case, url, headers) => {
    const { handler, counts } = createHarness();

    const response = await handler(new Request(url, { headers }));

    expect(response.status).toBe(403);
    await expectNoStore(response);
    expect(await response.json()).toMatchObject({
      status: 'error',
      error: { code: 'untrusted_request', retryable: false, retryAfterSeconds: null },
    });
    expect(counts()).toEqual({ serviceCreations: 0, checks: 0 });
  });

  test('allows only the exact Preview and Production hosts supplied by Vercel', async () => {
    const allowedHosts = createAllowedRentCheckHosts({
      VERCEL_PROJECT_PRODUCTION_URL: 'signedprice-production.vercel.app',
      VERCEL_URL: 'signedprice-git-feature-owner.vercel.app',
    });
    expect([...allowedHosts].sort()).toEqual([
      'signedprice-git-feature-owner.vercel.app',
      'signedprice-production.vercel.app',
      'signedprice.com',
      'www.signedprice.com',
    ]);
    const { handler, counts } = createHarness({ allowedHosts });

    const previewResponse = await handler(
      new Request(VALID_URL.replace('www.signedprice.com', 'signedprice-git-feature-owner.vercel.app')),
    );
    const productionResponse = await handler(
      new Request(VALID_URL.replace('www.signedprice.com', 'signedprice-production.vercel.app')),
    );
    const neighborResponse = await handler(
      new Request(VALID_URL.replace('www.signedprice.com', 'other-preview.vercel.app')),
    );
    const localhostResponse = await handler(
      new Request(VALID_URL.replace('https://www.signedprice.com', 'http://localhost:3100')),
    );

    expect(previewResponse.status).toBe(200);
    expect(productionResponse.status).toBe(200);
    expect(neighborResponse.status).toBe(403);
    expect(localhostResponse.status).toBe(403);
    expect(counts()).toEqual({ serviceCreations: 2, checks: 2 });
  });

  test('returns 503 for a missing key before creating the service', async () => {
    const { handler, counts } = createHarness({ serviceKey: '' });

    const response = await handler(new Request(VALID_URL));

    expect(response.status).toBe(503);
    await expectNoStore(response);
    expect(await response.json()).toMatchObject({
      status: 'error',
      error: { code: 'configuration_missing', retryable: false, retryAfterSeconds: null },
    });
    expect(counts()).toEqual({ serviceCreations: 0, checks: 0 });
  });

  test.each([
    ['internal_error', 500],
    ['source_malformed', 502],
    ['source_timeout', 503],
    ['rights_blocked', 503],
    ['source_unavailable', 503],
  ] satisfies readonly (readonly [SeoulRentCheckErrorCode, number])[])(
    'maps %s to HTTP %s without serializing implementation details',
    async (code, status) => {
      const { handler } = createHarness({ error: new KoreaRentServiceError(code) });

      const response = await handler(new Request(VALID_URL));
      const body = await response.text();

      expect(response.status).toBe(status);
      await expectNoStore(response);
      expect(JSON.parse(body)).toMatchObject({ status: 'error', error: { code } });
      expect(body).not.toContain('server-only-test-key');
      expect(body).not.toContain('apis.data.go.kr');
    },
  );

  test('normalizes an unknown internal exception and an invalid cache status', async () => {
    const secret = 'raw-internal-secret';
    const thrown = createHarness({ error: new Error(secret) });
    const poisoned = createHarness({
      result: {
        envelope: successEnvelope,
        cacheStatus: 'poisoned',
      } as unknown as KoreaRentCheckServiceResult,
    });

    for (const handler of [thrown.handler, poisoned.handler]) {
      const response = await handler(new Request(VALID_URL));
      const body = await response.text();

      expect(response.status).toBe(500);
      await expectNoStore(response);
      expect(response.headers.has('X-Signedprice-Cache')).toBe(false);
      expect(JSON.parse(body)).toMatchObject({
        status: 'error',
        error: { code: 'internal_error', retryable: false, retryAfterSeconds: null },
      });
      expect(body).not.toContain(secret);
    }
  });
});

describe('explicit unsupported-method handler', () => {
  test.each(['OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'])(
    'returns a typed 405 response for %s',
    async (method) => {
      const response = await methodNotAllowed(new Request(VALID_URL, { method }));

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
      await expectNoStore(response);
      expect(await response.json()).toMatchObject({
        status: 'error',
        error: { code: 'invalid_request', retryable: false, retryAfterSeconds: null },
      });
    },
  );

  test('returns a bodyless 405 response for HEAD', async () => {
    const response = await methodNotAllowed(new Request(VALID_URL, { method: 'HEAD' }));

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
    await expectNoStore(response);
    expect(await response.text()).toBe('');
  });
});
