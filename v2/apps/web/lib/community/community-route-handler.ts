import 'server-only';

import type {
  CommunityConfigurationCode,
  CommunityEnvironment,
} from './community-environment.server';
import {
  COMMUNITY_RESPONDENT_COOKIE,
} from './community-identity.server';
import {
  CommunityServiceError,
  type CommunityRequestContext,
  type CommunityServiceResult,
} from './community-service.server';

const NO_STORE = 'private, no-store';
const MAX_BODY_BYTES = 2_048;
const SCOPE_KEYS = ['marketId', 'scopeType', 'scopeId', 'evidenceId'] as const;
const BASE_HEADERS = {
  'Cache-Control': NO_STORE,
  'Content-Type': 'application/json; charset=utf-8',
} as const;

type EnvironmentFactory = () => CommunityEnvironment;

function response(
  body: Readonly<Record<string, unknown>>,
  status: number,
  setCookie: string | null = null,
): Response {
  return Response.json(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      ...(setCookie === null ? {} : { 'Set-Cookie': setCookie }),
    },
  });
}

function unavailable(code: string, status: number): Response {
  return response({ state: 'unavailable', code }, status);
}

function configurationUnavailable(
  code: CommunityConfigurationCode,
  method: 'GET' | 'POST' | 'DELETE',
): Response {
  return unavailable(code, method === 'GET' ? 200 : 503);
}

function scopeFrom(request: Request): Readonly<Record<(typeof SCOPE_KEYS)[number], string>> {
  const parameters = new URL(request.url).searchParams;
  const actualKeys = [...parameters.keys()];
  if (
    actualKeys.length !== SCOPE_KEYS.length ||
    !SCOPE_KEYS.every((key) => parameters.getAll(key).length === 1) ||
    actualKeys.some((key) => !SCOPE_KEYS.includes(key as (typeof SCOPE_KEYS)[number]))
  ) {
    throw new TypeError('Invalid Community query.');
  }
  return Object.freeze({
    marketId: parameters.get('marketId')!,
    scopeType: parameters.get('scopeType')!,
    scopeId: parameters.get('scopeId')!,
    evidenceId: parameters.get('evidenceId')!,
  });
}

function cookieValue(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (cookie === null) return null;
  for (const segment of cookie.split(';')) {
    const [rawName, ...rawValue] = segment.trim().split('=');
    if (rawName === COMMUNITY_RESPONDENT_COOKIE) return rawValue.join('=') || null;
  }
  return null;
}

function networkAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded === null) return null;
  const first = forwarded.split(',')[0]?.trim();
  return first === undefined || first.length === 0 ? null : first;
}

function requestContext(
  request: Request,
  bodyBytes: number,
): CommunityRequestContext {
  return Object.freeze({
    origin: request.headers.get('origin'),
    contentType: request.headers.get('content-type'),
    bodyBytes,
    cookieValue: cookieValue(request),
    networkAddress: networkAddress(request),
  });
}

function preflightWrite(request: Request): Response | null {
  const origin = request.headers.get('origin');
  if (origin === null || origin !== new URL(request.url).origin) {
    return unavailable('invalid_origin', 403);
  }
  const contentType = request.headers.get('content-type');
  if (contentType === null || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return unavailable('unsupported_media_type', 415);
  }
  return null;
}

function successful(result: CommunityServiceResult): Response {
  return response({
    state: result.state,
    selection: result.selection,
    aggregate: result.aggregate,
  }, 200, result.setCookie);
}

function failed(error: unknown): Response {
  if (error instanceof CommunityServiceError) {
    return error.code === 'rate_limited'
      ? response({ state: 'limited', code: error.code }, error.status)
      : unavailable(error.code, error.status);
  }
  return unavailable('storage_unavailable', 503);
}

export function createCommunityRouteHandlers(environment: EnvironmentFactory) {
  return Object.freeze({
    async GET(request: Request): Promise<Response> {
      let scope;
      try {
        scope = scopeFrom(request);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const configured = environment();
      if (configured.state === 'unavailable') {
        return configurationUnavailable(configured.code, 'GET');
      }
      try {
        return successful(await configured.service.read(scope, requestContext(request, 0)));
      } catch (error) {
        return failed(error);
      }
    },

    async POST(request: Request): Promise<Response> {
      const preflight = preflightWrite(request);
      if (preflight !== null) return preflight;
      let text: string;
      try {
        text = await request.text();
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const bodyBytes = new TextEncoder().encode(text).byteLength;
      if (bodyBytes > MAX_BODY_BYTES) return unavailable('payload_too_large', 413);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const configured = environment();
      if (configured.state === 'unavailable') {
        return configurationUnavailable(configured.code, 'POST');
      }
      try {
        return successful(await configured.service.upsert(
          body,
          requestContext(request, bodyBytes),
        ));
      } catch (error) {
        return failed(error);
      }
    },

    async DELETE(request: Request): Promise<Response> {
      const preflight = preflightWrite(request);
      if (preflight !== null) return preflight;
      let scope;
      try {
        scope = scopeFrom(request);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const configured = environment();
      if (configured.state === 'unavailable') {
        return configurationUnavailable(configured.code, 'DELETE');
      }
      try {
        return successful(await configured.service.delete(
          scope,
          requestContext(request, 0),
        ));
      } catch (error) {
        return failed(error);
      }
    },
  });
}
