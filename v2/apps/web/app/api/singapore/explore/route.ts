import { loadSingaporeExploreIndex } from '@/lib/singapore/explore-index.server';
import { packSingaporeExploreModel } from '@/lib/singapore/explore-transport';
import { singaporeProjectSearchTerm } from '@/lib/singapore/project-display-name';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const region = params.get('region') ?? '';
  const q = params.get('q') ?? '';
  const district = params.get('district') ?? '';
  const id = params.get('project') ?? '';
  if ((region && !['CCR', 'RCR', 'OCR'].includes(region)) || q.length > 100 || id.length > 128 || (district && !/^(0[1-9]|1[0-9]|2[0-8])$/.test(district))) return Response.json({ error: 'Invalid filters' }, { status: 400 });
  try {
    const model = await loadSingaporeExploreIndex();
    if (model.status !== 'ready') return Response.json({ error: 'Temporarily unavailable' }, { status: 503 });
    const term = singaporeProjectSearchTerm(q);
    const selected = { ...model, segments: model.segments.map(segment => ({ ...segment,
      projects: (segment.projects ?? []).filter(project =>
        (!region || segment.code === region) && (!district || project.district === district)
        && (!id || project.id === id)
        && (!term || singaporeProjectSearchTerm(`${project.name} ${project.street} ${project.district} district ${Number(project.district)} ${segment.code}`).includes(term))),
    })) };
    return Response.json(packSingaporeExploreModel(selected), { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch { return Response.json({ error: 'Temporarily unavailable' }, { status: 503 }); }
}
