import type { RightsPolicy } from '@signedprice/market-core';

import { buildKoreaRentCheckResult, completedSeoulMonthKeys } from './calculation';
import {
  DERIVED_FRESH_SECONDS,
  DERIVED_STALE_SECONDS,
  SOURCE_CACHE_TTL_SECONDS,
  derivedCacheKey,
  readDerivedCache,
  readSourceMonthCache,
  sourceCacheNamespace,
  writeDerivedCache,
  writeSourceMonthCache,
  type DerivedRentCheckCacheEntry,
  type DerivedRentCheckCachePayload,
  type RuntimeCachePort,
} from './cache';
import type {
  RentCheckQuote,
  SeoulRentCheckEnvelope,
  SeoulRentCheckErrorCode,
} from './input';
import {
  KR_MOLIT_RENT_RIGHTS,
  RightsViolationError,
  assertMolitRights,
  type MolitRightsLookup,
  type MolitRightsOperation,
} from './rights';
import {
  MOLIT_DEFAULT_PAGE_SIZE,
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RENT_ENDPOINTS,
  MolitSourceError,
  fetchMolitRentalMonth,
  type MolitFetch,
  type MolitRentalMonth,
  type ProviderCallBudget,
} from './xml';
import {
  DERIVED_RENT_CHECK_CACHE_KIND,
  MOLIT_RIGHTS_POLICY_ID,
  RENT_CHECK_COVERAGE_NAMESPACE_VERSION,
  RENT_CHECK_METHODOLOGY_POLICY_ID,
  RENT_CHECK_METHODOLOGY_VERSION,
} from './versions';
const TOTAL_DEADLINE_MS = 55_000;
const MAX_PROVIDER_CALLS = 48;
const MAX_CONCURRENCY = 3;

const IN_FLIGHT_SOURCE_MONTHS = new Map<string, Promise<MolitRentalMonth>>();

const CACHE_HIT_OPERATIONS = [
  'fetch',
  'cache',
  'derive',
  'display',
  'commercial',
] as const satisfies readonly MolitRightsOperation[];

const STORAGE_OPERATIONS = [
  'fetch',
  'store',
  'cache',
  'derive',
  'display',
  'commercial',
] as const satisfies readonly MolitRightsOperation[];

export type KoreaRentCheckCacheStatus = 'hit' | 'miss' | 'stale';

export type KoreaRentCheckServiceResult = {
  readonly envelope: SeoulRentCheckEnvelope;
  readonly cacheStatus: KoreaRentCheckCacheStatus;
};

export class KoreaRentServiceError extends Error {
  readonly retryable: boolean;

  constructor(readonly code: SeoulRentCheckErrorCode) {
    const details = {
      invalid_request: ['The rent quote is invalid.', false],
      untrusted_request: ['The request source is not permitted.', false],
      rate_limited: ['Too many requests were made.', true],
      configuration_missing: ['Official rental data is not configured.', false],
      rights_blocked: ['Official rental data use is not permitted.', false],
      source_timeout: ['The official rental source timed out.', true],
      source_malformed: ['The official rental source returned an invalid response.', true],
      source_unavailable: ['The official rental source is unavailable.', true],
      internal_error: ['Rent Check is unavailable.', false],
    } as const;
    super(details[code][0]);
    this.name = 'KoreaRentServiceError';
    this.retryable = details[code][1];
  }
}

export type SeoulRentCheckServiceDependencies = {
  readonly serviceKey?: string;
  readonly cache: RuntimeCachePort;
  readonly fetch: MolitFetch;
  readonly now: () => Date;
  readonly rightsLookup?: MolitRightsLookup;
  readonly createDeadlineSignal?: (timeoutMs: number) => AbortSignal;
  readonly createAttemptSignal?: (timeoutMs: number, deadlineSignal: AbortSignal) => AbortSignal;
  readonly createProviderBudget?: (limit: number) => ProviderCallBudget;
};

export type SeoulRentCheckService = {
  check(quote: RentCheckQuote): Promise<KoreaRentCheckServiceResult>;
};

function validInstant(referenceInstant: string | Date): Date {
  const instant = referenceInstant instanceof Date
    ? new Date(referenceInstant.getTime())
    : new Date(referenceInstant);
  if (!Number.isFinite(instant.getTime())) throw new TypeError('Reference instant must be valid.');
  return instant;
}

export function deriveCoverageNamespace(referenceInstant: string | Date): string {
  const through = completedSeoulMonthKeys(validInstant(referenceInstant), 1)[0]!;
  return `${RENT_CHECK_COVERAGE_NAMESPACE_VERSION}:through=${through}:months=12`;
}

function defaultRightsLookup(policyId: string): RightsPolicy | undefined {
  return policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined;
}

function defaultDeadlineSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function defaultProviderBudget(limit: number): ProviderCallBudget {
  let used = 0;
  return {
    consume() {
      if (used >= limit) throw new MolitSourceError('source_unavailable');
      used += 1;
    },
  };
}

function currentPolicy(
  lookup: MolitRightsLookup,
  operations: readonly MolitRightsOperation[],
  bounds: { readonly cacheTtlSeconds?: number; readonly retentionSeconds?: number } = {},
): RightsPolicy {
  return assertMolitRights({
    lookup,
    policyId: KR_MOLIT_RENT_RIGHTS.id,
    operations,
    ...bounds,
  });
}

function validateQuote(quote: RentCheckQuote, referenceInstant: Date): void {
  buildKoreaRentCheckResult([], quote, referenceInstant);
}

function normalizeError(error: unknown): KoreaRentServiceError {
  if (error instanceof KoreaRentServiceError) return error;
  if (error instanceof RightsViolationError) return new KoreaRentServiceError('rights_blocked');
  if (error instanceof MolitSourceError) return new KoreaRentServiceError(error.code);
  if (error instanceof TypeError) return new KoreaRentServiceError('invalid_request');
  return new KoreaRentServiceError('internal_error');
}

function isSourceFailure(error: KoreaRentServiceError): boolean {
  return (
    error.code === 'source_timeout' ||
    error.code === 'source_malformed' ||
    error.code === 'source_unavailable'
  );
}

function iso(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new KoreaRentServiceError('internal_error');
  return date.toISOString();
}

function dealYmd(month: string): string {
  return month.replace('-', '');
}

function waitForSourceWork(
  operation: Promise<MolitRentalMonth>,
  deadlineSignal: AbortSignal,
): Promise<MolitRentalMonth> {
  if (deadlineSignal.aborted) return Promise.reject(new MolitSourceError('source_timeout'));
  return new Promise<MolitRentalMonth>((resolve, reject) => {
    const abort = () => {
      deadlineSignal.removeEventListener('abort', abort);
      reject(new MolitSourceError('source_timeout'));
    };
    deadlineSignal.addEventListener('abort', abort, { once: true });
    operation.then(
      (month) => {
        deadlineSignal.removeEventListener('abort', abort);
        resolve(month);
      },
      (error: unknown) => {
        deadlineSignal.removeEventListener('abort', abort);
        reject(error);
      },
    );
  });
}

function coalesceSourceWork(
  namespace: string,
  loader: () => Promise<MolitRentalMonth>,
): Promise<MolitRentalMonth> {
  const existing = IN_FLIGHT_SOURCE_MONTHS.get(namespace);
  if (existing !== undefined) return existing;

  const pending = Promise.resolve().then(loader);
  IN_FLIGHT_SOURCE_MONTHS.set(namespace, pending);
  const cleanup = () => {
    if (IN_FLIGHT_SOURCE_MONTHS.get(namespace) === pending) {
      IN_FLIGHT_SOURCE_MONTHS.delete(namespace);
    }
  };
  void pending.finally(cleanup).catch(() => undefined);
  return pending;
}

function typeMapping(quote: RentCheckQuote): SeoulRentCheckEnvelope['typeMapping'] {
  return quote.requestedHousingType === 'studio'
    ? {
        applied: true,
        explanation: 'Studio is compared with detached/multi-unit source records.',
      }
    : { applied: false, explanation: null };
}

function limitations(quote: RentCheckQuote): readonly string[] {
  return Object.freeze([
    'Official reported contracts use contract dates and are not current asking listings.',
    'Records may later be corrected or cancelled; status coverage is incomplete.',
    'This result is a market reference, not an appraisal or legal advice.',
    '5.0%/year signedprice comparison assumption.',
    'Floor, condition, furnishings, maintenance fees, view, renovation, exact brokerage fees, and deposit-return risk require separate verification.',
    ...(quote.requestedHousingType === 'studio'
      ? ['MOLIT classifies the studio alias under detached and multi-unit source records.']
      : []),
  ]);
}

