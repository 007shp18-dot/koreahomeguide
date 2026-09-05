import {afterEach, describe, expect, it, vi} from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({contentDatabaseConfigured: () => true}));
const calls=vi.hoisted(()=>({commons:vi.fn(),google:vi.fn(),official:vi.fn()}));
vi.mock('../lib/photos/building-photo-store.server',()=>({discoverWikimediaCommonsPhotoCandidates:calls.commons,discoverGooglePlacePhotoCandidates:calls.google}));
vi.mock('../lib/public-market/official-building-enrichment.server',()=>({enrichOfficialBuildingFacts:calls.official}));
import {GET} from '../app/api/internal/building-enrichment/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('scoped property enrichment',()=>{
 it('collects candidates only for the requested seeded market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.commons.mockResolvedValue({state:'ready',checked:2,candidates:1});
  calls.google.mockResolvedValue({state:'not-configured',checked:0,candidates:0});
  calls.official.mockResolvedValue({state:'not-configured',checked:0,stored:0,unavailable:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=seoul&limit=2',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.commons).toHaveBeenCalledWith(2,'seoul');
  expect(calls.google).toHaveBeenCalledWith(2,'seoul');
  expect(calls.official).toHaveBeenCalledWith(2);
 });
 it('rejects invalid scope before collecting any candidates',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=invalid',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(400);
  expect(calls.commons).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('rejects an unknown enrichment source',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?source=instagram',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(400);
  expect(calls.commons).not.toHaveBeenCalled();
  expect(calls.google).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('advances both seeded markets when the scheduled request has no market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.commons.mockResolvedValue({state:'ready',checked:1,candidates:0});
  calls.google.mockResolvedValue({state:'not-configured',checked:0,candidates:0});
  calls.official.mockResolvedValue({state:'ready',checked:1,stored:1,unavailable:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?limit=1',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.commons).toHaveBeenCalledWith(1,'seoul');
  expect(calls.commons).toHaveBeenCalledWith(1,'singapore');
  expect(calls.google).toHaveBeenCalledWith(1,'seoul');
  expect(calls.google).toHaveBeenCalledWith(1,'singapore');
  expect(calls.official).toHaveBeenCalledWith(1);
 });
 it('uses the hourly schedule for a larger Wikimedia-only review batch',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.commons.mockResolvedValue({state:'ready',checked:30,candidates:4});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment',{headers:{authorization:'Bearer test-secret','x-vercel-cron-schedule':'7 * * * *'}}));
  expect(response.status).toBe(200);
  expect(calls.commons).toHaveBeenCalledWith(30,'seoul');
  expect(calls.commons).toHaveBeenCalledWith(30,'singapore');
  expect(calls.google).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({source:'wikimedia',checked:60,candidates:8});
 });
 it('runs only the explicitly requested source',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.google.mockResolvedValue({state:'ready',checked:20,candidates:5});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=singapore&source=google&limit=20',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.google).toHaveBeenCalledWith(20,'singapore');
  expect(calls.commons).not.toHaveBeenCalled();
  expect(calls.official).not.toHaveBeenCalled();
 });
 it('does not call the Korea official service for a Singapore-only run',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.commons.mockResolvedValue({state:'ready',checked:1,candidates:0});
  calls.google.mockResolvedValue({state:'not-configured',checked:0,candidates:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=singapore&limit=1',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.official).not.toHaveBeenCalled();
 });
});
