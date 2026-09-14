import {describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
vi.mock('server-only',()=>({}));
vi.mock('../lib/db/postgres.server',async()=>{
 if(process.env.QA_COMMUNITY_TEST!=='1') return {contentDatabase:()=>null};
 if(process.env.QA_PGLITE_MODULE) {
  const {PGlite}=await import(/* @vite-ignore */ process.env.QA_PGLITE_MODULE);
  const {readFile}=await import('node:fs/promises');
  const pg=await PGlite.create();
  await pg.exec(await readFile(new URL('../db/migrations/0032_community_questions.sql',import.meta.url),'utf8'));
  return {contentDatabase:()=>({query:async(statement:string,params:unknown[])=>{try{return (await pg.query(statement,params)).rows;}catch(e){console.error(e instanceof Error?e.message:'SQL error');throw e;}}})};
 }
 const {neon}=await import('@neondatabase/serverless');
 const client=neon(process.env.DATABASE_URL!,{fetchOptions:{get signal(){return AbortSignal.timeout(60000);}}});
 return {contentDatabase:()=>client};
});
import {GET as get,POST as post} from '../app/api/questions/route';
import {GET as getAccount,POST as account,DELETE as logout} from '../app/api/questions/account/route';
import {GET as adminGet,POST as adminPost} from '../app/api/internal/questions/route';
import {issueSession,SESSION_COOKIE} from '../lib/evidence-pool/auth.server';
import {database,rateLimit,scopeToken,hash} from '../lib/questions/security.server';
import {writePost} from '../lib/questions/repository.server';
const origin='https://qa.signedprice.test';
const testNetwork=randomUUID();
function req(path:string,body?:unknown,cookie=''){return new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'x-forwarded-for':testNetwork},body:body?JSON.stringify(body):undefined});}
describe.runIf(process.env.QA_COMMUNITY_TEST==='1')('questions isolated Postgres integration',()=>{
 it('runs real accounts, place feed, replies, reports, moderation, ownership and recovery',async()=>{
  const suffix=randomUUID().slice(0,8);const password='a-long-test-password-123!';const adminCookie=`${SESSION_COOKIE}=${issueSession(process.env.EVIDENCE_ADMIN_SECRET!)}`;
  async function register(s:string){const response=await account(req('/api/questions/account/',{action:'register',username:`qa_${suffix}_${s}`,nickname:`QA ${s}`,password}));const result=await response.json();expect(response.status,JSON.stringify(result)).toBe(200);expect(result.recovery).toHaveLength(48);const cookie=response.headers.get('set-cookie')!.split(';')[0]!;expect(response.headers.get('set-cookie')).toContain('HttpOnly');expect(response.headers.get('set-cookie')).toContain('Secure');const identity=await(await getAccount(req('/api/questions/account/',undefined,cookie))).json();return {cookie,user:identity.user,recovery:result.recovery,username:`qa_${suffix}_${s}`};}
  const a=await register('a');const b=await register('b');
  const scope={market:'seoul' as const,path:'/kr/seoul/explore/songpa-gu/songpa-gu-1j88w6f/',name:'Helio QA'};
  let r=await post(req('/api/questions/',{action:'create',title:`Station walk ${suffix}`,body:'How comfortable is this walk in the evening?',market:'dubai',scopeToken:scopeToken(scope),locale:'en'},a.cookie));const created=await r.json();expect(r.status,JSON.stringify(created)).toBe(200);const id=created.id;
  const pending=await writePost({title:`Website ${suffix}`,body:'Is https://example.com useful?',market:'seoul',locale:'en'},a.user);expect(pending.status).toBe('pending');
  const another=await writePost({title:`Dubai ${suffix}`,body:'How convenient is the public transport?',market:'dubai',locale:'en'},a.user);
  const feed=await(await get(req('/api/questions/?market=seoul'))).json();expect(feed.posts.some((p:{id:string})=>p.id===id)).toBe(true);expect(feed.posts.some((p:{id:string})=>p.id===pending.id||p.id===another.id)).toBe(false);
  const place=await(await get(req(`/api/questions/?place=${encodeURIComponent(scope.path)}`))).json();expect(place.posts.find((p:{id:string})=>p.id===id)?.market).toBe('seoul');expect(JSON.stringify(place)).not.toContain('password');expect(JSON.stringify(place)).not.toContain(a.user.id);
  expect((await get(req(`/api/questions/?id=${pending.id}`))).status).toBe(404);expect((await get(req(`/api/questions/?id=${pending.id}`,undefined,a.cookie))).status).toBe(200);
  r=await post(req('/api/questions/',{action:'create',parentId:id,body:'The sidewalks are wide along the main road.',locale:'en'},b.cookie));expect(r.status,await r.clone().text()).toBe(200);const reply=await r.json();
  expect((await post(req('/api/questions/',{action:'edit',id:reply.postId,body:'This is an unauthorized replacement.',title:''},a.cookie))).status).toBe(404);
  r=await post(req('/api/questions/',{action:'report',id:reply.postId,reason:'Please check this statement.'},a.cookie));expect(r.status,await r.clone().text()).toBe(200);
  expect((await post(req('/api/questions/',{action:'report',id:reply.postId,reason:'Please check again.'},a.cookie))).status).toBe(409);
  expect((await get(req(`/api/questions/?id=${id}`))).status).toBe(200);
  const reported=await(await adminGet(req('/api/internal/questions/?filter=reported',undefined,adminCookie))).json();expect(reported.posts.some((p:{id:string})=>p.id===reply.postId)).toBe(true);
  async function manage(action:string,postId:string){const response=await adminPost(req('/api/internal/questions/',{action,id:postId,reason:'QA moderation verification'},adminCookie));expect(response.status,await response.clone().text()).toBe(200);}
  await manage('hide',id);expect((await get(req(`/api/questions/?id=${id}`))).status).toBe(404);
  expect((await post(req('/api/questions/',{action:'create',parentId:id,body:'This should not publish under a hidden question.'},b.cookie))).status).toBe(404);
  await manage('publish',id);await manage('resolve',reply.postId);
  r=await adminPost(req('/api/internal/questions/',{action:'reply',parentId:id,body:'Official team answer for this QA test.',locale:'en'},adminCookie));expect(r.status,await r.clone().text()).toBe(200);
  const detail=await(await get(req(`/api/questions/?id=${id}`))).json();expect(detail.posts.some((p:{operator:boolean})=>p.operator)).toBe(true);
  await manage('block',reply.postId);expect((await(await getAccount(req('/api/questions/account/',undefined,b.cookie))).json()).user).toBe(null);await manage('unblock',reply.postId);
  r=await account(req('/api/questions/account/',{action:'recover',username:b.username,password:'new-long-password-123!',recovery:b.recovery}));expect(r.status,await r.clone().text()).toBe(200);const recovered=await r.json();expect(recovered.recovery).not.toBe(b.recovery);
  const resetCookie=r.headers.get('set-cookie')!.split(';')[0]!;expect((await logout(req('/api/questions/account/',undefined,resetCookie))).status).toBe(200);expect((await(await getAccount(req('/api/questions/account/',undefined,resetCookie))).json()).user).toBe(null);
  // Atomic shared bucket: exactly two concurrent attempts may pass.
  const limits=await Promise.allSettled(Array.from({length:6},()=>rateLimit(`qa:${suffix}`,2,60)));expect(limits.filter(r=>r.status==='fulfilled')).toHaveLength(2);
  const rows=await database().query('SELECT password_hash,recovery_hash FROM sp_qa_users WHERE id=$1',[a.user.id]);expect(rows[0]?.password_hash).not.toContain(password);expect(rows[0]?.recovery_hash).toBe(hash(a.recovery));
  r=await post(req('/api/questions/',{action:'edit',id,title:`Updated station question ${suffix}`,body:'Revised question with station walking details.'},a.cookie));expect(r.status,await r.clone().text()).toBe(200);
  const dupeInput={title:`Concurrent ${suffix}`,body:'Can this exact question be submitted twice?',market:'seoul'};
  const dupeResults=await Promise.allSettled([writePost(dupeInput,a.user),writePost(dupeInput,a.user)]);expect(dupeResults.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const logs=await(await adminGet(req(`/api/internal/questions/?id=${id}`,undefined,adminCookie))).json();expect(logs.events.some((e:{action:string})=>e.action==='hidden')).toBe(true);
  r=await post(req('/api/questions/',{action:'delete',id},a.cookie));expect(r.status,await r.clone().text()).toBe(200);expect((await get(req(`/api/questions/?id=${id}`))).status).toBe(404);
 },900000);
});
