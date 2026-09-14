import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { contractRankingSql } from '../lib/rankings/contract-ranking-query';
import { regionalRentSql, resolveRentCohort } from '../lib/rankings/regional-rent-query';

// Execute the production window-selection CTEs against controlled records.
// These CTEs use standard SQL window semantics supported by SQLite and PostgreSQL.
function run(order: 'highest' | 'lowest', rows: unknown[][]) {
 const source = contractRankingSql(order);
 const ctes = source.slice(source.indexOf('monthly_contracts AS ('), source.indexOf('\nSELECT dataset_id'));
 const sql = `WITH months AS (SELECT dataset_id, max(substr(observed_at,1,7)) AS month FROM eligible GROUP BY dataset_id), ${ctes}
 SELECT subject_entity_id,ranking_amount,rank,position,sample,id FROM ranked WHERE position<=50 ORDER BY dataset_id,position`;
 const python = `import json,sqlite3,sys
payload=json.load(sys.stdin)
db=sqlite3.connect(':memory:')
db.row_factory=sqlite3.Row
db.create_function('date_trunc',2,lambda unit,value:value[:7])
db.execute('CREATE TABLE eligible(dataset_id TEXT,subject_entity_id TEXT,ranking_amount REAL,observed_at TEXT,id TEXT,fetched_at TEXT)')
db.executemany('INSERT INTO eligible VALUES (?,?,?,?,?,?)',payload['rows'])
print(json.dumps([dict(row) for row in db.execute(payload['sql'])]))`;
 return JSON.parse(execFileSync('python3',['-c',python],{input:JSON.stringify({sql,rows}),encoding:'utf8'})) as {subject_entity_id:string;ranking_amount:number;rank:number;position:number;sample:number;id:string}[];
}
const row=(property:string,price:number,id=property,date='2026-08-10',dataset='kr-sale')=>[dataset,property,price,date,id,'2026-09-14'];
describe('one representative contract per property',()=>{
 it('deduplicates before taking 50, refilling from all eligible properties',()=>{
  const data=[...Array.from({length:60},(_,i)=>row(`p${i}`,1000-i)),...Array.from({length:60},(_,i)=>row('p0',2000+i,`duplicate${i}`))];
  const result=run('highest',data);
  expect(result).toHaveLength(50);
  expect(new Set(result.map(r=>r.subject_entity_id)).size).toBe(50);
  expect(result[0]?.ranking_amount).toBe(2059);
  expect(result[49]?.subject_entity_id).toBe('p49');
  expect(result.every(r=>r.sample===120)).toBe(true);
 });
 it('uses each property’s lowest contract for ascending order and retains competition ties',()=>{
  const data=[row('a',100,'a-high'),row('a',10,'a-low'),row('b',10),row('c',20)];
  expect(run('lowest',data).map(r=>[r.id,r.rank])).toEqual([['a-low',1],['b',1],['c',3]]);
 });
 it('selects the latest monthly contract when prices tie, without merging markets',()=>{
  const data=[row('same',100,'old-tie'),row('same',100,'new-tie','2026-08-11'),row('same',999,'older-month','2026-07-31'),row('same',50,'sg','2026-08-01','sg-private-sale')];
  expect(run('highest',data).map(r=>r.id)).toEqual(['new-tie','sg']);
 });
 it('does not deduplicate rent cohorts used to calculate regional medians',()=>{
  const sql=regionalRentSql(resolveRentCohort('seoul',{}));
  expect(sql).not.toContain('property_position');
  expect(sql).toContain('HAVING count(*)>=10');
 });
});
