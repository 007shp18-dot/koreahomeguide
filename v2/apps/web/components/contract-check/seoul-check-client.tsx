"use client";
import {useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import type {SingleQuoteCheckRouteModel} from '../../lib/single-quote-check/route-model.server';
import type {EntityCheckContext} from '../../lib/navigation/explorer-selection';
import {SingleQuoteCheckWorkspace} from './single-quote-check';
export function seoulCheckRequestHref(search:string,locale:'en'|'ko') {
 const input=new URLSearchParams(search),query=new URLSearchParams();
 for(const key of ['check','transaction','district','building','housing','area','price','deposit','monthly-rent','market','entity','returnTo']) {const value=input.get(key);if(value!==null) query.set(key,value);}
 if(query.size===0)return null;query.set('locale',locale);return `/api/seoul/check/?${query}`;
}
type Loaded={href:string;model:SingleQuoteCheckRouteModel;entityContext:EntityCheckContext|null};
export function SeoulCheckClient({initialModel,initialContext,locale}:{initialModel:SingleQuoteCheckRouteModel;initialContext:EntityCheckContext|null;locale:'en'|'ko'}) {
 const search=useSearchParams();const href=seoulCheckRequestHref(search.toString(),locale);
 const [loaded,setLoaded]=useState<Loaded|null>(null),[failed,setFailed]=useState<string|null>(null),[retry,setRetry]=useState(0);
 useEffect(()=>{if(href===null)return;const controller=new AbortController();
  fetch(href,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('check unavailable');return response.json() as Promise<Omit<Loaded,'href'>>}).then(value=>{if(!controller.signal.aborted)setLoaded({...value,href});}).catch(()=>{if(!controller.signal.aborted)setFailed(href);});
  return()=>controller.abort();
 },[href,retry]);
 const current=loaded?.href===href?loaded:null;const pending=href!==null&&current===null;const error=pending&&failed===href;
 return <><SingleQuoteCheckWorkspace key={current?href:'initial'} model={current?.model??initialModel} entityContext={current?.entityContext??initialContext} locale={locale} pending={pending} error={error} onRetry={()=>{setFailed(null);setRetry(n=>n+1)}} /></>;
}
