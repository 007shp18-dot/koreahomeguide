import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildingDisplayName } from '@/lib/public-market/seoul-display-names';
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 100) return Response.json({ items: [] });
  const { sale, rent } = koreaEvidenceRepositoriesFromEnvironment();
  if (!sale && !rent) return Response.json({ error: 'unavailable' }, { status: 503 });
  const needle = query.toLowerCase().replace(/\s/g, '');
  const seen = new Set<string>();
  const items = [...sale?.listBuildingRecords() ?? [], ...rent?.listBuildingRecords() ?? []].flatMap(b => {
    const key = `${b.districtSlug}/${b.buildingId}`;
    if (seen.has(key)) return []; seen.add(key);
    if (!`${b.officialName} ${buildingDisplayName(b.officialName, 'en')} ${b.neighborhoodName}`.toLowerCase().replace(/\s/g, '').includes(needle)) return [];
    const rows = 'recentSales' in b ? b.recentSales : b.recentTransactions;
    return [{ id: b.buildingId, name: b.officialName, englishName: buildingDisplayName(b.officialName, 'en'), district: b.districtSlug, neighborhood: b.neighborhoodName, housing: b.housingType, area: rows[0]?.areaSqm ?? null }];
  }).slice(0, 20);
  return Response.json({ items }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
