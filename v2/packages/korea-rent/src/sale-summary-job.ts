import { completedSeoulMonthKeys } from './calculation';
import { SEOUL_RENT_CHECK_DISTRICTS, type SeoulLawdCd } from './districts';
import type { SourceHousingType } from './input';
import {
  KR_MOLIT_SALE_RIGHTS,
  RightsViolationError,
  assertMolitSaleRights,
  type MolitRightsLookup,
} from './rights';
import { createSaleSourceMonthStore } from './sale-source-month-store';
import type { KoreaSaleRecord } from './sale';
import {
  buildKoreaSaleEvidence,
  type KoreaSaleEvidence,
  type KoreaSaleEvidenceSourceRecord,
} from './sale-evidence';
import type { RuntimeCachePort } from './cache';
import {
  MolitSourceError,
  fetchMolitSaleMonth,
  type MolitFetch,
  type MolitMalformedDiagnostic,
  type ProviderCallBudget,
} from './xml';
import { MOLIT_SALE_RIGHTS_POLICY_ID } from './versions';

const TOTAL_COORDINATES = 700 as const;
const PAGE_SIZE = 1_000 as const;
const DEFAULT_COORDINATE_LIMIT = 4;
const DEADLINE_MS = 50_000;
const JOB_TAG = 'kr-sale-summary-job:v1';
const SOURCE_TYPES = Object.freeze([
  'apartment', 'officetel', 'villa', 'detached',
] as const satisfies readonly SourceHousingType[]);

const JOB_STORE = createSaleSourceMonthStore({
  namespacePrefix: 'signedprice:kr-sale-summary-job:v1',
  ttlSeconds: 86_400,
  tags: [JOB_TAG],
  corruptTag: JOB_TAG,
});

export type KoreaSaleSummaryCoordinate = Readonly<{
  index: number;
  lawdCd: SeoulLawdCd;
  sourceHousingType: SourceHousingType;
  dealYmd: string;
}>;

export type KoreaSaleSummaryBatchResult = Readonly<{
  status: 'progress' | 'retryable' | 'blocked';
  nextCursor: number;
  completedCoordinates: number;
  totalCoordinates: typeof TOTAL_COORDINATES;
  code?: 'source_timeout' | 'source_unavailable' | 'source_malformed' | 'rights_blocked';
  diagnostic?: MolitMalformedDiagnostic;
}>;

export type KoreaSaleSnapshotFinalization = Readonly<{
  evidence: KoreaSaleEvidence;
  period: string;
  generatedAt: string;
  completedCoordinates: typeof TOTAL_COORDINATES;
}>;

export type KoreaSaleSummaryJobDependencies = Readonly<{
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
    policyId === KR_MOLIT_SALE_RIGHTS.id ? KR_MOLIT_SALE_RIGHTS : undefined);
}

