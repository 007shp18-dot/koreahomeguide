import 'server-only';

import type {
  KoreaPublicSummaryBatchResult,
  KoreaPublicSummaryFinalization,
} from '@signedprice/korea-rent';

import type { BuiltPublicSummaryArtifact } from './artifact-builder.server';

const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow',
} as const;

type BatchInput = Readonly<{
  referenceInstant: string;
  cursor: number;
}>;

type FinalizeInput = Readonly<{
  referenceInstant: string;
}>;

export type PublicSummaryJobHandlerDependencies = Readonly<{
  vercelEnv?: string;
  serviceKey?: string;
  runBatch(input: BatchInput): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: FinalizeInput): Promise<KoreaPublicSummaryFinalization>;
  buildArtifact(
    finalization: KoreaPublicSummaryFinalization,
  ): Promise<BuiltPublicSummaryArtifact>;
}>;

function json(value: unknown, status: number): Response {
  return Response.json(value, { status, headers: RESPONSE_HEADERS });
}

function error(code: 'not_found' | 'configuration_missing' | 'invalid_request' | 'internal_error', status: number) {
  return json({ status: 'error', code }, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

function canonicalInstant(value: unknown): value is string {
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
    return exactKeys(value, ['action', 'referenceInstant', 'cursor']) &&
      canonicalInstant(value.referenceInstant) &&
      Number.isSafeInteger(value.cursor) &&
      (value.cursor as number) >= 0 &&
      (value.cursor as number) <= 700
      ? {
          action: 'batch',
          referenceInstant: value.referenceInstant,
          cursor: value.cursor as number,
        }
      : null;
  }
  if (value.action === 'finalize') {
    return exactKeys(value, ['action', 'referenceInstant']) &&
      canonicalInstant(value.referenceInstant)
      ? { action: 'finalize', referenceInstant: value.referenceInstant }
      : null;
  }
  return null;
}

export function createPublicSummaryJobPostHandler(
  dependencies: PublicSummaryJobHandlerDependencies,
) {
  return async function post(request: Request): Promise<Response> {
    if (dependencies.vercelEnv !== 'preview') return error('not_found', 404);
    if (!dependencies.serviceKey) return error('configuration_missing', 503);

    let source: unknown;
    try {
      source = await request.json();
    } catch {
      return error('invalid_request', 400);
    }
    const input = parseRequest(source);
    if (input === null) return error('invalid_request', 400);

    try {
      if (input.action === 'batch') {
        const result = await dependencies.runBatch({
          referenceInstant: input.referenceInstant,
          cursor: input.cursor,
        });
        return json(result, result.status === 'progress' ? 200 : 503);
      }

      const finalization = await dependencies.finalize({
        referenceInstant: input.referenceInstant,
      });
      const built = await dependencies.buildArtifact(finalization);
      const report = {
        period: finalization.period,
        generatedAt: finalization.generatedAt,
        completedCoordinates: finalization.completedCoordinates,
        eligibleRecords: finalization.eligibleRecords,
        activeRecords: finalization.activeRecords,
        unknownStatusRecords: finalization.unknownStatusRecords,
        newContracts: finalization.newContracts,
        renewalContracts: finalization.renewalContracts,
        unknownContracts: finalization.unknownContracts,
      };
      return json({
        status: 'complete',
        artifact: built.artifact,
        serialized: built.serialized,
        sha256: built.sha256,
        report,
      }, 200);
    } catch {
      return error('internal_error', 500);
    }
  };
}

export function publicSummaryJobMethodNotAllowed(request: Request): Response {
  const headers = {
    ...RESPONSE_HEADERS,
    Allow: 'POST',
  };
  return request.method === 'HEAD'
    ? new Response(null, { status: 405, headers })
    : Response.json(
        { status: 'error', code: 'method_not_allowed' },
        { status: 405, headers },
      );
}
