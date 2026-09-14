import { SEPTEMBER_REVISIONS } from './revisions/september';
import { INSIGHT_REVISIONS } from './revisions/insights';
import { MARKET_BRIEF_REVISIONS } from './revisions/market-briefs';
import { MONTHLY_REVISIONS } from './revisions/monthly';
import { DATABASE_REVISIONS } from './revisions/database';
import { DATABASE_NEIGHBOURHOOD_REVISIONS } from './revisions/database-neighbourhoods';

export type EditorialRevision = Readonly<Record<'en' | 'ko', readonly [title: string, deck: string, body: string]>>;
const revisions: Readonly<Record<string, EditorialRevision>> = { ...SEPTEMBER_REVISIONS, ...INSIGHT_REVISIONS, ...MARKET_BRIEF_REVISIONS, ...MONTHLY_REVISIONS, ...DATABASE_REVISIONS, ...DATABASE_NEIGHBOURHOOD_REVISIONS };
export { BILINGUAL_DATABASE_SLUGS } from './editorial-edition-slugs';
export const hasEditorialRevision = (slug: string) => Object.hasOwn(revisions, slug);
export const EDITORIAL_REVISION_DATE = '2026-09-14T00:00:00Z';

/** Only authored prose changes. Source dates, evidence releases and licensed assets do not. */
export function reviseEditorial<T extends { slug: string; locale: string; title: string; deck: string; bodyMarkdown: string; updatedAt: string }>(article: T): T {
  if(article.locale!=='en'&&article.locale!=='ko')return article;
  // A later editor-approved database version supersedes this one-time revision.
  if(Date.parse(article.updatedAt)>Date.parse(EDITORIAL_REVISION_DATE))return article;
  const revision=revisions[article.slug]?.[article.locale];
  if(!revision||(article.updatedAt===EDITORIAL_REVISION_DATE&&article.title===revision[0]))return article;
  const images=article.bodyMarkdown.split('\n').filter(line=>line.startsWith('!['));
  const tables=[...article.bodyMarkdown.matchAll(/^\|.+(?:\n\|.+)+/gm)].map(match=>match[0]);
  const [title,deck,template]=revision;
  const usedImages=new Set<number>(),usedTables=new Set<number>();
  let bodyMarkdown=template.replace(/\{\{(image|table):(\d+)\}\}/g,(_,kind:string,index:string)=>{
    const position=Number(index);const values=kind==='image'?images:tables;
    if(!values[position])throw new Error(`Missing ${kind} ${index}: ${article.locale}/${article.slug}`);
    (kind==='image'?usedImages:usedTables).add(position);return values[position]!;
  });
  // Never silently lose a licensed illustration or an evidence table in an edit.
  const remaining=[...images.filter((_,i)=>!usedImages.has(i)),...tables.filter((_,i)=>!usedTables.has(i))];
  if(remaining.length)bodyMarkdown+=`\n\n## ${article.locale==='ko'?'자료와 제작':'Sources and production'}\n\n${remaining.join('\n\n')}`;
  const credits=article.bodyMarkdown.split('\n').filter(line=>/^(Photo:|사진:|\[Original photograph by |Contains information from the Urban Redevelopment Authority|Urban Redevelopment Authority의 정보를 포함)/u.test(line));
  if(credits.length)bodyMarkdown+=`\n\n## ${article.locale==='ko'?'자료와 제작':'Sources and production'}\n\n${credits.join('\n\n')}`;
  return {...article,title,deck,bodyMarkdown,updatedAt:EDITORIAL_REVISION_DATE};
}
