import {afterEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const service=vi.hoisted(()=>({get:vi.fn(),publish:vi.fn(),invalidate:vi.fn()}));
vi.mock('../lib/singapore/publication.server',()=>({getSingaporePublicationStatus:service.get}));
vi.mock('../lib/singapore/publication-build.server',()=>({publishSingaporeObservations:service.publish}));
vi.mock('../lib/singapore/publication-invalidate.server',()=>({invalidateSingaporePublicationPages:service.invalidate}));
import {GET,POST} from '../app/api/internal/singapore-publication/route';
import {issueSession} from '../lib/evidence-pool/auth.server';
const url='https://example.com/api/internal/singapore-publication/';
function session(){const secret='s'.repeat(48);vi.stubEnv('EVIDENCE_ADMIN_SECRET',secret);return `sp_evidence_session=${issueSession(secret)}`;}
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
it('protects status and publication without exposing service calls to anonymous requests',async()=>{
 vi.stubEnv('EVIDENCE_ADMIN_SECRET','');
 expect((await GET(new Request(url))).status).toBe(401);
 expect((await POST(new Request(url,{method:'POST'}))).status).toBe(401);
 expect(service.get).not.toHaveBeenCalled();expect(service.publish).not.toHaveBeenCalled();
});
it.each<Record<string,string>>([{}, {origin:'https://hostile.example'}, {origin:'https://example.com','sec-fetch-site':'cross-site'}])('rejects missing or cross-site origin even with signed admin cookie %j',async(headers)=>{
 expect((await POST(new Request(url,{method:'POST',headers:{...headers,cookie:session()}}))).status).toBe(403);
 expect(service.publish).not.toHaveBeenCalled();expect(service.invalidate).not.toHaveBeenCalled();
});
it('withholds publication on validation failure and never invalidates the last good release',async()=>{
 service.publish.mockRejectedValue(new Error('internal DB secret must not leak'));
 const response=await POST(new Request(url,{method:'POST',headers:{cookie:session(),origin:'https://example.com'}}));
 expect(response.status).toBe(422);expect(await response.json()).toEqual({error:'publication_withheld'});
 expect(service.invalidate).not.toHaveBeenCalled();
});
it('publishes only through authenticated same-origin action and invalidates after success',async()=>{
 service.publish.mockResolvedValue({id:'verified'});
 const response=await POST(new Request(url,{method:'POST',headers:{cookie:session(),origin:'https://example.com'}}));
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('private, no-store');
 expect(service.publish).toHaveBeenCalledWith({apply:true});expect(service.invalidate).toHaveBeenCalledOnce();
});
