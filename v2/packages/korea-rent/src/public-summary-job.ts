import type { PublicMarketSummary } from '@signedprice/market-core';

import { completedSeoulMonthKeys } from './calculation';
import { SEOUL_RENT_CHECK_DISTRICTS, type SeoulLawdCd } from './districts';
import type { KoreaRentRecord, SourceHousingType } from './input';
import { buildKoreaPublicMarketSummary } from './public-summary';
import {
  KR_MOLIT_RENT_RIGHTS,
  RightsViolationError,
  assertMolitRights,
  type MolitRightsLookup,
} from './rights';
import { createSourceMonthStore } from './source-month-store';
import type { RuntimeCachePort } from './cache';
import {
  MolitSourceError,
  fetchMolitRentalMonth,
  type MolitFetch,
  type ProviderCallBudget,
} from './xml';
import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
} from './versions';

const TOTAL_COORDINATES = 700 as const;
const PAGE_SIZE = 1_000 as const;
const DEFAULT_COORDINATE_LIMIT = 4;
const DEADLINE_MS = 50_000;
const JOB_TAG = 'kr-public-summary-job:v1';
const SOURCE_TYPES = [
  'apartment',
  'officetel',
  'villa',
  'detached',
] as const satisfies readonly SourceHousingType[];

const JOB_STORE = createSourceMonthStore({
  namespacePrefix: 'signedprice:kr-public-summary-job:v1',
  ttlSeconds: 86_400,
  tags: [JOB_TAG],
  corruptTag: JOB_TAG,
});

export type KoreaPublicSummaryCoordinate = Readonly<{
  index: number;
  lawdCd: SeoulLawdCd;
  sourceHousingType: SourceHousingType;
  dealYmd: string;
}>;

export type KoreaPublicSummaryBatchResult = Readonly<{
  status: 'progress' | 'retryable' | 'blocked';
  nextCursor: number;
  completedCoordinates: number;
  totalCoordinates: typeof TOTAL_COORDINATES;
  code?: 'source_timeout' | 'source_unavailable' | 'source_malformed' | 'rights_blocked';
}>;

export type KoreaPublicSummaryFinalization = Readonly<{
  summary: PublicMarketSummary;
  period: string;
  generatedAt: string;
  completedCoordinates: typeof TOTAL_COORDINATES;
  eligibleRecords: number;
  activeRecords: number;
  unknownStatusRecords: number;
  newContracts: number;
  renewalContracts: number;
  unknownContracts: number;
}>;

export type KoreaPublicSummaryJobDependencies = Readonly<{
  serviceKey: string;
  cache: RuntimeCachePort;
  fetch: MolitFetch;
  now: () => Date;
  rightsLookup?: MolitRightsLookup;
  coordinateLimit?: number;
  createDeadlineSignal?: (timeoutMs: number) => AbortSignal;
  createProviderBudget?: (limit: number) => ProviderCallBudget;
}>;

function rightsLookup(dependencies: { readonly rightsLookup?: MolitRightsLookup }): MolitRightsLookup {
  return dependencies.rightsLookup ?? ((policyId) =>
    policyId === KR_MOLIT_RENT_RIGHTS.id ? KR_MOLIT_RENT_RIGHTS : undefined);
}

function assertJobRights(
  dependencies: { readonly rightsLookup?: MolitRightsLookup },
  operations: readonly ('fetch' | 'store' | 'cache' | 'derive' | 'display' | 'commercial')[],
): void {
  assertMolitRights({
    lookup: rightsLookup(dependencies),
    policyId: MOLIT_RIGHTS_POLICY_ID,
    operations,
    cacheTtlSeconds: 86_400,
    retentionSeconds: 86_400,
  });
}

function defaultDeadlineSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function defaultProviderBudget(limit: number): ProviderCallBudget {
  let remaining = limit;
  return {
    consume() {
      if (remaining <= 0) throw new Error('Provider call budget exhausted.');
      remaining -= 1;
    },
  };
}

function validNow(dependencies: { readonly now: () => Date }): string {
  const instant = dependencies.now();
  if (!Number.isFinite(instant.getTime())) {
    throw new TypeError('Public summary generation time must be valid.');
  }
  return instant.toISOString();
}

export function buildKoreaPublicSummaryPlan(
  referenceInstant: string,
): readonly KoreaPublicSummaryCoordinate[] {
  const months = completedSeoulMonthKeys(referenceInstant, 7)
    .reverse()
    .map((month) => month.replace('-', ''));
  const plan: KoreaPublicSummaryCoordinate[] = [];
  for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
    for (const sourceHousingType of SOURCE_TYPES) {
      for (const dealYmd of months) {
        plan.push(Object.freeze({
          index: plan.length,
          lawdCd: district.lawdCd,
          sourceHousingType,
          dealYmd,
        }));
      }
    }
  }
  if (plan.length !== TOTAL_COORDINATES) {
    throw new TypeError('Public summary coordinate plan is incomplete.');
  }
  return Object.freeze(plan);
}

function sourceCode(error: unknown): KoreaPublicSummaryBatchResult['code'] {
  if (error instanceof RightsViolationError) return 'rights_blocked';
  if (error instanceof MolitSourceError) return error.code;
  return 'source_unavailable';
}

