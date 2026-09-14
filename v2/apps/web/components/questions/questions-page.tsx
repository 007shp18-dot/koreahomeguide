import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { prefix,type City,type SiteLocale } from '@/lib/questions/model';
import { QuestionsClient } from './questions-client';
export function QuestionsPage({locale='en',market='',id}:{locale?:SiteLocale;market?:City|'';id?:string}) {return <><SiteHeader copy={{...homepageCopy.header,homeHref:`${prefix(locale)}/`,languageLabel:locale==='ko'?'KO':locale==='zh-CN'?'ZH':'EN'}}/><main><QuestionsClient locale={locale} initialMarket={market} questionId={id}/></main><SiteFooter copy={homepageCopy.footer} locale={locale}/></>;}
