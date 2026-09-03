export const BUILDING_DECISION_MODES = [
  'overview', 'rent', 'buy', 'invest', 'evidence',
] as const;

export const BUILDING_CONTRACT_COHORTS = ['all', 'new', 'renewal'] as const;

export type BuildingDecisionMode = (typeof BUILDING_DECISION_MODES)[number];
export type BuildingContractCohort = (typeof BUILDING_CONTRACT_COHORTS)[number];

export type BuildingDecisionSelection = Readonly<{
  mode: BuildingDecisionMode;
  contract: BuildingContractCohort;
}>;

type BuildingDecisionQuery = Readonly<Record<
  string,
  string | string[] | undefined
>>;

function singleAllowed<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && allowed.includes(value as T)
    ? value as T
    : fallback;
}

export function parseBuildingDecisionSelection(
  query: BuildingDecisionQuery,
): BuildingDecisionSelection {
  return Object.freeze({
    mode: singleAllowed(query.mode, BUILDING_DECISION_MODES, 'overview'),
    contract: singleAllowed(query.contract, BUILDING_CONTRACT_COHORTS, 'new'),
  });
}

export function buildingDecisionHref(input: Readonly<{
  base: string;
  mode: BuildingDecisionMode;
  contract: BuildingContractCohort;
}>): string {
  if (!input.base.startsWith('/') || !input.base.endsWith('/')) {
    throw new TypeError('Building decision base must be a trailing-slash internal path.');
  }
  const query = new URLSearchParams();
  if (input.mode !== 'overview') query.set('mode', input.mode);
  if (input.contract !== 'new') query.set('contract', input.contract);
  const suffix = query.toString();
  return suffix === '' ? input.base : `${input.base}?${suffix}`;
}
