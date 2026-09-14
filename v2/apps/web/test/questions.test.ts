import {describe,it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {canonicalPlace,field,moderate,validScope} from '../lib/questions/model';
import {passwordHash,passwordMatches,readScope,scopeToken,jsonBody} from '../lib/questions/security.server';
import {GET as adminGet,POST as adminPost} from '../app/api/internal/questions/route';
import {POST as questionPost} from '../app/api/questions/route';
import {POST as accountPost} from '../app/api/questions/account/route';
afterEach(()=>vi.unstubAllEnvs());
describe('question safety boundaries',()=>{
 it('canonicalizes locale and transaction filters into one place identity',()=>{expect(canonicalPlace('/ko/kr/seoul/explore/songpa/a/?transaction=monthly')).toBe('/kr/seoul/explore/songpa/a/');});
 it('holds links, contact information and repeated text but publishes normal discussion',()=>{expect(moderate('Is the walk to the station comfortable with children?')).toBe('');expect(moderate('See https://example.com')).toBe('link');expect(moderate('Call +82 10 1234 5678')).toBe('contact');expect(moderate('write test@example.com')).toBeTruthy();expect(moderate('aaaaaaaaaaaaaaaa')).toBe('repetition');});
 it('rejects invalid markets, external and traversal scopes',()=>{expect(validScope({market:'seoul',path:'/ae/dubai/explore/x/',name:'x'})).toBe(false);expect(validScope({market:'seoul',path:'/kr/seoul/explore/../x/',name:'x'})).toBe(false);expect(validScope({market:'seoul',path:'/kr/seoul/explore/%2e%2e/x/',name:'x'})).toBe(false);});
 it('binds the server signed place name, city and URL against tampering',()=>{vi.stubEnv('EVIDENCE_ADMIN_SECRET','a'.repeat(40));const scope={market:'seoul' as const,path:'/kr/seoul/explore/songpa/a/',name:'Helio'};const token=scopeToken(scope);expect(readScope(token)).toEqual(scope);const payload=Buffer.from(JSON.stringify({...scope,name:'Fake'})).toString('base64url');expect(()=>readScope(`${payload}.${token.split('.')[1]}`)).toThrow();});
 it('salts password hashes and rejects an incorrect password',async()=>{const a=await passwordHash('test-password-123');const b=await passwordHash('test-password-123');expect(a).not.toBe(b);expect(a).not.toContain('test-password');expect(await passwordMatches('test-password-123',a)).toBe(true);expect(await passwordMatches('wrong-password-123',a)).toBe(false);});
 it('limits body bytes before parsing and rejects control characters',async()=>{const r=new Request('https://test.local/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:'a'.repeat(25000)})});await expect(jsonBody(r)).rejects.toMatchObject({status:413});expect(()=>field('abc\u0000def',5,20)).toThrow();});
 it('requires admin authentication for every management operation',async()=>{const r=new Request('https://test.local/api/internal/questions/');expect((await adminGet(r)).status).toBe(401);expect((await adminPost(r)).status).toBe(401);});
 it('rejects cross-origin writes before accessing storage',async()=>{const r=()=>new Request('https://test.local/api/questions/',{method:'POST',headers:{Origin:'https://attacker.local','Content-Type':'application/json'},body:'{}'});expect((await questionPost(r())).status).toBe(403);expect((await accountPost(r())).status).toBe(403);});
});
