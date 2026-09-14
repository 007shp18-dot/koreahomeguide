import { authorized } from '@/lib/evidence-pool/auth.server';
import { contentDatabase } from '@/lib/db/postgres.server';
import { classified } from '@/lib/evidence-pool/query.server';
import { marketCollectionStatus } from '@/lib/data-operations/market-status.server';
import { adminCities, type AdminOverview, type OverviewArticle } from '@/lib/admin/overview';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: Request) {
  if (!authorized(request)) return reply({ error: 'unauthorized' }, 401);
  const city = adminCities.find(city => city.id === (new URL(request.url).searchParams.get('city') ?? 'all'));
  if (!city) return reply({ error: 'invalid_city' }, 400);
  const db = contentDatabase();
  if (!db) return reply({ error: 'database_not_configured' }, 503);
  // Independent sections remain usable when one underlying data source is unavailable.
  const results = await Promise.allSettled([
    marketCollectionStatus(db),
    db.query(`${classified} SELECT e.data->>'market' AS market, e.quality, count(*)::integer AS count
      FROM classified e WHERE e.status='pending' AND ($1='all' OR e.data->>'market'=$1)
      GROUP BY e.data->>'market',e.quality ORDER BY e.data->>'market',e.quality`, [city.id]),
    db.query(`SELECT slug,payload->>'title' AS title,payload->>'locale' AS locale,
      payload->>'marketKey' AS market,state,count(*) OVER ()::integer AS total
      FROM editorial_publication_queue WHERE state IN ('draft','failed','cancelled')
      AND ($1='all' OR payload->>'marketKey'=$1) ORDER BY updated_at DESC,slug LIMIT 5`, [city.id]),
  ]);
  const [jobs, issues, editorial] = results;
  const data: AdminOverview = {
    city: city.id, refreshedAt: new Date().toISOString(),
    jobs: jobs.status === 'fulfilled' ? jobs.value.filter(job => city.id === 'all' || job.job.startsWith(city.prefix)) : null,
    issues: issues.status === 'fulfilled' ? issues.value.map(row => ({ market: String(row.market), quality: String(row.quality), count: Number(row.count) })) : null,
    editorial: editorial.status === 'fulfilled' ? {
      total: Number(editorial.value[0]?.total ?? 0),
      articles: editorial.value.map(row => ({ slug: String(row.slug), title: String(row.title || row.slug), locale: String(row.locale ?? 'en'), market: String(row.market ?? 'global'), state: String(row.state) })) as OverviewArticle[],
    } : null,
    unavailable: results.flatMap((result, index) => result.status === 'rejected' ? [['수집 기록', '자료 검토', '기사 목록'][index]!] : []),
  };
  return reply(data);
}
