export type SnapshotMarketId = 'kr-seoul' | 'sg-singapore';

export type MarketDataset =
  | 'kr-building-registry'
  | 'kr-sale'
  | 'kr-rent'
  | 'kr-conversion'
  | 'sg-private-sale'
  | 'sg-private-rent'
  | 'sg-hdb'
  | 'sg-market-context';

export type InstalledSnapshot = Readonly<{
  marketId: SnapshotMarketId;
  dataset: MarketDataset;
  schemaVersion: string;
  sourceVersion: string;
  parserVersion: string;
  rightsPolicyId: string;
  period: string;
  generatedAt: string;
  objectUrl: string;
  sha256: string;
  recordCount: number;
}>;

export type InstalledSnapshotRegistry = Readonly<{
  registryVersion: 'signedprice-installed-snapshots-v1';
  snapshots: readonly InstalledSnapshot[];
}>;

const registryKeys = Object.freeze(['registryVersion', 'snapshots']);
const snapshotKeys = Object.freeze([
  'marketId',
  'dataset',
  'schemaVersion',
  'sourceVersion',
  'parserVersion',
  'rightsPolicyId',
  'period',
  'generatedAt',
  'objectUrl',
  'sha256',
  'recordCount',
]);
const marketDatasets = Object.freeze({
  'kr-seoul': Object.freeze([
    'kr-building-registry',
    'kr-sale',
    'kr-rent',
    'kr-conversion',
  ]),
  'sg-singapore': Object.freeze([
    'sg-private-sale',
    'sg-private-rent',
    'sg-hdb',
    'sg-market-context',
  ]),
} as const satisfies Readonly<Record<SnapshotMarketId, readonly MarketDataset[]>>);
const periodPattern = /^(\d{4})-(0[1-9]|1[0-2])\/(\d{4})-(0[1-9]|1[0-2])$/;
const digestPattern = /^[a-f0-9]{64}$/;
const installedObjectPattern = /^installed:\/\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invalid(): never {
  throw new Error('Invalid installed snapshot registry.');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length
    && keys.every((key, index) => key === [...expected].sort()[index]);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function isCompletedPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = periodPattern.exec(value);
  if (match === null) return false;
  const start = Number(`${match[1]}${match[2]}`);
  const end = Number(`${match[3]}${match[4]}`);
  return start <= end;
}

function isObjectUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (installedObjectPattern.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function parseSnapshot(value: unknown): InstalledSnapshot {
  if (!isObject(value) || !hasExactKeys(value, snapshotKeys)) invalid();
  const marketId = value.marketId;
  const dataset = value.dataset;
  if (marketId !== 'kr-seoul' && marketId !== 'sg-singapore') invalid();
  if (typeof dataset !== 'string'
    || !(marketDatasets[marketId] as readonly string[]).includes(dataset)) invalid();
  if (!isNonBlankString(value.schemaVersion)
    || !isNonBlankString(value.sourceVersion)
    || !isNonBlankString(value.parserVersion)
    || !isNonBlankString(value.rightsPolicyId)
    || !isCompletedPeriod(value.period)
    || !isCanonicalInstant(value.generatedAt)
    || !isObjectUrl(value.objectUrl)
    || typeof value.sha256 !== 'string'
    || !digestPattern.test(value.sha256)
    || !Number.isSafeInteger(value.recordCount)
    || (value.recordCount as number) < 0) invalid();

  return Object.freeze({
    marketId,
    dataset: dataset as MarketDataset,
    schemaVersion: value.schemaVersion,
    sourceVersion: value.sourceVersion,
    parserVersion: value.parserVersion,
    rightsPolicyId: value.rightsPolicyId,
    period: value.period,
    generatedAt: value.generatedAt,
    objectUrl: value.objectUrl,
    sha256: value.sha256,
    recordCount: value.recordCount as number,
  });
}

export function parseInstalledSnapshotRegistry(value: unknown): InstalledSnapshotRegistry {
  if (!isObject(value)
    || !hasExactKeys(value, registryKeys)
    || value.registryVersion !== 'signedprice-installed-snapshots-v1'
    || !Array.isArray(value.snapshots)) invalid();

  const snapshots = value.snapshots.map(parseSnapshot);
  const activations = new Set<string>();
  for (const snapshot of snapshots) {
    const activation = `${snapshot.marketId}:${snapshot.dataset}`;
    if (activations.has(activation)) invalid();
    activations.add(activation);
  }

  return Object.freeze({
    registryVersion: 'signedprice-installed-snapshots-v1',
    snapshots: Object.freeze(snapshots),
  });
}
