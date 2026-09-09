import {afterEach,describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {probeKaptCosts} from '../lib/data-operations/kapt-probe.server';
afterEach(()=>vi.unstubAllEnvs());
describe('runtime Kapt service verification',()=>{
 it('reports missing runtime credentials without claiming provider rejection',async()=>{
  vi.stubEnv('SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY','');vi.stubEnv('DATA_GO_KR_SERVICE_KEY','');
  const query=vi.fn().mockResolvedValue([]);const fetcher=vi.fn<typeof fetch>();
  expect(await probeKaptCosts({query},fetcher)).toMatchObject({status:'runtime_credential_unavailable'});expect(fetcher).not.toHaveBeenCalled();
 });
 it('stores sanitized provider metadata without keys, provider messages or raw amounts',async()=>{
  vi.stubEnv('SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY','private-test-secret');
  const query=vi.fn().mockResolvedValueOnce([{kapt_code:'A12345678'}]).mockResolvedValue([]);
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({response:{header:{resultCode:'30',resultMsg:'private-test-secret'},body:{item:{kaptCode:'A12345678',lrefCost1:800000}}}})));
  const result=await probeKaptCosts({query},fetcher,new Date('2026-09-09T00:00:00Z'));
  expect(result).toMatchObject({status:'provider_rejected',providerCode:'30',month:'202607'});
  expect(JSON.stringify(result)).not.toContain('private-test-secret');expect(JSON.stringify(query.mock.calls)).not.toContain('private-test-secret');expect(JSON.stringify(result)).not.toContain('800000');
 });
 it('requires returned building identity to match the requested sample',async()=>{
  vi.stubEnv('SIGNEDPRICE_PUBLIC_DATA_SERVICE_KEY','private-test-secret');
  const query=vi.fn().mockResolvedValueOnce([{kapt_code:'A12345678'}]).mockResolvedValue([]);
  const fetcher=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({response:{header:{resultCode:'00'},body:{item:{kaptCode:'A99999999',lrefCost1:800000}}}})));
  expect(await probeKaptCosts({query},fetcher)).toMatchObject({status:'no_matching_sample',rowCount:0,fields:[]});
 });
});
