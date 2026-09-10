import 'server-only';

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { gzipSync } from 'node:zlib';

import type {
  KoreaSaleEvidence,
  KoreaSaleSnapshotFinalization,
  KoreaSaleSummaryBatchResult,
} from '@signedprice/korea-rent';

import { createKoreaSnapshotPublicExportHandler } from './snapshot-public-export.server';

type BuiltSaleArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
  recordCount: number;
}>;

const ARTIFACT_CHUNK_CHAR_LIMIT = 512 * 1024;

type EncodedSaleArtifact = Readonly<{
  dataset: 'kr-sale';
  sha256: string;
  recordCount: number;
  encoding: 'gzip+base64';
  compressedBytes: number;
  chunkCount: number;
  payload: string;
}>;

function encodeSaleArtifact(sale: BuiltSaleArtifact): EncodedSaleArtifact {
  const compressed = gzipSync(Buffer.from(sale.serialized, 'utf8'), { level: 9 });
  const payload = compressed.toString('base64');
  return Object.freeze({
    dataset: 'kr-sale',
    sha256: sale.sha256,
    recordCount: sale.recordCount,
    encoding: 'gzip+base64',
    compressedBytes: compressed.byteLength,
    chunkCount: Math.max(1, Math.ceil(payload.length / ARTIFACT_CHUNK_CHAR_LIMIT)),
    payload,
  });
}

function artifactMetadata(
  encoded: EncodedSaleArtifact,
): Omit<EncodedSaleArtifact, 'payload'> {
  const { payload: _payload, ...metadata } = encoded;
  void _payload;
  return Object.freeze(metadata);
}

function artifactChunk(encoded: EncodedSaleArtifact, chunk: number): string | undefined {
  if (chunk < 0 || chunk >= encoded.chunkCount) return undefined;
  return encoded.payload.slice(
    chunk * ARTIFACT_CHUNK_CHAR_LIMIT,
    (chunk + 1) * ARTIFACT_CHUNK_CHAR_LIMIT,
  );
}

export type KoreaSaleSnapshotJobHandlerDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  serviceKey: string | undefined;
  runBatch(input: Readonly<{
    referenceInstant: string;
    cursor: number;
  }>): Promise<KoreaSaleSummaryBatchResult>;
  finalize(input: Readonly<{
    referenceInstant: string;
  }>): Promise<KoreaSaleSnapshotFinalization>;
  buildSaleArtifact(input: KoreaSaleEvidence): Promise<BuiltSaleArtifact>;
  nowMs?: () => number;
}>;

