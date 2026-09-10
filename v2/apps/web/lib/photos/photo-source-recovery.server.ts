import 'server-only';
import type { SqlPort } from '../evidence-pool/repository.server';

export const SEED_RECOVERY_SQL = `INSERT INTO photo_source_recovery (asset_url,source_host,candidate_count,building_count,state)
SELECT asset_url,split_part(split_part(asset_url,'://',2),'/',1),count(*)::integer,count(DISTINCT building_key)::integer,
 CASE WHEN split_part(split_part(asset_url,'://',2),'/',1) IN ('upload.wikimedia.org','thumb.wikimedia.org') AND asset_url LIKE '%/wikipedia/commons/%' THEN 'pending' ELSE 'source-unresolved' END
FROM building_photos WHERE (candidate_source='naver-search' OR match_policy_version='source-recovery-v1') AND asset_url IS NOT NULL
GROUP BY asset_url
ON CONFLICT(asset_url) DO UPDATE SET candidate_count=excluded.candidate_count,building_count=excluded.building_count
WHERE (photo_source_recovery.candidate_count,photo_source_recovery.building_count) IS DISTINCT FROM (excluded.candidate_count,excluded.building_count)`;

export function commonsFileTitle(asset: string): string | null {
 try {
  const u=new URL(asset);
  if(u.protocol!=='https:' || !['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname))return null;
  const parts=u.pathname.split('/');
  if(parts[1]!=='wikipedia'||parts[2]!=='commons')return null;
  const file=parts[3]==='thumb'?parts[6]:parts[5];
  return file?`File:${decodeURIComponent(file)}`:null;
 }catch{return null;}
}
function plain(value:unknown):string {return typeof value==='string'?value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim():'';}
export type RecoveredSource = {title:string;sourcePage:string;author:string;license:string;description:string;width:number|null;height:number|null;reusable:boolean};
export function parseRecoveredSource(asset:string,page:Record<string,unknown>):RecoveredSource|null {
 const info=(page.imageinfo as Record<string,unknown>[]|undefined)?.[0];if(!info)return null;
 const title=commonsFileTitle(asset);if(!title || commonsFileTitle(String(info.url))?.replaceAll('_',' ')!==title.replaceAll('_',' '))return null;
 const m=(info.extmetadata??{}) as Record<string,{value?:unknown}>;
 const author=plain(m.Artist?.value??m.Credit?.value);const license=plain(m.LicenseUrl?.value);
 const sourcePage=String(info.descriptionurl??'');
 if(!sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:'))return null;
 let reusable=false;
 try{const u=new URL(license);reusable=u.protocol==='https:'&&u.hostname==='creativecommons.org'&&/^\/(licenses\/by(-sa)?\/\d\.\d|publicdomain\/(zero|mark)\/1\.0)\/?$/.test(u.pathname)&&author.length>0;}catch{}
 return {title:String(page.title??title).replace(/^File:/,''),sourcePage,author,license,description:plain(m.ImageDescription?.value),width:typeof info.width==='number'?info.width:null,height:typeof info.height==='number'?info.height:null,reusable};
}

// Store provenance separately from identity. A recovered licence is never a
// visual approval. Existing reviewed/rejected decisions are left untouched.
export const APPLY_RECOVERY_SQL = `WITH recovered AS (
 UPDATE photo_source_recovery SET state='recovered',source_page_url=$2,metadata=$3::jsonb,
 attempted_at=now(),next_retry_at=now()+interval '365 days',attempts=attempts+1,updated_at=now()
 WHERE asset_url=$1 RETURNING asset_url
), enriched AS (
 UPDATE building_photos p SET candidate_title=$4,source_page_url=$2,
 candidate_width=$5::integer,candidate_height=$6::integer,
 attribution_name=CASE WHEN $9::boolean THEN $7 ELSE p.attribution_name END,
 attribution_url=CASE WHEN $9::boolean THEN $8 ELSE p.attribution_url END,
 rights_status=CASE WHEN $9::boolean THEN 'licensed' ELSE p.rights_status END,
 candidate_source=CASE WHEN $9::boolean THEN 'wikimedia' ELSE p.candidate_source END,
 match_policy_version='source-recovery-v1',
 match_evidence=p.match_evidence || '["original-discovery:naver-search","source-metadata-recovered","visual-review-still-required"]'::jsonb || jsonb_build_array(CASE
 WHEN length(regexp_replace(lower(b.official_name),'[^[:alnum:]]','','g'))>=3 AND position(regexp_replace(lower(b.official_name),'[^[:alnum:]]','','g') in regexp_replace(lower($4 || ' ' || $10),'[^[:alnum:]]','','g'))>0
 THEN 'metadata-name-supported' ELSE 'metadata-name-unresolved' END),
 checked_at=now(),updated_at=now()
 FROM recovered r, buildings b WHERE p.building_key=b.key AND p.asset_url=r.asset_url AND p.candidate_source='naver-search'
 AND p.status IN ('candidate','review_required')
 RETURNING p.id
) SELECT count(*)::integer AS enriched FROM enriched`;

export async function recoverPhotoSources(sql:SqlPort,fetcher:typeof fetch=fetch,limit=20) {
 await sql.query(SEED_RECOVERY_SQL);
 const rows=await sql.query(`SELECT asset_url FROM photo_source_recovery WHERE state IN ('pending','retry') AND next_retry_at<=now() ORDER BY building_count DESC,asset_url LIMIT $1`,[Math.min(20,Math.max(1,limit))]);
 const assets=rows.map(r=>String(r.asset_url));const titles=assets.map(commonsFileTitle).filter((s):s is string=>s!==null);
 if(!titles.length)return {checked:0,recovered:0,enriched:0};
 const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|size|extmetadata',titles:[...new Set(titles)].join('|')}).toString();
 let pages:Record<string,unknown>[]=[];
 try{const response=await fetcher(url,{signal:AbortSignal.timeout(12_000),headers:{'User-Agent':'SignedPrice/1.0 (building photo source recovery)'}});if(!response.ok)throw new Error('provider-error');const body=await response.json();pages=Object.values(body.query?.pages??{});}catch{
  await sql.query(`UPDATE photo_source_recovery SET state='retry',attempted_at=now(),attempts=attempts+1,next_retry_at=now()+interval '1 day' WHERE asset_url=ANY($1::text[])`,[assets]);return {checked:assets.length,recovered:0,enriched:0};
 }
 let recovered=0,enriched=0;
 for(const asset of assets){
  const source=pages.map(p=>parseRecoveredSource(asset,p)).find(Boolean);
  if(!source){await sql.query(`UPDATE photo_source_recovery SET state='source-unresolved',attempted_at=now(),attempts=attempts+1 WHERE asset_url=$1`,[asset]);continue;}
  const [result]=await sql.query(APPLY_RECOVERY_SQL,[asset,source.sourcePage,JSON.stringify(source),source.title,source.width,source.height,source.author,source.license,source.reusable,source.description]);recovered++;enriched+=Number(result?.enriched??0);
 }
 return {checked:assets.length,recovered,enriched};
}
export async function photoSourceRecoverySummary(sql:SqlPort) {
 return sql.query(`SELECT source_host,state,count(*)::integer AS unique_images,sum(candidate_count)::integer AS candidate_rows,
 count(*) FILTER(WHERE building_count>1)::integer AS multiple_building_images,
 sum(candidate_count) FILTER(WHERE building_count>1)::integer AS multiple_building_rows
 FROM photo_source_recovery GROUP BY source_host,state ORDER BY sum(candidate_count) DESC`);
}
