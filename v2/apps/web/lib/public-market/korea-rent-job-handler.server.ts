import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

import type {
  KoreaObservedBuildingInventory,
  KoreaPublicSummaryBatchResult,
  KoreaRentEvidence,
  KoreaRentSnapshotFinalization,
} from '@signedprice/korea-rent';

type BuiltArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
}>;

type BuiltRentArtifact = BuiltArtifact & Readonly<{ recordCount: number }>;
type BuiltConversionArtifact = BuiltArtifact & Readonly<{ eligiblePairCount: number }>;

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
}>;

function json(body: Readonly<Record<string, unknown>>, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

function exactToken(actual: string | null, expected: string): boolean {
  if (actual === null || !actual.startsWith('Bearer ')) return false;
  const supplied = createHash('sha256').update(actual.slice(7)).digest();
  const configured = createHash('sha256').update(expected).digest();
  return timingSafeEqual(supplied, configured);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

export function createKoreaRentSnapshotRunnerPage(environment: string | undefined): Response {
  if (environment !== 'preview') {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Korea rent snapshot runner</title>
  <style>
    body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:0 20px;color:#171717}
    main{border:1px solid #d4d4d4;padding:24px}label{display:block;font-weight:650;margin-bottom:8px}
    input,button,a{font:inherit}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #737373}
    button,a{display:inline-block;margin-top:16px;padding:12px 16px;border:0;background:#171717;color:white;text-decoration:none;cursor:pointer}
    button:disabled{opacity:.5;cursor:wait}#download[hidden]{display:none}#status{min-height:24px;margin-top:16px;white-space:pre-wrap}
  </style>
</head>
<body>
  <main data-korea-rent-snapshot-runner data-runner-version="1">
    <h1>Korea rent snapshot</h1>
    <p>Preview-only runner for observed buildings, all-area rent evidence, and verified conversion pairs.</p>
    <label for="token">Preview job token</label>
    <input id="token" type="password" autocomplete="off" spellcheck="false">
    <button id="run" type="button">Run 700-coordinate rent snapshot</button>
    <p id="status" role="status">Ready.</p>
    <a id="download" download="korea-rent-snapshot-bundle.json" hidden>Download verified bundle</a>
  </main>
  <script>
    const endpoint = '/api/internal/korea-rent-snapshot/';
    const run = document.getElementById('run');
    const tokenInput = document.getElementById('token');
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
      const token = tokenInput.value;
      if (token.length < 24) { status.textContent = 'Enter the Preview job token.'; return; }
      run.disabled = true; download.hidden = true;
      const referenceInstant = new Date().toISOString();
      try {
        let cursor = 0;
        while (cursor < 700) {
          status.textContent = 'Processing ' + cursor + '/700 rental coordinates…';
          const result = await post({ action: 'batch', referenceInstant, cursor }, token);
          if (result.status !== 'progress' || !Number.isSafeInteger(result.nextCursor) || result.nextCursor <= cursor || result.nextCursor > 700 || result.totalCoordinates !== 700) throw new Error('invalid_progress');
          cursor = result.nextCursor;
        }
        status.textContent = 'Finalizing verified rent, building, and conversion artifacts…';
        const result = await post({ action: 'finalize', referenceInstant }, token);
        if (result.status !== 'ready' || result.completedCoordinates !== 700 || typeof result.artifacts !== 'object' || result.artifacts === null) throw new Error('invalid_artifact');
        const blob = new Blob([JSON.stringify(result, null, 2) + '\\n'], { type: 'application/json' });
        download.href = URL.createObjectURL(blob); download.hidden = false; tokenInput.value = '';
        status.textContent = 'Ready: period ' + result.period + '. Rent SHA-256 ' + result.artifacts.rent.sha256 + '. Conversion pairs ' + result.artifacts.conversion.recordCount + '.';
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
    if (!exactToken(request.headers.get('authorization'), dependencies.token)) {
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

    if (body.action === 'finalize' && Object.keys(body).length === 2) {
      try {
        const finalized = await dependencies.finalize({
          referenceInstant: body.referenceInstant,
        });
        if (finalized.completedCoordinates !== 700) {
          return json({ status: 'error', code: 'source_coverage_incomplete' }, 409);
        }
        const [rent, buildingRegistry, conversion] = await Promise.all([
          dependencies.buildRentArtifact(finalized.evidence),
          dependencies.buildInventoryArtifact(finalized.inventory),
          dependencies.buildConversionArtifact({
            records: finalized.conversionRecords,
            period: finalized.period,
            generatedAt: finalized.generatedAt,
          }),
        ]);
        return json({
          status: 'ready',
          completedCoordinates: finalized.completedCoordinates,
          period: finalized.period,
          generatedAt: finalized.generatedAt,
          artifacts: {
            rent: {
              dataset: 'kr-rent',
              sha256: rent.sha256,
              recordCount: rent.recordCount,
              artifact: rent.artifact,
            },
            buildingRegistry: {
              dataset: 'kr-building-registry',
              sha256: buildingRegistry.sha256,
              recordCount: finalized.inventory.records.length,
              artifact: buildingRegistry.artifact,
            },
            conversion: {
              dataset: 'kr-conversion',
              sha256: conversion.sha256,
              recordCount: conversion.eligiblePairCount,
              artifact: conversion.artifact,
            },
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