export async function runKoreaPublicSummaryBatch(
  input: Readonly<{ referenceInstant: string; cursor: number }>,
  dependencies: KoreaPublicSummaryJobDependencies,
): Promise<KoreaPublicSummaryBatchResult> {
  const plan = buildKoreaPublicSummaryPlan(input.referenceInstant);
  if (!Number.isSafeInteger(input.cursor) || input.cursor < 0 || input.cursor > plan.length) {
    throw new TypeError('Public summary cursor is invalid.');
  }
  const coordinateLimit = dependencies.coordinateLimit ?? DEFAULT_COORDINATE_LIMIT;
  if (!Number.isSafeInteger(coordinateLimit) || coordinateLimit <= 0 || coordinateLimit > 20) {
    throw new TypeError('Public summary coordinate limit is invalid.');
  }

  try {
    assertJobRights(dependencies, ['fetch', 'store', 'cache', 'derive', 'display', 'commercial']);
  } catch (error) {
    return {
      status: 'blocked',
      nextCursor: input.cursor,
      completedCoordinates: input.cursor,
      totalCoordinates: TOTAL_COORDINATES,
      code: sourceCode(error),
    };
  }

  const signal = (dependencies.createDeadlineSignal ?? defaultDeadlineSignal)(DEADLINE_MS);
  const budget = (dependencies.createProviderBudget ?? defaultProviderBudget)(coordinateLimit * 3);
  const coordinates = plan.slice(input.cursor, input.cursor + coordinateLimit);

  const processCoordinate = async (
    coordinate: KoreaPublicSummaryCoordinate,
  ): Promise<KoreaPublicSummaryBatchResult['code'] | null> => {
    try {
      const identity = { ...coordinate, pageSize: PAGE_SIZE };
      if (await JOB_STORE.read(dependencies.cache, identity, signal) !== null) return null;
      const loaded = await fetchMolitRentalMonth(
        {
          serviceKey: dependencies.serviceKey,
          sourceHousingType: coordinate.sourceHousingType,
          lawdCd: coordinate.lawdCd,
          dealYmd: coordinate.dealYmd,
          pageSize: PAGE_SIZE,
        },
        {
          fetch: dependencies.fetch,
          budget,
          deadlineSignal: signal,
          now: dependencies.now,
        },
      );
      await JOB_STORE.write(dependencies.cache, loaded, undefined, signal);
      return await JOB_STORE.read(dependencies.cache, identity, signal) === null
        ? 'source_unavailable'
        : null;
    } catch (error) {
      return sourceCode(error);
    }
  };

  for (let offset = 0; offset < coordinates.length; offset += 2) {
    const pair = coordinates.slice(offset, offset + 2);
    const results = await Promise.all(pair.map(processCoordinate));
    const failed = results.findIndex((code) => code !== null);
    if (failed !== -1) {
      const nextCursor = input.cursor + offset + failed;
      return {
        status: results[failed] === 'rights_blocked' ? 'blocked' : 'retryable',
        nextCursor,
        completedCoordinates: nextCursor,
        totalCoordinates: TOTAL_COORDINATES,
        code: results[failed]!,
      };
    }
  }

  const nextCursor = input.cursor + coordinates.length;
  return {
    status: 'progress',
    nextCursor,
    completedCoordinates: nextCursor,
    totalCoordinates: TOTAL_COORDINATES,
  };
}

function isEligible(record: KoreaRentRecord): boolean {
  return (
    record.recordStatus !== 'cancelled' &&
    record.depositWon > 0 &&
    record.monthlyRentWon === 0 &&
    record.areaSqm >= 45 &&
    record.areaSqm <= 55
  );
}

export async function finalizeKoreaPublicSummaryJob(
  input: Readonly<{ referenceInstant: string }>,
  dependencies: Omit<KoreaPublicSummaryJobDependencies, 'serviceKey' | 'fetch'>,
): Promise<KoreaPublicSummaryFinalization> {
  assertJobRights(dependencies, ['cache', 'derive', 'display', 'commercial']);
  const plan = buildKoreaPublicSummaryPlan(input.referenceInstant);
  const records: KoreaRentRecord[] = [];
  for (const coordinate of plan) {
    const month = await JOB_STORE.read(dependencies.cache, {
      ...coordinate,
      pageSize: PAGE_SIZE,
    });
    if (month === null) {
      throw new TypeError('Public summary source coverage is incomplete.');
    }
    records.push(...month.records);
  }

  const eligible = records.filter(isEligible);
  const completedMonths = completedSeoulMonthKeys(input.referenceInstant, 7).reverse();
  const period = `${completedMonths[0]}/${completedMonths.at(-1)}`;
  const summary = buildKoreaPublicMarketSummary({
    area: 'seoul',
    parent: 'kr',
    band: '45-55sqm',
    period,
    completedMonths,
    sourceComplete: true,
    source: {
      marketId: 'kr-seoul',
      provider: 'MOLIT',
      endpointVersion: MOLIT_ENDPOINT_VERSION,
      parserVersion: MOLIT_PARSER_VERSION,
      rightsPolicyId: MOLIT_RIGHTS_POLICY_ID,
    },
    rightsLookup: rightsLookup(dependencies),
    records,
  });

  return Object.freeze({
    summary,
    period,
    generatedAt: validNow(dependencies),
    completedCoordinates: TOTAL_COORDINATES,
    eligibleRecords: eligible.length,
    activeRecords: eligible.filter((record) => record.recordStatus === 'active').length,
    unknownStatusRecords: eligible.filter((record) => record.recordStatus === 'unknown').length,
    newContracts: eligible.filter((record) => record.contractType === 'new').length,
    renewalContracts: eligible.filter((record) => record.contractType === 'renewal').length,
    unknownContracts: eligible.filter((record) => record.contractType === 'unknown').length,
  });
}
