import {readFileSync} from 'node:fs';
import {afterEach, describe, expect, it, vi} from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({contentDatabaseConfigured: () => true}));
const calls=vi.hoisted(()=>({backfill:vi.fn(),official:vi.fn()}));
vi.mock('../lib/photos/photo-backfill.server',()=>({runPhotoBackfillSlice:calls.backfill}));
vi.mock('../lib/public-market/official-building-enrichment.server',()=>({enrichOfficialBuildingFacts:calls.official}));
import {GET} from '../app/api/internal/building-enrichment/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('scoped property enrichment',()=>{
 it('collects candidates only for the requested seeded market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.backfill.mockImplementation(async ({provider}:{provider:string})=>provider==='wikimedia'?{state:'ready',checked:2,candidates:1}:{state:'not-configured',checked:0,candidates:0});
  calls.official.mockResolvedValue({state:'not-configured',checked:0,stored:0,unavailable:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=seoul&limit=2',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:2,market:'kr-seoul',provider:'wikimedia'}));
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:2,market:'kr-seoul',provider:'google'}));
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:2,market:'kr-seoul',provider:'naver-search'}));
  expect(calls.official).toHaveBeenCalledWith(2);
 });
 it('rejects invalid scope before collecting any candidates',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=invalid',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(400);
  expect(calls.backfill).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('rejects an unknown enrichment source',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?source=instagram',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(400);
  expect(calls.backfill).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('advances both seeded markets when the scheduled request has no market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.backfill.mockResolvedValue({state:'ready',checked:1,candidates:0});
  calls.official.mockResolvedValue({state:'ready',checked:1,stored:1,unavailable:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?limit=1',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:1,market:'kr-seoul',provider:'wikimedia'}));
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:1,market:'sg-singapore',provider:'google'}));
  expect(calls.official).toHaveBeenCalledWith(1);
 });
 it('uses the hourly schedule for a larger Wikimedia-only review batch',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.backfill.mockResolvedValue({state:'ready',checked:30,candidates:4});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment',{headers:{authorization:'Bearer test-secret','x-vercel-cron-schedule':'7 * * * *'}}));
  expect(response.status).toBe(200);
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:30,market:'kr-seoul',provider:'wikimedia'}));
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({limit:30,market:'sg-singapore',provider:'wikimedia'}));
  expect(calls.backfill).toHaveBeenCalledTimes(2);
  expect(calls.official).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({source:'wikimedia',checked:60,candidates:8});
 });
 it('runs only the explicitly requested source',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.backfill.mockResolvedValue({state:'ready',checked:20,candidates:5});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=singapore&source=google&limit=20',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.backfill).toHaveBeenCalledWith(expect.objectContaining({
   limit:20,market:'sg-singapore',provider:'google',dailyRequestCap:5,dailySpendCapUsd:0.16,
  }));
  expect(calls.backfill).toHaveBeenCalledTimes(1);
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('does not call the Korea official service for a Singapore-only run',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.backfill.mockResolvedValue({state:'ready',checked:1,candidates:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=singapore&limit=1',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('runs photo providers sequentially within one market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const events:string[]=[];
  calls.backfill.mockImplementation(async ({provider}:{provider:string})=>{
   events.push(`start:${provider}`);
   await Promise.resolve();
   events.push(`finish:${provider}`);
   return {state:'ready',checked:1,candidates:0};
  });
  calls.official.mockResolvedValue({state:'ready',checked:1,stored:1,unavailable:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=seoul&limit=1',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(events).toEqual([
   'start:wikimedia','finish:wikimedia',
   'start:google','finish:google',
   'start:naver-search','finish:naver-search',
  ]);
 });
 it('schedules each discovery provider and official facts independently',()=>{
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8')) as {
   crons?:readonly Readonly<{path:string;schedule:string}>[];
  };
  expect(config.crons).toEqual(expect.arrayContaining([
   {path:'/api/internal/building-enrichment?source=wikimedia&limit=30',schedule:'7 * * * *'},
   {path:'/api/internal/building-enrichment?source=naver&limit=30',schedule:'27 * * * *'},
   {path:'/api/internal/building-enrichment?source=google&limit=30',schedule:'47 * * * *'},
   {path:'/api/internal/building-enrichment?source=official&limit=12',schedule:'17 * * * *'},
  ]));
 });
 it('shares the Google budget sequentially across both markets',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const events:string[]=[];
  calls.backfill.mockImplementation(async ({market}:{market:string})=>{
   events.push(`start:${market}`);
   await Promise.resolve();
   events.push(`finish:${market}`);
   return {state:'ready',checked:1,candidates:0};
  });
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?source=google&limit=5',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(events).toEqual([
   'start:kr-seoul','finish:kr-seoul',
   'start:sg-singapore','finish:sg-singapore',
  ]);
 });
});
