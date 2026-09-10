import 'server-only';
import {cache} from 'react';
import {unstable_cache} from 'next/cache';
import {getPortfolioRecord,listPortfolioRecords} from '../../content/portfolio-manifest';
import type {EditorialPortfolioRecord} from '../../content/portfolio-types';
import type {ContentLocale,PublishedContentArticle} from './content-types';
import {getPublishedContent,listPublishedContent} from './content-repository.server';
const isNews=(article:PublishedContentArticle)=>['news-brief','market-brief','data-story'].includes(article.type);
export function storedEditorialRecord(article:PublishedContentArticle):EditorialPortfolioRecord {
 const prefix=article.locale==='en'?'':article.locale==='ko'?'/ko':'/zh-cn';
 return {...article,readerQuestion:article.deck,evidenceReleaseIds:[],revisionNote:'Published through the editorial workspace.',canonicalHref:`${prefix}/news/${article.slug}/`,translationGroupId:null,infographic:null};
}
export const listNewsroomArticles=cache(async(locale:ContentLocale='en'):Promise<readonly EditorialPortfolioRecord[]>=>{
 const stored=(await (process.env.DATABASE_URL?unstable_cache(()=>listPublishedContent({locale,limit:200}),['newsroom-list',locale],{revalidate:900,tags:[`newsroom:${locale}`]})():Promise.resolve([]))).filter(isNews).map(storedEditorialRecord);
 const slugs=new Set(stored.map(a=>a.slug));
 return [...stored,...listPortfolioRecords(locale).filter(a=>!slugs.has(a.slug))].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
});
export const getNewsroomArticle=cache(async(slug:string,locale:ContentLocale='en'):Promise<EditorialPortfolioRecord|null>=>{
 const stored=await getPublishedContent(locale,slug);
 if(stored && isNews(stored))return storedEditorialRecord(stored);
 const article=getPortfolioRecord(locale,slug);return article&&(isNews(article)||(locale==='ko'&&article.type==='policy-update'))?article:null;
});
