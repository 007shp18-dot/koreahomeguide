import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

import { SEED_PASSWORD } from '../property-seed-runner/seed-password.generated';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TEST_HOST = 'ep-rapid-grass-b34p9oiz.c-4.ap-southeast-1.aws.neon.tech';
const TEST_ROLE = 'signedprice_seed_runner';

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') return new NextResponse(null, { status: 404 });
  const currentPassword = new URL(request.url).searchParams.get('pw');
  if (!SEED_PASSWORD || !currentPassword || currentPassword.length < 12 || currentPassword.length > 200) {
    return NextResponse.json({ error: 'unavailable' }, { status: 400 });
  }
  const connection = `postgresql://${TEST_ROLE}:${encodeURIComponent(currentPassword)}@${TEST_HOST}/neondb?sslmode=require`;
  const sql = neon(connection);
  try {
    const escaped = SEED_PASSWORD.replaceAll("'", "''");
    await sql.query(`ALTER ROLE ${TEST_ROLE} PASSWORD '${escaped}'`);
    return NextResponse.json({ state: 'synced' }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch (error) {
    console.error('SignedPrice temporary seed credential sync failed.', error);
    return NextResponse.json({ error: 'sync_failed' }, { status: 500 });
  }
}
