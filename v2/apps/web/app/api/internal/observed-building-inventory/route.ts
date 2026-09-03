import 'server-only';

import {
  finalizeKoreaObservedBuildingInventoryJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { createVercelRuntimeCache } from '@/lib/rent-check/runtime-cache.server';
import { buildObservedBuildingArtifact } from '@/lib/public-market/observed-building-artifact-builder.server';
import {
  createObservedBuildingJobHandler,
  createObservedBuildingRunnerPage,
} from '@/lib/public-market/observed-building-job-handler.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const cache = createVercelRuntimeCache();
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

export const GET = () => createObservedBuildingRunnerPage(process.env.VERCEL_ENV);

export const POST = createObservedBuildingJobHandler({
  environment: process.env.VERCEL_ENV,
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
  serviceKey,
  runBatch(input) {
    return runKoreaPublicSummaryBatch(input, {
      serviceKey: serviceKey ?? '',
      cache,
      fetch: globalThis.fetch,
      now: () => new Date(),
    });
  },
  finalize(input) {
    return finalizeKoreaObservedBuildingInventoryJob(input, {
      cache,
      now: () => new Date(),
    });
  },
  buildArtifact: buildObservedBuildingArtifact,
});
