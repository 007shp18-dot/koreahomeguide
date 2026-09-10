import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createCommunityService,
  CommunityServiceError,
  type CommunityRequestContext,
} from '../lib/community/community-service.server';
import {
  resolveCommunityEvidenceScope,
  type CommunityEvidenceRepositories,
} from '../lib/community/community-evidence.server';
import type {
  CommunityEvidenceScope,
  CommunityRepository,
  CommunitySelection,
  StoredCommunityResponse,
} from '../lib/community/community-repository.server';
import type { CommunityRateLimitPort } from '../lib/community/community-rate-limit.server';
import { createPublicAreaSummaryRepository } from '../lib/public-market/area-summary-repository.server';
import { createPublicBuildingRepository } from '../lib/public-market/building-summary-repository.server';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaV1Fixture,
  createPublicAreaV2Fixture,
} from './public-area-fixture';
import {
  createPublicBuildingFixture,
} from './public-building-fixture';

const allowedOrigin = 'https://www.signedprice.com';
const identitySecret = 'identity-'.padEnd(64, 'a');
const networkSecret = 'network-'.padEnd(64, 'b');
const cookieValue = '12'.repeat(32);

function repositories(version: 'v1' | 'v2' = 'v2'): CommunityEvidenceRepositories {
  return {
    area: createPublicAreaSummaryRepository({
      source: version === 'v2' ? createPublicAreaV2Fixture() : createPublicAreaV1Fixture(),
      expected: { marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD },
    }),
    building: createPublicBuildingRepository({
      source: createPublicBuildingFixture(),
      expected: { marketId: 'kr-seoul', period: PUBLIC_AREA_FIXTURE_PERIOD },
    }),
  };
}

const districtEvidenceId = `kr-seoul:${PUBLIC_AREA_FIXTURE_PERIOD}:area:v2:all`;
const districtScope = {
  marketId: 'kr-seoul',
  scopeType: 'district',
  scopeId: 'jung-gu',
  evidenceId: districtEvidenceId,
} as const;

function input(direction: 'HIGHER' | 'SIMILAR' | 'LOWER' = 'SIMILAR') {
  return {
    schemaVersion: 1,
    ...districtScope,
    direction,
    reason: null,
  };
}

function context(overrides: Partial<CommunityRequestContext> = {}): CommunityRequestContext {
  return {
    origin: allowedOrigin,
    contentType: 'application/json',
    bodyBytes: 240,
    cookieValue,
    networkAddress: '203.0.113.4',
    ...overrides,
  };
}

function scopeKey(scope: CommunityEvidenceScope, respondentKey: string): string {
  return [scope.marketId, scope.scopeType, scope.scopeId, scope.evidenceId, respondentKey].join('|');
}

function memoryRepository(): CommunityRepository & Readonly<{ size(): number }> {
  const rows = new Map<string, StoredCommunityResponse>();
  return Object.freeze({
    async upsert(response) { rows.set(scopeKey(response, response.respondentKey), response); },
    async delete(scope, respondentKey) { rows.delete(scopeKey(scope, respondentKey)); },
    async getSelection(scope, respondentKey): Promise<CommunitySelection | null> {
      const row = rows.get(scopeKey(scope, respondentKey));
      return row === undefined ? null : Object.freeze({
        direction: row.direction, reason: row.reason,
      });
    },
    async aggregate(scope) {
      const matching = [...rows.values()].filter((row) => (
        row.marketId === scope.marketId && row.scopeType === scope.scopeType &&
        row.scopeId === scope.scopeId && row.evidenceId === scope.evidenceId
      ));
      const directions = (['HIGHER', 'SIMILAR', 'LOWER'] as const).map((direction) =>
        Object.freeze({ direction, count: matching.filter((row) => row.direction === direction).length }));
      const reasons = (['LINE', 'ASPECT', 'FLOOR', 'REMODEL', 'VIEW', 'NOISE', 'OTHER'] as const)
        .flatMap((reason) => {
          const count = matching.filter((row) => row.reason === reason).length;
          return count === 0 ? [] : [Object.freeze({ reason, count })];
        });
      return Object.freeze({
        total: matching.length,
        directions: Object.freeze(directions),
        reasons: Object.freeze(reasons),
      });
    },
    size: () => rows.size,
  });
}

function service(inputOverrides: Readonly<{
  repository?: CommunityRepository;
  rateLimit?: CommunityRateLimitPort;
  evidenceRepositories?: CommunityEvidenceRepositories;
}> = {}) {
  return createCommunityService({
    repository: inputOverrides.repository ?? memoryRepository(),
    rateLimit: inputOverrides.rateLimit ?? {
      async consume() { return 'allowed'; },
    },
    evidenceRepositories: inputOverrides.evidenceRepositories ?? repositories(),
    allowedOrigin,
    identitySecret,
    networkSecret,
  });
}

