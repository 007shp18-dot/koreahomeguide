import 'server-only';

type KoreaSnapshotPublicExportDependencies = Readonly<{
  environment: string | undefined;
  token: string | undefined;
  referenceInstant: string;
  datasets: readonly string[];
  postHandler(request: Request): Promise<Response>;
}>;

function responseHeaders(contentType?: string | null): Headers {
  const headers = new Headers({
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; base-uri 'none'; form-action 'none'",
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow',
  });
  if (contentType !== undefined && contentType !== null) {
    headers.set('content-type', contentType);
  }
  return headers;
}

function empty(status: number, allow?: string): Response {
  const headers = responseHeaders();
  if (allow !== undefined) headers.set('allow', allow);
  return new Response(null, { status, headers });
}

function isCanonicalChunk(value: string | null): value is string {
  if (value === null || !/^(?:0|[1-9]\d*)$/.test(value)) return false;
  return Number.isSafeInteger(Number(value));
}

export function createKoreaSnapshotPublicExportHandler(
  dependencies: KoreaSnapshotPublicExportDependencies,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') return empty(405, 'GET');
    if (dependencies.environment !== 'production') return empty(404);
    if (
      dependencies.token === undefined
      || dependencies.token.length < 24
      || !Number.isFinite(new Date(dependencies.referenceInstant).getTime())
      || new Date(dependencies.referenceInstant).toISOString() !== dependencies.referenceInstant
    ) return empty(503);

    const url = new URL(request.url);
    let body: Readonly<Record<string, unknown>> | undefined;

    if (
      url.searchParams.getAll('export').length === 1
      && url.searchParams.get('export') === 'manifest'
      && url.searchParams.getAll('dataset').length === 0
      && url.searchParams.getAll('chunk').length === 0
    ) {
      body = Object.freeze({
        action: 'finalize',
        referenceInstant: dependencies.referenceInstant,
      });
    } else if (
      url.searchParams.getAll('export').length === 1
      && url.searchParams.get('export') === 'artifact'
      && url.searchParams.getAll('dataset').length === 1
      && dependencies.datasets.includes(url.searchParams.get('dataset') ?? '')
      && url.searchParams.getAll('chunk').length === 1
      && isCanonicalChunk(url.searchParams.get('chunk'))
    ) {
      body = Object.freeze({
        action: 'artifact',
        referenceInstant: dependencies.referenceInstant,
        dataset: url.searchParams.get('dataset'),
        chunk: Number(url.searchParams.get('chunk')),
      });
    }

    if (body === undefined) return empty(400);

    try {
      const internalResponse = await dependencies.postHandler(new Request(request.url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${dependencies.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      }));
      return new Response(internalResponse.body, {
        status: internalResponse.status,
        statusText: internalResponse.statusText,
        headers: responseHeaders(internalResponse.headers.get('content-type')),
      });
    } catch {
      return empty(503);
    }
  };
}
