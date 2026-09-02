import 'server-only';

import { randomBytes } from 'node:crypto';

import {
  finalizeKoreaSaleSnapshotJob,
  runKoreaSaleSummaryBatch,
} from '@signedprice/korea-rent';

import { buildKoreaSaleEvidenceArtifact } from '@/lib/public-market/sale-evidence-artifact-builder.server';
import {
  createKoreaSaleSnapshotJobHandler,
  createKoreaSaleSnapshotPublicExportHandler,
  createKoreaSaleSnapshotRunnerPage,
  type KoreaSaleSnapshotJobHandlerDependencies,
} from '@/lib/public-market/korea-sale-job-handler.server';
import { createVercelRuntimeCache } from '@/lib/rent-check/runtime-cache.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const cache = createVercelRuntimeCache();
const serviceKey = process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
  ?? process.env.DATA_GO_KR_SERVICE_KEY;
const exportReferenceInstant = '2026-09-02T00:00:00.000Z';
const exportCapability = randomBytes(32).toString('hex');

const handlerDependencies = {
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
      now: () => new Date(input.referenceInstant),
    });
  },
  buildSaleArtifact: buildKoreaSaleEvidenceArtifact,
} satisfies Omit<KoreaSaleSnapshotJobHandlerDependencies, 'environment' | 'token'>;

export const POST = createKoreaSaleSnapshotJobHandler({
  ...handlerDependencies,
  environment: process.env.VERCEL_ENV,
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
});

const exportPostHandler = createKoreaSaleSnapshotJobHandler({
  ...handlerDependencies,
  environment: 'preview',
  token: exportCapability,
});

const publicExport = createKoreaSaleSnapshotPublicExportHandler({
  environment: process.env.VERCEL_ENV,
  token: exportCapability,
  referenceInstant: exportReferenceInstant,
  allowCollection: process.env.VERCEL_ENV === 'production',
  postHandler: exportPostHandler,
});

export const GET = (request: Request) => (
  new URL(request.url).searchParams.has('export')
    ? publicExport(request)
    : createKoreaSaleSnapshotRunnerPage(
      process.env.VERCEL_ENV,
      process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
    )
);