function envelopeFromMonths(
  quote: RentCheckQuote,
  referenceInstant: Date,
  months: readonly string[],
  sourceMonths: readonly MolitRentalMonth[],
  responseGeneratedAt: string,
  policy: RightsPolicy,
): SeoulRentCheckEnvelope {
  const records = sourceMonths.flatMap((month) => month.records);
  const calculated = buildKoreaRentCheckResult(records, quote, referenceInstant);
  const {
    comparables,
    policyId,
    policyVersion,
    annualDepositRate,
    contractSelection,
    eligibleContractTypeCounts,
    selectedContractTypeCounts,
    sourceRecordStatusCounts,
    selectedLatestContractMonth,
    ...result
  } = calculated;
  const usedSourceMonths = sourceMonths.slice(0, calculated.monthsUsed);
  const retrievalInstants = usedSourceMonths.map((month) => month.retrievedAt).sort();
  if (retrievalInstants.length !== calculated.monthsUsed) {
    throw new KoreaRentServiceError('internal_error');
  }
  const envelope: SeoulRentCheckEnvelope = {
    marketId: 'kr-seoul',
    status: calculated.rating === 'insufficient' ? 'insufficient' : 'success',
    requestedHousingType: quote.requestedHousingType,
    sourceHousingType: quote.sourceHousingType,
    typeMapping: typeMapping(quote),
    source: {
      provider: 'MOLIT',
      dataset: MOLIT_RENT_ENDPOINTS[quote.sourceHousingType].dataset,
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: policy.id,
      attribution: policy.attribution,
    },
    coverage: {
      basis: 'contract_date',
      timezone: 'Asia/Seoul',
      coverageThroughMonth: months[0]!,
      latestContractMonth: selectedLatestContractMonth,
      sourceRetrievedAt: {
        earliest: retrievalInstants[0]!,
        latest: retrievalInstants.at(-1)!,
      },
      responseGeneratedAt,
      monthsUsed: calculated.monthsUsed,
    },
    methodology: {
      policyId,
      version: policyVersion,
      annualDepositRate,
      verdictBasis: calculated.verdictBasis,
      contractSelection,
      eligibleContractTypeCounts,
      selectedContractTypeCounts,
      sourceRecordStatusCounts,
    },
    result,
    comparables,
    limitations: limitations(quote),
  };
  return Object.freeze(envelope);
}

async function loadMonthsWithConcurrency(
  months: readonly string[],
  loader: (month: string) => Promise<MolitRentalMonth>,
): Promise<readonly MolitRentalMonth[]> {
  const results: (MolitRentalMonth | undefined)[] = Array(months.length);
  let nextIndex = 0;
  let firstError: unknown;

  async function worker(): Promise<void> {
    while (firstError === undefined) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= months.length) return;
      try {
        results[index] = await loader(months[index]!);
      } catch (error) {
        firstError ??= error;
      }
    }
  }

  await Promise.all(Array.from({ length: MAX_CONCURRENCY }, () => worker()));
  if (firstError !== undefined) throw firstError;
  if (results.some((month) => month === undefined)) {
    throw new KoreaRentServiceError('source_unavailable');
  }
  return results as readonly MolitRentalMonth[];
}

