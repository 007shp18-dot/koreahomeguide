import { rankingPath, type RankingLocale } from '@/lib/rankings/ranking-locale';
import { redirect } from 'next/navigation';

import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { ContractRankings } from '@/components/rankings/contract-rankings';
import { contractRankings, regionalRentRankings } from '@/lib/rankings/contracts.server';
import { resolveRentCohort } from '@/lib/rankings/regional-rent-query';
import { RegionalRentRankings } from '@/components/rankings/regional-rent-rankings';
import { TokyoRankings } from '@/components/rankings/tokyo-rankings';
import { DubaiRankings } from '@/components/rankings/dubai-rankings';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import { dubaiProjectEvidenceForContext } from '@/lib/dubai/project-evidence.server';


export async function RankingsPage({ searchParams, locale = 'en' }: { searchParams: Promise<Record<string,string | string[] | undefined>>; locale?: RankingLocale }) {
 const query = await searchParams;
 if (query.city === 'dubai') {
  const order = query.order === 'lowest' ? 'lowest' : 'highest';
  const stage = query.stage === 'ready' ? 'ready' : 'off-plan';
  if (query.kind === 'rent') redirect(`${rankingPath(locale)}?city=dubai&kind=sale&order=${order}&stage=${stage}`);
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  const context = repository?.getContext() ?? null;
  return <RankingMarketsHub locale={locale} query={query}><DubaiRankings locale={locale} context={context} projects={context ? dubaiProjectEvidenceForContext(context) : []} order={order} stage={stage}/></RankingMarketsHub>;
 }
 if (query.city === 'tokyo') {
  if (query.kind === 'rent' || query.order === 'lowest') redirect(`${rankingPath(locale)}?city=tokyo&kind=sale&order=highest`);
  return <RankingMarketsHub locale={locale} query={query}><TokyoRankings locale={locale} /></RankingMarketsHub>;
 }
 const city = query.city === 'singapore' ? 'singapore' : 'seoul';
 const kind = query.kind === 'rent' ? 'rent' : 'sale';
 const order = query.order === 'lowest' ? 'lowest' : 'highest';
 if(kind==='rent') {
  const cohort=resolveRentCohort(city,query);
  const data=await regionalRentRankings(cohort);
  return <RankingMarketsHub locale={locale} query={query}><RegionalRentRankings locale={locale} rows={data?.rows ?? null} cohort={cohort} order={order} checkedAt={data?.checkedAt}/></RankingMarketsHub>;
 }
 const data = await contractRankings(order);
 return <RankingMarketsHub locale={locale} query={query}><ContractRankings locale={locale} rows={data?.rows ?? null} checkedAt={data?.checkedAt} city={city} kind={kind} order={order} /></RankingMarketsHub>;
}
