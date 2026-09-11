import {authorized,sameOrigin,operatorId} from '@/lib/evidence-pool/auth.server';
import {contentDatabase} from '@/lib/db/postgres.server';
import {parseEditorialArticleInput} from '../content-articles/route';
import {getPortfolioRecord} from '@/content/portfolio-manifest';
import {publishDueEditorial} from '@/lib/operations/editorial-publication.server';
export const dynamic='force-dynamic';
export const maxDuration=300;
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request) {
 if(!authorized(request))return reply({error:'unauthorized'},401);
 const sql=contentDatabase();if(!sql)return reply({error:'database_not_configured'},503);
 try{const params=new URL(request.url).searchParams;const slug=params.get('slug');if(slug){const rows=await sql.query(`SELECT a.slug,a.editorial_status AS state,0 AS version,a.updated_at,jsonb_build_object('slug',a.slug,'title',a.title,'summary',a.summary,'bodyMarkdown',a.body_markdown,'marketKey',coalesce(a.market_key,'global'),'locale',a.locale,'contentType',a.content_type,'evidenceState',a.evidence_state,'reviewedBy',a.reviewed_by,'sources',coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'kind',s.source_kind,'publisher',s.publisher,'title',s.title,'href',s.canonical_url,'checkedAt',s.checked_at,'publishedAt',s.published_at) ORDER BY l.position) FROM content_source_links l JOIN content_sources s ON s.id=l.source_id WHERE l.content_slug=a.slug),'[]'::jsonb)) AS payload FROM content_articles a WHERE a.slug=$1 AND a.content_type IN ('news-brief','market-brief','data-story')`,[slug]);return rows.length?reply({item:rows[0]}):reply({error:'not_found'},404);}const id=params.get('id');if(id){if(!/^[a-f0-9-]{36}$/i.test(id))return reply({error:'invalid_id'},400);const rows=await sql.query('SELECT * FROM editorial_publication_queue WHERE id=$1',[id]);return rows.length?reply({item:rows[0]}):reply({error:'not_found'},404);}
 return reply({items:await sql.query(`SELECT id,slug,jsonb_build_object('title',payload->>'title','locale',payload->>'locale','marketKey',payload->>'marketKey') AS payload,version,state,scheduled_at,published_at,error_code,updated_at FROM editorial_publication_queue UNION ALL SELECT NULL AS id,a.slug,jsonb_build_object('title',a.title,'locale',a.locale,'marketKey',a.market_key) AS payload,0 AS version,a.editorial_status AS state,NULL AS scheduled_at,a.published_at,NULL AS error_code,a.updated_at FROM content_articles a WHERE a.content_type IN ('news-brief','market-brief','data-story') AND NOT EXISTS(SELECT 1 FROM editorial_publication_queue q WHERE q.slug=a.slug) ORDER BY updated_at DESC LIMIT 100`)});}catch{return reply({error:'storage_unavailable'},503);}
}
export async function POST(request:Request) {
 if(!authorized(request))return reply({error:'unauthorized'},401);
 if(!sameOrigin(request))return reply({error:'invalid_origin'},403);
 const sql=contentDatabase();if(!sql)return reply({error:'database_not_configured'},503);
 try {
  const raw=await request.text();if(Buffer.byteLength(raw)>150000)return reply({error:'request_too_large'},413);
  const body=JSON.parse(raw);
  if(body.action==='publish-due')return reply({results:await publishDueEditorial()});
  if(body.action==='cancel') {
   const rows=await sql.query(`UPDATE editorial_publication_queue SET state='cancelled',version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND state IN ('draft','scheduled','failed') RETURNING id`,[body.id,body.version]);
   return rows.length?reply({state:'cancelled'}):reply({error:'version_conflict'},409);
  }
  if(!['draft','schedule','publish'].includes(body.action))return reply({error:'invalid_action'},400);
  const input=parseEditorialArticleInput({...body.article,status:body.action!=='draft'?'published':'draft'});
  if(!input || input.evidenceState==='withdrawn' || !['news-brief','market-brief','data-story'].includes(input.contentType))return reply({error:'invalid_article'},422);
  // Compiled portfolio records keep their established routes and editing process.
  if(getPortfolioRecord(input.locale,input.slug))return reply({error:'reserved_portfolio_slug'},409);
  const scheduled=body.action==='publish'?new Date():body.action==='schedule'?new Date(body.scheduledAt):null;
  if(scheduled && !Number.isFinite(scheduled.getTime()))return reply({error:'invalid_schedule'},422);
  const state=scheduled?'scheduled':'draft';
  const rows=await sql.query(`INSERT INTO editorial_publication_queue(slug,payload,state,scheduled_at,operator_id)
   VALUES($1,$2::jsonb,$3,$4,$5) ON CONFLICT(slug) DO UPDATE SET payload=excluded.payload,state=excluded.state,
   scheduled_at=excluded.scheduled_at,version=editorial_publication_queue.version+1,error_code=NULL,updated_at=now(),operator_id=excluded.operator_id
   WHERE editorial_publication_queue.version=$6 AND editorial_publication_queue.state NOT IN ('publishing','refreshing') RETURNING id,version,state`,
   [input.slug,JSON.stringify(input),state,scheduled?.toISOString()??null,operatorId(request),body.version??0]);
  const saved=rows[0];if(!saved)return reply({error:'version_conflict'},409);
  if(body.action==='publish'){const results=await publishDueEditorial(String(saved.id));return reply({...saved,results});}
  return reply(saved);
 }catch{return reply({error:'operation_failed'},400);}
}
