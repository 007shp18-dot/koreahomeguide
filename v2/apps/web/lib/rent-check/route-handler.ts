import {
  KoreaRentServiceError,
  parseSeoulRentCheckQuery,
  type KoreaRentCheckCacheStatus,
  type SeoulRentCheckErrorCode,
  type SeoulRentCheckErrorEnvelope,
  type SeoulRentCheckService,
} from '@signedprice/korea-rent';

import { isTrustedRentCheckRequest } from './request-security';

const NO_STORE = 'private, no-store';
const JSON_HEADERS = {
  'Cache-Control': NO_STORE,
  'Content-Type': 'application/json; charset=utf-8',
} as const;

const STATUS_BY_ERROR = {
  invalid_request: 400,
  untrusted_request: 403,
  rate_limited: 429,
  configuration_missing: 503,
  rights_blocked: 503,
  source_timeout: 503,
  source_malformed: 502,
  source_unavailable: 503,
  internal_error: 500,
} as const satisfies Readonly<Record<SeoulRentCheckErrorCode, number>>;

const CACHE_STATUSES = new Set<KoreaRentCheckCacheStatus>(['hit', 'miss', 'stale']);

export type RentCheckGetHandlerDependencies = {
  readonly allowedHosts: ReadonlySet<string>;
  readonly serviceKey?: string;
  readonly createService: (serviceKey: string) => SeoulRentCheckService;
};

function errorResponse(error: KoreaRentServiceError): Response {
  const envelope: SeoulRentCheckErrorEnvelope = {
    status: 'error',
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      retryAfterSeconds: null,
    },
  };
  return Response.json(envelope, {
    status: STATUS_BY_ERROR[error.code],
    headers: JSON_HEADERS,
  });
}

function normalizedServiceError(error: unknown): KoreaRentServiceError {
  return error instanceof KoreaRentServiceError
    ? error
    : new KoreaRentServiceError('internal_error');
}

export function createRentCheckGetHandler(dependencies: RentCheckGetHandlerDependencies) {
  return async function getRentCheck(request: Request): Promise<Response> {
    if (!isTrustedRentCheckRequest(request, dependencies.allowedHosts)) {
      return errorResponse(new KoreaRentServiceError('untrusted_request'));
    }

    let quote;
    try {
      quote = parseSeoulRentCheckQuery(new URL(request.url).searchParams);
    } catch {
      return errorResponse(new KoreaRentServiceError('invalid_request'));
    }

    if (!dependencies.serviceKey) {
      return errorResponse(new KoreaRentServiceError('configuration_missing'));
    }

    try {
      const service = dependencies.createService(dependencies.serviceKey);
      const result = await service.check(quote);
      if (!CACHE_STATUSES.has(result.cacheStatus)) {
        return errorResponse(new KoreaRentServiceError('internal_error'));
      }
      return Response.json(result.envelope, {
        status: 200,
        headers: {
          ...JSON_HEADERS,
          'X-Signedprice-Cache': result.cacheStatus,
        },
      });
    } catch (error) {
      return errorResponse(normalizedServiceError(error));
    }
  };
}

export function methodNotAllowed(request: Request): Response {
  const headers = {
    Allow: 'GET',
    'Cache-Control': NO_STORE,
  } as const;
  if (request.method === 'HEAD') {
    return new Response(null, { status: 405, headers });
  }

  const error = new KoreaRentServiceError('invalid_request');
  const envelope: SeoulRentCheckErrorEnvelope = {
    status: 'error',
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      retryAfterSeconds: null,
    },
  };
  return Response.json(envelope, {
    status: 405,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