function assertJobRights(
  dependencies: { readonly rightsLookup?: MolitRightsLookup },
  operations: readonly ('fetch' | 'store' | 'cache' | 'derive' | 'display' | 'commercial')[],
): void {
  assertMolitSaleRights({
    lookup: rightsLookup(dependencies),
    policyId: MOLIT_SALE_RIGHTS_POLICY_ID,
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
  return { consume() {
    if (remaining <= 0) throw new Error('Provider call budget exhausted.');
    remaining -= 1;
  } };
}

function validNow(dependencies: { readonly now: () => Date }): string {
  const instant = dependencies.now();
  if (!Number.isFinite(instant.getTime())) {
    throw new TypeError('Sale summary generation time must be valid.');
  }
  return instant.toISOString();
}

export function buildKoreaSaleSummaryPlan(
  referenceInstant: string,
): readonly KoreaSaleSummaryCoordinate[] {
  const months = completedSeoulMonthKeys(referenceInstant, 7)
    .reverse()
    .map((month) => month.replace('-', ''));
  const plan: KoreaSaleSummaryCoordinate[] = [];
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
    throw new TypeError('Sale summary coordinate plan is incomplete.');
  }
  return Object.freeze(plan);
}

function sourceCode(error: unknown): KoreaSaleSummaryBatchResult['code'] {
  if (error instanceof RightsViolationError) return 'rights_blocked';
  if (error instanceof MolitSourceError) return error.code;
  return 'source_unavailable';
}

function sourceDiagnostic(error: unknown): MolitMalformedDiagnostic | undefined {
  return error instanceof MolitSourceError ? error.diagnostic : undefined;
}

export async function runKoreaSaleSummaryBatch(
  input: Readonly<{ referenceInstant: string; cursor: number }>,
  dependencies: KoreaSaleSummaryJobDependencies,
): Promise<KoreaSaleSummaryBatchResult> {
  const plan = buildKoreaSaleSummaryPlan(input.referenceInstant);
  if (!Number.isSafeInteger(input.cursor) || input.cursor < 0 || input.cursor > plan.length) {
    throw new TypeError('Sale summary cursor is invalid.');
  }
  const coordinateLimit = dependencies.coordinateLimit ?? DEFAULT_COORDINATE_LIMIT;
  if (!Number.isSafeInteger(coordinateLimit) || coordinateLimit <= 0 || coordinateLimit > 20) {
    throw new TypeError('Sale summary coordinate limit is invalid.');
  }

  try {
    assertJobRights(dependencies, ['fetch', 'store', 'cache', 'derive', 'display', 'commercial']);
  } catch (error) {
    return {
      status: 'blocked', nextCursor: input.cursor, completedCoordinates: input.cursor,
      totalCoordinates: TOTAL_COORDINATES, code: sourceCode(error),
    };
  }

  const signal = (dependencies.createDeadlineSignal ?? defaultDeadlineSignal)(DEADLINE_MS);
  const budget = (dependencies.createProviderBudget ?? defaultProviderBudget)(coordinateLimit * 3);
  const coordinates = plan.slice(input.cursor, input.cursor + coordinateLimit);

  const processCoordinate = async (coordinate: KoreaSaleSummaryCoordinate) => {
    try {
      const identity = { ...coordinate, pageSize: PAGE_SIZE };
      if (await JOB_STORE.read(dependencies.cache, identity, signal) !== null) return null;
      const loaded = await fetchMolitSaleMonth({
        serviceKey: dependencies.serviceKey,
        sourceHousingType: coordinate.sourceHousingType,
        lawdCd: coordinate.lawdCd,
        dealYmd: coordinate.dealYmd,
        pageSize: PAGE_SIZE,
      }, {
        fetch: dependencies.fetch,
        budget,
        deadlineSignal: signal,
        now: dependencies.now,
      });
      await JOB_STORE.write(dependencies.cache, loaded, undefined, signal);
      return await JOB_STORE.read(dependencies.cache, identity, signal) === null
        ? { code: 'source_unavailable' as const }
        : null;
    } catch (error) {
      const diagnostic = sourceDiagnostic(error);
      return {
        code: sourceCode(error)!,
        ...(diagnostic === undefined ? {} : { diagnostic }),
      };
    }
  };

  for (let offset = 0; offset < coordinates.length; offset += 2) {
    const results = await Promise.all(coordinates.slice(offset, offset + 2).map(processCoordinate));
    const failed = results.findIndex((failure) => failure !== null);
    if (failed !== -1) {
      const nextCursor = input.cursor + offset + failed;
      const failure = results[failed]!;
      return {
        status: failure.code === 'rights_blocked' ? 'blocked' : 'retryable',
        nextCursor,
        completedCoordinates: nextCursor,
        totalCoordinates: TOTAL_COORDINATES,
        code: failure.code,
        ...(failure.diagnostic === undefined ? {} : { diagnostic: failure.diagnostic }),
      };
    }
  }

  const nextCursor = input.cursor + coordinates.length;
  return {
    status: 'progress', nextCursor, completedCoordinates: nextCursor,
    totalCoordinates: TOTAL_COORDINATES,
  };
}

type LoadedSaleRecords = Readonly<{
  all: readonly KoreaSaleRecord[];
  byDistrict: ReadonlyMap<SeoulLawdCd, readonly KoreaSaleRecord[]>;
}>;

async function loadSaleRecords(referenceInstant: string, cache: RuntimeCachePort) {
  const plan = buildKoreaSaleSummaryPlan(referenceInstant);
  const records: KoreaSaleRecord[] = [];
  const byDistrict = new Map<SeoulLawdCd, KoreaSaleRecord[]>(
    SEOUL_RENT_CHECK_DISTRICTS.map(({ lawdCd }) => [lawdCd, []]),
  );
  for (const coordinate of plan) {
    const month = await JOB_STORE.read(cache, { ...coordinate, pageSize: PAGE_SIZE });
    if (month === null) throw new TypeError('Sale summary source coverage is incomplete.');
    records.push(...month.records);
    byDistrict.get(coordinate.lawdCd)!.push(...month.records);
  }
  return { all: Object.freeze(records), byDistrict } as LoadedSaleRecords;
}

function completedPeriod(referenceInstant: string) {
  const completedMonths = completedSeoulMonthKeys(referenceInstant, 7).reverse();
  return {
    completedMonths,
    period: `${completedMonths[0]}/${completedMonths.at(-1)}`,
  } as const;
}

function toSourceRecords(loaded: LoadedSaleRecords): readonly KoreaSaleEvidenceSourceRecord[] {
  const records: KoreaSaleEvidenceSourceRecord[] = [];
  for (const district of SEOUL_RENT_CHECK_DISTRICTS) {
    for (const record of loaded.byDistrict.get(district.lawdCd)!) {
      records.push(Object.freeze({ districtSlug: district.slug, record }));
    }
  }
  return Object.freeze(records);
}

export async function finalizeKoreaSaleSnapshotJob(
  input: Readonly<{ referenceInstant: string }>,
  dependencies: Omit<KoreaSaleSummaryJobDependencies, 'serviceKey' | 'fetch'>,
): Promise<KoreaSaleSnapshotFinalization> {
  assertJobRights(dependencies, ['cache', 'derive', 'display', 'commercial']);
  const loaded = await loadSaleRecords(input.referenceInstant, dependencies.cache);
  const { completedMonths, period } = completedPeriod(input.referenceInstant);
  const generatedAt = validNow(dependencies);
  const evidence = buildKoreaSaleEvidence({
    period,
    completedMonths,
    generatedAt,
    records: toSourceRecords(loaded),
  });
  return Object.freeze({
    evidence,
    period,
    generatedAt,
    completedCoordinates: TOTAL_COORDINATES,
  });
}
