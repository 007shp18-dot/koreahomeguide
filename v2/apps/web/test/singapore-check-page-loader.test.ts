import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ prepared: vi.fn(), evidence: vi.fn(), get: vi.fn(), publication: vi.fn(), revoked: vi.fn() }));
vi.mock('../lib/singapore/publication.server', () => ({ activeSingaporePublication: mocks.publication, singaporePublicationRightsRevoked: mocks.revoked }));
vi.mock('../lib/singapore/check-form-catalog.server', () => ({ loadSingaporeCheckFormCatalog: mocks.prepared }));
vi.mock('../lib/singapore/check-evidence-repository.server', () => ({ singaporeCheckEvidenceRepositoriesFromEnvironment: mocks.evidence }));

import { loadSingaporeCheckPageModel, singaporeCheckPageIsIndexable } from '../lib/singapore/check-page-loader.server';

const catalog = {
  available: true, months: [], segments: [], projects: [], districts: [], propertyTypes: [],
  floorRanges: [], saleTypes: [], towns: [], blocks: [], flatTypes: [], storeyRanges: [],
};
const prepared = { published: true, catalogs: { 'ura-private-sale': catalog, 'hdb-resale': catalog, 'hdb-rent': catalog } };
const ura = {
  submitted: '1', 'a-amount': '1000000', 'a-market': 'ura-private-sale', 'a-segment': 'CCR',
  'a-district': '09', 'a-property-type': 'Condominium', 'a-area-min': '80', 'a-area-max': '100',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prepared.mockReturnValue(prepared);
  mocks.publication.mockResolvedValue(null);
  mocks.revoked.mockReturnValue(false);
  mocks.get.mockReturnValue(null);
  mocks.evidence.mockResolvedValue({ get: mocks.get, availability: () => ({ 'ura-private-sale': false, 'hdb-resale': false, 'hdb-rent': false }) });
});

afterEach(() => vi.unstubAllEnvs());

describe('Singapore Check incremental evidence loading', () => {
  it('uses form-only choices with a production database configured', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured');
    const model = await loadSingaporeCheckPageModel({ 'a-project': 'known-project' });
    expect(mocks.evidence).toHaveBeenCalledWith([]);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(model.catalogs).toBe(prepared.catalogs);
    expect(mocks.publication).toHaveBeenCalledTimes(1);
  });

  it('overlays active private project choices without expanding HDB archives', async () => {
    mocks.publication.mockResolvedValue({ check: { records: [{ month: '2026-08', marketSegment: 'RCR', project: 'LIVE PROJECT', projectId: 'live-project', district: '15', propertyType: 'Condominium', floorRange: '06-10', saleType: 'Resale' }] } });
    const model = await loadSingaporeCheckPageModel({});
    expect(model.catalogs['ura-private-sale'].projects).toEqual([{ id: 'live-project', label: 'LIVE PROJECT' }]);
    expect(model.catalogs['hdb-rent']).toBe(prepared.catalogs['hdb-rent']);
    expect(mocks.evidence).toHaveBeenCalledWith([]);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('withdraws private form choices when active display rights are revoked', async () => {
    mocks.revoked.mockReturnValue(true);
    const model = await loadSingaporeCheckPageModel({});
    expect(model.catalogs['ura-private-sale'].available).toBe(false);
    expect(model.catalogs['ura-private-sale'].projects).toEqual([]);
    expect(model.catalogs['hdb-resale']).toBe(prepared.catalogs['hdb-resale']);
  });
  it('opens a retained project form without reading transaction evidence', async () => {
    const model = await loadSingaporeCheckPageModel({ 'a-project': 'known-project' });
    expect(mocks.evidence).toHaveBeenCalledWith([]);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(model.catalogs).toBe(prepared.catalogs);
    expect(model.drafts.a.project).toBe('known-project');
  });

  it('loads only the selected market for a valid single offer', async () => {
    const model = await loadSingaporeCheckPageModel(ura);
    expect(mocks.evidence).toHaveBeenCalledWith(['ura-private-sale']);
    expect(model.result).toMatchObject({ kind: 'single', offer: { status: 'unavailable' } });
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith('ura-private-sale');
  });

  it('loads both selected markets for a comparison', async () => {
    await loadSingaporeCheckPageModel({ ...ura, mode: 'compare', 'b-market': 'hdb-rent', 'b-town': 'BEDOK', 'b-flat-type': '3-ROOM', 'b-amount': '2500' });
    expect(mocks.evidence).toHaveBeenCalledWith(['ura-private-sale', 'hdb-rent']);
  });

  it('rejects invalid submissions without loading history', async () => {
    const model = await loadSingaporeCheckPageModel({ submitted: '1', 'a-market': ['ura-private-sale', 'hdb-rent'] });
    expect(mocks.evidence).toHaveBeenCalledWith([]);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(model.result).toMatchObject({ kind: 'invalid' });
  });

  it('falls back to verified source loading if the catalog is stale or overridden', async () => {
    mocks.prepared.mockReturnValue(null);
    await loadSingaporeCheckPageModel({});
    expect(mocks.evidence).toHaveBeenCalledWith(undefined);
    expect(mocks.get).toHaveBeenCalled();
  });

  it('keeps landing publication and query noindex without loading history', async () => {
    expect(await singaporeCheckPageIsIndexable({})).toBe(true);
    expect(await singaporeCheckPageIsIndexable({ 'a-project': 'known-project' })).toBe(false);
    mocks.prepared.mockReturnValue({ ...prepared, published: false });
    expect(await singaporeCheckPageIsIndexable({})).toBe(false);
    expect(mocks.evidence).not.toHaveBeenCalled();
  });
});
