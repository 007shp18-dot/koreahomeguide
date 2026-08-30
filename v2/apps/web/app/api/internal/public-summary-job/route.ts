import 'server-only';

import {
  finalizeKoreaPublicSummaryJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { buildPublicSummaryArtifact } from '@/lib/public-market/artifact-builder.server';
import {
  createPublicSummaryJobPostHandler,
  publicSummaryJobMethodNotAllowed,
} from '@/lib/public-market/job-handler.server';
import {
  createPublicSummaryJobRuntimeCache,
} from '@/lib/public-market/public-summary-job-cache.server';

const cache = createPublicSummaryJobRuntimeCache();
const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = createPublicSummaryJobPostHandler({
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
    return finalizeKoreaPublicSummaryJob(input, {
      cache,
      now: () => new Date(),
    });
  },
  buildArtifact: buildPublicSummaryArtifact,
});

export const GET = publicSummaryJobMethodNotAllowed;
export const HEAD = publicSummaryJobMethodNotAllowed;
export const OPTIONS = publicSummaryJobMethodNotAllowed;
export const PUT = publicSummaryJobMethodNotAllowed;
export const PATCH = publicSummaryJobMethodNotAllowed;
export const DELETE = publicSummaryJobMethodNotAllowed;
