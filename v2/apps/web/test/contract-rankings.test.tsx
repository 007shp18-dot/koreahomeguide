import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContractRankings } from '../components/rankings/contract-rankings';
import { rankingMoney, type ContractRankingRow } from '../lib/rankings/contract-ranking-query';
import { rankRegions, resolveRentCohort, regionalRentSql, type RegionalRentRow } from '../lib/rankings/regional-rent-query';
import data from '../../../../artifacts/rankings/2026-09-11-sales.json';
import rentalData from '../../../../artifacts/rankings/2026-09-11-regional-rents.json';
const rows = data.rows as unknown as (ContractRankingRow & {order:string})[];
describe('reviewed rankings', () => {
 it('keeps 50 distinct sales in correct order for each market and direction',()=>{
  for(const city of ['seoul','singapore'])for(const order of ['highest','lowest']){
   const group=rows.filter(r=>r.city===city&&r.order===order);
   expect(group).toHaveLength(50);expect(new Set(group.map(r=>r.id)).size).toBe(50);
   group.slice(1).forEach((r,i)=>expect((Number(r.amount)-Number(group[i]!.amount))*(order==='highest'?-1:1)).toBeGreaterThanOrEqual(0));
   expect(group.every(r=>/[A-Za-z가-힣]/.test(r.name)&&!['단독','다가구','아파트','UNKNOWN'].includes(r.name))).toBe(true);
  }
 });
 it('preserves full currency amounts',()=>{
  expect(rankingMoney(rows.find(r=>r.city==='seoul'&&r.order==='highest')!)).toBe('₩25,500,000,000');
  expect(rankingMoney(rows.find(r=>r.city==='singapore'&&r.order==='highest')!)).toBe('S$7,883,000');
 });
 it('renders database Date values for source timestamps',()=>{
  const row = {...rows.find(r=>r.city==='seoul'&&r.order==='highest')!, source_as_of: new Date('2026-09-11T00:00:00.000Z')};
  const html = renderToStaticMarkup(<ContractRankings rows={[row]} city="seoul" kind="sale"/>);
  expect(html).toContain('Source collected: 2026-09-11');
 });
 it('validates cohorts and keeps the source month independent of cohort filtering',()=>{
  const c=resolveRentCohort('singapore',{area:"invalid'",beds:'100',deposit:'invalid'});
  expect(c.area).toBe('60-90');expect(c.beds).toBe('2');
  const sql=regionalRentSql(c);
  expect(sql.indexOf('), months AS MATERIALIZED (')).toBeLessThan(sql.indexOf('), grouped AS ('));
  expect(sql).toContain('HAVING count(*)>=10');expect(sql).not.toContain("invalid'");
 });
 it('uses district competition ranks and retains cents',()=>{
  for(const group of rentalData.groups)expect(group.rows.every(r=>r.n>=10)).toBe(true);
  const kr=rentalData.groups.find(g=>g.city==='seoul')!;
  const ranked=rankRegions(kr.rows as RegionalRentRow[],'lowest');
  expect(ranked.slice(0,3).map(r=>r.rank)).toEqual([1,1,3]);
  const sg=rentalData.groups.find(g=>g.city==='singapore')!;
  expect(sg.rows.some(r=>r.amount===3237.5)).toBe(true);
 });
 it('does not fabricate rankings on data failure',()=>{
  expect(renderToStaticMarkup(<ContractRankings rows={null} city="seoul" kind="sale"/>)).toContain('temporarily unavailable');
 });
});
