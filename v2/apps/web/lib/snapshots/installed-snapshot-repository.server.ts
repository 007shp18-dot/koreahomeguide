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

function parseCompressedInventory(source: Buffer): unknown {
  return JSON.parse(gunzipSync(source).toString('utf8'));
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
  return undefined;
}

export function resolveInstalledSnapshotRegistry(): unknown {
  return installedSnapshotRegistry;
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
  return Object.freeze({
    schemaVersion: typeof artifactVersion === 'number'
      ? String(artifactVersion)
      : artifactVersion ?? payload.schemaVersion,
    marketId: payload.marketId ?? provenance?.marketId,
    period: payload.period ?? provenance?.period,
    recordCount: Array.isArray(payload.records)
      ? payload.records.length
      : Array.isArray(payload.areaRecords) && Array.isArray(payload.buildingRecords)
        ? payload.areaRecords.length + payload.buildingRecords.length
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
        const digest = createHash('sha256').update(canonicalJson(payload)).digest('hex');
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
