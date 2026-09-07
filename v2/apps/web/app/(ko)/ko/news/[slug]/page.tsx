import { notFound } from 'next/navigation';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { NewsroomArticle } from '@/components/newsroom/newsroom-article';
import { PublicEditorialJsonLd } from '@/components/public-json-ld';
import { EDITORIAL_PORTFOLIO, getPortfolioRecord, listPortfolioRecords } from '@/content/portfolio-manifest';
import { editorialLanguageAlternates, indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/design-review/editorial-growth-review.module.css';
type Props = {params:Promise<{slug:string}>};
export const dynamicParams = false;
export function generateStaticParams() { return listPortfolioRecords('ko').filter(article=>article.type!=='guide').map(({slug})=>({slug})); }
export async function generateMetadata({params}:Props) {
  const article=getPortfolioRecord('ko',(await params).slug); if(!article || article.type==='guide') notFound();
  return indexableMetadata({path:article.canonicalHref as `/${string}`,title:`${article.title} | signedprice`,description:article.deck,languageAlternates:editorialLanguageAlternates(article,EDITORIAL_PORTFOLIO),locale:'ko_KR',imagePath:'/og/ko/'});
}
export default async function Page({params}:Props) {
  const article=getPortfolioRecord('ko',(await params).slug); if(!article || article.type==='guide') notFound();
  return <KoreanSiteFrame href={article.canonicalHref}><div className={styles.reviewRoot}><NewsroomArticle article={article}/><PublicEditorialJsonLd article={article}/></div></KoreanSiteFrame>;
}
