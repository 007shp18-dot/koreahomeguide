import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const captured = vi.hoisted(() => ({ points: [] as { id: string; selected?: boolean; title: string; label: string }[] }));
vi.mock('../components/maps/google-place-map', () => ({ GooglePlaceMap: ({ points }: { points: typeof captured.points }) => {
  captured.points = points; return <div />;
} }));
import { DubaiExplorer } from '../components/dubai/dubai-explorer';
import { dubaiEvidenceRepositoryFromEnvironment } from '../lib/dubai/evidence-repository.server';
import { buildDubaiExploreModel } from '../lib/dubai/route-model.server';
import { dubaiProjectEvidenceForContext } from '../lib/dubai/project-evidence.server';
import { parseDubaiExploreState, buildDubaiExploreHref } from '../lib/dubai/explore-model';

describe('Dubai project Explore release', () => {
  const repository = dubaiEvidenceRepositoryFromEnvironment()!;
  const model = buildDubaiExploreModel(repository);
  const projects = dubaiProjectEvidenceForContext(repository.getContext());
  it('binds project publication to the same released area source and period', () => {
    expect(projects).toHaveLength(56);
    expect(dubaiProjectEvidenceForContext({ ...repository.getContext(), dataDigest: 'changed' })).toEqual([]);
    expect(dubaiProjectEvidenceForContext({ ...repository.getContext(), displayState: 'stale' })).toEqual([]);
  });
  it('keeps a project deep link, its price card, and its area marker together', () => {
    const project = projects[0]!;
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} model={model} projects={projects}
      initialArea={project.areaSlug} initialStage={project.stage} initialHousing={project.housing}
      initialProjectId={project.id} initialPage={999} />);
    expect(html).toContain(project.name);
    expect(html).toContain('Area location only');
    expect(html).toContain(`DLD project ${project.projectNumber}`);
    expect(html).toContain(`AED ${project.medianPriceAed.toLocaleString('en')}`);
    const marker = captured.points.find(point => point.selected);
    expect(marker?.id).toBe(project.areaSlug);
    expect(marker?.label).toBe(marker?.title);
    expect(marker?.title).not.toBe(project.name);
    expect(captured.points).toHaveLength(Math.min(24, captured.points.length));
  });
  it.each([undefined, 'marsa-dubai'])('keeps area comparisons compact, including selected area %s, until the reader opens evidence', (initialArea) => {
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} model={model} projects={projects} initialArea={initialArea} />);
    const disclosures = [...html.matchAll(/<details[^>]*data-area-evidence[^>]*>/g)].map(match => match[0]);
    expect(disclosures).toHaveLength(captured.points.length);
    expect(disclosures.every(tag => !tag.includes(' open'))).toBe(true);
    expect(html).toContain('Price and rent details');
  });
  it.each(['apartment', 'villa'] as const)('carries the selected Off-Plan %s cohort from both list and map preview into detail', (housing) => {
    if (model.status !== 'ready') throw new Error('missing released Dubai evidence');
    const area = model.areas.find(item => item.href !== null && item.segments.some(segment => segment.housing === housing && segment.sales.offPlan !== null));
    if (area?.href == null) throw new Error('missing released Off-Plan cohort');
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} model={model}
      initialArea={area.slug} initialStage="off-plan" initialHousing={housing} />);
    const links = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>View area prices<\/a>/g)].map(match => new URL(match[1]!.replaceAll('&amp;', '&'), 'https://signedprice.test'));
    expect(links.length).toBeGreaterThan(1);
    expect(links.filter(link => link.pathname.replace(/\/$/u, '') === area.href!.replace(/\/$/u, ''))).toHaveLength(2);
    for (const link of links) {
      expect(link.searchParams.get('stage')).toBe('off-plan');
      expect(link.searchParams.get('housing')).toBe(housing);
    }
  });
  it('restores valid project identity without publishing a project-only URL', () => {
    const state = parseDubaiExploreState({ area: 'business-bay', project: '123-apartment-off-plan', stage: 'off-plan' });
    expect(buildDubaiExploreHref(state)).toContain('project=123-apartment-off-plan');
    expect(buildDubaiExploreHref({ ...state, selectedArea: null })).not.toContain('project=');
  });
});
