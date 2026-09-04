import { NextResponse } from 'next/server';

import { contentDatabase } from '@/lib/db/postgres.server';
import { createPublicEntityProjectionPublisher } from '@/lib/public-data/entity-projection-publisher.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export function isPublicEntityProjectionRequestAuthorized(
  request: Request,
  secret = process.env.CRON_SECRET?.trim() ?? '',
): boolean {
  return secret.length > 0 && request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isPublicEntityProjectionRequestAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sql = contentDatabase();
  if (sql === null) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 });
  }
  try {
    const publisher = createPublicEntityProjectionPublisher({
      query: (statement, parameters = []) => sql.query(statement, [...parameters]),
    });
    return NextResponse.json({ state: 'ready', ...(await publisher.publishSeoul()) });
  } catch {
    console.error('SignedPrice public entity projection refresh failed.');
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }
}
