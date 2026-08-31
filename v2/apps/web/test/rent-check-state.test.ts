import { describe, expect, it, vi } from 'vitest';

import type {
  SeoulRentCheckEnvelope,
  SeoulRentCheckErrorEnvelope,
} from '@signedprice/korea-rent';
import {
  abortOwnedRentCheckRequest,
  areaDisplayValue,
  clearRentCheckErrorsForAction,
  createInitialRentCheckState,
  focusFirstRentCheckError,
  isQuoteMutatingRentCheckAction,
  rentCheckReducer,
  requestRentCheck,
  validateRentCheckInput,
  type RentCheckInput,
} from '../lib/rent-check/client-state';

const draft: RentCheckInput = {
  lawdCd: '11590',
  housingType: 'officetel',
  areaSqm: '28',
  areaUnit: 'sqm',
  depositWon: '10000000',
  monthlyRentWon: '900000',
};

const envelope = {
  marketId: 'kr-seoul',
  status: 'success',
  requestedHousingType: 'officetel',
  sourceHousingType: 'officetel',
  typeMapping: { applied: false, explanation: null },
  source: {
    provider: 'MOLIT',
    dataset: 'Officetel rental contracts',
    endpointVersion: 'v1',
    parserVersion: 'kr-molit-rent-parser-v2',
    rightsPolicyId: 'kr-molit-rent-v1',
    attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
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
    eligibleContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 5, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 5, cancelled: 0, unknown: 0 },
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
      buildingLabel: 'Sample building 1', areaSqm: 28, depositWon: 10_000_000,
      monthlyRentWon: 900_000, contractDate: '2026-07-15', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Sample building 2', areaSqm: 27, depositWon: 9_000_000,
      monthlyRentWon: 850_000, contractDate: '2026-07-14', contractType: 'new',
      recordStatus: 'active',
    },
    {
      areaSqm: 29, depositWon: 11_000_000, monthlyRentWon: 910_000,
      contractDate: '2026-07-13', contractType: 'new', recordStatus: 'active',
    },
    {
      buildingLabel: 'Sample building 4', areaSqm: 28, depositWon: 10_000_000,
      monthlyRentWon: 950_000, contractDate: '2026-07-12', contractType: 'new',
      recordStatus: 'active',
    },
    {
      buildingLabel: 'Sample building 5', areaSqm: 30, depositWon: 12_000_000,
      monthlyRentWon: 1_000_000, contractDate: '2026-07-11', contractType: 'new',
      recordStatus: 'active',
    },
  ],
  limitations: [
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
  ],
} satisfies SeoulRentCheckEnvelope;

const medianFallbackAboveDraft: RentCheckInput = {
  ...draft,
  monthlyRentWon: '1100200',
};

const medianFallbackAboveEnvelope = {
  ...envelope,
  coverage: { ...envelope.coverage, monthsUsed: 12 },
  methodology: {
    ...envelope.methodology,
    verdictBasis: 'median-fallback',
    eligibleContractTypeCounts: { new: 3, renewal: 0, unknown: 0 },
    selectedContractTypeCounts: { new: 3, renewal: 0, unknown: 0 },
    sourceRecordStatusCounts: { active: 3, cancelled: 0, unknown: 0 },
  },
  result: {
    ...envelope.result,
    rating: 'above',
    askingValueWon: 1_100_200,
    medianValueWon: 1_000_000,
    minValueWon: null,
    p25ValueWon: null,
    p75ValueWon: null,
    maxValueWon: null,
    differencePct: 10,
    percentileRank: null,
    verdictBasis: 'median-fallback',
    confidence: 'low',
    comparableCount: 3,
    monthsUsed: 12,
    tier: 3,
  },
  comparables: envelope.comparables.slice(0, 3),
} satisfies SeoulRentCheckEnvelope;

const medianFallbackBelowDraft: RentCheckInput = {
  ...draft,
  monthlyRentWon: '899800',
};

const medianFallbackBelowEnvelope = {
  ...medianFallbackAboveEnvelope,
  result: {
    ...medianFallbackAboveEnvelope.result,
    rating: 'below',
    askingValueWon: 899_800,
    differencePct: -10,
  },
} satisfies SeoulRentCheckEnvelope;