export function createSeoulRentCheckService(
  dependencies: SeoulRentCheckServiceDependencies,
): SeoulRentCheckService {
  const lookup = dependencies.rightsLookup ?? defaultRightsLookup;

  return {
    async check(quote): Promise<KoreaRentCheckServiceResult> {
      if (dependencies.serviceKey === undefined || dependencies.serviceKey.length === 0) {
        throw new KoreaRentServiceError('configuration_missing');
      }

      let deadlineSignal: AbortSignal;
      try {
        deadlineSignal = (dependencies.createDeadlineSignal ?? defaultDeadlineSignal)(
          TOTAL_DEADLINE_MS,
        );
      } catch (error) {
        throw normalizeError(error);
      }

      let referenceInstant: Date;
      try {
        referenceInstant = validInstant(dependencies.now());
        validateQuote(quote, referenceInstant);
        currentPolicy(lookup, CACHE_HIT_OPERATIONS);
      } catch (error) {
        throw normalizeError(error);
      }

      const referenceMs = referenceInstant.getTime();
      const coverageNamespace = deriveCoverageNamespace(referenceInstant);
      const cacheKey = derivedCacheKey(quote, coverageNamespace);
      let cached: DerivedRentCheckCacheEntry | null;
      try {
        cached = await readDerivedCache(
          dependencies.cache,
          cacheKey,
          coverageNamespace,
          quote,
          deadlineSignal,
        );
      } catch (error) {
        throw normalizeError(error);
      }
      let staleCandidate: DerivedRentCheckCacheEntry | null = null;
      if (cached !== null) {
        try {
          currentPolicy(lookup, CACHE_HIT_OPERATIONS);
        } catch (error) {
          throw normalizeError(error);
        }
        if (referenceMs < Date.parse(cached.freshUntil)) {
          return { envelope: cached.envelope, cacheStatus: 'hit' };
        }
        if (referenceMs < Date.parse(cached.staleUntil)) staleCandidate = cached;
      }

      let revalidationCompleted = false;
      try {
        const months = completedSeoulMonthKeys(referenceInstant, 12);
        const budget = (dependencies.createProviderBudget ?? defaultProviderBudget)(
          MAX_PROVIDER_CALLS,
        );
        const sourceMonths = await loadMonthsWithConcurrency(months, async (month) => {
          currentPolicy(lookup, CACHE_HIT_OPERATIONS);
          const cacheInput = {
            sourceHousingType: quote.sourceHousingType,
            lawdCd: quote.lawdCd,
            dealYmd: dealYmd(month),
            pageSize: MOLIT_DEFAULT_PAGE_SIZE,
          } as const;
          const sourceHit = await readSourceMonthCache(
            dependencies.cache,
            cacheInput,
            deadlineSignal,
          );
          if (sourceHit !== null) {
            currentPolicy(lookup, CACHE_HIT_OPERATIONS);
            return sourceHit;
          }

          currentPolicy(lookup, STORAGE_OPERATIONS, {
            cacheTtlSeconds: SOURCE_CACHE_TTL_SECONDS,
            retentionSeconds: SOURCE_CACHE_TTL_SECONDS,
          });
          if (deadlineSignal.aborted) throw new MolitSourceError('source_timeout');
          const namespace = sourceCacheNamespace(cacheInput);
          const fetched = await waitForSourceWork(
            coalesceSourceWork(namespace, async () => {
              currentPolicy(lookup, STORAGE_OPERATIONS, {
                cacheTtlSeconds: SOURCE_CACHE_TTL_SECONDS,
                retentionSeconds: SOURCE_CACHE_TTL_SECONDS,
              });
              const loaded = await fetchMolitRentalMonth(
                {
                  serviceKey: dependencies.serviceKey!,
                  ...cacheInput,
                },
                {
                  fetch: dependencies.fetch,
                  budget,
                  deadlineSignal,
                  ...(dependencies.createAttemptSignal === undefined
                    ? {}
                    : { attemptSignal: dependencies.createAttemptSignal }),
                  now: dependencies.now,
                },
              );
              currentPolicy(lookup, STORAGE_OPERATIONS, {
                cacheTtlSeconds: SOURCE_CACHE_TTL_SECONDS,
                retentionSeconds: SOURCE_CACHE_TTL_SECONDS,
              });
              await writeSourceMonthCache(
                dependencies.cache,
                loaded,
                () => {
                  currentPolicy(lookup, STORAGE_OPERATIONS, {
                    cacheTtlSeconds: SOURCE_CACHE_TTL_SECONDS,
                    retentionSeconds: SOURCE_CACHE_TTL_SECONDS,
                  });
                },
                deadlineSignal,
              );
              return loaded;
            }),
            deadlineSignal,
          );
          currentPolicy(lookup, CACHE_HIT_OPERATIONS);
          return fetched;
        });
        revalidationCompleted = true;
        const policy = currentPolicy(lookup, CACHE_HIT_OPERATIONS);
        const responseGeneratedAt = iso(dependencies.now());
        const envelope = envelopeFromMonths(
          quote,
          referenceInstant,
          months,
          sourceMonths,
          responseGeneratedAt,
          policy,
        );
        const generatedMs = Date.parse(responseGeneratedAt);
        const entry: DerivedRentCheckCachePayload = Object.freeze({
          kind: DERIVED_RENT_CHECK_CACHE_KIND,
          parserVersion: MOLIT_PARSER_VERSION,
          methodologyPolicyId: RENT_CHECK_METHODOLOGY_POLICY_ID,
          methodologyVersion: RENT_CHECK_METHODOLOGY_VERSION,
          rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
          coverageNamespace,
          canonicalQuote: Object.freeze({ ...quote }),
          freshUntil: new Date(generatedMs + DERIVED_FRESH_SECONDS * 1_000).toISOString(),
          staleUntil: new Date(generatedMs + DERIVED_STALE_SECONDS * 1_000).toISOString(),
          envelope,
        });
        currentPolicy(lookup, CACHE_HIT_OPERATIONS, {
          cacheTtlSeconds: DERIVED_STALE_SECONDS,
        });
        await writeDerivedCache(dependencies.cache, cacheKey, entry, deadlineSignal);
        currentPolicy(lookup, CACHE_HIT_OPERATIONS);
        return { envelope, cacheStatus: 'miss' };
      } catch (error) {
        const normalized = normalizeError(error);
        if (staleCandidate !== null && !revalidationCompleted && isSourceFailure(normalized)) {
          try {
            currentPolicy(lookup, CACHE_HIT_OPERATIONS);
          } catch (rightsError) {
            throw normalizeError(rightsError);
          }
          return { envelope: staleCandidate.envelope, cacheStatus: 'stale' };
        }
        throw normalized;
      }
    },
  };
}
