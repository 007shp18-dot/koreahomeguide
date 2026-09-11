import {randomUUID} from 'node:crypto';
import {authorized,sameOrigin,operatorId} from '@/lib/evidence-pool/auth.server';
import {contentDatabase} from '@/lib/db/postgres.server';
export const dynamic='force-dynamic';
const reply=(error:string,status:number)=>Response.json({error},{status});
export async function POST(request:Request){
 if(!authorized(request))return reply('unauthorized',401);
 if(!sameOrigin(request))return reply('invalid_origin',403);
 const sql=contentDatabase();if(!sql)return reply('database_not_configured',503);
 if(Number(request.headers.get('content-length'))>1600000)return reply('image_too_large',413);
 try{
 const bytes=Buffer.from(await request.arrayBuffer());
 if(!bytes.length||bytes.length>1572864)return reply('image_too_large',413);
 const type=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
 if(!type)return reply('invalid_image',415);
 const id=randomUUID();await sql.query("INSERT INTO editorial_uploaded_images(id,content_type,image_bytes,operator_id) VALUES($1,$2,decode($3,'base64'),$4)",[id,type,bytes.toString('base64'),operatorId(request)]);
 return Response.json({src:`/api/editorial-images/${id}/`},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return reply('image_upload_failed',503);}
}
