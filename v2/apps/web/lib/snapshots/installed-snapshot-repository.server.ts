import 'server-only';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

import {
  parseInstalledSnapshotRegistry,
  type InstalledSnapshot,
  type MarketDataset,
  type SnapshotMarketId,
} from '@signedprice/market-core';

import installedSnapshotRegistry from '../../data/installed-snapshots.json';

export type VerifiedInstalledSnapshot = Readonly<{
  metadata: InstalledSnapshot;
  payload: unknown;
}>;

export type InstalledSnapshotRepository = Readonly<{
  get(marketId: SnapshotMarketId, dataset: MarketDataset): VerifiedInstalledSnapshot;
}>;

export class InstalledSnapshotUnavailableError extends Error {
  readonly code = 'installed_snapshot_unavailable' as const;

  constructor() {
    super('Verified installed snapshot is unavailable.');
    this.name = 'InstalledSnapshotUnavailableError';
  }
}

let checkedInObservedBuildingInventory: unknown;
let checkedInKoreaRentEvidence: unknown;
let checkedInKoreaSaleEvidence: unknown;
let checkedInKoreaConversionEvidence: unknown;
let checkedInSingaporePrivateSale: unknown;
let checkedInSingaporeHdb: unknown;
const checkedInSnapshotDigests = new WeakMap<object, string>();

function parseCompressedInventory(source: Buffer): unknown {
  const serialized = gunzipSync(source).toString('utf8');
  const parsed = JSON.parse(serialized) as unknown;
  if (typeof parsed === 'object' && parsed !== null) {
    checkedInSnapshotDigests.set(
      parsed,
      createHash('sha256').update(serialized).digest('hex'),
    );
  }
  return parsed;
}

function readCheckedInObservedBuildingInventory(): unknown {
  if (checkedInObservedBuildingInventory !== undefined) {
    return checkedInObservedBuildingInventory;
  }
  try {
    checkedInObservedBuildingInventory = parseCompressedInventory(readFileSync(resolve(
      process.cwd(),
      'data/observed-building-inventory.json.gz',
    )));
  } catch {
    try {
      checkedInObservedBuildingInventory = parseCompressedInventory(readFileSync(resolve(
        process.cwd(),
        'apps/web/data/observed-building-inventory.json.gz',
      )));
    } catch {
      return undefined;
    }
  }
  return checkedInObservedBuildingInventory;
}

function readCheckedInArtifact(
  current: unknown,
  assign: (value: unknown) => void,
  candidates: readonly (() => Buffer)[],
): unknown {
  if (current !== undefined) return current;
  for (const load of candidates) {
    try {
      const value = parseCompressedInventory(load());
      assign(value);
      return value;
    } catch {
      // Try the alternate project working directory before failing closed.
    }
  }
  return undefined;
}

export function resolveInstalledSnapshotObject(objectUrl: string): unknown {
  if (objectUrl === 'installed://kr-building-registry') {
    return readCheckedInObservedBuildingInventory();
  }
  if (objectUrl === 'installed://kr-rent') {
    return readCheckedInArtifact(
      checkedInKoreaRentEvidence,
      (value) => { checkedInKoreaRentEvidence = value; },
      [
        () => readFileSync(resolve(process.cwd(), 'data/korea-rent-evidence.json.gz')),
        () => readFileSync(resolve(
          process.cwd(),
          'apps/web/data/korea-rent-evidence.json.gz',
        )),
      ],
    );
  }
  if (objectUrl === 'installed://kr-sale') {
    return readCheckedInArtifact(
      checkedInKoreaSaleEvidence,
      (value) => { checkedInKoreaSaleEvidence = value; },
      [
        () => readFileSync(resolve(process.cwd(), 'data/korea-sale-evidence.json.gz')),
        () => readFileSync(resolve(
          process.cwd(),
          'apps/web/data/korea-sale-evidence.json.gz',
        )),
      ],
    );
  }
  if (objectUrl === 'installed://kr-conversion') {
    return readCheckedInArtifact(
      checkedInKoreaConversionEvidence,
      (value) => { checkedInKoreaConversionEvidence = value; },
      [
        () => readFileSync(resolve(process.cwd(), 'data/korea-conversion-evidence.json.gz')),
        () => readFileSync(resolve(
          process.cwd(),
          'apps/web/data/korea-conversion-evidence.json.gz',
        )),
      ],
    );
  }
  if (objectUrl === 'installed://sg-private-sale') {
    return readCheckedInArtifact(
      checkedInSingaporePrivateSale,
      (value) => { checkedInSingaporePrivateSale = value; },
      [
        () => readFileSync(resolve(process.cwd(), 'data/singapore-private-sale.json.gz')),
        () => readFileSync(resolve(
          process.cwd(),
          'apps/web/data/singapore-private-sale.json.gz',
        )),
      ],
    );
  }
  if (objectUrl === 'installed://sg-hdb') {
    return readCheckedInArtifact(
      checkedInSingaporeHdb,
      (value) => { checkedInSingaporeHdb = value; },
      [
        () => readFileSync(resolve(process.cwd(), 'data/singapore-hdb.json.gz')),
        () => readFileSync(resolve(process.cwd(), 'apps/web/data/singapore-hdb.json.gz')),
      ],
    );
  }
  return undefined;
}

