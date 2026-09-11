'use client';
import {useState} from 'react';
import {ToolEventOnMount,sendToolEvent} from '../tools/tool-analytics';
import styles from './contract-check.module.css';
export function currentSameOriginResultUrl(locationLike:Readonly<{href:string;origin:string}>):string|null {
 try {const url=new URL(locationLike.href); if(!['https:','http:'].includes(url.protocol)||url.origin!==locationLike.origin) return null;url.hash='';return url.href;}catch{return null;}
}
export async function copyCurrentResultLink(input:Readonly<{location:{href:string;origin:string};clipboard?:{writeText:(value:string)=>Promise<void>}}>) {
 const url=currentSameOriginResultUrl(input.location);
 if(url && input.clipboard) {try {await input.clipboard.writeText(url);return {status:'copied' as const,url};}catch{/* Manual fallback. */}}
 return {status:'manual' as const,url};
}
export function ResultLinkCopy({locale,tool}:Readonly<{locale:'en'|'ko'|'zh-CN';tool:'single-quote'|'offer-compare'}>) {
 const [state,setState]=useState<{status:'copied'|'manual';url:string|null}|null>(null);
 const ko=locale==='ko';
 return <div className={styles.resultCopy}><ToolEventOnMount event="tool_complete" market="kr-seoul" surface="check-result" tool={tool}/><button type="button" onClick={async()=>{const next=await copyCurrentResultLink({location:window.location,clipboard:navigator.clipboard});setState(next);if(next.status==='copied')sendToolEvent('result_link_copy',{market:'kr-seoul',surface:'check-result',tool});}}>{ko?'결과 링크 복사':locale === 'zh-CN' ? "复制结果链接" : 'Copy result link'}</button><small>{ko?'링크에 입력한 거래 조건이 포함됩니다.':locale === 'zh-CN' ? "链接包含您输入的条件。" : 'The link includes the terms you entered.'}</small><p role="status" aria-live="polite">{state?.status==='copied'?(ko?'결과 링크를 복사했습니다.':locale === 'zh-CN' ? "已复制结果链接。" : 'Result link copied.'):state?.status==='manual'?(ko?'아래 링크를 직접 복사하세요.':locale === 'zh-CN' ? "请手动复制此链接。" : 'Copy this link manually.') : ''}</p>{state?.status==='manual'&&state.url?<input aria-label={ko?'결과 링크':locale === 'zh-CN' ? "结果链接" : 'Result link'} readOnly value={state.url} onFocus={event=>event.target.select()}/>:null}</div>;
}
