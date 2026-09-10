import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/singapore/publication.server', () => ({ activeSingaporePublication: async () => null, singaporePublicationRightsRevoked: () => false }));
vi.mock('../lib/singapore/snapshot-repository.server', () => ({ singaporeSnapshotRepositoryFromEnvironment: () => { throw new Error('The verified index must not decompress transactions.'); } }));
import registry from '../data/installed-snapshots.json';
import index from '../data/singapore-explore-index.json';
import { loadInstalledSingaporeExploreIndex, loadSingaporeExploreIndex } from '../lib/singapore/explore-index.server';

describe('Singapore compact public Explore index', () => {
  it('serves every project from the verified index without loading transaction archives', async () => {
    const model = await loadSingaporeExploreIndex();
    expect(model.status).toBe('ready');
    if (model.status !== 'ready') throw new Error('Missing index');
    expect(model.segments).toHaveLength(3);
    expect(model.segments.reduce((total, segment) => total + (segment.projects?.length ?? 0), 0)).toBeGreaterThan(3000);
  });
  it('rejects stale release metadata and all explicit source overrides', () => {
    const changed = structuredClone(registry);
    changed.snapshots.find(entry => entry.dataset === 'sg-private-sale')!.sha256 = '0'.repeat(64);
    expect(loadInstalledSingaporeExploreIndex({ registrySource: changed, environment: {} })).toBeNull();
    for (const key of ['SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY', 'SIGNEDPRICE_SINGAPORE_SNAPSHOT_ARTIFACT']) {
      expect(loadInstalledSingaporeExploreIndex({ environment: { [key]: '' } })).toBeNull();
    }
    expect(loadInstalledSingaporeExploreIndex({ environment: { SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS: 'false' } })).toBeNull();
    expect(loadInstalledSingaporeExploreIndex({ candidate: { ...index, version: 'stale' }, environment: {} })).toBeNull();
  });
});
