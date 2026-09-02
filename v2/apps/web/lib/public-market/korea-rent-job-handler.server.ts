import 'server-only';

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { gzipSync } from 'node:zlib';

import type {
  KoreaObservedBuildingInventory,
  KoreaPublicSummaryBatchResult,
  KoreaRentEvidence,
  KoreaRentSnapshotFinalization,
} from '@signedprice/korea-rent';

import { createKoreaSnapshotPublicExportHandler } from './snapshot-public-export.server';

type BuiltArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
}>;

type BuiltRentArtifact = BuiltArtifact & Readonly<{ recordCount: number }>;
type BuiltConversionArtifact = BuiltArtifact & Readonly<{ eligiblePairCount: number }>;

const ARTIFACT_CHUNK_CHAR_LIMIT = 512 * 1024;

type EncodedArtifact = Readonly<{
  dataset: 'kr-rent' | 'kr-building-registry' | 'kr-conversion';
  sha256: string;
  recordCount: number;
  encoding: 'gzip+base64';
  compressedBytes: number;
  chunkCount: number;
  payload: string;
}>;

function encodeArtifact(
  dataset: 'kr-rent' | 'kr-building-registry' | 'kr-conversion',
  built: BuiltArtifact,
  recordCount: number,
): EncodedArtifact {
  const compressed = gzipSync(Buffer.from(built.serialized, 'utf8'), { level: 9 });
  const payload = compressed.toString('base64');
  return Object.freeze({
    dataset,
    sha256: built.sha256,
    recordCount,
    encoding: 'gzip+base64',
    compressedBytes: compressed.byteLength,
    chunkCount: Math.max(1, Math.ceil(payload.length / ARTIFACT_CHUNK_CHAR_LIMIT)),
    payload,
  });
}

function artifactMetadata(encoded: EncodedArtifact): Omit<EncodedArtifact, 'payload'> {
  const { payload: _payload, ...metadata } = encoded;
  return Object.freeze(metadata);
}

function artifactChunk(encoded: EncodedArtifact, chunk: number): string | undefined {
  if (chunk < 0 || chunk >= encoded.chunkCount) return undefined;
  return encoded.payload.slice(
    chunk * ARTIFACT_CHUNK_CHAR_LIMIT,
    (chunk + 1) * ARTIFACT_CHUNK_CHAR_LIMIT,
  );
}

export type KoreaRentSnapshotJobHandlerDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  serviceKey: string | undefined;
  runBatch(input: Readonly<{
    referenceInstant: string;
    cursor: number;
  }>): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: Readonly<{
    referenceInstant: string;
  }>): Promise<KoreaRentSnapshotFinalization>;
  buildRentArtifact(input: KoreaRentEvidence): Promise<BuiltRentArtifact>;
  buildInventoryArtifact(input: KoreaObservedBuildingInventory): Promise<BuiltArtifact>;
  buildConversionArtifact(input: Readonly<{
    records: KoreaRentSnapshotFinalization['conversionRecords'];
    period: string;
    generatedAt: string;
  }>): Promise<BuiltConversionArtifact>;
  nowMs?: () => number;
}>;

export type KoreaRentSnapshotPublicExportDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  referenceInstant: string;
  allowCollection?: boolean;
  postHandler(request: Request): Promise<Response>;
}>;

const RUNNER_TOKEN_TTL_SECONDS = 6 * 60 * 60;

