import 'server-only';

import { createHash } from 'node:crypto';
import registry from '../../data/installed-snapshots.json';
import installedIndex from '../../data/singapore-explore-index.json' with { type: 'json' };
import { loadPublishedSingaporeExplore } from './explore-publication.server';
import { singaporeSnapshotRepositoryFromEnvironment } from './snapshot-repository.server';
import { buildSingaporeExploreModel } from './route-model.server';
import { unpackSingaporeExploreModel, type PackedSingaporeExploreModel } from './explore-transport';
import type { SingaporeExploreModel } from './route-types';

export const SINGAPORE_EXPLORE_INDEX_VERSION = 'signedprice-singapore-explore-index-v1';
export function singaporeExploreRegistryFingerprint(source: unknown): string | null {
  const value = source as typeof registry | null;
  if (!value || value.registryVersion !== 'signedprice-installed-snapshots-v1' || !Array.isArray(value.snapshots)) return null;
  const entries = value.snapshots.filter(entry => entry.marketId === 'sg-singapore' && entry.dataset === 'sg-private-sale');
  if (entries.length !== 1) return null;
  const entry = entries[0]!;
  return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))))).digest('hex');
}

let installedModel: SingaporeExploreModel | null = null;
/** A build-verified public index, never transaction history or private source records. */
export function loadInstalledSingaporeExploreIndex({ candidate = installedIndex as unknown, environment = process.env, registrySource = registry as unknown }: Readonly<{
  candidate?: unknown; environment?: Readonly<Record<string, string | undefined>>; registrySource?: unknown;
}> = {}): SingaporeExploreModel | null {
  if (environment.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || environment.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined || environment.SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT !== undefined) return null;
  const index = candidate as { version?: string; registryFingerprint?: string; model?: PackedSingaporeExploreModel } | null;
  const fingerprint = singaporeExploreRegistryFingerprint(registrySource);
  if (!index || fingerprint === null || index.version !== SINGAPORE_EXPLORE_INDEX_VERSION || index.registryFingerprint !== fingerprint || index.model?.status !== 'ready') return null;
  if (candidate === installedIndex && installedModel !== null) return installedModel;
  const model = unpackSingaporeExploreModel(index.model);
  if (candidate === installedIndex) installedModel = model;
  return model;
}

const modelCache = new WeakMap<object, SingaporeExploreModel>();
export async function loadSingaporeExploreIndex(): Promise<SingaporeExploreModel> {
  const explicitSource = process.env.SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT !== undefined || process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined;
  if (!explicitSource) {
    const publication = await loadPublishedSingaporeExplore();
    if (publication.status === 'ready') return publication.model;
    if (publication.status === 'unavailable') return buildSingaporeExploreModel(null);
    const installed = loadInstalledSingaporeExploreIndex();
    if (installed !== null) return installed;
  }
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return buildSingaporeExploreModel(null);
  const cached = modelCache.get(repository);
  if (cached) return cached;
  const model = buildSingaporeExploreModel(repository);
  modelCache.set(repository, model);
  return model;
}
