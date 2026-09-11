import {authorized} from '@/lib/evidence-pool/auth.server';
import {contentDatabase} from '@/lib/db/postgres.server';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404});
 const sql=contentDatabase();if(!sql)return new Response(null,{status:503});
 try{
 const rows=await sql.query(`SELECT content_type,encode(image_bytes,'base64') AS bytes FROM editorial_uploaded_images WHERE id=$1 AND ($2 OR EXISTS(SELECT 1 FROM content_articles WHERE editorial_status='published' AND evidence_state <> 'withdrawn' AND position($3 in body_markdown)>0))`,[id,authorized(request),`/api/editorial-images/${id}/`]);
 const row=rows[0];if(!row)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 return new Response(new Uint8Array(Buffer.from(row.bytes,'base64')),{headers:{'Content-Type':row.content_type,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch{return new Response(null,{status:503});}
}
