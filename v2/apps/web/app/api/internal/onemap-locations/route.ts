import { revalidatePath } from 'next/cache';

import { contentDatabase } from '../../../../lib/db/postgres.server';
import {
  authorized,
  equalSecret,
  operatorId,
  sameOrigin,
} from '../../../../lib/evidence-pool/auth.server';
import {
  getOneMapLocationCandidate,
  listOneMapLocationCandidates,
  reviewOneMapLocationCandidate,
  runOneMapLocationCollection,
} from '../../../../lib/data-operations/onemap-locations.server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu;
const REVIEW_STATES = ['pending', 'approved', 'rejected', 'all'] as const;

function reply(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret && equalSecret(request.headers.get('authorization') ?? '', `Bearer ${secret}`),
  );
}

async function readJson(request: Request) {
  if (Number(request.headers.get('content-length')) > 4096) throw new Error('request_too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_command');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 4096) throw new Error('request_too_large');
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

export async function GET(request: Request) {
  const isCron = cronAuthorized(request);
  if (!isCron && !authorized(request)) return reply({ error: 'unauthorized' }, 401);

  const database = contentDatabase();
  if (!database) return reply({ error: 'database_not_configured' }, 503);
  const sql = { query: (statement: string, parameters?: unknown[]) => database.query(statement, parameters) };

  try {
    if (isCron) return reply(await runOneMapLocationCollection(sql, { limit: 250 }));

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      if (!UUID.test(id)) return reply({ error: 'invalid_id' }, 400);
      return reply({ item: await getOneMapLocationCandidate(sql, id) });
    }

    const page = Number(url.searchParams.get('page') ?? '1');
    const status = url.searchParams.get('status') ?? 'pending';
    if (
      !Number.isInteger(page) || page < 1 || page > 10000 ||
      !REVIEW_STATES.includes(status as (typeof REVIEW_STATES)[number])
    ) return reply({ error: 'invalid_filters' }, 400);

    return reply(await listOneMapLocationCandidates(sql, { page, status }));
  } catch {
    return reply({ error: 'onemap_location_collection_unavailable' }, 503);
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return reply({ error: 'unauthorized' }, 401);
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403);

  const database = contentDatabase();
  if (!database) return reply({ error: 'database_not_configured' }, 503);
  const sql = { query: (statement: string, parameters?: unknown[]) => database.query(statement, parameters) };

  try {
    const body = await readJson(request);
    if (body.action === 'collect') {
      return reply(await runOneMapLocationCollection(sql, { force: true, limit: 250 }));
    }
    if (
      body.action === 'review' &&
      typeof body.id === 'string' && UUID.test(body.id) &&
      Number.isInteger(body.version) && Number(body.version) > 0 &&
      (body.status === 'approved' || body.status === 'rejected') &&
      typeof body.reason === 'string' &&
      body.reason.trim().length >= 3 && body.reason.length <= 240
    ) {
      const result = await reviewOneMapLocationCandidate(sql, {
        id: body.id,
        version: Number(body.version),
        status: body.status,
        reason: body.reason,
        actor: operatorId(request),
      });
      if (!result) return reply({ error: 'conflict_or_unmatched' }, 409);

      revalidatePath('/sg/singapore', 'page');
      revalidatePath('/ko/sg/singapore', 'page');
      revalidatePath('/sg/singapore/hdb/[town]/[blockId]', 'page');
      revalidatePath('/ko/sg/singapore/hdb/[town]/[blockId]', 'page');
      return reply(result);
    }
    return reply({ error: 'invalid_command' }, 400);
  } catch (error) {
    if (error instanceof Error && error.message === 'request_too_large') {
      return reply({ error: 'request_too_large' }, 413);
    }
    return reply({ error: 'onemap_location_request_failed' }, 400);
  }
}
