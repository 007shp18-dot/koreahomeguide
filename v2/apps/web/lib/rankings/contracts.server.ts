import 'server-only';
import { unstable_cache } from 'next/cache';
import { contentDatabase } from '../db/postgres.server';
import { contractRankingSql, type RankingOrder, type ContractRankingRow } from './contract-ranking-query';
import { regionalRentSql, type RentCohort, type RegionalRentRow } from './regional-rent-query';

const readRankings = unstable_cache(async (order: RankingOrder) => {
 const sql = contentDatabase();
 if (!sql) throw new Error('Ranking data unavailable');
 const rows = await sql.query(contractRankingSql(order)) as ContractRankingRow[];
 return { rows, checkedAt: new Date().toISOString() };
}, ['individual-contract-rankings-v2'], { revalidate: 900 });

export async function contractRankings(order: RankingOrder = 'highest') {
 try { return await readRankings(order); }
 catch { return null; }
}

const readRegions = unstable_cache(async (cohort: RentCohort) => {
 const sql=contentDatabase();
 if(!sql) throw new Error('Regional data unavailable');
 const rows=await sql.query(regionalRentSql(cohort)) as RegionalRentRow[];
 return {rows,checkedAt:new Date().toISOString()};
}, ['regional-rent-rankings-v1'], {revalidate:900});
export async function regionalRentRankings(cohort: RentCohort) {
 try { return await readRegions(cohort); } catch { return null; }
}
