import {describe, expect, it, vi} from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('../lib/public-market/home-featured-buildings.server',()=>({buildHomeFeaturedBuildings:()=>[]}));
vi.mock('../lib/singapore/hdb-snapshot-repository.server',()=>({hdbSnapshotRepositoryFromEnvironment:()=>({listTowns:()=>[{town:'ANG MO KIO'}],listBlocks:()=>[{blockId:'abc',block:'1',street:'ANG MO KIO AVE 1',town:'ANG MO KIO',resaleMedianSgd:500000,resaleCount:10,property:{yearCompleted:1980,totalDwellingUnits:100}}]})}));
import {buildHomeMarketVisuals} from '../lib/home-market-visuals.server';
describe('homepage seeded HDB photos',()=>{
 it('uses the same registry key as enrichment and the HDB detail page',()=>{
  expect(buildHomeMarketVisuals()[0]).toMatchObject({photoRegistryKey:'sg-hdb:ANG MO KIO:1 ANG MO KIO AVE 1'});
 });
});
