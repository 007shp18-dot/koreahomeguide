import 'server-only';

import type {
  KoreaPublicBuildingSummaryFinalization,
  KoreaPublicSummaryBatchResult,
} from '@signedprice/korea-rent';

const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

type BatchInput = Readonly<{ referenceInstant: string; cursor: number }>;
type FinalizeInput = Readonly<{ referenceInstant: string }>;

export type PublicBuildingJobHandlerDependencies = Readonly<{
  vercelEnv?: string;
  serviceKey?: string;
  runBatch(input: BatchInput): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: FinalizeInput): Promise<KoreaPublicBuildingSummaryFinalization>;
  buildArtifact(finalization: KoreaPublicBuildingSummaryFinalization): Promise<Readonly<{
    serialized: string;
    sha256: string;
  }>>;
}>;

function json(value: unknown, status: number): Response {
  return Response.json(value, { status, headers });
}

function error(code: string, status: number): Response {
  return json({ status: 'error', code }, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function parse(value: unknown):
  | Readonly<{ action: 'batch'; referenceInstant: string; cursor: number }>
  | Readonly<{ action: 'finalize'; referenceInstant: string }>
  | null {
  if (!isRecord(value) || !canonicalInstant(value.referenceInstant)) return null;
  if (
    value.action === 'batch' && Object.keys(value).length === 3
    && Number.isSafeInteger(value.cursor) && (value.cursor as number) >= 0
    && (value.cursor as number) <= 700
  ) return Object.freeze({
    action: 'batch', referenceInstant: value.referenceInstant, cursor: value.cursor as number,
  });
  if (value.action === 'finalize' && Object.keys(value).length === 2) {
    return Object.freeze({ action: 'finalize', referenceInstant: value.referenceInstant });
  }
  return null;
}

export function createPublicBuildingJobPostHandler(
  dependencies: PublicBuildingJobHandlerDependencies,
) {
  return async function post(request: Request): Promise<Response> {
    if (dependencies.vercelEnv !== 'preview') return error('not_found', 404);
    if (!dependencies.serviceKey?.trim()) return error('configuration_missing', 503);
    if (request.headers.get('origin') !== new URL(request.url).origin) {
      return error('forbidden', 403);
    }
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
      return error('unsupported_media_type', 415);
    }
    let body: unknown;
    try { body = await request.json(); } catch { return error('invalid_request', 400); }
    const input = parse(body);
    if (input === null) return error('invalid_request', 400);
    try {
      if (input.action === 'batch') {
        const result = await dependencies.runBatch(input);
        if (
          result.totalCoordinates !== 700 || result.nextCursor < 0 || result.nextCursor > 700
          || result.completedCoordinates < 0 || result.completedCoordinates > 700
        ) return error('internal_error', 500);
        if (result.status === 'progress') return json({
          status: 'progress', nextCursor: result.nextCursor,
          completedCoordinates: result.completedCoordinates, totalCoordinates: 700,
        }, 200);
        return json({
          status: result.status, nextCursor: result.nextCursor,
          completedCoordinates: result.completedCoordinates, totalCoordinates: 700,
          code: result.code,
        }, result.status === 'blocked' ? 403 : 503);
      }
      const finalized = await dependencies.finalize(input);
      if (
        finalized.completedCoordinates !== 700
        || finalized.publishedBuildings !== finalized.records.length
      ) return error('internal_error', 500);
      const built = await dependencies.buildArtifact(finalized);
      const markerCount = finalized.records.filter(({ latitude }) => latitude !== null).length;
      return json({
        status: 'complete', period: finalized.period, generatedAt: finalized.generatedAt,
        completedCoordinates: 700, eligibleRecords: finalized.eligibleRecords,
        buildingCount: finalized.publishedBuildings, markerCount,
        unresolvedGeocodeCount: finalized.publishedBuildings - markerCount,
        artifact: built.serialized, sha256: built.sha256,
      }, 200);
    } catch {
      return error('internal_error', 500);
    }
  };
}

export function publicBuildingJobMethodNotAllowed(request: Request): Response {
  return request.method === 'HEAD'
    ? new Response(null, { status: 405, headers: { ...headers, Allow: 'POST' } })
    : json({ status: 'error', code: 'method_not_allowed' }, 405);
}