function json(body: Readonly<Record<string, unknown>>, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

function exactToken(actual: string | null, expected: string, nowMs: number): boolean {
  if (actual === null || !actual.startsWith('Bearer ')) return false;
  const suppliedValue = actual.slice(7);
  const supplied = createHash('sha256').update(suppliedValue).digest();
  const configured = createHash('sha256').update(expected).digest();
  if (timingSafeEqual(supplied, configured)) return true;

  const [version, expiresRaw, nonce, signature] = suppliedValue.split('.');
  if (
    version !== 'v1'
    || !/^\d{10}$/.test(expiresRaw ?? '')
    || !/^[a-f0-9]{32}$/.test(nonce ?? '')
    || !/^[a-f0-9]{64}$/.test(signature ?? '')
  ) return false;
  const expiresSeconds = Number(expiresRaw);
  const nowSeconds = Math.floor(nowMs / 1_000);
  if (
    !Number.isSafeInteger(expiresSeconds)
    || expiresSeconds < nowSeconds
    || expiresSeconds - nowSeconds > RUNNER_TOKEN_TTL_SECONDS
  ) return false;
  const payload = `${version}.${expiresRaw}.${nonce}`;
  const expectedSignature = createHmac('sha256', expected).update(payload).digest();
  return timingSafeEqual(Buffer.from(signature!, 'hex'), expectedSignature);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

export function createKoreaRentSnapshotRunnerToken(
  secret: string,
  dependencies: Readonly<{
    nowMs?: () => number;
    nonce?: () => string;
  }> = Object.freeze({}),
): string {
  if (secret.length < 24) throw new TypeError('Preview runner secret is unavailable.');
  const nowMs = (dependencies.nowMs ?? Date.now)();
  const nonce = (dependencies.nonce ?? (() => randomBytes(16).toString('hex')))();
  if (!Number.isFinite(nowMs) || !/^[a-f0-9]{32}$/.test(nonce)) {
    throw new TypeError('Preview runner delegation is invalid.');
  }
  const expiresSeconds = Math.floor(nowMs / 1_000) + RUNNER_TOKEN_TTL_SECONDS;
  const payload = `v1.${expiresSeconds}.${nonce}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function createKoreaRentSnapshotRunnerPage(
  environment: string | undefined,
  secret: string | undefined,
  dependencies: Readonly<{
    nowMs?: () => number;
    nonce?: () => string;
  }> = Object.freeze({}),
): Response {
  if (environment !== 'preview') {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  if (secret === undefined || secret.length < 24) {
    return new Response(null, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  const runnerToken = createKoreaRentSnapshotRunnerToken(secret, dependencies);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Korea rent snapshot runner</title>
  <style>
    body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:0 20px;color:#171717}
    main{border:1px solid #d4d4d4;padding:24px}
    button,a{font:inherit}
    button,a{display:inline-block;margin-top:16px;padding:12px 16px;border:0;background:#171717;color:white;text-decoration:none;cursor:pointer}
    button:disabled{opacity:.5;cursor:wait}#download[hidden]{display:none}#status{min-height:24px;margin-top:16px;white-space:pre-wrap}
  </style>
</head>
<body>
  <main data-korea-rent-snapshot-runner data-runner-version="1">
    <h1>Korea rent snapshot</h1>
    <p>Preview-only runner for observed buildings, all-area rent evidence, and verified conversion pairs.</p>
    <button id="run" type="button">Run 700-coordinate rent snapshot</button>
    <p id="status" role="status">Ready in this protected Preview.</p>
    <a id="download" download="korea-rent-snapshot-bundle.json" hidden>Download verified bundle</a>
  </main>
  <script>
    const endpoint = '/api/internal/korea-rent-snapshot/';
    const runnerToken = ${JSON.stringify(runnerToken)};
    const run = document.getElementById('run');
    const status = document.getElementById('status');
    const download = document.getElementById('download');
    async function post(body, token) {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure && typeof failure.code === 'string'
          ? failure.code : 'request_failed_' + response.status);
      }
      return response.json();
    }
    run.addEventListener('click', async () => {
      run.disabled = true; download.hidden = true;
      const referenceInstant = new Date().toISOString();
      try {
        let cursor = 0;
        while (cursor < 700) {
          status.textContent = 'Processing ' + cursor + '/700 rental coordinates…';
          const result = await post({ action: 'batch', referenceInstant, cursor }, runnerToken);
          if (result.status !== 'progress' || !Number.isSafeInteger(result.nextCursor) || result.nextCursor <= cursor || result.nextCursor > 700 || result.totalCoordinates !== 700) throw new Error('invalid_progress');
          cursor = result.nextCursor;
        }
        status.textContent = 'Finalizing verified rent, building, and conversion artifacts…';
        const result = await post({ action: 'finalize', referenceInstant }, runnerToken);
        if (result.status !== 'ready' || result.completedCoordinates !== 700 || typeof result.artifacts !== 'object' || result.artifacts === null) throw new Error('invalid_artifact');
        for (const artifact of Object.values(result.artifacts)) {
          if (artifact.status === 'unavailable') continue;
          const chunks = [];
          for (let chunk = 0; chunk < artifact.chunkCount; chunk += 1) {
            status.textContent = 'Downloading ' + artifact.dataset + ' chunk ' + (chunk + 1) + '/' + artifact.chunkCount + '…';
            const part = await post({
              action: 'artifact', referenceInstant,
              dataset: artifact.dataset, chunk,
            }, runnerToken);
            if (part.status !== 'chunk' || part.dataset !== artifact.dataset || part.sha256 !== artifact.sha256 || part.chunk !== chunk || part.chunkCount !== artifact.chunkCount || typeof part.payload !== 'string' || part.payload.length > 524288) throw new Error('invalid_artifact_chunk');
            chunks.push(part.payload);
          }
          artifact.payload = chunks.join('');
        }
        const blob = new Blob([JSON.stringify(result, null, 2) + '\\n'], { type: 'application/json' });
        download.href = URL.createObjectURL(blob); download.hidden = false;
        const conversionStatus = result.artifacts.conversion.status === 'unavailable'
          ? 'Conversion evidence held below publication floor.'
          : 'Conversion pairs ' + result.artifacts.conversion.recordCount + '.';
        status.textContent = 'Ready: period ' + result.period + '. Rent SHA-256 ' + result.artifacts.rent.sha256 + '. ' + conversionStatus;
      } catch (error) {
        status.textContent = 'Job failed: ' + (error instanceof Error ? error.message : 'unknown_error') + '.';
      } finally { run.disabled = false; }
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'",
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export function createKoreaRentSnapshotPublicExportHandler(
  dependencies: KoreaRentSnapshotPublicExportDependencies,
): (request: Request) => Promise<Response> {
  return createKoreaSnapshotPublicExportHandler({
    ...dependencies,
    datasets: Object.freeze(['kr-rent', 'kr-building-registry', 'kr-conversion']),
  });
}

export function createKoreaRentSnapshotJobHandler(
  dependencies: KoreaRentSnapshotJobHandlerDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') {
      return json({ status: 'error', code: 'method_not_allowed' }, 405, { allow: 'POST' });
    }
    if (dependencies.environment !== 'preview') {
      return json({ status: 'error', code: 'preview_only' }, 403);
    }
    if (dependencies.token === undefined || dependencies.token.length < 24) {
      return json({ status: 'error', code: 'configuration_missing' }, 503);
    }
    if (!exactToken(
      request.headers.get('authorization'),
      dependencies.token,
      (dependencies.nowMs ?? Date.now)(),
    )) {
      return json({ status: 'error', code: 'unauthorized' }, 401);
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ status: 'error', code: 'invalid_request' }, 400);
    }
    if (!isRecord(body) || !isCanonicalInstant(body.referenceInstant)) {
      return json({ status: 'error', code: 'invalid_request' }, 400);
    }

    if (body.action === 'batch') {
      if (
        Object.keys(body).length !== 3
        || !Number.isSafeInteger(body.cursor)
        || (body.cursor as number) < 0
        || (body.cursor as number) > 700
      ) return json({ status: 'error', code: 'invalid_request' }, 400);
      if (dependencies.serviceKey === undefined || dependencies.serviceKey.length === 0) {
        return json({ status: 'error', code: 'configuration_missing' }, 503);
      }
      try {
        const progress = await dependencies.runBatch({
          referenceInstant: body.referenceInstant,
          cursor: body.cursor as number,
        });
        return json(progress, progress.status === 'blocked' ? 403 : 200);
      } catch {
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    if (body.action === 'artifact') {
      if (
        Object.keys(body).length !== 4
        || !['kr-rent', 'kr-building-registry', 'kr-conversion'].includes(
          body.dataset as string,
        )
        || !Number.isSafeInteger(body.chunk)
        || (body.chunk as number) < 0
      ) return json({ status: 'error', code: 'invalid_request' }, 400);
      try {
        const finalized = await dependencies.finalize({
          referenceInstant: body.referenceInstant,
        });
        if (finalized.completedCoordinates !== 700) {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        let encoded: EncodedArtifact;
        if (body.dataset === 'kr-rent') {
          const rent = await dependencies.buildRentArtifact(finalized.evidence);
          encoded = encodeArtifact('kr-rent', rent, rent.recordCount);
        } else if (body.dataset === 'kr-building-registry') {
          const buildingRegistry = await dependencies.buildInventoryArtifact(finalized.inventory);
          encoded = encodeArtifact(
            'kr-building-registry',
            buildingRegistry,
            finalized.inventory.records.length,
          );
        } else {
          const conversion = await dependencies.buildConversionArtifact({
            records: finalized.conversionRecords,
            period: finalized.period,
            generatedAt: finalized.generatedAt,
          });
          encoded = encodeArtifact(
            'kr-conversion',
            conversion,
            conversion.eligiblePairCount,
          );
        }
        const chunk = body.chunk as number;
        const payload = artifactChunk(encoded, chunk);
        if (payload === undefined) return json({ status: 'error', code: 'invalid_request' }, 400);
        return json({
          status: 'chunk',
          ...artifactMetadata(encoded),
          chunk,
          payload,
        }, 200);
      } catch (error) {
        if (
          error instanceof TypeError
          && error.message === 'Public summary source coverage is incomplete.'
        ) return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        if (
          error instanceof TypeError
          && error.message === (
            'Source data did not meet the publication floor for required conversion curves.'
          )
        ) return json({ status: 'error', code: 'publication_floor_not_met' }, 409);
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    if (body.action === 'finalize' && Object.keys(body).length === 2) {
      try {
        const finalized = await dependencies.finalize({
          referenceInstant: body.referenceInstant,
        });
        if (finalized.completedCoordinates !== 700) {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        let rent: BuiltRentArtifact;
        try {
          rent = await dependencies.buildRentArtifact(finalized.evidence);
        } catch {
          return json({ status: 'error', code: 'rent_artifact_unavailable' }, 503);
        }
        let buildingRegistry: BuiltArtifact;
        try {
          buildingRegistry = await dependencies.buildInventoryArtifact(finalized.inventory);
        } catch {
          return json({ status: 'error', code: 'building_artifact_unavailable' }, 503);
        }
        let conversion:
          | BuiltConversionArtifact
          | Readonly<{
            dataset: 'kr-conversion';
            status: 'unavailable';
            code: 'publication_floor_not_met';
          }>;
        try {
          conversion = await dependencies.buildConversionArtifact({
            records: finalized.conversionRecords,
            period: finalized.period,
            generatedAt: finalized.generatedAt,
          });
        } catch (error) {
          if (
            error instanceof TypeError
            && error.message === (
              'Source data did not meet the publication floor for required conversion curves.'
            )
          ) {
            conversion = Object.freeze({
              dataset: 'kr-conversion',
              status: 'unavailable',
              code: 'publication_floor_not_met',
            });
          } else {
            return json({ status: 'error', code: 'conversion_artifact_unavailable' }, 503);
          }
        }
        return json({
          status: 'ready',
          completedCoordinates: finalized.completedCoordinates,
          period: finalized.period,
          generatedAt: finalized.generatedAt,
          artifacts: {
            rent: artifactMetadata(encodeArtifact('kr-rent', rent, rent.recordCount)),
            buildingRegistry: artifactMetadata(encodeArtifact(
              'kr-building-registry', buildingRegistry, finalized.inventory.records.length,
            )),
            conversion: 'status' in conversion
              ? conversion
              : artifactMetadata(encodeArtifact(
                'kr-conversion',
                conversion,
                conversion.eligiblePairCount,
              )),
          },
        }, 200);
      } catch (error) {
        if (
          error instanceof TypeError
          && error.message === 'Public summary source coverage is incomplete.'
        ) return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    return json({ status: 'error', code: 'invalid_request' }, 400);
  };
}
