import { createRightsPolicy, type RightsPolicy } from '@signedprice/market-core';

import { MOLIT_RIGHTS_POLICY_ID, MOLIT_SALE_RIGHTS_POLICY_ID } from './versions';

export type MolitRightsOperation =
  | 'fetch'
  | 'store'
  | 'cache'
  | 'derive'
  | 'display'
  | 'commercial';

export type MolitRightsLookup = (policyId: string) => RightsPolicy | undefined;

export type MolitRightsRequest = {
  readonly lookup: MolitRightsLookup;
  readonly policyId: string;
  readonly operations: readonly MolitRightsOperation[];
  readonly cacheTtlSeconds?: number;
  readonly retentionSeconds?: number;
};

const PERMISSION_BY_OPERATION = {
  fetch: 'canFetch',
  store: 'canStore',
  cache: 'canCache',
  derive: 'canCreateDerived',
  display: 'canDisplay',
  commercial: 'canUseCommercially',
} as const satisfies Readonly<Record<MolitRightsOperation, keyof RightsPolicy>>;

const PLACEHOLDER_EVIDENCE = /^(?:not approved|none|pending|placeholder|tbd|todo)$/i;

export const KR_MOLIT_RENT_RIGHTS = createRightsPolicy({
  id: MOLIT_RIGHTS_POLICY_ID,
  canFetch: true,
  canStore: true,
  canCache: true,
  canDisplay: true,
  canCreateDerived: true,
  canUseCommercially: true,
  canIndex: false,
  retention: '24 hours',
  cacheTtl: '24 hours',
  attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  evidenceRef: 'https://www.data.go.kr/data/15126474/openapi.do',
});

export const KR_MOLIT_SALE_RIGHTS = createRightsPolicy({
  id: MOLIT_SALE_RIGHTS_POLICY_ID,
  canFetch: true,
  canStore: true,
  canCache: true,
  canDisplay: true,
  canCreateDerived: true,
  canUseCommercially: true,
  canIndex: false,
  retention: '24 hours',
  cacheTtl: '24 hours',
  attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  evidenceRef: 'https://www.data.go.kr/data/15126468/openapi.do',
});

export class RightsViolationError extends Error {
  readonly code = 'rights_blocked' as const;

  constructor() {
    super('Official transaction data use is not permitted by the active rights policy.');
    this.name = 'RightsViolationError';
  }
}

function durationSeconds(value: string): number | null {
  const match = /^(\d+) (second|minute|hour|day)s?$/.exec(value.trim());
  if (match === null) return null;

  const amount = Number(match[1]);
  const unitSeconds = {
    second: 1,
    minute: 60,
    hour: 3_600,
    day: 86_400,
  } as const;
  const unit = match[2] as keyof typeof unitSeconds;
  return Number.isSafeInteger(amount) ? amount * unitSeconds[unit] : null;
}

function hasEvidence(policy: RightsPolicy): boolean {
  const evidenceRef = policy.evidenceRef.trim();
  return (
    policy.attribution.length > 0 &&
    policy.attribution.every((value) => value.trim().length > 0) &&
    evidenceRef.length > 0 &&
    !PLACEHOLDER_EVIDENCE.test(evidenceRef) &&
    /^https:\/\//.test(evidenceRef)
  );
}

function withinBound(requested: number | undefined, policyValue: string): boolean {
  if (requested === undefined) return true;
  if (!Number.isSafeInteger(requested) || requested < 0) return false;
  const maximum = durationSeconds(policyValue);
  return maximum !== null && requested <= maximum;
}

export function assertMolitRights(request: MolitRightsRequest): RightsPolicy {
  return assertExpectedMolitRights(request, KR_MOLIT_RENT_RIGHTS);
}

function assertExpectedMolitRights(
  request: MolitRightsRequest,
  expected: RightsPolicy,
): RightsPolicy {
  const policy = request.lookup(request.policyId);
  if (
    request.policyId !== expected.id ||
    policy === undefined ||
    policy.id !== expected.id ||
    !hasEvidence(policy) ||
    request.operations.some((operation) => policy[PERMISSION_BY_OPERATION[operation]] !== true) ||
    !withinBound(request.cacheTtlSeconds, policy.cacheTtl) ||
    !withinBound(request.retentionSeconds, policy.retention)
  ) {
    throw new RightsViolationError();
  }
  return policy;
}

export function assertMolitSaleRights(request: MolitRightsRequest): RightsPolicy {
  return assertExpectedMolitRights(request, KR_MOLIT_SALE_RIGHTS);
}

export async function runWithMolitRights<T>(
  request: MolitRightsRequest,
  loader: (policy: RightsPolicy) => T | Promise<T>,
): Promise<T> {
  const policy = assertMolitRights(request);
  return loader(policy);
}

export async function runWithMolitSaleRights<T>(
  request: MolitRightsRequest,
  loader: (policy: RightsPolicy) => T | Promise<T>,
): Promise<T> {
  const policy = assertMolitSaleRights(request);
  return loader(policy);
}
