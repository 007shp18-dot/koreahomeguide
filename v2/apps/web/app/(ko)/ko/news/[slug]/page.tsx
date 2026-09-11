import { getNewsroomArticle } from '@/lib/content/newsroom-content.server';
import { notFound } from 'next/navigation';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, listPortfolioRecords } from '@/content/portfolio-manifest';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';
type Props = {params:Promise<{slug:string}>};
export const dynamicParams = true;
export const revalidate = 900;
export function generateStaticParams() { return listPortfolioRecords('ko').filter(article=>article.type!=='guide').map(({slug})=>({slug})); }
export async function generateMetadata({params}:Props) {
  const article=await getNewsroomArticle((await params).slug,'ko'); if(!article || article.type==='guide') notFound();
  return indexableMetadata({path:article.canonicalHref as `/${string}`,title:`${article.title} | signedprice`,description:article.deck,languageAlternates:editorialLanguageAlternates(article,EDITORIAL_PORTFOLIO),locale:'ko_KR',imagePath:'/og/ko/'});
}
export default async function Page({params}:Props) {
  const article=await getNewsroomArticle((await params).slug,'ko'); if(!article || article.type==='guide') notFound();
  return <EditorialGrowthPublicFrame locale="ko" surface="content" currentHref={article.canonicalHref}><NewsroomArticle article={article}/><PublicEditorialJsonLd article={article}/></EditorialGrowthPublicFrame>;
}
