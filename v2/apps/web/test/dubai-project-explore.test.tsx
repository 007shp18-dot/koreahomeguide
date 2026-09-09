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
  it('keeps area comparisons compact until the reader opens their evidence', () => {
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} model={model} projects={projects} />);
    const disclosures = [...html.matchAll(/<details[^>]*data-area-evidence[^>]*>/g)].map(match => match[0]);
    expect(disclosures).toHaveLength(captured.points.length);
    expect(disclosures.every(tag => !tag.includes(' open'))).toBe(true);
    expect(html).toContain('Price and rent details');
  });
  it('restores valid project identity without publishing a project-only URL', () => {
    const state = parseDubaiExploreState({ area: 'business-bay', project: '123-apartment-off-plan', stage: 'off-plan' });
    expect(buildDubaiExploreHref(state)).toContain('project=123-apartment-off-plan');
    expect(buildDubaiExploreHref({ ...state, selectedArea: null })).not.toContain('project=');
  });
});
