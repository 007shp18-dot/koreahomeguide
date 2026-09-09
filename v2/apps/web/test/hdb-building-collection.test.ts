import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {fetchHdbBuildings,normalizeHdbBuilding,runHdbBuildingCollection} from '../lib/data-operations/hdb-buildings.server';
const row={_id:1,blk_no:'1',street:'BEACH RD',residential:'Y',bldg_contract_town:'KWN',year_completed:'1970',max_floor_lvl:'16',total_dwelling_units:'142'};
const response=(records:unknown[],total=records.length)=>new Response(JSON.stringify({success:true,result:{resource_id:'d_17f5382f26140b1fdae0ba2ef6239d2f',total,records}}));
describe('HDB building ingestion',()=>{
 it('has stable content identity across provider row number/order changes and never invents coordinates',()=>{
  const a=normalizeHdbBuilding(row,'x'),b=normalizeHdbBuilding({...row,_id:199},'y');
  expect(a.content_hash).toBe(b.content_hash);expect(a.provider_key).toBe(b.provider_key);expect(a.year_completed).toBe(1970);expect(a).not.toHaveProperty('latitude');
  expect(normalizeHdbBuilding({...row,total_dwelling_units:'143'},'x').content_hash).not.toBe(a.content_hash);
 });
 it('captures complete raw envelopes with unique stable keys',async()=>{
  const result=await fetchHdbBuildings(vi.fn(async()=>response([row])));
  expect(result.records).toHaveLength(1);expect(JSON.parse(result.pages[0]!.content).result.records[0]).toEqual(row);
 });
 it('rejects incomplete pages before storing candidates',async()=>{
  await expect(fetchHdbBuildings(vi.fn(async()=>response([row],2)))).rejects.toThrow('incomplete_page');
 });
 it('rejects totals changing across pages and uses fixed provider destinations',async()=>{
  const fetcher=vi.fn(async()=>response(Array.from({length:1000},(_,i)=>({...row,blk_no:String(i)})),1001));
  fetcher.mockImplementationOnce(async()=>response(Array.from({length:1000},(_,i)=>({...row,blk_no:String(i)})),1001)).mockImplementationOnce(async()=>response([{...row,blk_no:'1000'}],1002));
  await expect(fetchHdbBuildings(fetcher)).rejects.toThrow('provider_total_changed');
  expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it('rejects duplicate block street identity',async()=>{
  await expect(fetchHdbBuildings(vi.fn(async()=>response([row,{...row,_id:2}])))).rejects.toThrow('duplicate_provider_key');
 });
 it('does not call providers when not due or leased',async()=>{
  const query=vi.fn(async()=>[]),fetcher=vi.fn();expect((await runHdbBuildingCollection({query},{fetcher})).status).toBe('not_due_or_busy');expect(fetcher).not.toHaveBeenCalled();
 });
 it('records a safe failure without replacing stored candidates',async()=>{
  const query=vi.fn(async(statement:string)=>statement.includes('RETURNING *')?[{last_hash:null}]:[]);
  const result=await runHdbBuildingCollection({query},{fetcher:vi.fn(async()=>response([row],2))});
  expect(result).toMatchObject({status:'failed',error:'incomplete_page'});
  expect(query.mock.calls.some(([s])=>s.includes('INSERT INTO hdb_building_candidates'))).toBe(false);
 });
});
