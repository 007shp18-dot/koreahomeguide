import 'server-only';

import type {
  KoreaPublicAreaSummaryFinalization,
  KoreaPublicSummaryBatchResult,
} from '@signedprice/korea-rent';

const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

type BatchInput = Readonly<{ referenceInstant: string; cursor: number }>;
type FinalizeInput = Readonly<{ referenceInstant: string }>;

export type PublicAreaSummaryJobHandlerDependencies = Readonly<{
  vercelEnv?: string;
  serviceKey?: string;
  runBatch(input: BatchInput): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: FinalizeInput): Promise<KoreaPublicAreaSummaryFinalization>;
  buildArtifact(finalization: KoreaPublicAreaSummaryFinalization): Promise<Readonly<{
    serialized: string;
    sha256: string;
  }>>;
}>;

type ErrorCode =
  | 'not_found'
  | 'configuration_missing'
  | 'unsupported_media_type'
  | 'invalid_request'
  | 'internal_error';

function json(value: unknown, status: number): Response {
  return Response.json(value, { status, headers: RESPONSE_HEADERS });
}

function error(code: ErrorCode, status: number): Response {
  return json({ status: 'error', code }, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index]);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function parseRequest(value: unknown):
  | Readonly<{ action: 'batch'; referenceInstant: string; cursor: number }>
  | Readonly<{ action: 'finalize'; referenceInstant: string }>
  | null {
  if (!isRecord(value) || typeof value.action !== 'string') return null;
  if (value.action === 'batch') {
    return hasExactKeys(value, ['action', 'referenceInstant', 'cursor']) &&
      isCanonicalInstant(value.referenceInstant) &&
      Number.isSafeInteger(value.cursor) &&
      (value.cursor as number) >= 0 &&
      (value.cursor as number) <= 700
      ? Object.freeze({
          action: 'batch' as const,
          referenceInstant: value.referenceInstant,
          cursor: value.cursor as number,
        })
      : null;
  }
  if (value.action === 'finalize') {
    return hasExactKeys(value, ['action', 'referenceInstant']) &&
      isCanonicalInstant(value.referenceInstant)
      ? Object.freeze({ action: 'finalize' as const, referenceInstant: value.referenceInstant })
      : null;
  }
  return null;
}

function validCoordinate(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= 700;
}

function batchResponse(result: KoreaPublicSummaryBatchResult): Response {
  if (
    !validCoordinate(result.nextCursor) ||
    !validCoordinate(result.completedCoordinates) ||
    result.totalCoordinates !== 700
  ) {
    return error('internal_error', 500);
  }
  const base = {
    status: result.status,
    nextCursor: result.nextCursor,
    completedCoordinates: result.completedCoordinates,
    totalCoordinates: result.totalCoordinates,
  } as const;
  if (result.status === 'progress') return json(base, 200);
  if (
    result.status === 'retryable' &&
    ['source_timeout', 'source_unavailable', 'source_malformed'].includes(result.code ?? '')
  ) {
    return json({ ...base, code: result.code }, 503);
  }
  if (result.status === 'blocked' && result.code === 'rights_blocked') {
    return json({ ...base, code: result.code }, 403);
  }
  return error('internal_error', 500);
}

function validateFinalization(finalization: KoreaPublicAreaSummaryFinalization): Readonly<{
  cityN: number;
  newCityN: number;
  renewalCityN: number;
  unknownCityN: number;
  districtCount: number;
  districtNSum: number;
}> | null {
  const { all, new: newGroup, renewal } = finalization.groups;
  const districtCount = all.districtSummaries.length;
  if (
    finalization.completedCoordinates !== 700 ||
    districtCount !== 25 ||
    newGroup.districtSummaries.length !== districtCount ||
    renewal.districtSummaries.length !== districtCount ||
    finalization.unknownContractCounts.districts.length !== districtCount
  ) {
    return null;
  }
  const districtNSum = all.districtSummaries.reduce((sum, summary) => sum + summary.n, 0);
  const newDistrictNSum = newGroup.districtSummaries.reduce(
    (sum, summary) => sum + summary.n,
    0,
  );
  const renewalDistrictNSum = renewal.districtSummaries.reduce(
    (sum, summary) => sum + summary.n,
    0,
  );
  const unknownDistrictNSum = finalization.unknownContractCounts.districts.reduce(
    (sum, count) => sum + count,
    0,
  );
  const districtReconciles = all.districtSummaries.every((summary, index) => (
    summary.n ===
      newGroup.districtSummaries[index]!.n +
      renewal.districtSummaries[index]!.n +
      finalization.unknownContractCounts.districts[index]!
  ));
  if (
    !districtReconciles ||
    all.citySummary.n !== districtNSum ||
    newGroup.citySummary.n !== newDistrictNSum ||
    renewal.citySummary.n !== renewalDistrictNSum ||
    finalization.unknownContractCounts.city !== unknownDistrictNSum ||
    all.citySummary.n !==
      newGroup.citySummary.n + renewal.citySummary.n + finalization.unknownContractCounts.city ||
    finalization.eligibleRecords !== all.citySummary.n
  ) {
    return null;
  }
  return Object.freeze({
    cityN: all.citySummary.n,
    newCityN: newGroup.citySummary.n,
    renewalCityN: renewal.citySummary.n,
    unknownCityN: finalization.unknownContractCounts.city,
    districtCount,
    districtNSum,
  });
}

export function createPublicAreaSummaryJobPostHandler(
  dependencies: PublicAreaSummaryJobHandlerDependencies,
) {
  return async function post(request: Request): Promise<Response> {
    if (dependencies.vercelEnv !== 'preview') return error('not_found', 404);
    if (dependencies.serviceKey === undefined || dependencies.serviceKey.trim() === '') {
      return error('configuration_missing', 503);
    }
    if (
      request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
      'application/json'
    ) {
      return error('unsupported_media_type', 415);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return error('invalid_request', 400);
    }
    const input = parseRequest(body);
    if (input === null) return error('invalid_request', 400);

    try {
      if (input.action === 'batch') {
        return batchResponse(await dependencies.runBatch({
          referenceInstant: input.referenceInstant,
          cursor: input.cursor,
        }));
      }
      const finalization = await dependencies.finalize({
        referenceInstant: input.referenceInstant,
      });
      const counts = validateFinalization(finalization);
      if (counts === null) return error('internal_error', 500);
      const built = await dependencies.buildArtifact(finalization);
      if (typeof built.serialized !== 'string' || !/^[0-9a-f]{64}$/.test(built.sha256)) {
        return error('internal_error', 500);
      }
      return json({
        status: 'complete',
        period: finalization.period,
        generatedAt: finalization.generatedAt,
        completedCoordinates: finalization.completedCoordinates,
        ...counts,
        artifact: built.serialized,
        sha256: built.sha256,
      }, 200);
    } catch {
      return error('internal_error', 500);
    }
  };
}

export function publicAreaSummaryJobMethodNotAllowed(request: Request): Response {
  const headers = { ...RESPONSE_HEADERS, Allow: 'POST' };
  return request.method === 'HEAD'
    ? new Response(null, { status: 405, headers })
    : Response.json(
        { status: 'error', code: 'method_not_allowed' },
        { status: 405, headers },
      );
}
