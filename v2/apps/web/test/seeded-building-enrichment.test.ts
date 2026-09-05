import {afterEach, describe, expect, it, vi} from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/db/postgres.server', () => ({contentDatabaseConfigured: () => true}));
const calls=vi.hoisted(()=>({commons:vi.fn(),google:vi.fn()}));
vi.mock('../lib/photos/building-photo-store.server',()=>({discoverWikimediaCommonsPhotoCandidates:calls.commons,discoverGooglePlacePhotoCandidates:calls.google}));
import {GET} from '../app/api/internal/building-enrichment/route';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
describe('scoped property enrichment',()=>{
 it('collects candidates only for the requested seeded market',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  calls.commons.mockResolvedValue({state:'ready',checked:2,candidates:1});
  calls.google.mockResolvedValue({state:'not-configured',checked:0,candidates:0});
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=seoul&limit=2',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(200);
  expect(calls.commons).toHaveBeenCalledWith(2,'seoul');
  expect(calls.google).toHaveBeenCalledWith(2,'seoul');
 });
 it('rejects invalid scope before collecting any candidates',async()=>{
  vi.stubEnv('CRON_SECRET','test-secret');
  const response=await GET(new Request('https://example.com/api/internal/building-enrichment?market=invalid',{headers:{authorization:'Bearer test-secret'}}));
  expect(response.status).toBe(400);
  expect(calls.commons).not.toHaveBeenCalled();
 });
});
