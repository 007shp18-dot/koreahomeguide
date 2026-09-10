import type { ReactNode } from 'react';
import {SiteHeader} from '../site-header';
import {SiteFooter} from '../site-footer';
import type {SiteLocale} from '../../lib/navigation/site-navigation';
import styles from './tools.module.css';
export function ToolsShell({locale='en',href,children}:Readonly<{locale?:SiteLocale;href:string;children:ReactNode}>) {
 const name=locale === 'ko' ? '도구' : locale === 'zh-CN' ? '工具' : 'Tools';
 return <><SiteHeader copy={{brand:'signedprice',homeLabel:'signedprice home',navigationLabel:'Tools navigation',languageLabel:locale==='ko'?'KO':locale==='zh-CN'?'ZH':'EN',links:[{label:name,href,isCurrent:true}]}}/><main className={styles.page}>{children}</main><SiteFooter locale={locale} copy={{brand:'signedprice',descriptor:'Property research and practical decision tools.',navigationLabel:'Footer',links:[],status:'Source and assumptions are shown with each result.'}}/></>;
}