describe('Community evidence allowlist', () => {
  it('resolves current district and verified building scopes with artifact versions', () => {
    expect(resolveCommunityEvidenceScope(districtScope, repositories())).toEqual(districtScope);
    expect(resolveCommunityEvidenceScope({
      marketId: 'kr-seoul',
      scopeType: 'building',
      scopeId: 'gangnam-evidence-tower',
      evidenceId: `kr-seoul:${PUBLIC_AREA_FIXTURE_PERIOD}:building:v1:all`,
    }, repositories())).toMatchObject({ scopeType: 'building' });
  });

  it.each([
    ['stale evidence', { ...districtScope, evidenceId: 'kr-seoul:2025-01/2025-07:area:v2:all' }, repositories()],
    ['unknown district', { ...districtScope, scopeId: 'unknown-gu' }, repositories()],
    ['unknown building', {
      ...districtScope, scopeType: 'building', scopeId: 'unknown-building',
      evidenceId: `kr-seoul:${PUBLIC_AREA_FIXTURE_PERIOD}:building:v1:all`,
    }, repositories()],
    ['v1 split', {
      ...districtScope,
      evidenceId: `kr-seoul:${PUBLIC_AREA_FIXTURE_PERIOD}:area:v1:new`,
    }, repositories('v1')],
  ] as const)('rejects %s without echoing its value', (_name, request, dependencies) => {
    expect(() => resolveCommunityEvidenceScope(request, dependencies)).toThrow(
      'Community evidence scope is unavailable.',
    );
  });
});

describe('protected Community service', () => {
  it('upserts rather than appending and returns only caller selection plus threshold state', async () => {
    const repository = memoryRepository();
    const community = service({ repository });

    const first = await community.upsert(input('HIGHER'), context());
    const replaced = await community.upsert({ ...input('LOWER'), reason: 'VIEW' }, context());

    expect(first.aggregate).toEqual({ status: 'collecting' });
    expect(replaced.selection).toEqual({ direction: 'LOWER', reason: 'VIEW' });
    expect(replaced.aggregate).toEqual({ status: 'collecting' });
    expect(repository.size()).toBe(1);
    expect(JSON.stringify(replaced)).not.toMatch(/respondent|network|203\.0\.113\.4/);
  });

  it('publishes only after five distinct active responses', async () => {
    const repository = memoryRepository();
    for (let index = 0; index < 5; index += 1) {
      await repository.upsert({
        ...districtScope,
        respondentKey: `seed-${index}`,
        direction: index < 2 ? 'HIGHER' : index < 4 ? 'SIMILAR' : 'LOWER',
        reason: null,
      });
    }

    const result = await service({ repository }).read(districtScope, context());
    expect(result.aggregate).toMatchObject({ status: 'published', total: 5 });
    expect(JSON.stringify(result)).not.toContain('seed-');
  });

  it('deletes the caller selection idempotently', async () => {
    const community = service();
    await community.upsert(input('HIGHER'), context());

    expect((await community.delete(districtScope, context())).selection).toBeNull();
    expect((await community.delete(districtScope, context())).selection).toBeNull();
  });

  it.each([
    ['missing Origin', { origin: null }, input(), 'invalid_origin'],
    ['wrong Origin', { origin: 'https://evil.example' }, input(), 'invalid_origin'],
    ['non-JSON', { contentType: 'text/plain' }, input(), 'unsupported_media_type'],
    ['oversized body', { bodyBytes: 3_000 }, input(), 'payload_too_large'],
    ['stale evidence', {}, { ...input(), evidenceId: 'kr-seoul:2025-01/2025-07:area:v2:all' }, 'stale_evidence'],
    ['unknown district', {}, { ...input(), scopeId: 'unknown-gu' }, 'stale_evidence'],
  ] as const)('rejects %s with a browser-safe code', async (_name, overrides, payload, code) => {
    await expect(service().upsert(payload, context(overrides))).rejects.toMatchObject({
      name: 'CommunityServiceError', code,
    });
  });

  it('denies a rate-limited write before persistence', async () => {
    const repository = memoryRepository();
    const rateLimit: CommunityRateLimitPort = {
      async consume() { return 'limited'; },
    };

    await expect(service({ repository, rateLimit }).upsert(input(), context()))
      .rejects.toEqual(new CommunityServiceError('rate_limited', 429));
    expect(repository.size()).toBe(0);
  });

  it('sanitizes storage failures', async () => {
    const repository = memoryRepository();
    const failing: CommunityRepository = {
      ...repository,
      async upsert() { throw new Error('postgres://secret@host raw SQL'); },
    };

    await expect(service({ repository: failing }).upsert(input(), context()))
      .rejects.toMatchObject({ code: 'storage_unavailable', status: 503 });
  });
});
