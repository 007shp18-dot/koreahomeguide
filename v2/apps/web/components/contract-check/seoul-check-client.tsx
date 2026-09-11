"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {useSearchParams} from 'next/navigation';
import type {SingleQuoteCheckRouteModel} from '../../lib/single-quote-check/route-model.server';
import type {EntityCheckContext} from '../../lib/navigation/explorer-selection';
import {SingleQuoteCheckWorkspace} from './single-quote-check';
export function seoulCheckRequestHref(search:string,locale:'en'|'ko'|'zh-CN') {
 const input=new URLSearchParams(search),query=new URLSearchParams();
 for(const key of ['check','transaction','district','building','housing','area','price','deposit','monthly-rent','market','entity','returnTo']) {const value=input.get(key);if(value!==null) query.set(key,value);}
 if(query.size===0)return null;query.set('locale',locale);return `/api/seoul/check/?${query}`;
}
type Loaded={href:string;revision:number;model:SingleQuoteCheckRouteModel;entityContext:EntityCheckContext|null};
export function SeoulCheckClient({initialModel,initialContext,locale}:{initialModel:SingleQuoteCheckRouteModel;initialContext:EntityCheckContext|null;locale:'en'|'ko'|'zh-CN'}) {
 const search=useSearchParams();const href=seoulCheckRequestHref(search.toString(),locale);
 const [loaded,setLoaded]=useState<Loaded|null>(null),[failed,setFailed]=useState<string|null>(null),[retry,setRetry]=useState(0);
 useEffect(()=>{if(href===null)return;const controller=new AbortController();
  fetch(href,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('check unavailable');return response.json() as Promise<Omit<Loaded,'href'|'revision'>>}).then(value=>{if(!controller.signal.aborted)setLoaded({...value,href,revision:retry});}).catch(()=>{if(!controller.signal.aborted)setFailed(href);});
  return()=>controller.abort();
 },[href,retry]);
 const current=loaded?.href===href&&loaded.revision===retry?loaded:null;const pending=href!==null&&current===null;const error=pending&&failed===href;
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const query=new URLSearchParams();
  for(const [key,value] of new FormData(event.currentTarget))if(typeof value==='string')query.append(key,value);
  setFailed(null);
  if(seoulCheckRequestHref(query.toString(),locale)===href)setRetry(n=>n+1);
  else window.history.pushState(null,'',`${locale==='zh-CN'?'/zh-cn':locale==='ko'?'/ko':''}/kr/seoul/check/?${query}`);
 }
 return <><SingleQuoteCheckWorkspace key={href===null?'initial':loaded?.href??'initial'} model={href===null?initialModel:loaded?.model??initialModel} entityContext={href===null?initialContext:loaded?.entityContext??initialContext} locale={locale} pending={pending} error={error} onSubmit={submit} onRetry={()=>{setFailed(null);setRetry(n=>n+1)}} /></>;
}
