import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { RESEARCH_CONSENT_VERSION } from '../lib/tool-research/contract';
import {
  RESEARCH_OWNER_COOKIE,
  researchOwnerHash,
  serializeResearchOwnerCookie,
} from '../lib/tool-research/identity.server';
import { createToolResearchRouteHandlers } from '../lib/tool-research/route-handler.server';
import type { ToolResearchRepository } from '../lib/tool-research/repository.server';

const endpoint = 'https://www.signedprice.com/api/tools/research';
const cookieValue = 'ab'.repeat(32);

function body() {
  return {
    consent: { granted: true, version: RESEARCH_CONSENT_VERSION },
    retryId: '018f47a6-7e8d-7e79-9f1e-123456789abc',
    snapshot: {
      schemaVersion: 1,
      tool: 'single-quote',
      market: 'kr-seoul',
      currency: 'KRW',
      bands: { askingPrice: 'krw-100m-500m', area: 'sqm-60-85', sample: 'sample-10-24' },
      categories: { transaction: 'sale', housingType: 'apartment', verdict: 'typical', scope: 'district' },
    },
  };
}

function request(payload: unknown = body(), headers: Record<string, string> = {}) {
  return new Request(endpoint, {
    method: 'POST',
    headers: {
      Origin: 'https://www.signedprice.com',
      'Content-Type': 'application/json',
      Cookie: `${RESEARCH_OWNER_COOKIE}=${cookieValue}`,
      ...headers,
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

function repository(overrides: Partial<ToolResearchRepository> = {}): ToolResearchRepository {
  return {
    submit: overrides.submit ?? (async () => ({ state: 'stored', expiresAt: '2026-12-08T12:00:00.000Z' })),
    deleteOwner: overrides.deleteOwner ?? (async () => 1),
    expire: overrides.expire ?? (async () => 0),
    summarizeRetained: overrides.summarizeRetained ?? (async () => []),
  };
}

function handlers(repositoryValue: ToolResearchRepository | null, collectionEnabled = true) {
  return createToolResearchRouteHandlers(() => ({
    repository: repositoryValue,
    collectionEnabled,
    now: () => new Date('2026-09-09T12:00:00.000Z'),
    random: () => Buffer.alloc(32, 0xab),
  }));
}

describe('tool research route handler', () => {
  it.each([
    ['wrong origin', request(body(), { Origin: 'https://evil.example' }), 403, 'invalid_origin'],
    ['missing origin', request(body(), { Origin: '' }), 403, 'invalid_origin'],
    ['wrong content type', request(body(), { 'Content-Type': 'text/plain' }), 415, 'unsupported_media_type'],
    ['malformed JSON', request('{'), 400, 'invalid_payload'],
    ['unversioned consent', request({ ...body(), consent: { granted: true } }), 400, 'invalid_payload'],
    ['oversized declared body', request(body(), { 'Content-Length': '5000' }), 413, 'payload_too_large'],
  ])('rejects %s before storage', async (_name, input, status, code) => {
    const submit = vi.fn<ToolResearchRepository['submit']>();
    const response = await handlers(repository({ submit })).POST(input);
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ state: 'unavailable', code });
    expect(submit).not.toHaveBeenCalled();
  });

  it('bounds the actual UTF-8 body and never accepts a truncated prefix', async () => {
    const payload = JSON.stringify(body()).replace('"consent"', `"padding":"${'가'.repeat(1_400)}","consent"`);
    const response = await handlers(repository()).POST(request(payload));
    expect(new TextEncoder().encode(payload).byteLength).toBeGreaterThan(4_096);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ state: 'unavailable', code: 'payload_too_large' });
  });

  it('rejects query parameters instead of accepting an extra data channel', async () => {
    const submit = vi.fn<ToolResearchRepository['submit']>();
    const response = await handlers(repository({ submit })).POST(new Request(`${endpoint}?address=gangnam`, {
      method: 'POST',
      headers: {
        Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json',
        Cookie: `${RESEARCH_OWNER_COOKIE}=${cookieValue}`,
      },
      body: JSON.stringify(body()),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ state: 'unavailable', code: 'invalid_payload' });
    expect(submit).not.toHaveBeenCalled();
  });

  it('initializes ownership without storing a record, then stores only normalized fields', async () => {
    const submit = vi.fn<ToolResearchRepository['submit']>(async () => ({
      state: 'stored', expiresAt: '2026-12-08T12:00:00.000Z',
    }));
    const route = handlers(repository({ submit }));
    const initialized = await route.PUT(new Request(endpoint, {
      method: 'PUT',
      headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' },
      body: '{}',
    }));
    expect(initialized.status).toBe(200);
    expect(await initialized.json()).toEqual({ state: 'owner-ready' });
    expect(initialized.headers.get('set-cookie')).toContain(`${RESEARCH_OWNER_COOKIE}=${cookieValue}`);
    expect(submit).not.toHaveBeenCalled();

    const response = await route.POST(request());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ state: 'stored', expiresAt: '2026-12-08T12:00:00.000Z' });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(submit).toHaveBeenCalledOnce();
    const stored = submit.mock.calls[0]![0];
    expect(stored.ownerHash).toBe(researchOwnerHash(cookieValue));
    expect(stored.ownerHash).toBe(createHash('sha256').update(`tool-research-owner-v1\0${cookieValue}`).digest('hex'));
    expect(JSON.stringify(stored)).not.toContain(cookieValue);
    expect(stored.snapshot).toEqual(body().snapshot);
    expect(stored.source).toBe('user_scenario');
    expect(stored.purpose).toBe('product_research');
    expect(stored.consentVersion).toBe(RESEARCH_CONSENT_VERSION);
  });

  it('requires initialized ownership before writing a submission', async () => {
    const submit = vi.fn<ToolResearchRepository['submit']>();
    const response = await handlers(repository({ submit })).POST(request(body(), { Cookie: '' }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ state: 'unavailable', code: 'owner_required' });
    expect(submit).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('returns a truthful duplicate state for a retry without replacing its owner cookie', async () => {
    const submit = vi.fn<ToolResearchRepository['submit']>(async () => ({
      state: 'duplicate', expiresAt: '2026-12-08T12:00:00.000Z',
    }));
    const response = await handlers(repository({ submit })).POST(request(body(), {
      Cookie: `${RESEARCH_OWNER_COOKIE}=${cookieValue}`,
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ state: 'duplicate', expiresAt: '2026-12-08T12:00:00.000Z' });
  });

  it('does not claim success or leak database details on failure', async () => {
    const response = await handlers(repository({
      submit: async () => { throw new Error('postgres://secret payload row'); },
    })).POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ state: 'unavailable', code: 'storage_unavailable' });
  });

  it('blocks new collection while still allowing owner-scoped deletion', async () => {
    const deleteOwner = vi.fn<ToolResearchRepository['deleteOwner']>(async () => 2);
    const route = handlers(repository({ deleteOwner }), false);
    const blocked = await route.POST(request());
    expect(blocked.status).toBe(503);
    expect(await blocked.json()).toEqual({ state: 'unavailable', code: 'collection_disabled' });

    const deleted = await route.DELETE(new Request(endpoint, {
      method: 'DELETE',
      headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json', Cookie: `${RESEARCH_OWNER_COOKIE}=${cookieValue}` },
    }));
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ state: 'deleted', deletedCount: 2 });
    expect(deleteOwner).toHaveBeenCalledWith(researchOwnerHash(cookieValue));
    const initialize = await route.PUT(new Request(endpoint, {
      method: 'PUT', headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' }, body: '{}',
    }));
    expect(initialize.status).toBe(503);
  });

  it('treats deletion without a valid ownership cookie as an empty owner scope', async () => {
    const deleteOwner = vi.fn<ToolResearchRepository['deleteOwner']>();
    const response = await handlers(repository({ deleteOwner })).DELETE(new Request(endpoint, {
      method: 'DELETE',
      headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ state: 'deleted', deletedCount: 0 });
    expect(deleteOwner).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a DELETE body instead of ignoring unbounded input', async () => {
    const deleteOwner = vi.fn<ToolResearchRepository['deleteOwner']>();
    const response = await handlers(repository({ deleteOwner })).DELETE(new Request(endpoint, {
      method: 'DELETE',
      headers: {
        Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json',
        Cookie: `${RESEARCH_OWNER_COOKIE}=${cookieValue}`,
      },
      body: JSON.stringify({ owner: 'someone-else' }),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ state: 'unavailable', code: 'invalid_payload' });
    expect(deleteOwner).not.toHaveBeenCalled();
  });

  it('returns unavailable when storage is not configured', async () => {
    expect((await handlers(null).POST(request())).status).toBe(503);
    const deleted = await handlers(null).DELETE(new Request(endpoint, {
      method: 'DELETE', headers: { Origin: 'https://www.signedprice.com', 'Content-Type': 'application/json' },
    }));
    expect(deleted.status).toBe(503);
  });
});

describe('tool research owner cookie', () => {
  it('is opaque, first-party, HttpOnly, Secure and SameSite', () => {
    const header = serializeResearchOwnerCookie(cookieValue);
    expect(header).toContain('Path=/');
    expect(header).toContain('Max-Age=31536000');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Lax');
    expect(header).not.toMatch(/Domain=|SameSite=None/i);
  });
});
