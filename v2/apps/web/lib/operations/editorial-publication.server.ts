import 'server-only';
import {revalidatePath,revalidateTag} from 'next/cache';
import {contentDatabase} from '../db/postgres.server';
import {saveEditorialArticle, type SaveEditorialArticleInput} from '../insights/content-article-store.server';
import {parseEditorialArticleInput} from '../../app/api/internal/content-articles/route';
export function publicationPaths(input: Pick<SaveEditorialArticleInput,'locale'|'slug'|'contentType'>) {
 const prefix=input.locale==='en'?'':input.locale==='ko'?'/ko':'/zh-cn';
 return [`${prefix}/news/`,`${prefix}/news/${input.slug}/`,'/editorial-sitemap.xml'];
}
export async function publishDueEditorial() {
 const sql=contentDatabase();if(!sql)throw new Error('database_not_configured');
 // A lease prevents two workers publishing the same item; expired leases are recoverable.
 const rows=await sql.query(`WITH due AS (
 SELECT id FROM editorial_publication_queue WHERE
 (state='scheduled' AND scheduled_at<=now()) OR (state IN ('publishing','refreshing') AND lease_until<now())
 ORDER BY scheduled_at LIMIT 10 FOR UPDATE SKIP LOCKED
 ) UPDATE editorial_publication_queue q SET state=CASE WHEN q.state='refreshing' THEN 'refreshing' ELSE 'publishing' END,
 lease_until=now()+interval '10 minutes',attempts=attempts+1,updated_at=now()
 FROM due WHERE q.id=due.id RETURNING q.*`);
 const results=[];
 for(const row of rows) {
  const payload=row.payload as Record<string,unknown>;
  const input=parseEditorialArticleInput({...payload,marketKey:payload.marketKey??'global',status:'published'});
  if(!input || input.evidenceState==='withdrawn') {await sql.query(`UPDATE editorial_publication_queue SET state='failed',error_code='publication_requirements_not_met',lease_until=NULL WHERE id=$1`,[row.id]);results.push({id:row.id,state:'failed'});continue;}
  try {
   if(row.state!=='refreshing') {
    await saveEditorialArticle(input);
    await sql.query(`UPDATE editorial_publication_queue SET state='refreshing' WHERE id=$1`,[row.id]);
   }
   revalidateTag(`newsroom:${input.locale}`, {expire:0});
   for(const path of publicationPaths(input))revalidatePath(path);
   await sql.query(`UPDATE editorial_publication_queue SET state='published',published_at=coalesce(published_at,now()),updated_at=now(),lease_until=NULL,error_code=NULL WHERE id=$1`,[row.id]);
   results.push({id:row.id,state:'published'});
  } catch {
   // Refreshing rows retain their outbox state so a cache failure does not lose publication.
   await sql.query(`UPDATE editorial_publication_queue SET state=CASE WHEN state='refreshing' THEN state ELSE 'failed' END,error_code='publication_or_refresh_failed',lease_until=now()+interval '10 minutes',updated_at=now() WHERE id=$1`,[row.id]);
   results.push({id:row.id,state:'retry_or_review'});
  }
 }
 return results;
}
