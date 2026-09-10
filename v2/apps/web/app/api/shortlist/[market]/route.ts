import { defaults, validBudgetFilters, type BudgetFilters } from '@/lib/global-shortlist/model';
import { overseasBudget } from '@/lib/global-shortlist/repository.server';
export async function GET(request: Request, { params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (market !== 'singapore' && market !== 'dubai' && market !== 'tokyo') return Response.json({ error: 'unknown_market' }, { status: 404 });
  const query = new URL(request.url).searchParams;
  const base = defaults(market);
  const filters: BudgetFilters = { budget: Number(query.get('budget') ?? base.budget), minArea: Number(query.get('minArea') ?? base.minArea), maxArea: Number(query.get('maxArea') ?? base.maxArea), region: query.get('region') ?? base.region, housing: query.get('housing') ?? base.housing, completion: query.get('completion') ?? base.completion };
  const page = Number(query.get('page') ?? 1), saved = query.getAll('saved');
  if (!validBudgetFilters(filters, market) || !Number.isSafeInteger(page) || page < 1 || page > 10000 || saved.length > 30 || saved.some(s => !/^[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]{1,160}$/.test(s))) return Response.json({ error: 'invalid_search' }, { status: 400 });
  const result = await overseasBudget(market, filters, saved, page);
  return Response.json(result ?? { error: 'evidence_unavailable' }, { status: result ? 200 : 503, headers: { 'Cache-Control': 'private, no-store' } });
}