export type KoreaSaleSnapshotPublicExportDependencies = Readonly<{
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

export function createKoreaSaleSnapshotRunnerToken(
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

export function createKoreaSaleSnapshotRunnerPage(
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
  const runnerToken = createKoreaSaleSnapshotRunnerToken(secret, dependencies);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Korea sale snapshot runner</title>
  <style>
    body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:0 20px;color:#171717}
    main{border:1px solid #d4d4d4;padding:24px}
    button,a{font:inherit}
    button,a{display:inline-block;margin-top:16px;padding:12px 16px;border:0;background:#171717;color:white;text-decoration:none;cursor:pointer}
    button:disabled{opacity:.5;cursor:wait}#download[hidden]{display:none}#status{min-height:24px;margin-top:16px;white-space:pre-wrap}
  </style>
</head>
<body>
  <main data-korea-sale-snapshot-runner data-runner-version="1">
    <h1>Korea sale snapshot</h1>
    <p>Preview-only runner for all-area apartment, officetel, villa, and detached-house sale evidence.</p>
    <button id="run" type="button">Run 700-coordinate sale snapshot</button>
    <p id="status" role="status">Ready in this protected Preview.</p>
    <a id="download" download="korea-sale-snapshot-bundle.json" hidden>Download verified bundle</a>
  </main>
  <script>
    const endpoint = '/api/internal/korea-sale-snapshot/';
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
      if (!response.ok) throw new Error('request_failed_' + response.status);
      return response.json();
    }
    run.addEventListener('click', async () => {
      run.disabled = true; download.hidden = true;
      const referenceInstant = new Date().toISOString();
      try {
        let cursor = 0;
        while (cursor < 700) {
          status.textContent = 'Processing ' + cursor + '/700 sale coordinates…';
          const result = await post({ action: 'batch', referenceInstant, cursor }, runnerToken);
          if (result.status !== 'progress' || !Number.isSafeInteger(result.nextCursor) || result.nextCursor <= cursor || result.nextCursor > 700 || result.totalCoordinates !== 700) throw new Error('invalid_progress');
          cursor = result.nextCursor;
        }
        status.textContent = 'Finalizing verified sale artifact…';
        const result = await post({ action: 'finalize', referenceInstant }, runnerToken);
        if (result.status !== 'ready' || result.completedCoordinates !== 700 || typeof result.artifacts !== 'object' || result.artifacts === null) throw new Error('invalid_artifact');
        const sale = result.artifacts.sale;
        const chunks = [];
        for (let chunk = 0; chunk < sale.chunkCount; chunk += 1) {
          status.textContent = 'Downloading kr-sale chunk ' + (chunk + 1) + '/' + sale.chunkCount + '…';
          const part = await post({
            action: 'artifact', referenceInstant, dataset: 'kr-sale', chunk,
          }, runnerToken);
          if (part.status !== 'chunk' || part.dataset !== 'kr-sale' || part.sha256 !== sale.sha256 || part.chunk !== chunk || part.chunkCount !== sale.chunkCount || typeof part.payload !== 'string' || part.payload.length > 524288) throw new Error('invalid_artifact_chunk');
          chunks.push(part.payload);
        }
        sale.payload = chunks.join('');
        const blob = new Blob([JSON.stringify(result, null, 2) + '\\n'], { type: 'application/json' });
        download.href = URL.createObjectURL(blob); download.hidden = false;
        status.textContent = 'Ready: period ' + result.period + '. Sale SHA-256 ' + result.artifacts.sale.sha256 + '.';
      } catch (error) {
        status.textContent = 'Job failed. Review Preview function logs and retry.';
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

export function createKoreaSaleSnapshotPublicExportHandler(
  dependencies: KoreaSaleSnapshotPublicExportDependencies,
): (request: Request) => Promise<Response> {
  return createKoreaSnapshotPublicExportHandler({
    ...dependencies,
    datasets: Object.freeze(['kr-sale']),
  });
}

export function createKoreaSaleSnapshotJobHandler(
  dependencies: KoreaSaleSnapshotJobHandlerDependencies,
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
      if (Object.keys(body).length !== 3 || !Number.isSafeInteger(body.cursor) ||
        (body.cursor as number) < 0 || (body.cursor as number) > 700) {
        return json({ status: 'error', code: 'invalid_request' }, 400);
      }
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
        || body.dataset !== 'kr-sale'
        || !Number.isSafeInteger(body.chunk)
        || (body.chunk as number) < 0
      ) return json({ status: 'error', code: 'invalid_request' }, 400);
      try {
        const finalized = await dependencies.finalize({ referenceInstant: body.referenceInstant });
        if (finalized.completedCoordinates !== 700) {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        const encoded = encodeSaleArtifact(
          await dependencies.buildSaleArtifact(finalized.evidence),
        );
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
          && error.message === 'Sale summary source coverage is incomplete.'
        ) return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    if (body.action === 'finalize' && Object.keys(body).length === 2) {
      try {
        const finalized = await dependencies.finalize({ referenceInstant: body.referenceInstant });
        if (finalized.completedCoordinates !== 700) {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        const sale = await dependencies.buildSaleArtifact(finalized.evidence);
        const encoded = encodeSaleArtifact(sale);
        return json({
          status: 'ready',
          completedCoordinates: finalized.completedCoordinates,
          period: finalized.period,
          generatedAt: finalized.generatedAt,
          artifacts: {
            sale: artifactMetadata(encoded),
          },
        }, 200);
      } catch (error) {
        if (error instanceof TypeError &&
          error.message === 'Sale summary source coverage is incomplete.') {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        return json({ status: 'error', code: 'job_unavailable' }, 503);
      }
    }

    return json({ status: 'error', code: 'invalid_request' }, 400);
  };
}
