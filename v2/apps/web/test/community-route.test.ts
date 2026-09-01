import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  DELETE as defaultDelete,
  GET as defaultGet,
  POST as defaultPost,
} from '../app/api/community/evidence-response/route';
import {
  createCommunityRouteHandlers,
} from '../lib/community/community-route-handler';
import type { CommunityEnvironment } from '../lib/community/community-environment.server';
import {
  CommunityServiceError,
  type CommunityService,
} from '../lib/community/community-service.server';

const endpoint = 'https://www.signedprice.com/api/community/evidence-response';
const scope = {
  marketId: 'kr-seoul',
  scopeType: 'district',
  scopeId: 'jung-gu',
  evidenceId: 'kr-seoul:2026-01/2026-07:area:v2:all',
} as const;

function scopeUrl(overrides: Partial<typeof scope> = {}): string {
  const query = new URLSearchParams({ ...scope, ...overrides });
  return `${endpoint}?${query}`;
}

function postRequest(
  body: unknown = { schemaVersion: 1, ...scope, direction: 'SIMILAR', reason: null },
  headers: Record<string, string> = {},
): Request {
  return new Request(endpoint, {
    method: 'POST',
    headers: {
      Origin: 'https://www.signedprice.com',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function expectPrivate(response: Response) {
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.has('access-control-allow-origin')).toBe(false);
}

function readyEnvironment(
  overrides: Readonly<Partial<CommunityService>> = {},
): CommunityEnvironment {
  const result = Object.freeze({
    state: 'collecting' as const,
    selection: null,
    aggregate: Object.freeze({ status: 'collecting' as const }),
    setCookie: 'signedprice_community=abc; Path=/; HttpOnly; Secure; SameSite=Lax',
  });
  return {
    state: 'ready',
    service: {
      read: overrides.read ?? (async () => result),
      upsert: overrides.upsert ?? (async () => result),
      delete: overrides.delete ?? (async () => result),
    },
  };
}

describe('Community evidence-response Route Handler', () => {
  it('returns an exact honest unavailable state without configured storage', async () => {
    const response = await defaultGet(new Request(scopeUrl()));

    expect(response.status).toBe(200);
    await expectPrivate(response);
    expect(await response.json()).toEqual({
      state: 'unavailable',
      code: 'storage_not_configured',
    });
  });

  it.each([
    ['POST', defaultPost, postRequest(undefined, { 'Content-Type': 'text/plain' }), 415, 'unsupported_media_type'],
    ['POST wrong origin', defaultPost, postRequest(undefined, { Origin: 'https://evil.example' }), 403, 'invalid_origin'],
    ['POST malformed JSON', defaultPost, postRequest('{'), 400, 'invalid_payload'],
    ['DELETE wrong origin', defaultDelete, new Request(scopeUrl(), {
      method: 'DELETE',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    }), 403, 'invalid_origin'],
  ] as const)('rejects %s before the configuration gate', async (_name, handler, request, status, code) => {
    const response = await handler(request);

    expect(response.status).toBe(status);
    await expectPrivate(response);
    expect(await response.json()).toEqual({ state: 'unavailable', code });
  });

  it('rejects an oversized body before JSON parsing', async () => {
    const response = await defaultPost(postRequest('x'.repeat(2_049)));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      state: 'unavailable', code: 'payload_too_large',
    });
  });

  it('maps a ready service result without exposing its cookie field in JSON', async () => {
    const handlers = createCommunityRouteHandlers(() => readyEnvironment());
    const response = await handlers.POST(postRequest());

    expect(response.status).toBe(200);
    await expectPrivate(response);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(await response.json()).toEqual({
      state: 'collecting',
      selection: null,
      aggregate: { status: 'collecting' },
    });
  });

  it('parses an exact GET scope and rejects repeated or extra query keys', async () => {
    const read = vi.fn(async () => Object.freeze({
      state: 'collecting' as const,
      selection: null,
      aggregate: Object.freeze({ status: 'collecting' as const }),
      setCookie: null,
    }));
    const handlers = createCommunityRouteHandlers(() => readyEnvironment({ read }));

    expect((await handlers.GET(new Request(scopeUrl()))).status).toBe(200);
    expect(read).toHaveBeenCalledWith(scope, expect.any(Object));
    expect((await handlers.GET(new Request(`${scopeUrl()}&scopeId=jongno-gu`))).status).toBe(400);
    expect((await handlers.GET(new Request(`${scopeUrl()}&extra=true`))).status).toBe(400);
  });

  it('maps service rate and storage errors to browser-safe envelopes', async () => {
    const limited = createCommunityRouteHandlers(() => readyEnvironment({
      upsert: async () => { throw new CommunityServiceError('rate_limited', 429); },
    }));
    const unavailable = createCommunityRouteHandlers(() => readyEnvironment({
      upsert: async () => { throw new Error('postgres://secret SQL'); },
    }));

    const limitedResponse = await limited.POST(postRequest());
    expect(limitedResponse.status).toBe(429);
    expect(await limitedResponse.json()).toEqual({ state: 'limited', code: 'rate_limited' });

    const unavailableResponse = await unavailable.POST(postRequest());
    expect(unavailableResponse.status).toBe(503);
    expect(await unavailableResponse.json()).toEqual({
      state: 'unavailable', code: 'storage_unavailable',
    });
  });
});