function insufficientEnvelopeWithCount(
  comparableCount: 0 | 1 | 2,
  latestContractMonth: string | null,
): SeoulRentCheckEnvelope {
  return {
    ...envelope,
    status: 'insufficient',
    coverage: {
      ...envelope.coverage,
      latestContractMonth,
      monthsUsed: 12,
    },
    methodology: {
      ...envelope.methodology,
      verdictBasis: null,
      contractSelection: comparableCount === 0 ? null : 'mixed',
      eligibleContractTypeCounts: { new: comparableCount, renewal: 0, unknown: 0 },
      selectedContractTypeCounts: { new: comparableCount, renewal: 0, unknown: 0 },
      sourceRecordStatusCounts: { active: comparableCount, cancelled: 0, unknown: 0 },
    },
    result: {
      ...envelope.result,
      rating: 'insufficient',
      comparableCount,
      medianValueWon: null,
      minValueWon: null,
      p25ValueWon: null,
      p75ValueWon: null,
      maxValueWon: null,
      differencePct: null,
      percentileRank: null,
      verdictBasis: null,
      confidence: null,
      monthsUsed: 12,
      tier: null,
    },
    comparables: [],
  };
}

describe('rent check reducer', () => {
  it('creates an idle state with separate draft and checked values', () => {
    expect(createInitialRentCheckState(draft)).toEqual({
      status: 'idle',
      draftInput: draft,
      areaDisplay: '28',
      checkedInput: null,
      requestId: 0,
      abortController: null,
      envelope: null,
      cacheStatus: null,
      error: null,
    });
  });

  it('moves to loading with a monotonically increasing request ID and checked snapshot', () => {
    const controller = new AbortController();
    const state = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT',
      requestId: 1,
      controller,
    });

    expect(state).toEqual({
      status: 'loading',
      draftInput: draft,
      areaDisplay: '28',
      checkedInput: draft,
      requestId: 1,
      abortController: controller,
      envelope: null,
      cacheStatus: null,
      error: null,
    });
    expect(rentCheckReducer(state, {
      type: 'SUBMIT', requestId: 1, controller: new AbortController(),
    })).toBe(state);
  });

  it('aborts the owned request when a newer submission begins', () => {
    const firstController = new AbortController();
    const first = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller: firstController,
    });
    const secondController = new AbortController();
    abortOwnedRentCheckRequest(first);
    const second = rentCheckReducer(first, {
      type: 'SUBMIT', requestId: 2, controller: secondController,
    });

    expect(firstController.signal.aborted).toBe(true);
    expect(secondController.signal.aborted).toBe(false);
    expect(second.requestId).toBe(2);
    expect(second.abortController).toBe(secondController);
  });

  it('keeps the reducer pure while an explicit edit preparation aborts its owned request', () => {
    const controller = new AbortController();
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller,
    });

    abortOwnedRentCheckRequest(loading);
    const edited = rentCheckReducer(loading, {
      type: 'EDIT', field: 'monthlyRentWon', value: '910000',
    });

    expect(controller.signal.aborted).toBe(true);
    expect(edited.status).toBe('idle');
  });

  it('ignores late success and error actions from an older request', () => {
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 2, controller: new AbortController(),
    });
    const staleSuccess = rentCheckReducer(loading, {
      type: 'RESOLVE', requestId: 1, response: { envelope, cacheStatus: 'miss' },
    });
    const staleError = rentCheckReducer(loading, {
      type: 'REJECT',
      requestId: 1,
      error: {
        code: 'source_timeout', message: 'Timed out.', retryable: true,
        retryAfterSeconds: null,
      },
    });

    expect(staleSuccess).toBe(loading);
    expect(staleError).toBe(loading);
  });

  it.each(['hit', 'miss', 'stale'] as const)(
    'stores the validated %s cache provenance on success',
    (cacheStatus) => {
      const loading = rentCheckReducer(createInitialRentCheckState(draft), {
        type: 'SUBMIT', requestId: 1, controller: new AbortController(),
      });
      const success = rentCheckReducer(loading, {
        type: 'RESOLVE', requestId: 1, response: { envelope, cacheStatus },
      });

      expect(success.status).toBe('success');
      expect(success.envelope).toBe(envelope);
      expect(success.cacheStatus).toBe(cacheStatus);
      expect(success.checkedInput).toEqual(draft);
      expect(success.abortController).toBeNull();
    },
  );

  it('uses insufficient as a completed official-data state', () => {
    const insufficientEnvelope = {
      ...envelope,
      status: 'insufficient',
      result: {
        ...envelope.result,
        rating: 'insufficient',
        medianValueWon: null,
        minValueWon: null,
        p25ValueWon: null,
        p75ValueWon: null,
        maxValueWon: null,
        differencePct: null,
        percentileRank: null,
        verdictBasis: null,
        confidence: null,
        comparableCount: 0,
        tier: null,
      },
      comparables: [],
    } satisfies SeoulRentCheckEnvelope;
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller: new AbortController(),
    });

    expect(rentCheckReducer(loading, {
      type: 'RESOLVE',
      requestId: 1,
      response: { envelope: insufficientEnvelope, cacheStatus: 'hit' },
    }).status).toBe('insufficient');
  });

  it('editing a checked field clears the completed verdict and cache status', () => {
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller: new AbortController(),
    });
    const success = rentCheckReducer(loading, {
      type: 'RESOLVE', requestId: 1, response: { envelope, cacheStatus: 'stale' },
    });
    const edited = rentCheckReducer(success, {
      type: 'EDIT', field: 'monthlyRentWon', value: '950000',
    });

    expect(edited).toEqual({
      status: 'idle',
      draftInput: { ...draft, monthlyRentWon: '950000' },
      areaDisplay: '28',
      checkedInput: null,
      requestId: 1,
      abortController: null,
      envelope: null,
      cacheStatus: null,
      error: null,
    });
  });

  it('keeps an in-flight request and checked snapshot when only the display unit changes', () => {
    const controller = new AbortController();
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller,
    });
    const toggled = rentCheckReducer(loading, { type: 'SET_AREA_UNIT', unit: 'pyeong' });

    expect(toggled.status).toBe('loading');
    expect(toggled.abortController).toBe(controller);
    expect(controller.signal.aborted).toBe(false);
    expect(toggled.checkedInput).toEqual({ ...draft, areaUnit: 'pyeong' });
  });

  it('keeps a completed verdict and cache provenance when only the display unit changes', () => {
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 1, controller: new AbortController(),
    });
    const success = rentCheckReducer(loading, {
      type: 'RESOLVE', requestId: 1, response: { envelope, cacheStatus: 'stale' },
    });
    const toggled = rentCheckReducer(success, { type: 'SET_AREA_UNIT', unit: 'pyeong' });

    expect(toggled.status).toBe('success');
    expect(toggled.envelope).toBe(envelope);
    expect(toggled.cacheStatus).toBe('stale');
    expect(toggled.checkedInput).toEqual({ ...draft, areaUnit: 'pyeong' });
  });

  it('classifies only quote-changing form actions as request-invalidating', () => {
    expect(isQuoteMutatingRentCheckAction({ type: 'SET_AREA_UNIT', unit: 'pyeong' })).toBe(false);
    expect(isQuoteMutatingRentCheckAction({
      type: 'EDIT_AREA', value: '30', unit: 'sqm',
    })).toBe(true);
    expect(isQuoteMutatingRentCheckAction({
      type: 'EDIT', field: 'monthlyRentWon', value: '1',
    })).toBe(true);
  });

  it.each([
    ['source_timeout', true],
    ['rights_blocked', false],
  ] as const)('keeps the draft but clears verdict state for %s', (code, retryable) => {
    const loading = rentCheckReducer(createInitialRentCheckState(draft), {
      type: 'SUBMIT', requestId: 3, controller: new AbortController(),
    });
    const error = rentCheckReducer(loading, {
      type: 'REJECT',
      requestId: 3,
      error: { code, message: 'Unavailable.', retryable, retryAfterSeconds: null },
    });

    expect(error.status).toBe('error');
    expect(error.draftInput).toEqual(draft);
    expect(error.checkedInput).toBeNull();
    expect(error.envelope).toBeNull();
    expect(error.cacheStatus).toBeNull();
    expect(error.error).toEqual({
      code, message: 'Unavailable.', retryable, retryAfterSeconds: null,
    });
  });
});

