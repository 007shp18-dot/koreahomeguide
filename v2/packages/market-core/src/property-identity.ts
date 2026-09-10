import type { DeepReadonly, MarketId } from './markets';

export const propertyEntityKinds = [
  'master-development',
  'project',
  'estate',
  'building',
  'block',
  'unit',
  'land-parcel',
] as const;

export type PropertyEntityKind = (typeof propertyEntityKinds)[number];
export type PropertyIdentityStatus = 'unverified' | 'verified' | 'ambiguous' | 'rejected';

export type ExternalPropertyIdentifier = DeepReadonly<{
  sourceId: string;
  type: string;
  value: string;
}>;

export type PropertyIdentityInput = Readonly<{
  id: string;
  marketId: MarketId;
  geographyId: string | null;
  parentId: string | null;
  kind: PropertyEntityKind;
  canonicalName: string;
  identityStatus: PropertyIdentityStatus;
  externalIdentifiers: readonly Readonly<{
    sourceId: string;
    type: string;
    value: string;
  }>[];
  localSchemaVersion: string;
  localAttributes: Readonly<Record<string, unknown>>;
}>;

export type PropertyIdentity = DeepReadonly<PropertyIdentityInput>;

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${field} is required`);
  return normalized;
}

function cloneAndFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => cloneAndFreeze(item))) as DeepReadonly<Value>;
  }
  if (value !== null && typeof value === 'object') {
    const clone = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cloneAndFreeze(item)]),
    );
    return Object.freeze(clone) as DeepReadonly<Value>;
  }
  return value as DeepReadonly<Value>;
}

export function createPropertyIdentity(input: PropertyIdentityInput): PropertyIdentity {
  const id = required(input.id, 'id');
  if (input.parentId === id) throw new Error('parentId cannot reference the identity itself');

  const identifierKeys = new Set<string>();
  const externalIdentifiers = input.externalIdentifiers.map((identifier) => {
    const sourceId = required(identifier.sourceId, 'external identifier sourceId');
    const type = required(identifier.type, 'external identifier type');
    const value = required(identifier.value, 'external identifier value');
    const key = `${sourceId}\u0000${type}`;
    if (identifierKeys.has(key)) throw new Error('external identifier source and type must be unique');
    identifierKeys.add(key);
    return { sourceId, type, value };
  });

  return cloneAndFreeze({
    id,
    marketId: input.marketId,
    geographyId: input.geographyId === null ? null : required(input.geographyId, 'geographyId'),
    parentId: input.parentId === null ? null : required(input.parentId, 'parentId'),
    kind: input.kind,
    canonicalName: required(input.canonicalName, 'canonicalName'),
    identityStatus: input.identityStatus,
    externalIdentifiers,
    localSchemaVersion: required(input.localSchemaVersion, 'localSchemaVersion'),
    localAttributes: input.localAttributes,
  });
}
