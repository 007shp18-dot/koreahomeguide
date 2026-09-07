import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
import { buildShortlist, DEFAULT_FILTERS, validFilters } from '@/lib/seoul-shortlist/model';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const filters = {
    budget: Number(query.get('budget') ?? DEFAULT_FILTERS.budget),
    minArea: Number(query.get('minArea') ?? DEFAULT_FILTERS.minArea),
    maxArea: Number(query.get('maxArea') ?? DEFAULT_FILTERS.maxArea),
    district: query.get('district') ?? 'all',
  };
  const ids = query.getAll('saved');
  const page = Number(query.get('page') ?? '1');
  if (!validFilters(filters) || !Number.isSafeInteger(page) || page < 1 || page > 10000
    || ids.length > 30 || ids.some(id => !/^[a-z0-9_-]+\/[a-zA-Z0-9_-]{1,160}$/.test(id))
    || (filters.district !== 'all' && !SEOUL_RENT_CHECK_DISTRICTS.some(d => d.slug === filters.district))) {
    return Response.json({ status: 'invalid_request' }, { status: 400 });
  }
  const repository = koreaEvidenceRepositoriesFromEnvironment().sale;
  if (!repository) return Response.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return Response.json(buildShortlist(repository.getArtifact(), filters, ids, page), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
