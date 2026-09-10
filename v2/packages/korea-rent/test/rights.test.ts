import { describe, expect, test } from 'vitest';

import { createRightsPolicy, type RightsPolicy } from '@signedprice/market-core';

import {
  KR_MOLIT_RENT_RIGHTS,
  KR_MOLIT_SALE_RIGHTS,
  RightsViolationError,
  runWithMolitSaleRights,
  runWithMolitRights,
  type MolitRightsLookup,
  type MolitRightsOperation,
} from '../src/index';

const ALL_RUNTIME_OPERATIONS = [
  'fetch',
  'store',
  'cache',
  'derive',
  'display',
  'commercial',
] as const satisfies readonly MolitRightsOperation[];

function lookupFor(policy: RightsPolicy | undefined): MolitRightsLookup {
  return (policyId) => policy?.id === policyId ? policy : undefined;
}

function enabledPolicy(overrides: Partial<RightsPolicy> = {}): RightsPolicy {
  return createRightsPolicy({
    ...KR_MOLIT_RENT_RIGHTS,
    ...overrides,
    id: overrides.id ?? KR_MOLIT_RENT_RIGHTS.id,
  });
}

describe('KR_MOLIT_RENT_RIGHTS', () => {
  test('publishes the versioned MOLIT rent rights policy', () => {
    expect(KR_MOLIT_RENT_RIGHTS).toBeDefined();
  });

  test.runIf(Boolean(KR_MOLIT_RENT_RIGHTS))(
    'enables the runtime operations only with attribution, evidence, and 24-hour bounds',
    async () => {
    const result = await runWithMolitRights(
      {
        lookup: lookupFor(KR_MOLIT_RENT_RIGHTS),
        policyId: 'kr-molit-rent-v1',
        operations: ALL_RUNTIME_OPERATIONS,
        cacheTtlSeconds: 86_400,
        retentionSeconds: 86_400,
      },
      async () => 'loaded',
    );

    expect(result).toBe('loaded');
    expect(KR_MOLIT_RENT_RIGHTS).toMatchObject({
      id: 'kr-molit-rent-v1',
      canFetch: true,
      canStore: true,
      canCache: true,
      canCreateDerived: true,
      canDisplay: true,
      canUseCommercially: true,
      cacheTtl: '24 hours',
      retention: '24 hours',
    });
    expect(KR_MOLIT_RENT_RIGHTS.attribution.length).toBeGreaterThan(0);
    expect(KR_MOLIT_RENT_RIGHTS.evidenceRef).toMatch(/^https:\/\/www\.data\.go\.kr\//);
    expect(Object.isFrozen(KR_MOLIT_RENT_RIGHTS)).toBe(true);
    expect(Object.isFrozen(KR_MOLIT_RENT_RIGHTS.attribution)).toBe(true);
    },
  );

  test.runIf(Boolean(KR_MOLIT_RENT_RIGHTS)).each(ALL_RUNTIME_OPERATIONS)(
    'denies a missing %s permission before its loader runs',
    async (operation) => {
      const permissionByOperation = {
        fetch: 'canFetch',
        store: 'canStore',
        cache: 'canCache',
        derive: 'canCreateDerived',
        display: 'canDisplay',
        commercial: 'canUseCommercially',
      } as const satisfies Readonly<Record<MolitRightsOperation, keyof RightsPolicy>>;
      const policy = enabledPolicy({ [permissionByOperation[operation]]: false });
      let loaderRuns = 0;

      await expect(
        runWithMolitRights(
          {
            lookup: lookupFor(policy),
            policyId: policy.id,
            operations: [operation],
          },
          async () => {
            loaderRuns += 1;
            return 'unreachable';
          },
        ),
      ).rejects.toBeInstanceOf(RightsViolationError);
      expect(loaderRuns).toBe(0);
    },
  );

  test.runIf(Boolean(KR_MOLIT_RENT_RIGHTS)).each([
    ['unknown policy', () => lookupFor(undefined), 'kr-molit-rent-unknown', 86_400, 86_400],
    ['cache TTL above policy', () => lookupFor(KR_MOLIT_RENT_RIGHTS), 'kr-molit-rent-v1', 86_401, 86_400],
    ['retention above policy', () => lookupFor(KR_MOLIT_RENT_RIGHTS), 'kr-molit-rent-v1', 86_400, 86_401],
    [
      'missing attribution',
      () => lookupFor(enabledPolicy({ attribution: [] })),
      'kr-molit-rent-v1',
      86_400,
      86_400,
    ],
    [
      'placeholder evidence',
      () => lookupFor(enabledPolicy({ evidenceRef: 'not approved' })),
      'kr-molit-rent-v1',
      86_400,
      86_400,
    ],
  ] as const)(
    'denies %s before a loader runs',
    async (_label, lookupFactory, policyId, cacheTtlSeconds, retentionSeconds) => {
      let loaderRuns = 0;

      await expect(
        runWithMolitRights(
          {
            lookup: lookupFactory(),
            policyId,
            operations: ALL_RUNTIME_OPERATIONS,
            cacheTtlSeconds,
            retentionSeconds,
          },
          async () => {
            loaderRuns += 1;
            return 'unreachable';
          },
        ),
      ).rejects.toBeInstanceOf(RightsViolationError);
      expect(loaderRuns).toBe(0);
    },
  );

  test('denies a fully enabled alternate rights policy ID before its loader runs', async () => {
    const alternate = enabledPolicy({ id: 'kr-molit-rent-v2' });
    let loaderRuns = 0;

    await expect(
      runWithMolitRights(
        {
          lookup: lookupFor(alternate),
          policyId: alternate.id,
          operations: ALL_RUNTIME_OPERATIONS,
          cacheTtlSeconds: 86_400,
          retentionSeconds: 86_400,
        },
        async () => {
          loaderRuns += 1;
          return 'unreachable';
        },
      ),
    ).rejects.toBeInstanceOf(RightsViolationError);
    expect(loaderRuns).toBe(0);
  });

  test.runIf(Boolean(KR_MOLIT_RENT_RIGHTS)).each([
    ['display', { canDisplay: false }],
    ['commercial use', { canUseCommercially: false }],
  ] as const)('denies a verified cached hit when current %s rights are withdrawn', async (_label, revoked) => {
    let currentPolicy = KR_MOLIT_RENT_RIGHTS;
    const lookup: MolitRightsLookup = (policyId) =>
      currentPolicy.id === policyId ? currentPolicy : undefined;
    const cachedValue = Object.freeze({ verified: true, payload: 'cached' });

    currentPolicy = enabledPolicy(revoked);
    let displayRuns = 0;

    await expect(
      runWithMolitRights(
        {
          lookup,
          policyId: cachedValue.verified ? 'kr-molit-rent-v1' : 'unknown',
          operations: ['display', 'commercial'],
        },
        async () => {
          displayRuns += 1;
          return cachedValue;
        },
      ),
    ).rejects.toBeInstanceOf(RightsViolationError);
    expect(displayRuns).toBe(0);
  });
});

describe('KR_MOLIT_SALE_RIGHTS', () => {
  test('uses an independently versioned, official, commercially usable sale policy', async () => {
    const result = await runWithMolitSaleRights({
      lookup: lookupFor(KR_MOLIT_SALE_RIGHTS),
      policyId: 'kr-molit-sale-v1',
      operations: ALL_RUNTIME_OPERATIONS,
      cacheTtlSeconds: 86_400,
      retentionSeconds: 86_400,
    }, async () => 'sale-loaded');

    expect(result).toBe('sale-loaded');
    expect(KR_MOLIT_SALE_RIGHTS).toMatchObject({
      id: 'kr-molit-sale-v1',
      canFetch: true,
      canStore: true,
      canCache: true,
      canCreateDerived: true,
      canDisplay: true,
      canUseCommercially: true,
      cacheTtl: '24 hours',
      retention: '24 hours',
    });
    expect(KR_MOLIT_SALE_RIGHTS.evidenceRef).toBe(
      'https://www.data.go.kr/data/15126468/openapi.do',
    );
  });

  test('never accepts the rental policy or a lookalike sale policy id', async () => {
    const lookalike = createRightsPolicy({
      ...KR_MOLIT_SALE_RIGHTS,
      id: 'kr-molit-sale-v2',
    });
    for (const policy of [KR_MOLIT_RENT_RIGHTS, lookalike]) {
      await expect(runWithMolitSaleRights({
        lookup: lookupFor(policy),
        policyId: policy.id,
        operations: ALL_RUNTIME_OPERATIONS,
      }, async () => 'unreachable')).rejects.toBeInstanceOf(RightsViolationError);
    }
  });
});
