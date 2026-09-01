import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

import type {
  KoreaObservedBuildingInventory,
  KoreaObservedBuildingInventoryFinalization,
  KoreaPublicSummaryBatchResult,
} from '@signedprice/korea-rent';

type BuiltObservedBuildingArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
}>;

export type ObservedBuildingJobHandlerDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  serviceKey: string | undefined;
  runBatch(input: Readonly<{
    referenceInstant: string;
    cursor: number;
  }>): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: Readonly<{
    referenceInstant: string;
  }>): Promise<KoreaObservedBuildingInventoryFinalization>;
  buildArtifact(input: KoreaObservedBuildingInventory): Promise<BuiltObservedBuildingArtifact>;
}>;

function json(body: Readonly<Record<string, unknown>>, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

function exactToken(actual: string | null, expected: string): boolean {
  if (actual === null || !actual.startsWith('Bearer ')) return false;
  const suppliedDigest = createHash('sha256').update(actual.slice(7)).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

export function createObservedBuildingJobHandler(
  dependencies: ObservedBuildingJobHandlerDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return json({ status: 'error', code: 'method_not_allowed' }, 405, { allow: 'POST' });
    }
    if (dependencies.token === undefined || dependencies.token.length < 24) {
      return json({ status: 'error', code: 'configuration_missing' }, 503);
    }
    if (!exactToken(request.headers.get('authorization'), dependencies.token)) {
      return json({ status: 'error', code: 'unauthorized' }, 401);
    }
    if (dependencies.environment !== 'preview') {
      return json({ status: 'error', code: 'preview_only' }, 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ status: 'error', code: 'invalid_request' }, 400);
    }
    if (!isObject(body) || !isCanonicalInstant(body.referenceInstant)) {
      return json({ status: 'error', code: 'invalid_request' }, 400);
    }

    if (body.action === 'batch') {
      if (
        Object.keys(body).length !== 3
        || !Number.isSafeInteger(body.cursor)
        || (body.cursor as number) < 0
        || (body.cursor as number) > 700
      ) return json({ status: 'error', code: 'invalid_request' }, 400);
      if (dependencies.serviceKey === undefined || dependencies.serviceKey.length === 0) {
        return json({ status: 'error', code: 'configuration_missing' }, 503);
      }
      try {
        const progress = await dependencies.runBatch({
          referenceInstant: body.referenceInstant,
          cursor: body.cursor as number,
        });
        return json(progress, progress.status === 'blocked' ? 403 : 200);
      } catch {
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    if (body.action === 'finalize' && Object.keys(body).length === 2) {
      try {
        const finalized = await dependencies.finalize({
          referenceInstant: body.referenceInstant,
        });
        const built = await dependencies.buildArtifact(finalized.inventory);
        return json({
          status: 'ready',
          completedCoordinates: finalized.completedCoordinates,
          period: finalized.period,
          generatedAt: finalized.generatedAt,
          sha256: built.sha256,
          artifact: built.artifact,
        }, 200);
      } catch (error) {
        if (
          error instanceof TypeError
          && error.message === 'Public summary source coverage is incomplete.'
        ) return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    return json({ status: 'error', code: 'invalid_request' }, 400);
  };
}
