import 'server-only';

import {
  finalizeKoreaSaleSnapshotJob,
  runKoreaSaleSummaryBatch,
} from '@signedprice/korea-rent';

import { buildKoreaSaleEvidenceArtifact } from '@/lib/public-market/sale-evidence-artifact-builder.server';
import {
  createKoreaSaleSnapshotJobHandler,
  createKoreaSaleSnapshotRunnerPage,
} from '@/lib/public-market/korea-sale-job-handler.server';
import { createVercelRuntimeCache } from '@/lib/rent-check/runtime-cache.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const cache = createVercelRuntimeCache();
const serviceKey = process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
  ?? process.env.DATA_GO_KR_SERVICE_KEY;

export const GET = () => createKoreaSaleSnapshotRunnerPage(process.env.VERCEL_ENV);

export const POST = createKoreaSaleSnapshotJobHandler({
  environment: process.env.VERCEL_ENV,
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
  serviceKey,
  runBatch(input) {
    return runKoreaSaleSummaryBatch(input, {
      serviceKey: serviceKey ?? '',
      cache,
      fetch: globalThis.fetch,
      now: () => new Date(),
    });
  },
  finalize(input) {
    return finalizeKoreaSaleSnapshotJob(input, {
      cache,
      now: () => new Date(),
    });
  },
  buildSaleArtifact: buildKoreaSaleEvidenceArtifact,
});
