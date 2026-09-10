import 'server-only';
import { buildSingaporeAreaMapCoverage } from './map-coverage';
import type { SingaporeExploreModel } from './route-types';

export function singaporeExploreOverview(model: SingaporeExploreModel) {
  if (model.status !== 'ready') return { model, regionPoints: [], districtSummary: [] };
  const projects = model.segments.flatMap(segment => (segment.projects ?? []).map(project => ({ ...project, segment: segment.code })));
  const districts = new Map<string, { region: string; district: string; count: number }>();
  for (const project of projects) {
    const key = `${project.segment}:${project.district}`;
    const entry = districts.get(key) ?? { region: project.segment, district: project.district, count: 0 };
    entry.count += 1; districts.set(key, entry);
  }
  return {
    districtSummary: [...districts.values()],
    model: { ...model, segments: model.segments.map(segment => ({ ...segment, projects: [] })) },
    regionPoints: buildSingaporeAreaMapCoverage(projects, projects, 'region').points,
  };
}
