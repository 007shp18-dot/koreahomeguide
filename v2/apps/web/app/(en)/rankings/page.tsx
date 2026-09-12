import type { Metadata } from 'next';

import { RankingMarketsHub } from '@/components/rankings/ranking-markets-hub';
import { indexableMetadata } from '@/lib/public-metadata';
import { ContractRankings } from '@/components/rankings/contract-rankings';
import { contractRankings, regionalRentRankings } from '@/lib/rankings/contracts.server';
import { resolveRentCohort } from '@/lib/rankings/regional-rent-query';
import { RegionalRentRankings } from '@/components/rankings/regional-rent-rankings';

export const metadata: Metadata = indexableMetadata({
  path: '/rankings/',
  title: 'Property price rankings by market | signedprice',
  description: 'Highest and lowest individual apartment and condo sale prices, plus district rental medians matched by size, deposit or bedroom count.',
  languageAlternates: { en: '/rankings/', ko: '/ko/rankings/', 'zh-Hans': '/zh-cn/rankings/' },
});

export default async function RankingsHubPage({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
 const query = await searchParams;
 const city = query.city === 'singapore' ? 'singapore' : 'seoul';
 const kind = query.kind === 'rent' ? 'rent' : 'sale';
 const order = query.order === 'lowest' ? 'lowest' : 'highest';
 if(kind==='rent') {
  const cohort=resolveRentCohort(city,query);
  const data=await regionalRentRankings(cohort);
  return <RankingMarketsHub><RegionalRentRankings rows={data?.rows ?? null} cohort={cohort} order={order} checkedAt={data?.checkedAt}/></RankingMarketsHub>;
 }
 const data = await contractRankings(order);
 return <RankingMarketsHub><ContractRankings rows={data?.rows ?? null} checkedAt={data?.checkedAt} city={city} kind={kind} order={order} /></RankingMarketsHub>;
}
