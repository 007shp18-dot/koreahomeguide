import 'server-only';

import {
  finalizeKoreaPublicBuildingSummaryJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { buildPublicBuildingSummaryArtifact } from '@/lib/public-market/building-artifact-builder.server';
import {
  createPublicBuildingJobPostHandler,
  publicBuildingJobMethodNotAllowed,
} from '@/lib/public-market/building-job-handler.server';
import { createPublicBuildingJobRuntimeCache } from '@/lib/public-market/public-building-job-cache.server';

const cache = createPublicBuildingJobRuntimeCache();
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = createPublicBuildingJobPostHandler({
  vercelEnv: process.env.VERCEL_ENV,
  serviceKey,
  runBatch(input) {
    return runKoreaPublicSummaryBatch(input, {
      serviceKey: serviceKey!, cache, fetch: globalThis.fetch,
      now: () => new Date(), coordinateLimit: 20,
    });
  },
  finalize(input) {
    return finalizeKoreaPublicBuildingSummaryJob(input, { cache, now: () => new Date() });
  },
  buildArtifact: buildPublicBuildingSummaryArtifact,
});

export const GET = publicBuildingJobMethodNotAllowed;
export const HEAD = publicBuildingJobMethodNotAllowed;
export const OPTIONS = publicBuildingJobMethodNotAllowed;
export const PUT = publicBuildingJobMethodNotAllowed;
export const PATCH = publicBuildingJobMethodNotAllowed;
export const DELETE = publicBuildingJobMethodNotAllowed;
