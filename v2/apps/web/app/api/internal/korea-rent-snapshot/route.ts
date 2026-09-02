import 'server-only';

import {
  finalizeKoreaRentSnapshotJob,
  runKoreaPublicSummaryBatch,
} from '@signedprice/korea-rent';

import { buildObservedBuildingArtifact } from '@/lib/public-market/observed-building-artifact-builder.server';
import { buildKoreaConversionArtifact } from '@/lib/public-market/conversion-artifact-builder.server';
import { buildKoreaRentEvidenceArtifact } from '@/lib/public-market/rent-evidence-artifact-builder.server';
import {
  createKoreaRentSnapshotJobHandler,
  createKoreaRentSnapshotPublicExportHandler,
  createKoreaRentSnapshotRunnerPage,
  type KoreaRentSnapshotJobHandlerDependencies,
} from '@/lib/public-market/korea-rent-job-handler.server';
import { createVercelRuntimeCache } from '@/lib/rent-check/runtime-cache.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const cache = createVercelRuntimeCache();
const serviceKey = process.env.SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY
  ?? process.env.DATA_GO_KR_SERVICE_KEY;
const exportReferenceInstant = '2026-09-02T00:00:00.000Z';

const handlerDependencies = {
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
    return finalizeKoreaRentSnapshotJob(input, {
      cache,
      now: () => new Date(),
    });
  },
  buildRentArtifact: buildKoreaRentEvidenceArtifact,
  buildInventoryArtifact: buildObservedBuildingArtifact,
  buildConversionArtifact: buildKoreaConversionArtifact,
} satisfies Omit<KoreaRentSnapshotJobHandlerDependencies, 'environment' | 'token'>;

export const POST = createKoreaRentSnapshotJobHandler({
  ...handlerDependencies,
  environment: process.env.VERCEL_ENV,
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
});

const exportPostHandler = createKoreaRentSnapshotJobHandler({
  ...handlerDependencies,
  environment: 'preview',
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
});

const publicExport = createKoreaRentSnapshotPublicExportHandler({
  environment: process.env.VERCEL_ENV,
  token: process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
  referenceInstant: exportReferenceInstant,
  postHandler: exportPostHandler,
});

export const GET = (request: Request) => (
  new URL(request.url).searchParams.has('export')
    ? publicExport(request)
    : createKoreaRentSnapshotRunnerPage(
      process.env.VERCEL_ENV,
      process.env.SIGNEDPRICE_INTERNAL_JOB_TOKEN,
    )
);
