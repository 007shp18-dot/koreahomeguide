import { createHistoryHandler } from '@/lib/public-market/korea-sale-history.server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const POST = createHistoryHandler({
 environment: process.env.VERCEL_ENV,
 token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
 serviceKey: process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY ?? process.env.DATA_GO_KR_SERVICE_KEY,
 fetch: globalThis.fetch,
});
