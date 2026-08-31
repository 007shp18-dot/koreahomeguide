import 'server-only';

import {
  finalizeKoreaPublicAreaSummaryJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { buildPublicAreaSummaryArtifact } from '@/lib/public-market/area-artifact-builder.server';
import {
  createPublicAreaSummaryJobPostHandler,
  publicAreaSummaryJobMethodNotAllowed,
} from '@/lib/public-market/area-job-handler.server';
import {
  createPublicAreaSummaryJobRuntimeCache,
} from '@/lib/public-market/public-area-summary-job-cache.server';

const cache = createPublicAreaSummaryJobRuntimeCache();
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = createPublicAreaSummaryJobPostHandler({
  vercelEnv: process.env.VERCEL_ENV,
  serviceKey,
  runBatch(input) {
    return runKoreaPublicSummaryBatch(input, {
      serviceKey: serviceKey!,
      cache,
      fetch: globalThis.fetch,
      now: () => new Date(),
    });
  },
  finalize(input) {
    return finalizeKoreaPublicAreaSummaryJob(input, {
      cache,
      now: () => new Date(),
    });
  },
  buildArtifact: buildPublicAreaSummaryArtifact,
});

export const GET = publicAreaSummaryJobMethodNotAllowed;
export const HEAD = publicAreaSummaryJobMethodNotAllowed;
export const OPTIONS = publicAreaSummaryJobMethodNotAllowed;
export const PUT = publicAreaSummaryJobMethodNotAllowed;
export const PATCH = publicAreaSummaryJobMethodNotAllowed;
export const DELETE = publicAreaSummaryJobMethodNotAllowed;
