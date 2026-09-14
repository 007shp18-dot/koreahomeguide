import { authorized,operatorId } from '@/lib/evidence-pool/auth.server';
import { field,isCity,postId,QuestionError } from '@/lib/questions/model';
import { database,failure,jsonBody,mutationOrigin,reply } from '@/lib/questions/security.server';
import { serialize,writePost } from '@/lib/questions/repository.server';
export const dynamic='force-dynamic';
export async function GET(request: Request) { try {
 if(!authorized(request)) return reply({error:'unauthorized'},401); const db=database(); const params=new URL(request.url).searchParams; const id=params.get('id');
 if(id) { postId(id); const rows=await db.query(`SELECT p.*,u.nickname,u.blocked FROM sp_qa_posts p LEFT JOIN sp_qa_users u ON u.id=p.user_id WHERE p.id=$1`,[id]); if(!rows[0]) throw new QuestionError('not_found',404);
 const [events,reports]=await Promise.all([db.query('SELECT action,reason,actor,created_at FROM sp_qa_events WHERE post_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50',[id]),db.query('SELECT reason,resolved_at,created_at FROM sp_qa_reports WHERE post_id=$1 ORDER BY created_at DESC LIMIT 100',[id])]);
 return reply({question:serialize(rows[0],null,true),events,reports,posts:[],hasMore:false}); }
 const market=params.get('market')??''; if(market&&!isCity(market)) throw new QuestionError('invalid_input'); const filter=params.get('filter')??'all'; if(!['all','unanswered','pending','reported','hidden'].includes(filter)) throw new QuestionError('invalid_input');
 const page=Number(params.get('page')??1); if(!Number.isInteger(page)||page<1||page>10000) throw new QuestionError('invalid_input'); const q=(params.get('q')??'').slice(0,100);
 const rows=await db.query(`SELECT p.*,u.nickname,u.blocked,(SELECT count(*)::int FROM sp_qa_reports r WHERE r.post_id=p.id AND r.resolved_at IS NULL) AS reports FROM sp_qa_posts p LEFT JOIN sp_qa_users u ON u.id=p.user_id WHERE ($1='' OR p.market=$1) AND ($2='' OR position(lower($2) in lower(p.title||' '||p.body||' '||p.place_name||' '||coalesce(u.nickname,'')||' '||coalesce(u.username,'')))>0) AND CASE $3 WHEN 'pending' THEN p.status='pending' WHEN 'hidden' THEN p.status='hidden' WHEN 'reported' THEN EXISTS(SELECT 1 FROM sp_qa_reports r WHERE r.post_id=p.id AND r.resolved_at IS NULL) WHEN 'unanswered' THEN p.parent_id IS NULL AND p.status='published' AND NOT EXISTS(SELECT 1 FROM sp_qa_posts a WHERE a.parent_id=p.id AND a.status='published') ELSE p.status<>'deleted' END ORDER BY p.created_at DESC,p.id DESC LIMIT 26 OFFSET $4`,[market,q,filter,(page-1)*25]);
 return reply({posts:rows.slice(0,25).map(r=>serialize(r,null,true)),hasMore:rows.length>25});
 } catch(e) { return failure(e); } }
export async function POST(request: Request) { try {
 if(!authorized(request)) return reply({error:'unauthorized'},401); mutationOrigin(request); const input=await jsonBody(request); const operator=operatorId(request); const db=database();
 if(input.action==='reply') return reply(await writePost(input,null,operator));
 const id=postId(input.id); const reason=field(input.reason,3,500);
 if(input.action==='hide'||input.action==='publish') { const status=input.action==='hide'?'hidden':'published'; const rows=await db.query(`WITH changed AS (UPDATE sp_qa_posts SET status=$2,review_reason=$3,updated_at=now() WHERE id=$1 AND status<>'deleted' RETURNING id), logged AS (INSERT INTO sp_qa_events(post_id,actor,action,reason) SELECT id,$4,$2,$3 FROM changed) SELECT id FROM changed`,[id,status,reason,operator]); if(!rows.length) throw new QuestionError('not_found',404); }
 else if(input.action==='resolve') { await db.query(`WITH resolved AS (UPDATE sp_qa_reports SET resolved_at=now() WHERE post_id=$1 AND resolved_at IS NULL RETURNING post_id) INSERT INTO sp_qa_events(post_id,actor,action,reason) SELECT DISTINCT post_id,$2,'reports_resolved',$3 FROM resolved`,[id,operator,reason]); }
 else if(input.action==='block'||input.action==='unblock') { const blocked=input.action==='block'; const rows=await db.query(`WITH changed AS (UPDATE sp_qa_users SET blocked=$2 WHERE id=(SELECT user_id FROM sp_qa_posts WHERE id=$1) RETURNING id), revoked AS (DELETE FROM sp_qa_sessions WHERE user_id IN(SELECT id FROM changed) AND $2), logged AS (INSERT INTO sp_qa_events(post_id,user_id,actor,action,reason) SELECT $1,id,$3,$4,$5 FROM changed) SELECT id FROM changed`,[id,blocked,operator,String(input.action),reason]); if(!rows.length) throw new QuestionError('not_found',404); }
 else throw new QuestionError('invalid_input'); return reply({ok:true});
 } catch(e) { return failure(e); } }
