'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import type {PropertyScenarioContext,ToolMarket,ScenarioCurrency} from '../../lib/tools/property-scenario-context';
import styles from './tools.module.css';
const currencies={'kr-seoul':'KRW','sg-singapore':'SGD','ae-dubai':'AED'} as const;
export function PropertyScenarioWorkspace({context,locale}:Readonly<{context:PropertyScenarioContext;locale:'en'|'ko'}>) {
 const [active,setActive]=useState(context); const ko=locale==='ko';
 return <><div className={styles.context}><label>{ko?'시장 · 통화':'Market · currency'}<select value={active.market} onChange={event=>{const market=event.target.value as ToolMarket;setActive({...context,market,currency:currencies[market] as ScenarioCurrency,price:null,propertyName:null,entity:null,returnTo:null,areaSqm:null,housing:null,transaction:null}); const url=new URL(location.href);url.search='';url.searchParams.set('market',market);url.searchParams.set('currency',currencies[market]);history.replaceState(null,'',url);}}><option value="kr-seoul">Seoul · KRW</option><option value="sg-singapore">Singapore · SGD</option><option value="ae-dubai">Dubai · AED</option></select></label>{active.propertyName?<p>{active.propertyName}{active.areaSqm?` · ${active.areaSqm} m²`:''}</p>:null}{active.returnTo?<Link href={active.returnTo}>{ko?'원래 건물로 돌아가기':'Return to property evidence'}</Link>:null}</div><PropertyScenarioCalculator key={`${active.market}-${active.entity}`} price={active.price} currency={active.currency} locale={locale} analytics={{market:active.market,surface:'standalone-tool'}}/><nav className={styles.links} aria-label={ko?'관련 자료':'Related evidence'}><Link href={active.market==='kr-seoul'?`${ko?'/ko':''}/kr/seoul/explore/`:active.market==='sg-singapore'?'/sg/singapore/explore/':'/ae/dubai/explore/'}>Explore</Link><Link href={`${ko?'/ko':''}/tools/`}>{ko?'모든 도구':'All tools'}</Link><Link href="/guides/">Guides</Link></nav></>;
}