export function resolveInstalledSnapshotRegistry(): unknown {
  return installedSnapshotRegistry;
}

export function shouldUseCheckedInSnapshots(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.NODE_ENV !== 'test'
    && environment.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS !== 'false';
}

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalJson(value: unknown, ancestors = new Set<object>()): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new InstalledSnapshotUnavailableError();
    return encoded;
  }
  if (ancestors.has(value)) throw new InstalledSnapshotUnavailableError();
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => canonicalJson(entry, ancestors)).join(',')}]`;
    }
    const object = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(object).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(object[key], ancestors)}`
    )).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

function snapshotIdentity(payload: Readonly<Record<string, unknown>>): Readonly<{
  schemaVersion: unknown;
  marketId: unknown;
  period: unknown;
  recordCount: number | null;
}> {
  const provenance = isObject(payload.provenance) ? payload.provenance : undefined;
  const totals = isObject(payload.totals) ? payload.totals : undefined;
  const artifactVersion = payload.artifactVersion;
  const singaporePeriod = isObject(payload.period)
    && typeof payload.period.from === 'string'
    && typeof payload.period.to === 'string'
    ? `${payload.period.from}/${payload.period.to}`
    : undefined;
  const singaporeMarket = payload.version === 'signedprice-singapore-private-sale-v1'
    || payload.version === 'signedprice-singapore-hdb-v1'
    || payload.version === 'signedprice-singapore-hdb-published-v1'
    ? 'sg-singapore'
    : undefined;
  const hdbPeriods = isObject(payload.periods) ? payload.periods : undefined;
  const hdbTotals = isObject(payload.totals) ? payload.totals : undefined;
  const hdbPeriodValues = [hdbPeriods?.resale, hdbPeriods?.rental]
    .filter((value): value is string => typeof value === 'string' && /^\d{4}-\d{2}\/\d{4}-\d{2}$/.test(value));
  const hdbPeriod = hdbPeriodValues.length === 2
    ? `${hdbPeriodValues.map((value) => value.slice(0, 7)).sort()[0]}/${hdbPeriodValues
      .map((value) => value.slice(8)).sort().at(-1)}`
    : undefined;
  return Object.freeze({
    schemaVersion: typeof artifactVersion === 'number'
      ? String(artifactVersion)
      : artifactVersion ?? payload.schemaVersion ?? payload.version,
    marketId: payload.marketId ?? provenance?.marketId ?? singaporeMarket,
    period: payload.version === 'signedprice-singapore-hdb-v1'
      || payload.version === 'signedprice-singapore-hdb-published-v1'
      ? hdbPeriod
      : singaporePeriod ?? payload.period ?? provenance?.period,
    recordCount: Array.isArray(payload.records)
      ? payload.records.length
      : Array.isArray(payload.areaRecords) && Array.isArray(payload.buildingRecords)
        ? payload.areaRecords.length + payload.buildingRecords.length
        : Number.isSafeInteger(hdbTotals?.sourceRows)
          && (hdbTotals?.sourceRows as number) >= 0
          ? hdbTotals?.sourceRows as number
        : Number.isSafeInteger(totals?.eligiblePairCount)
          && (totals?.eligiblePairCount as number) >= 0
          ? totals?.eligiblePairCount as number
        : null,
  });
}

export function createInstalledSnapshotRepository(input: Readonly<{
  registrySource: unknown;
  resolveObject(objectUrl: string): unknown;
}>): InstalledSnapshotRepository {
  let registry;
  try {
    registry = parseInstalledSnapshotRegistry(input.registrySource);
  } catch {
    throw new InstalledSnapshotUnavailableError();
  }
  const activations = new Map(
    registry.snapshots.map((snapshot) => [
      `${snapshot.marketId}:${snapshot.dataset}`,
      snapshot,
    ] as const),
  );

  return Object.freeze({
    get(marketId: SnapshotMarketId, dataset: MarketDataset): VerifiedInstalledSnapshot {
      try {
        const metadata = activations.get(`${marketId}:${dataset}`);
        if (metadata === undefined) throw new InstalledSnapshotUnavailableError();
        const payload = input.resolveObject(metadata.objectUrl);
        if (!isObject(payload)) throw new InstalledSnapshotUnavailableError();
        const digest = checkedInSnapshotDigests.get(payload)
          ?? createHash('sha256').update(canonicalJson(payload)).digest('hex');
        const identity = snapshotIdentity(payload);
        if (digest !== metadata.sha256
          || identity.schemaVersion !== metadata.schemaVersion
          || identity.marketId !== metadata.marketId
          || identity.period !== metadata.period
          || identity.recordCount !== metadata.recordCount) {
          throw new InstalledSnapshotUnavailableError();
        }
        return Object.freeze({ metadata, payload });
      } catch (error) {
        if (error instanceof InstalledSnapshotUnavailableError) throw error;
        throw new InstalledSnapshotUnavailableError();
      }
    },
  });
}
