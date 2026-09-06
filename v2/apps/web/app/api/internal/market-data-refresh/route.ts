import { NextResponse } from 'next/server';

import { contentDatabase } from '@/lib/db/postgres.server';
import {
  createMarketRefreshRepository,
  type MarketRefreshSqlPort,
} from '@/lib/market-data/refresh-repository.server';
import {
  createMarketDataRefreshService,
  type MarketDataRefreshResult,
} from '@/lib/market-data/refresh-service.server';
import {
  isMarketRefreshJob,
  type MarketRefreshJob,
} from '@/lib/market-data/refresh-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Leave headroom below Vercel's 4.5 MB Function request-body ceiling.
const MAX_OPERATOR_CSV_BYTES = 4 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export function isMarketDataRefreshRequestAuthorized(
  request: Request,
  secret: string,
): boolean {
  return secret.length > 0 && request.headers.get('authorization') === `Bearer ${secret}`;
}

export function parseMarketDataRefreshJob(request: Request): MarketRefreshJob | null {
  const parameters = [...new URL(request.url).searchParams.entries()];
  if (parameters.length !== 1 || parameters[0]?.[0] !== 'job') return null;
  const candidate = parameters[0][1];
  return isMarketRefreshJob(candidate) ? candidate : null;
}

function responseStatus(result: MarketDataRefreshResult): number {
  if (result.state === 'busy') return 202;
  if (result.state !== 'failed') return 200;
  return result.code === 'storage_unavailable' ? 503
    : result.code === 'source_invalid' ? 422
      : 502;
}

function refreshService() {
  const sql = contentDatabase();
  if (sql === null) return null;
  const port: MarketRefreshSqlPort = Object.freeze({
    query: async (statement, parameters = []) => sql.query(statement, [...parameters]),
    transaction: async (statements) => {
      const results = await sql.transaction((transaction) => statements.map(({
        statement,
        parameters = [],
      }) => transaction.query(statement, [...parameters])));
      return results;
    },
  });
  return createMarketDataRefreshService({
    repository: createMarketRefreshRepository(port),
  });
}

async function execute(job: MarketRefreshJob, uploadedCsv?: string) {
  const service = refreshService();
  if (service === null) {
    return json({ error: 'database_not_configured' }, 503);
  }
  try {
    const result = uploadedCsv === undefined
      ? await service.run(job)
      : await service.run(job, { uploadedCsv });
    return json(result, responseStatus(result));
  } catch {
    console.error('SignedPrice market data refresh failed unexpectedly.');
    return json({ error: 'refresh_unavailable' }, 503);
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? '';
  if (!isMarketDataRefreshRequestAuthorized(request, secret)) {
    return json({ error: 'unauthorized' }, 401);
  }
  const job = parseMarketDataRefreshJob(request);
  if (job === null) return json({ error: 'invalid_job' }, 400);
  return execute(job);
}

export async function POST(request: Request) {
  const secret = process.env.CONTENT_ADMIN_SECRET?.trim() ?? '';
  if (!isMarketDataRefreshRequestAuthorized(request, secret)) {
    return json({ error: 'unauthorized' }, 401);
  }
  const job = parseMarketDataRefreshJob(request);
  if (job !== 'ae-dubai-transaction' && job !== 'ae-dubai-rent') {
    return json({ error: 'invalid_job' }, 400);
  }
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'text/csv' && mediaType !== 'application/csv') {
    return json({ error: 'unsupported_media_type' }, 415);
  }
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 1
      || parsedLength > MAX_OPERATOR_CSV_BYTES) {
      return json({ error: 'invalid_csv_size' }, 413);
    }
  }
  let uploadedCsv: string;
  try {
    uploadedCsv = await request.text();
  } catch {
    return json({ error: 'invalid_csv_body' }, 400);
  }
  const byteLength = new TextEncoder().encode(uploadedCsv).byteLength;
  if (byteLength === 0 || byteLength > MAX_OPERATOR_CSV_BYTES) {
    return json({ error: 'invalid_csv_size' }, 413);
  }
  return execute(job, uploadedCsv);
}