describe('rent check client request boundary', () => {
  it.each([
    [0, null],
    [1, '2026-07'],
    [2, '2026-06'],
  ] as const)(
    'accepts an insufficient %i-record envelope with private latest-month provenance',
    async (comparableCount, latestContractMonth) => {
      const body = insufficientEnvelopeWithCount(comparableCount, latestContractMonth);
      const fetcher = vi.fn(async () => Response.json(body, {
        status: 200,
        headers: { 'X-Signedprice-Cache': 'hit' },
      }));

      await expect(requestRentCheck(draft, { fetch: fetcher })).resolves.toEqual({
        envelope: body,
        cacheStatus: 'hit',
      });
    },
  );

  it.each(['hit', 'miss', 'stale'] as const)(
    'returns a typed success with %s provenance',
    async (cacheStatus) => {
      const fetcher = vi.fn(async () => Response.json(envelope, {
        status: 200,
        headers: { 'X-Signedprice-Cache': cacheStatus },
      }));

      await expect(requestRentCheck(draft, { fetch: fetcher })).resolves.toEqual({
        envelope,
        cacheStatus,
      });
      expect(fetcher).toHaveBeenCalledWith(
        '/api/markets/kr-seoul/rent-check/?lawdCd=11590&type=officetel&deposit=10000000&rent=900000&area=28',
        expect.objectContaining({ method: 'GET' }),
      );
    },
  );

  it.each([null, '', 'poisoned'])(
    'rejects a 200 response with invalid cache header %s',
    async (cacheStatus) => {
      const fetcher = vi.fn(async () => Response.json(envelope, {
        status: 200,
        headers: cacheStatus === null ? {} : { 'X-Signedprice-Cache': cacheStatus },
      }));

      await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
        code: 'source_unavailable',
        retryable: true,
      });
    },
  );

  it('rejects a malformed success body before it can enter state', async () => {
    const fetcher = vi.fn(async () => Response.json(
      { ...envelope, marketId: 'raw-html-market' },
      { status: 200, headers: { 'X-Signedprice-Cache': 'hit' } },
    ));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it.each([
    {
      ...envelope,
      coverage: { ...envelope.coverage, monthsUsed: '3' },
    },
    {
      ...envelope,
      result: { ...envelope.result, monthsUsed: 4 },
    },
    {
      ...envelope,
      result: { ...envelope.result, tier: 4 },
    },
  ])('rejects malformed numeric enum provenance %#', async (body) => {
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it('accepts a public comparable that omits its optional building label', async () => {
    const fetcher = vi.fn(async () => Response.json(envelope, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).resolves.toEqual({
      envelope,
      cacheStatus: 'hit',
    });
  });

  it.each([
    ['above boundary', medianFallbackAboveDraft, medianFallbackAboveEnvelope],
    ['below boundary', medianFallbackBelowDraft, medianFallbackBelowEnvelope],
  ] as const)('accepts a valid median-fallback %s tuple', async (_label, input, body) => {
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(input, { fetch: fetcher })).resolves.toEqual({
      envelope: body,
      cacheStatus: 'hit',
    });
  });

  it.each([
    ['above typical rating', { ...envelope, result: { ...envelope.result, rating: 'above' } }],
    ['below typical rating', { ...envelope, result: { ...envelope.result, rating: 'below' } }],
    ['fabricated difference', {
      ...envelope, result: { ...envelope.result, differencePct: 999 },
    }],
    ['missing typical percentile', {
      ...envelope, result: { ...envelope.result, percentileRank: null },
    }],
  ] as const)('rejects a 200 typical-range tuple with %s', async (_label, body) => {
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it.each([
    ['non-null percentile', medianFallbackAboveDraft, {
      ...medianFallbackAboveEnvelope,
      result: { ...medianFallbackAboveEnvelope.result, percentileRank: 50 },
    }],
    ['fair rating at +10 boundary', medianFallbackAboveDraft, {
      ...medianFallbackAboveEnvelope,
      result: { ...medianFallbackAboveEnvelope.result, rating: 'fair' },
    }],
    ['fair rating at -10 boundary', medianFallbackBelowDraft, {
      ...medianFallbackBelowEnvelope,
      result: { ...medianFallbackBelowEnvelope.result, rating: 'fair' },
    }],
  ] as const)('rejects a 200 median-fallback tuple with %s', async (_label, input, body) => {
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(input, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it.each([201, 206])('rejects HTTP %i even when the body looks successful', async (status) => {
    const fetcher = vi.fn(async () => Response.json(envelope, {
      status,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it.each([
    ['requested type', { ...envelope, requestedHousingType: 'studio' }],
    ['success rating', {
      ...envelope,
      result: { ...envelope.result, rating: 'insufficient' },
    }],
    ['result months', {
      ...envelope,
      result: { ...envelope.result, monthsUsed: 6 },
    }],
    ['negative count', {
      ...envelope,
      methodology: {
        ...envelope.methodology,
        selectedContractTypeCounts: { new: -1, renewal: 0, unknown: 0 },
      },
    }],
    ['negative amount', {
      ...envelope,
      result: { ...envelope.result, askingValueWon: -1 },
    }],
    ['negative comparable area', {
      ...envelope,
      comparables: envelope.comparables.map((row, index) => index === 0
        ? { ...row, areaSqm: -28 }
        : row),
    }],
  ] as const)('rejects a 200 envelope with contradictory %s', async (_label, body) => {
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it('rejects a contradictory studio source mapping', async () => {
    const studioDraft = { ...draft, housingType: 'studio' as const };
    const body = {
      ...envelope,
      requestedHousingType: 'studio',
      sourceHousingType: 'detached',
      typeMapping: { applied: false, explanation: null },
      source: { ...envelope.source, dataset: 'Detached and multi-unit rental contracts' },
      limitations: [
        ...envelope.limitations,
        'MOLIT classifies the studio alias under detached and multi-unit source records.',
      ],
    } satisfies SeoulRentCheckEnvelope;
    const fetcher = vi.fn(async () => Response.json(body, {
      status: 200,
      headers: { 'X-Signedprice-Cache': 'hit' },
    }));

    await expect(requestRentCheck(studioDraft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable', retryable: true,
    });
  });

  it.each([
    ['120', 120],
    ['invalid', 60],
    [null, 60],
  ] as const)('handles a platform 429 before JSON using Retry-After %s', async (header, seconds) => {
    const fetcher = vi.fn(async () => new Response('<html>rate limited</html>', {
      status: 429,
      headers: header === null ? {} : { 'Retry-After': header },
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'rate_limited',
      retryable: true,
      retryAfterSeconds: seconds,
    });
  });

  it('preserves a valid typed non-2xx error envelope', async () => {
    const typedError = {
      status: 'error',
      error: {
        code: 'rights_blocked',
        message: 'Official rental data use is not permitted.',
        retryable: false,
        retryAfterSeconds: null,
      },
    } satisfies SeoulRentCheckErrorEnvelope;
    const fetcher = vi.fn(async () => Response.json(typedError, { status: 503 }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject(
      typedError.error,
    );
  });

  it.each([
    ['invalid_request', false, null],
    ['untrusted_request', false, null],
    ['configuration_missing', false, null],
    ['rights_blocked', false, null],
    ['internal_error', false, null],
    ['rate_limited', true, 60],
    ['source_timeout', true, null],
    ['source_malformed', true, null],
    ['source_unavailable', true, null],
  ] as const)(
    'accepts canonical retry metadata for %s',
    async (code, retryable, retryAfterSeconds) => {
      const body = {
        status: 'error',
        error: { code, message: 'Boundary message.', retryable, retryAfterSeconds },
      } satisfies SeoulRentCheckErrorEnvelope;
      const fetcher = vi.fn(async () => Response.json(body, { status: 503 }));

      await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject(body.error);
    },
  );

  it.each([
    ['retryable rights boundary', {
      status: 'error',
      error: {
        code: 'rights_blocked', message: 'Contradiction.', retryable: true,
        retryAfterSeconds: 30,
      },
    }],
    ['non-retry timeout', {
      status: 'error',
      error: {
        code: 'source_timeout', message: 'Contradiction.', retryable: false,
        retryAfterSeconds: null,
      },
    }],
    ['non-retry configuration with delay', {
      status: 'error',
      error: {
        code: 'configuration_missing', message: 'Contradiction.', retryable: false,
        retryAfterSeconds: 10,
      },
    }],
    ['non-retry rate limit', {
      status: 'error',
      error: {
        code: 'rate_limited', message: 'Contradiction.', retryable: false,
        retryAfterSeconds: null,
      },
    }],
  ] as const)('rejects typed error contradiction: %s', async (_label, body) => {
    const fetcher = vi.fn(async () => Response.json(body, { status: 503 }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable',
      message: 'Official rental evidence is unavailable. Try again later.',
      retryable: true,
      retryAfterSeconds: null,
    });
  });

  it('maps every other invalid non-2xx body to one generic unavailable error', async () => {
    const fetcher = vi.fn(async () => new Response('<html>bad gateway</html>', {
      status: 502,
    }));

    await expect(requestRentCheck(draft, { fetch: fetcher })).rejects.toMatchObject({
      code: 'source_unavailable',
      message: 'Official rental evidence is unavailable. Try again later.',
      retryable: true,
      retryAfterSeconds: null,
    });
  });
});

describe('pyeong display conversion', () => {
  it('preserves the real 8 to 8. to 8.5 editing sequence', () => {
    let state = createInitialRentCheckState({ ...draft, areaSqm: '' });
    state = rentCheckReducer(state, { type: 'EDIT_AREA', value: '8', unit: 'pyeong' });
    expect(areaDisplayValue(state)).toBe('8');
    expect(state.draftInput.areaSqm).toBe('26.45');

    state = rentCheckReducer(state, { type: 'EDIT_AREA', value: '8.', unit: 'pyeong' });
    expect(areaDisplayValue(state)).toBe('8.');
    expect(state.draftInput.areaSqm).toBe('26.45');

    state = rentCheckReducer(state, { type: 'EDIT_AREA', value: '8.5', unit: 'pyeong' });
    expect(areaDisplayValue(state)).toBe('8.5');
    expect(state.draftInput.areaSqm).toBe('28.1');
  });

  it('stores square metres once and derives repeated unit toggles without drift', () => {
    let state = createInitialRentCheckState({ ...draft, areaSqm: '' });
    state = rentCheckReducer(state, {
      type: 'EDIT_AREA', value: '20', unit: 'pyeong',
    });

    expect(state.draftInput.areaSqm).toBe('66.12');
    expect(areaDisplayValue(state)).toBe('20');

    for (let index = 0; index < 20; index += 1) {
      state = rentCheckReducer(state, { type: 'SET_AREA_UNIT', unit: 'sqm' });
      expect(areaDisplayValue(state)).toBe('66.12');
      state = rentCheckReducer(state, { type: 'SET_AREA_UNIT', unit: 'pyeong' });
      expect(areaDisplayValue(state)).toBe('20');
    }

    expect(state.draftInput.areaSqm).toBe('66.12');
  });

  it('discards an invalid intermediate display on a unit round trip without drifting sqm', () => {
    let state = createInitialRentCheckState({ ...draft, areaSqm: '28' });
    state = rentCheckReducer(state, { type: 'SET_AREA_UNIT', unit: 'pyeong' });
    state = rentCheckReducer(state, { type: 'EDIT_AREA', value: '8..', unit: 'pyeong' });
    expect(areaDisplayValue(state)).toBe('8..');
    expect(state.draftInput.areaSqm).toBe('28');

    state = rentCheckReducer(state, { type: 'SET_AREA_UNIT', unit: 'sqm' });
    state = rentCheckReducer(state, { type: 'SET_AREA_UNIT', unit: 'pyeong' });
    expect(state.draftInput.areaSqm).toBe('28');
    expect(areaDisplayValue(state)).toBe('8.47');
  });
});

describe('field-level input validation', () => {
  it('accepts one complete canonical quote', () => {
    expect(validateRentCheckInput(draft)).toEqual({});
  });

  it('returns literal field errors for invalid area and KRW bounds', () => {
    expect(validateRentCheckInput({
      ...draft,
      areaSqm: '2000.01',
      depositWon: '20000000001',
      monthlyRentWon: '100000001',
    })).toEqual({
      areaSqm: 'Enter an area greater than 0 and no more than 2,000 ㎡.',
      depositWon: 'Enter a whole-won deposit from 0 to 20,000,000,000.',
      monthlyRentWon: 'Enter whole-won monthly rent from 0 to 100,000,000.',
    });
  });

  it('names both monetary fields when deposit and rent are zero', () => {
    expect(validateRentCheckInput({
      ...draft, depositWon: '0', monthlyRentWon: '0',
    })).toEqual({
      depositWon: 'Deposit and monthly rent cannot both be zero.',
      monthlyRentWon: 'Deposit and monthly rent cannot both be zero.',
    });
  });

  it('validates the authored pyeong display instead of a stale canonical sqm value', () => {
    expect(validateRentCheckInput(draft, '8.')).toEqual({
      areaSqm: 'Enter an area greater than 0 and no more than 2,000 ㎡.',
    });
  });

  it('focuses the first authored field error in form order', () => {
    const focused: string[] = [];

    focusFirstRentCheckError(
      { depositWon: 'bad', areaSqm: 'bad' },
      {
        areaSqm: { focus: () => focused.push('areaSqm') },
        depositWon: { focus: () => focused.push('depositWon') },
        monthlyRentWon: { focus: () => focused.push('monthlyRentWon') },
      },
    );
    expect(focused).toEqual(['areaSqm']);
  });

  it('clears the related stale error for a valid size preset action', () => {
    expect(clearRentCheckErrorsForAction(
      { areaSqm: 'bad', depositWon: 'still bad' },
      { type: 'EDIT_AREA', value: '20', unit: 'sqm' },
    )).toEqual({ depositWon: 'still bad' });
  });
});
