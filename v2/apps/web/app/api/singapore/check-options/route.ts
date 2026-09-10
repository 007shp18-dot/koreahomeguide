import { loadActiveSingaporeCheckFormCatalog } from '@/lib/singapore/check-page-loader.server';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '@/lib/singapore/check-evidence-repository.server';
import { buildSingaporeCheckRouteModel } from '@/lib/singapore/check-route-model.server';
import { SINGAPORE_CHECK_MARKETS, type SingaporeCheckMarket } from '@signedprice/singapore-property';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const market = params.get('market') as SingaporeCheckMarket;
  const kind = params.get('kind');
  const q = (params.get('q') ?? '').trim().toLocaleLowerCase('en');
  if (!SINGAPORE_CHECK_MARKETS.includes(market) || !['projects', 'blocks'].includes(kind ?? '') || q.length > 100) return Response.json({ error: 'Invalid search' }, { status: 400 });
  try {
    const prepared = await loadActiveSingaporeCheckFormCatalog();
    const catalog = prepared?.catalogs[market] ?? buildSingaporeCheckRouteModel(await singaporeCheckEvidenceRepositoriesFromEnvironment([market]), {}).catalogs[market];
    if (!catalog.available) return Response.json({ error: 'Unavailable' }, { status: 503 });
    const entries = kind === 'projects' ? catalog.projects : catalog.blocks;
    const options = entries.filter(item => item.label.toLocaleLowerCase('en').includes(q)).slice(0, 40).map(item => [item.id, item.label]);
    return Response.json({ options }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch { return Response.json({ error: 'Unavailable' }, { status: 503 }); }
}
