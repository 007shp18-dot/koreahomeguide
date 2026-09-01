import 'server-only';

import { buildPublicCommunityAggregate } from './community-aggregate';
import {
  resolveCommunityEvidenceScope,
  type CommunityEvidenceRepositories,
} from './community-evidence.server';
import {
  deriveNetworkKey,
  resolveRespondentIdentity,
} from './community-identity.server';
import type {
  CommunityEvidenceScope,
  CommunityRepository,
  CommunitySelection,
} from './community-repository.server';
import type { CommunityRateLimitPort } from './community-rate-limit.server';
import { parseEvidenceResponseInput } from './community-schema';
import type { CommunityAggregateModel } from './community-types';

export type CommunityRequestContext = Readonly<{
  origin: string | null;
  contentType: string | null;
  bodyBytes: number;
  cookieValue: string | null;
  networkAddress: string | null;
}>;

export type CommunityServiceResult = Readonly<{
  state: CommunityAggregateModel['status'];
  selection: CommunitySelection | null;
  aggregate: CommunityAggregateModel;
  setCookie: string | null;
}>;

export type CommunityService = Readonly<{
  read(scope: unknown, context: CommunityRequestContext): Promise<CommunityServiceResult>;
  upsert(input: unknown, context: CommunityRequestContext): Promise<CommunityServiceResult>;
  delete(scope: unknown, context: CommunityRequestContext): Promise<CommunityServiceResult>;
}>;

export type CommunityServiceErrorCode =
  | 'invalid_origin'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'invalid_payload'
  | 'stale_evidence'
  | 'rate_limited'
  | 'storage_unavailable';

export class CommunityServiceError extends Error {
  constructor(
    readonly code: CommunityServiceErrorCode,
    readonly status: number,
  ) {
    super('Community response request failed.');
    this.name = 'CommunityServiceError';
  }
}

type CommunityServiceDependencies = Readonly<{
  repository: CommunityRepository;
  rateLimit: CommunityRateLimitPort;
  evidenceRepositories: CommunityEvidenceRepositories;
  allowedOrigin: string;
  identitySecret: string;
  networkSecret: string;
}>;

function serviceError(code: CommunityServiceErrorCode, status: number): never {
  throw new CommunityServiceError(code, status);
}

function scopeFromResponse(input: ReturnType<typeof parseEvidenceResponseInput>) {
  return Object.freeze({
    marketId: input.marketId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    evidenceId: input.evidenceId,
  });
}

function assertWriteContext(
  context: CommunityRequestContext,
  allowedOrigin: string,
): void {
  if (context.origin !== allowedOrigin) serviceError('invalid_origin', 403);
  if (
    context.contentType === null ||
    !/^application\/json(?:\s*;|$)/i.test(context.contentType)
  ) {
    serviceError('unsupported_media_type', 415);
  }
  if (
    !Number.isSafeInteger(context.bodyBytes) ||
    context.bodyBytes < 0 ||
    context.bodyBytes > 2_048
  ) {
    serviceError('payload_too_large', 413);
  }
}

export function createCommunityService(
  dependencies: CommunityServiceDependencies,
): CommunityService {
  const identityFor = (context: CommunityRequestContext) => {
    try {
      return resolveRespondentIdentity(context.cookieValue, dependencies.identitySecret);
    } catch {
      serviceError('storage_unavailable', 503);
    }
  };

  const resolveScope = (value: unknown): CommunityEvidenceScope => {
    try {
      return resolveCommunityEvidenceScope(value, dependencies.evidenceRepositories);
    } catch {
      serviceError('stale_evidence', 409);
    }
  };

  const repositoryCall = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch {
      serviceError('storage_unavailable', 503);
    }
  };

  const resultFor = async (
    scope: CommunityEvidenceScope,
    respondentKey: string,
    setCookie: string | null,
  ): Promise<CommunityServiceResult> => {
    const [selection, counts] = await repositoryCall(() => Promise.all([
      dependencies.repository.getSelection(scope, respondentKey),
      dependencies.repository.aggregate(scope),
    ]));
    let aggregate: CommunityAggregateModel;
    try {
      aggregate = buildPublicCommunityAggregate(counts);
    } catch {
      serviceError('storage_unavailable', 503);
    }
    return Object.freeze({
      state: aggregate.status,
      selection,
      aggregate,
      setCookie,
    });
  };

  const rateCheck = async (
    context: CommunityRequestContext,
    respondentKey: string,
  ): Promise<void> => {
    let networkKey: string;
    try {
      networkKey = deriveNetworkKey(
        context.networkAddress ?? 'network-unavailable',
        dependencies.networkSecret,
      );
    } catch {
      serviceError('storage_unavailable', 503);
    }
    try {
      if (await dependencies.rateLimit.consume({ respondentKey, networkKey }) === 'limited') {
        serviceError('rate_limited', 429);
      }
    } catch (error) {
      if (error instanceof CommunityServiceError) throw error;
      serviceError('storage_unavailable', 503);
    }
  };

  return Object.freeze({
    async read(scopeValue, context) {
      const scope = resolveScope(scopeValue);
      const identity = identityFor(context);
      return resultFor(scope, identity.respondentKey, identity.setCookie);
    },

    async upsert(value, context) {
      assertWriteContext(context, dependencies.allowedOrigin);
      let input: ReturnType<typeof parseEvidenceResponseInput>;
      try {
        input = parseEvidenceResponseInput(value);
      } catch {
        serviceError('invalid_payload', 400);
      }
      const scope = resolveScope(scopeFromResponse(input));
      const identity = identityFor(context);
      await rateCheck(context, identity.respondentKey);
      await repositoryCall(() => dependencies.repository.upsert({
        ...scope,
        respondentKey: identity.respondentKey,
        direction: input.direction,
        reason: input.reason,
      }));
      return resultFor(scope, identity.respondentKey, identity.setCookie);
    },

    async delete(scopeValue, context) {
      assertWriteContext(context, dependencies.allowedOrigin);
      const scope = resolveScope(scopeValue);
      const identity = identityFor(context);
      await rateCheck(context, identity.respondentKey);
      await repositoryCall(() => dependencies.repository.delete(scope, identity.respondentKey));
      return resultFor(scope, identity.respondentKey, identity.setCookie);
    },
  });
}
