import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: async () => [{release_id:'revoked',rights_allowed:false}] }) }));
beforeEach(() => { vi.resetModules(); vi.stubEnv('DATABASE_URL','test-configured'); });
describe('explicit Singapore rights withdrawal', () => {
 it('does not revive installed sale snapshots after a revoked active release', async () => {
  const { singaporeSnapshotRepositoryFromEnvironment } = await import('../lib/singapore/snapshot-repository.server');
  expect(await singaporeSnapshotRepositoryFromEnvironment()).toBeNull();
 });
 it('removes URA Check evidence rather than falling back to installed URA', async () => {
  const { singaporeCheckEvidenceRepositoriesFromEnvironment } = await import('../lib/singapore/check-evidence-repository.server');
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment(['ura-private-sale']);
  expect(repositories.get('ura-private-sale')).toBeNull();
  expect(repositories.availability()['ura-private-sale']).toBe(false);
 });
});

afterEach(() => vi.unstubAllEnvs());
