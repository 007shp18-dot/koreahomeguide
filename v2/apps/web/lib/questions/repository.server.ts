import 'server-only';
import { randomUUID } from 'node:crypto';
import { isCity,field,moderate,postId,QuestionError,type Member,type QuestionPost,type Scope } from './model';
import { database,hash,readScope } from './security.server';
const columns=`p.*,u.nickname,u.blocked,(SELECT count(*)::integer FROM sp_qa_posts a WHERE a.parent_id=p.id AND a.status='published') AS answers`;
const from=`FROM sp_qa_posts p LEFT JOIN sp_qa_users u ON u.id=p.user_id`;
const visible=`(p.status='published' OR (p.user_id=$1::uuid AND p.status='pending'))`;
const parentVisible=`(p.parent_id IS NULL OR EXISTS(SELECT 1 FROM sp_qa_posts parent WHERE parent.id=p.parent_id AND parent.status='published'))`;
export function serialize(row: Record<string,unknown>, user: Member|null, admin=false): QuestionPost { return {id:String(row.id),parentId:row.parent_id ? String(row.parent_id):null,market:row.market as QuestionPost['market'],placePath:String(row.place_path),placeName:String(row.place_name),title:String(row.title),body:String(row.body),author:String(row.nickname??''),operator:Boolean(row.operator_id),mine:Boolean(user&&row.user_id===user.id),status:String(row.status),createdAt:new Date(String(row.created_at)).toISOString(),answers:Number(row.answers??0),...(admin?{userId:row.user_id?String(row.user_id):undefined,blocked:Boolean(row.blocked),reason:String(row.review_reason),reports:Number(row.reports??0)}:{})}; }
export async function listQuestions(params: URLSearchParams, user: Member|null) {
 const page=Number(params.get('page')??1); if(!Number.isInteger(page)||page<1||page>10000) throw new QuestionError('invalid_input');
 const id=params.get('id'); const db=database();
 if(id) { postId(id); const q=await db.query(`SELECT ${columns} ${from} WHERE p.id=$2 AND p.parent_id IS NULL AND ${visible}`,[user?.id??null,id]); if(!q[0]) throw new QuestionError('not_found',404);
 const answers=await db.query(`SELECT ${columns} ${from} WHERE p.parent_id=$2 AND ${visible} ORDER BY p.created_at,p.id LIMIT 21 OFFSET $3`,[user?.id??null,id,(page-1)*20]);
 return {question:serialize(q[0],user),posts:answers.slice(0,20).map(r=>serialize(r,user)),hasMore:answers.length>20}; }
 const market=params.get('market')??''; if(market&&!isCity(market)) throw new QuestionError('invalid_input');
 const place=params.get('place')??''; if(place.length>400) throw new QuestionError('invalid_input');
 const query=(params.get('q')??'').slice(0,100); const mine=params.get('mine')==='1'; if(mine&&!user) throw new QuestionError('login_required',401);
 const rows=await db.query(`SELECT ${columns} ${from} WHERE ${visible} AND ${parentVisible} AND p.parent_id IS NULL AND ($2='' OR p.market=$2) AND ($3='' OR p.place_path=$3) AND ($4='' OR position(lower($4) in lower(p.title||' '||p.body||' '||p.place_name))>0) AND (NOT $5 OR p.user_id=$1::uuid) ORDER BY p.created_at DESC,p.id DESC LIMIT 21 OFFSET $6`,[user?.id??null,market,place,query,mine,(page-1)*20]);
 return {posts:rows.slice(0,20).map(r=>serialize(r,user)),hasMore:rows.length>20};
}
export async function writePost(input: Record<string,unknown>, user: Member|null, operator?: string) {
 const db=database(); const body=field(input.body,5,4000); const locale=input.locale==='ko'||input.locale==='zh-CN'?input.locale:'en'; let scope: Scope; let title=''; let parent: string|null=null;
 if(input.parentId) { parent=postId(input.parentId); const rows=await db.query("SELECT market,place_path,place_name FROM sp_qa_posts WHERE id=$1 AND parent_id IS NULL AND status='published'",[parent]); if(!rows[0]) throw new QuestionError('not_found',404); scope={market:rows[0].market as Scope['market'],path:String(rows[0].place_path),name:String(rows[0].place_name)}; }
 else { title=field(input.title,5,160); if(input.scopeToken) scope=readScope(input.scopeToken); else { if(!isCity(input.market)) throw new QuestionError('invalid_input'); scope={market:input.market,path:'',name:''}; } }
 if(!user&&!operator) throw new QuestionError('login_required',401);
 const fingerprint=hash(`${title}\n${body}`.toLowerCase().replace(/\s+/g,''));
 const duplicate=await db.query(`SELECT id FROM sp_qa_posts WHERE user_id=$1::uuid AND fingerprint=$2 AND status<>'deleted' LIMIT 1`,[user?.id??null,fingerprint]); if(duplicate.length) throw new QuestionError('duplicate',409);
 const reason=operator?'':moderate(`${title}\n${body}`); const status=reason?'pending':'published'; const id=randomUUID();
 const rows=await db.query(`WITH inserted AS (INSERT INTO sp_qa_posts(id,parent_id,user_id,operator_id,market,place_path,place_name,title,body,status,review_reason,fingerprint,locale) SELECT $1,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13 WHERE ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM sp_qa_users WHERE id=$3::uuid AND NOT blocked)) AND ($2::uuid IS NULL OR EXISTS(SELECT 1 FROM sp_qa_posts WHERE id=$2::uuid AND parent_id IS NULL AND status='published')) ON CONFLICT DO NOTHING RETURNING id), logged AS (INSERT INTO sp_qa_events(post_id,actor,action,reason) SELECT id,$14,'created',$11 FROM inserted) SELECT id FROM inserted`,[id,parent,user?.id??null,operator??null,scope.market,scope.path,scope.name,title,body,status,reason,fingerprint,locale,operator??user!.id]);
 if(!rows.length) throw new QuestionError('duplicate',409); return {id:parent??id,postId:id,status};
}
export async function userAction(input: Record<string,unknown>, user: Member) {
 const id=postId(input.id); const db=database();
 if(input.action==='report') {
  const reason=field(input.reason,5,500); const rows=await db.query(`INSERT INTO sp_qa_reports(id,post_id,user_id,reason) SELECT $1,p.id,$3,$4 FROM sp_qa_posts p WHERE p.id=$2 AND p.status='published' AND ${parentVisible} AND p.user_id IS DISTINCT FROM $3::uuid ON CONFLICT(post_id,user_id) DO NOTHING RETURNING id`,[randomUUID(),id,user.id,reason]); if(!rows.length) throw new QuestionError('already_reported',409); return {ok:true};
 }
 if(input.action==='delete') { const rows=await db.query(`WITH changed AS (UPDATE sp_qa_posts SET status='deleted',body='[deleted]',title=CASE WHEN parent_id IS NULL THEN '[deleted]' ELSE '' END,updated_at=now() WHERE id=$1 AND user_id=$2 AND status<>'deleted' RETURNING id), logged AS (INSERT INTO sp_qa_events(post_id,actor,action,reason) SELECT id,$2,'deleted','author' FROM changed) SELECT id FROM changed`,[id,user.id]); if(!rows.length) throw new QuestionError('not_found',404); return {ok:true}; }
 if(input.action==='edit') {
  const body=field(input.body,5,4000); const original=await db.query("SELECT parent_id,title FROM sp_qa_posts WHERE id=$1 AND user_id=$2 AND status IN ('published','pending')",[id,user.id]); if(!original[0]) throw new QuestionError('not_found',404);
  const title=original[0].parent_id?'':field(input.title,5,160); const reason=moderate(`${title}\n${body}`); const status=reason?'pending':'published';
  const rows=await db.query(`WITH changed AS (UPDATE sp_qa_posts SET title=$3,body=$4,status=$5,review_reason=$6,fingerprint=$7,updated_at=now() WHERE id=$1 AND user_id=$2 AND status IN ('published','pending') RETURNING id), logged AS (INSERT INTO sp_qa_events(post_id,actor,action,reason) SELECT id,$2,'edited',$6 FROM changed) SELECT id FROM changed`,[id,user.id,title,body,status,reason,hash(`${title}\n${body}`.toLowerCase().replace(/\s+/g,''))]); if(!rows.length) throw new QuestionError('not_found',404); return {ok:true,status};
 }
 throw new QuestionError('invalid_input');
}
