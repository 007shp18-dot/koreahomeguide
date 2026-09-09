import {revalidatePath} from 'next/cache';
import {contentDatabase} from '../../../../lib/db/postgres.server';
import {authorized,equalSecret,sameOrigin,operatorId} from '../../../../lib/evidence-pool/auth.server';
import {runHdbBuildingCollection,listHdbCandidates,getHdbCandidate,reviewHdbCandidate} from '../../../../lib/data-operations/hdb-buildings.server';
export const runtime='nodejs';
export const maxDuration=300;
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim();const cron=Boolean(secret&&equalSecret(request.headers.get('authorization')??'',`Bearer ${secret}`));
 if(!cron&&!authorized(request))return reply({error:'unauthorized'},401);
 const db=contentDatabase();if(!db)return reply({error:'database_not_configured'},503);const sql={query:(statement:string,parameters?:unknown[])=>db.query(statement,parameters)};
 try{
  if(cron)return reply(await runHdbBuildingCollection(sql));
  const url=new URL(request.url);const id=url.searchParams.get('id');
  if(id){if(!/^[a-f0-9-]{36}$/i.test(id))return reply({error:'invalid_id'},400);return reply({item:await getHdbCandidate(sql,id)});}
  const page=Number(url.searchParams.get('page')??'1');const status=url.searchParams.get('status')??'pending';
  if(!Number.isInteger(page)||page<1||page>10000||!['pending','approved','rejected',''].includes(status))return reply({error:'invalid_filters'},400);
  return reply(await listHdbCandidates(sql,{page,status}));
 }catch{return reply({error:'hdb_collection_unavailable'},503);}
}
export async function POST(request:Request){
 if(!authorized(request))return reply({error:'unauthorized'},401);if(!sameOrigin(request))return reply({error:'invalid_origin'},403);
 const db=contentDatabase();if(!db)return reply({error:'database_not_configured'},503);const sql={query:(statement:string,parameters?:unknown[])=>db.query(statement,parameters)};
 try{
  const reader=request.body?.getReader();if(!reader)return reply({error:'invalid_command'},400);const chunks:Uint8Array[]=[];let bytes=0;
  try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>4096)return reply({error:'request_too_large'},413);chunks.push(part.value);}}finally{await reader.cancel();}
  const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(body.action==='collect')return reply(await runHdbBuildingCollection(sql,{force:true}));
  if(body.action==='review'&&typeof body.id==='string'&&/^[a-f0-9-]{36}$/i.test(body.id)&&Number.isInteger(body.version)&&body.version>0&&['approved','rejected'].includes(body.status)&&typeof body.reason==='string'&&body.reason.trim().length>=3&&body.reason.length<=240){const result=await reviewHdbCandidate(sql,{id:body.id,version:body.version,status:body.status,reason:body.reason,actor:operatorId(request)});if(result){revalidatePath('/sg/singapore/hdb/[town]/[blockId]','page');revalidatePath('/ko/sg/singapore/hdb/[town]/[blockId]','page');return reply(result);}return reply({error:'conflict_or_unmatched'},409);}
  return reply({error:'invalid_command'},400);
 }catch{return reply({error:'hdb_request_failed'},400);}
}
