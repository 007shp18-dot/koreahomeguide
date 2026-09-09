import 'server-only';

import { createHash } from 'node:crypto';

import {
  canonicalToolResearchSnapshot,
  parseToolResearchSubmission,
} from './contract';
import {
  createResearchOwnerCookie,
  RESEARCH_OWNER_COOKIE,
  researchOwnerHash,
  serializeResearchOwnerCookie,
  validResearchOwnerCookie,
} from './identity.server';
import type { ToolResearchRepository } from './repository.server';

const MAX_BODY_BYTES = 4_096;
const BASE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
} as const;

type ToolResearchRouteEnvironment = Readonly<{
  repository: ToolResearchRepository | null;
  collectionEnabled: boolean;
  now?: () => Date;
  random?: (size: number) => Uint8Array;
}>;

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

function preflight(request: Request): Response | null {
  let origin: string;
  try {
    const url = new URL(request.url);
    origin = url.origin;
    if ([...url.searchParams].length !== 0) return unavailable('invalid_payload', 400);
  } catch {
    return unavailable('invalid_origin', 403);
  }
  if (request.headers.get('origin') !== origin) return unavailable('invalid_origin', 403);
  const contentType = request.headers.get('content-type');
  if (contentType === null || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return unavailable('unsupported_media_type', 415);
  }
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    const bytes = Number(declared);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_BODY_BYTES) {
      return unavailable('payload_too_large', 413);
    }
  }
  return null;
}

function cookieFrom(request: Request): string | null {
  const header = request.headers.get('cookie');
  if (header === null) return null;
  for (const part of header.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === RESEARCH_OWNER_COOKIE) return validResearchOwnerCookie(value.join('=') || null);
  }
  return null;
}

function safeNow(environment: ToolResearchRouteEnvironment): Date {
  const now = (environment.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) throw new TypeError('Invalid current time.');
  return now;
}

export function createToolResearchRouteHandlers(
  environmentFactory: () => ToolResearchRouteEnvironment,
) {
  return Object.freeze({
    async PUT(request: Request): Promise<Response> {
      const rejected = preflight(request);
      if (rejected !== null) return rejected;
      let text: string;
      try {
        text = await request.text();
      } catch {
        return unavailable('invalid_payload', 400);
      }
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
        return unavailable('payload_too_large', 413);
      }
      try {
        const body = JSON.parse(text) as unknown;
        if (typeof body !== 'object' || body === null || Array.isArray(body)
          || Object.keys(body).length !== 0) return unavailable('invalid_payload', 400);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const environment = environmentFactory();
      if (!environment.collectionEnabled) return unavailable('collection_disabled', 503);
      if (environment.repository === null) return unavailable('storage_not_configured', 503);
      const existingCookie = cookieFrom(request);
      if (existingCookie !== null) return response({ state: 'owner-ready' }, 200);
      const cookieValue = createResearchOwnerCookie(environment.random);
      return response({ state: 'owner-ready' }, 200, serializeResearchOwnerCookie(cookieValue));
    },

    async POST(request: Request): Promise<Response> {
      const rejected = preflight(request);
      if (rejected !== null) return rejected;
      const declared = request.headers.get('content-length');
      if (declared !== null && Number(declared) === 0) return unavailable('invalid_payload', 400);
      let text: string;
      try {
        text = await request.text();
      } catch {
        return unavailable('invalid_payload', 400);
      }
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
        return unavailable('payload_too_large', 413);
      }
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      let submission;
      try {
        submission = parseToolResearchSubmission(parsedJson);
      } catch {
        return unavailable('invalid_payload', 400);
      }
      const environment = environmentFactory();
      if (!environment.collectionEnabled) return unavailable('collection_disabled', 503);
      if (environment.repository === null) return unavailable('storage_not_configured', 503);

      const cookieValue = cookieFrom(request);
      if (cookieValue === null) return unavailable('owner_required', 409);
      const ownerHash = researchOwnerHash(cookieValue);
      const scenarioHash = createHash('sha256')
        .update(`tool-research-scenario-v1\0${canonicalToolResearchSnapshot(submission.snapshot)}`)
        .digest('hex');
      try {
        const result = await environment.repository.submit({
          ownerHash,
          retryId: submission.retryId,
          scenarioHash,
          snapshot: submission.snapshot,
          source: 'user_scenario',
          purpose: 'product_research',
          consentVersion: submission.consent.version,
          now: safeNow(environment),
        });
        return response(
          { state: result.state, expiresAt: result.expiresAt },
          result.state === 'stored' ? 201 : 200,
          null,
        );
      } catch {
        return unavailable('storage_unavailable', 503);
      }
    },

    async DELETE(request: Request): Promise<Response> {
      const rejected = preflight(request);
      if (rejected !== null) return rejected;
      let text: string;
      try {
        text = await request.text();
      } catch {
        return unavailable('invalid_payload', 400);
      }
      if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
        return unavailable('payload_too_large', 413);
      }
      if (text.length !== 0) return unavailable('invalid_payload', 400);
      const environment = environmentFactory();
      if (environment.repository === null) return unavailable('storage_not_configured', 503);
      const cookieValue = cookieFrom(request);
      if (cookieValue === null) return response({ state: 'deleted', deletedCount: 0 }, 200);
      try {
        const deletedCount = await environment.repository.deleteOwner(researchOwnerHash(cookieValue));
        return response({ state: 'deleted', deletedCount }, 200);
      } catch {
        return unavailable('storage_unavailable', 503);
      }
    },
  });
}
