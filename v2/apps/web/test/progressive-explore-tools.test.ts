import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { singaporeSnapshotRepositoryFromEnvironment } from '../lib/singapore/snapshot-repository.server';
import { buildSingaporeExploreModel } from '../lib/singapore/route-model.server';
import { singaporeExploreOverview } from '../lib/singapore/explore-progressive.server';
import { GET as explore } from '../app/api/singapore/explore/route';
import { unpackSingaporeExploreModel } from '../lib/singapore/explore-transport';
import { GET as options } from '../app/api/singapore/check-options/route';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '../lib/singapore/check-evidence-repository.server';

describe('Progressive Singapore data loading', () => {
  it('keeps region anchors and totals while removing the project catalog from the initial payload', async () => {
    const full = buildSingaporeExploreModel(await singaporeSnapshotRepositoryFromEnvironment());
    expect(full.status).toBe('ready');
    const overview = singaporeExploreOverview(full);
    if (full.status !== 'ready' || overview.model.status !== 'ready') throw new Error('missing evidence');
    expect(overview.model.segments.map(s => s.projectCount)).toEqual(full.segments.map(s => s.projectCount));
    expect(overview.model.segments.every(s => s.projects.length === 0)).toBe(true);
    expect(overview.regionPoints).toHaveLength(3);
    expect(JSON.stringify(overview).length).toBeLessThan(JSON.stringify(full).length / 10);
    console.log('Explore model bytes', JSON.stringify(full).length, '=>', JSON.stringify(overview).length);
  }, 30000);
  it('only returns the requested region, and rejects invalid filters', async () => {
    const response = await explore(new Request('https://signedprice.com/api/singapore/explore/?region=CCR'));
    expect(response.status).toBe(200);
    const model = unpackSingaporeExploreModel(await response.json());
    if (model.status !== 'ready') throw new Error('missing model');
    expect(model.segments.find(s => s.code === 'CCR')!.projects!.length).toBeGreaterThan(0);
    expect(model.segments.filter(s => s.code !== 'CCR').every(s => !s.projects?.length)).toBe(true);
    expect((await explore(new Request('https://signedprice.com/api/singapore/explore/?region=bad'))).status).toBe(400);
  }, 30000);
  it('decodes only the selected check market and caps searchable choices', async () => {
    const repository = await singaporeCheckEvidenceRepositoriesFromEnvironment(['ura-private-sale']);
    expect(repository.get('ura-private-sale')).not.toBeNull();
    expect(repository.get('hdb-resale')).toBeNull();
    expect(repository.get('hdb-rent')).toBeNull();
    const response = await options(new Request('https://signedprice.com/api/singapore/check-options/?market=ura-private-sale&kind=projects&q='));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options.length).toBeLessThanOrEqual(40);
    const label = result.options[0][1];
    const search = await options(new Request(`https://signedprice.com/api/singapore/check-options/?market=ura-private-sale&kind=projects&q=${encodeURIComponent(label)}`));
    expect((await search.json()).options.some((row: string[]) => row[1] === label)).toBe(true);
  }, 30000);
});
