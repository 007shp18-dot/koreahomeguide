import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

import type {
  KoreaObservedBuildingInventory,
  KoreaObservedBuildingInventoryFinalization,
  KoreaPublicSummaryBatchResult,
} from '@signedprice/korea-rent';

type BuiltObservedBuildingArtifact = Readonly<{
  artifact: Readonly<Record<string, unknown>>;
  serialized: string;
  sha256: string;
}>;

export type ObservedBuildingJobHandlerDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  serviceKey: string | undefined;
  runBatch(input: Readonly<{
    referenceInstant: string;
    cursor: number;
  }>): Promise<KoreaPublicSummaryBatchResult>;
  finalize(input: Readonly<{
    referenceInstant: string;
  }>): Promise<KoreaObservedBuildingInventoryFinalization>;
  buildArtifact(input: KoreaObservedBuildingInventory): Promise<BuiltObservedBuildingArtifact>;
}>;

function json(body: Readonly<Record<string, unknown>>, status: number, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', ...headers },
  });
}

function exactToken(actual: string | null, expected: string): boolean {
  if (actual === null || !actual.startsWith('Bearer ')) return false;
  const suppliedDigest = createHash('sha256').update(actual.slice(7)).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

export function createObservedBuildingRunnerPage(environment: string | undefined): Response {
  if (environment !== 'preview') {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Observed building inventory runner</title>
  <style>
    body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:0 20px;color:#171717}
    main{border:1px solid #d4d4d4;border-radius:12px;padding:24px}label{display:block;font-weight:650;margin-bottom:8px}
    input,button,a{font:inherit}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #a3a3a3;border-radius:8px}
    button,a{display:inline-block;margin-top:16px;padding:10px 16px;border:0;border-radius:8px;background:#171717;color:white;text-decoration:none;cursor:pointer}
    button:disabled{opacity:.5;cursor:wait}#download[hidden]{display:none}#status{min-height:24px;margin-top:16px;white-space:pre-wrap}
  </style>
</head>
<body>
  <main data-observed-building-runner>
    <h1>Observed building inventory</h1>
    <p>Preview-only runner. The bearer token stays in this browser session and is sent only to the same-origin internal endpoint.</p>
    <label for="token">Preview job token</label>
    <input id="token" type="password" autocomplete="off" spellcheck="false">
    <button id="run" type="button">Run 700-coordinate job</button>
    <p id="status" role="status">Ready.</p>
    <a id="download" download="observed-building-inventory.json" hidden>Download verified artifact</a>
  </main>
  <script>
    const endpoint = '/api/internal/observed-building-inventory/';
    const run = document.getElementById('run');
    const tokenInput = document.getElementById('token');
    const status = document.getElementById('status');
    const download = document.getElementById('download');

    async function post(body, token) {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('request_failed_' + response.status);
      return response.json();
    }

    run.addEventListener('click', async () => {
      const token = tokenInput.value;
      if (token.length < 24) { status.textContent = 'Enter the Preview job token.'; return; }
      run.disabled = true;
      download.hidden = true;
      const referenceInstant = new Date().toISOString();
      try {
        let cursor = 0;
        while (cursor < 700) {
          status.textContent = 'Processing ' + cursor + '/700 coordinates…';
          const result = await post({ action: 'batch', referenceInstant, cursor }, token);
          if (result.status !== 'progress' || !Number.isSafeInteger(result.nextCursor) || result.nextCursor <= cursor || result.nextCursor > 700 || result.totalCoordinates !== 700) {
            throw new Error('invalid_progress');
          }
          cursor = result.nextCursor;
        }
        status.textContent = 'Finalizing verified artifact…';
        const result = await post({ action: 'finalize', referenceInstant }, token);
        if (result.status !== 'ready' || result.completedCoordinates !== 700 || typeof result.artifact !== 'object' || result.artifact === null) {
          throw new Error('invalid_artifact');
        }
        const blob = new Blob([JSON.stringify(result.artifact, null, 2) + '\\n'], { type: 'application/json' });
        download.href = URL.createObjectURL(blob);
        download.hidden = false;
        tokenInput.value = '';
        status.textContent = 'Ready: 700/700 coordinates. Period ' + result.period + '. SHA-256 ' + result.sha256 + '.';
      } catch (error) {
        status.textContent = 'Job failed. Review the Preview function logs and retry.';
      } finally {
        run.disabled = false;
      }
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

export function createObservedBuildingJobHandler(
  dependencies: ObservedBuildingJobHandlerDependencies,
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
    if (!isObject(body) || !isCanonicalInstant(body.referenceInstant)) {
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
        const built = await dependencies.buildArtifact(finalized.inventory);
        return json({
          status: 'ready',
          completedCoordinates: finalized.completedCoordinates,
          period: finalized.period,
          generatedAt: finalized.generatedAt,
          sha256: built.sha256,
          artifact: built.artifact,
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
