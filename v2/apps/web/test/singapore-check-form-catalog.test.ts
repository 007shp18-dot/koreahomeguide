import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/singapore/check-evidence-repository.server', () => { throw new Error('Form choices must not load transaction history.'); });
import registry from '../data/installed-snapshots.json';
import candidate from '../data/singapore-check-form-catalog.json';
import { loadSingaporeCheckFormCatalog, singaporeCheckFormRegistryFingerprint } from '../lib/singapore/check-form-catalog.server';

const copyRegistry = () => structuredClone(registry);
const checkEntry = (value: typeof registry) => value.snapshots.find(entry => entry.dataset === 'sg-check-ura-private-sale')!;

describe('Singapore Check form-only release catalog', () => {
  it('opens verified published form choices without the transaction repository', () => {
    const result = loadSingaporeCheckFormCatalog({ environment: {} });
    expect(result?.published).toBe(true);
    expect(result?.catalogs['ura-private-sale'].available).toBe(true);
    expect(result?.catalogs['ura-private-sale'].projects.length).toBeGreaterThan(3000);
    expect(result?.catalogs['hdb-resale'].blocks.length).toBeGreaterThan(0);
    expect(result?.catalogs['hdb-rent'].blocks.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain('amountSgd');
  });
  it.each([
    'SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY',
    'SIGNEDPRICE_SINGAPORE_CHECK_URA_ARTIFACT',
    'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_ARTIFACT',
    'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_ARTIFACT',
  ])('bypasses installed form choices when %s is explicitly overridden', (name) => {
    expect(loadSingaporeCheckFormCatalog({ environment: { [name]: '' } })).toBeNull();
  });
  it('respects disabled installed snapshots', () => {
    expect(loadSingaporeCheckFormCatalog({ environment: { SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS: 'false' } })).toBeNull();
  });
  it('rejects changes to every bound release metadata field', () => {
    for (const [field, value] of Object.entries(checkEntry(registry))) {
      const changed = copyRegistry();
      Object.assign(checkEntry(changed), { [field]: typeof value === 'number' ? value + 1 : `${value}-changed` });
      expect(loadSingaporeCheckFormCatalog({ environment: {}, registrySource: changed }), field).toBeNull();
    }
  });
  it('binds all three releases but ignores unrelated markets and object key order', () => {
    for (const dataset of ['sg-check-hdb-rent', 'sg-check-hdb-resale']) {
      const changed = copyRegistry();
      changed.snapshots.find(entry => entry.dataset === dataset)!.sha256 = '0'.repeat(64);
      expect(loadSingaporeCheckFormCatalog({ environment: {}, registrySource: changed })).toBeNull();
    }
    const unrelated = copyRegistry();
    unrelated.snapshots.find(entry => entry.marketId === 'kr-seoul')!.sha256 = '0'.repeat(64);
    unrelated.snapshots.reverse();
    expect(singaporeCheckFormRegistryFingerprint(unrelated)).toBe(singaporeCheckFormRegistryFingerprint(registry));
  });
  it('fails closed on missing, duplicate or malformed sidecar metadata', () => {
    const missing = copyRegistry();
    missing.snapshots = missing.snapshots.filter(entry => entry.dataset !== 'sg-check-hdb-rent');
    expect(loadSingaporeCheckFormCatalog({ environment: {}, registrySource: missing })).toBeNull();
    const duplicate = copyRegistry();
    duplicate.snapshots.push(checkEntry(duplicate));
    expect(loadSingaporeCheckFormCatalog({ environment: {}, registrySource: duplicate })).toBeNull();
    for (const invalid of [null, {}, { ...candidate, version: 'old' }, { ...candidate, published: 'yes' }, { ...candidate, catalogs: {} }]) {
      expect(loadSingaporeCheckFormCatalog({ environment: {}, candidate: invalid })).toBeNull();
    }
  });
});
