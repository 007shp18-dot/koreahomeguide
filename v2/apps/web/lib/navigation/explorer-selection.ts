export type ExplorerMarket = 'kr' | 'sg' | 'ae';
export type ExplorerTransaction = 'sale' | 'jeonse' | 'monthly' | 'rent';
export type ExplorerContractType = 'new' | 'renewal' | 'all';

export type ExplorerSelection = Readonly<{
  market: ExplorerMarket;
  transaction: ExplorerTransaction;
  propertyType?: string;
  district?: string;
  neighborhood?: string;
  buildingId?: string;
  contractType?: ExplorerContractType;
  sort?: string;
}>;

export type ExplorerSelectionDefaults = Readonly<{
  market: ExplorerMarket;
  transaction: ExplorerTransaction;
}>;

export type ExplorerSelectionAllowLists = Readonly<{
  propertyTypes?: readonly string[];
  districts?: readonly string[];
  neighborhoods?: readonly string[];
  buildingIds?: readonly string[];
  sorts?: readonly string[];
}>;

export type ExplorerSearchParams =
  | URLSearchParams
  | Readonly<Record<string, string | readonly string[] | undefined>>;

const markets = Object.freeze(['kr', 'sg', 'ae'] as const);
const marketTransactions = Object.freeze({
  kr: Object.freeze(['sale', 'jeonse', 'monthly'] as const),
  sg: Object.freeze(['sale', 'rent'] as const),
  ae: Object.freeze(['sale'] as const),
});
const marketDefaults = Object.freeze({
  kr: 'jeonse',
  sg: 'sale',
  ae: 'sale',
} as const satisfies Record<ExplorerMarket, ExplorerTransaction>);
const contractTypes = Object.freeze(['new', 'renewal', 'all'] as const);
const identifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMarket(value: unknown): value is ExplorerMarket {
  return typeof value === 'string' && markets.includes(value as ExplorerMarket);
}

function isTransactionFor(
  market: ExplorerMarket,
  value: unknown,
): value is ExplorerTransaction {
  return typeof value === 'string'
    && (marketTransactions[market] as readonly string[]).includes(value);
}

function acceptedIdentifier(
  value: unknown,
  allowList: readonly string[] | undefined,
): string | undefined {
  if (typeof value !== 'string' || !identifierPattern.test(value)) return undefined;
  if (allowList !== undefined && !allowList.includes(value)) return undefined;
  return value;
}

function defaultTransaction(defaults: ExplorerSelectionDefaults): ExplorerTransaction {
  return isTransactionFor(defaults.market, defaults.transaction)
    ? defaults.transaction
    : marketDefaults[defaults.market];
}

export function normalizeExplorerSelection(
  input: unknown,
  defaults: ExplorerSelectionDefaults,
  allowLists: ExplorerSelectionAllowLists = Object.freeze({}),
): ExplorerSelection {
  const source: Readonly<Record<string, unknown>> = isObject(input)
    ? input
    : Object.freeze({});
  const market = isMarket(source.market) ? source.market : defaults.market;
  const fallbackTransaction = market === defaults.market
    ? defaultTransaction(defaults)
    : marketDefaults[market];
  const transaction = isTransactionFor(market, source.transaction)
    ? source.transaction
    : fallbackTransaction;
  const propertyType = acceptedIdentifier(source.propertyType, allowLists.propertyTypes);
  const district = acceptedIdentifier(source.district, allowLists.districts);
  const neighborhood = district === undefined
    ? undefined
    : acceptedIdentifier(source.neighborhood, allowLists.neighborhoods);
  const buildingId = neighborhood === undefined
    ? undefined
    : acceptedIdentifier(source.buildingId, allowLists.buildingIds);
  const contractType = market === 'kr'
    && (transaction === 'jeonse' || transaction === 'monthly')
    && typeof source.contractType === 'string'
    && (contractTypes as readonly string[]).includes(source.contractType)
    ? source.contractType as ExplorerContractType
    : undefined;
  const sort = acceptedIdentifier(source.sort, allowLists.sorts);

  return Object.freeze({
    market,
    transaction,
    ...(propertyType === undefined ? {} : { propertyType }),
    ...(district === undefined ? {} : { district }),
    ...(neighborhood === undefined ? {} : { neighborhood }),
    ...(buildingId === undefined ? {} : { buildingId }),
    ...(contractType === undefined ? {} : { contractType }),
    ...(sort === undefined ? {} : { sort }),
  });
}

function scalarSearchParam(input: ExplorerSearchParams, key: string): string | undefined {
  if (input instanceof URLSearchParams) {
    const values = input.getAll(key);
    return values.length === 1 ? values[0] : undefined;
  }
  const value = input[key];
  return typeof value === 'string' ? value : undefined;
}

export function parseExplorerSelection(
  input: ExplorerSearchParams,
  defaults: ExplorerSelectionDefaults,
  allowLists?: ExplorerSelectionAllowLists,
): ExplorerSelection {
  return normalizeExplorerSelection({
    market: scalarSearchParam(input, 'market'),
    transaction: scalarSearchParam(input, 'transaction'),
    propertyType: scalarSearchParam(input, 'propertyType'),
    district: scalarSearchParam(input, 'district'),
    neighborhood: scalarSearchParam(input, 'neighborhood'),
    buildingId: scalarSearchParam(input, 'buildingId'),
    contractType: scalarSearchParam(input, 'contractType'),
    sort: scalarSearchParam(input, 'sort'),
  }, defaults, allowLists);
}

export function serializeExplorerSelection(
  input: ExplorerSelection,
  defaults: ExplorerSelectionDefaults,
): string {
  const selection = normalizeExplorerSelection(input, defaults);
  const query = new URLSearchParams();
  if (selection.market !== defaults.market) query.set('market', selection.market);
  const transactionDefault = selection.market === defaults.market
    ? defaultTransaction(defaults)
    : marketDefaults[selection.market];
  if (selection.transaction !== transactionDefault) {
    query.set('transaction', selection.transaction);
  }
  if (selection.propertyType !== undefined) query.set('propertyType', selection.propertyType);
  if (selection.district !== undefined) query.set('district', selection.district);
  if (selection.neighborhood !== undefined) query.set('neighborhood', selection.neighborhood);
  if (selection.buildingId !== undefined) query.set('buildingId', selection.buildingId);
  if (selection.contractType !== undefined) query.set('contractType', selection.contractType);
  if (selection.sort !== undefined) query.set('sort', selection.sort);
  return query.toString();
}

export function createSelectionHref(
  path: string,
  selection: ExplorerSelection,
  defaults: ExplorerSelectionDefaults,
): string {
  const query = serializeExplorerSelection(selection, defaults);
  return query.length === 0 ? path : `${path}?${query}`;
}
