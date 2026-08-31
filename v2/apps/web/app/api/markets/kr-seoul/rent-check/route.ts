import 'server-only';

import { createSeoulRentCheckService } from '@signedprice/korea-rent';

import { createAllowedRentCheckHosts } from '@/lib/rent-check/request-security';
import {
  createRentCheckGetHandler,
  methodNotAllowed,
} from '@/lib/rent-check/route-handler';
import { createVercelRuntimeCache } from '@/lib/rent-check/runtime-cache.server';

const cache = createVercelRuntimeCache();
const allowedHosts = createAllowedRentCheckHosts({
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_URL: process.env.VERCEL_URL,
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = createRentCheckGetHandler({
  allowedHosts,
  serviceKey: process.env.DATA_GO_KR_SERVICE_KEY,
  createService(serviceKey) {
    return createSeoulRentCheckService({
      serviceKey,
      cache,
      fetch: globalThis.fetch,
      now: () => new Date(),
    });
  },
});

export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
