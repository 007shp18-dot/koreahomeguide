export type RightsPolicy = {
  readonly id: string;
  readonly canFetch: boolean;
  readonly canStore: boolean;
  readonly canCache: boolean;
  readonly canDisplay: boolean;
  readonly canCreateDerived: boolean;
  readonly canUseCommercially: boolean;
  readonly canIndex: boolean;
  readonly retention: string;
  readonly cacheTtl: string;
  readonly attribution: readonly string[];
  readonly evidenceRef: string;
};

export type RightsPolicyInput = Partial<RightsPolicy> & Pick<RightsPolicy, 'id'>;

/**
 * Rights are deny-by-default: a caller must explicitly grant every action.
 */
export function createRightsPolicy(input: RightsPolicyInput): RightsPolicy {
  return Object.freeze({
    id: input.id,
    canFetch: input.canFetch ?? false,
    canStore: input.canStore ?? false,
    canCache: input.canCache ?? false,
    canDisplay: input.canDisplay ?? false,
    canCreateDerived: input.canCreateDerived ?? false,
    canUseCommercially: input.canUseCommercially ?? false,
    canIndex: input.canIndex ?? false,
    retention: input.retention ?? 'not approved',
    cacheTtl: input.cacheTtl ?? 'not approved',
    attribution: Object.freeze([...(input.attribution ?? [])]),
    evidenceRef: input.evidenceRef ?? 'not approved',
  });
}
