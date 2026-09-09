'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import styles from './workspace.module.css';
export type HdbCandidate = {id:string;version:number;status:string;block:string;street:string;entityId:string|null;yearCompleted:number|null;maxFloorLevel:number|null;dwellingUnits:number|null;residential:boolean;town:string;fetchedAt:string;sourceUrl:string;contentHash:string;isCurrent?:boolean;audit?:{previous_version:number;next_version:number;previous_status:string;next_status:string;reason:string;actor:string;reviewed_at:string}[]};
type List = {items:HdbCandidate[];page:number;total:number};
const endpoint='/api/internal/hdb-buildings/';
const labels:Record<string,string>={pending:'검토 대기',approved:'승인',rejected:'제외'};
export function HdbBuildingPanel({onUnauthorized,initialData}:{onUnauthorized?:()=>void;initialData?:List}) {
 const [data,setData]=useState<List|null>(initialData??null);const [page,setPage]=useState(1);const [status,setStatus]=useState('pending');
 const [selected,setSelected]=useState<HdbCandidate|null>(null);const [reason,setReason]=useState('');
 const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(!initialData);const [error,setError]=useState('');const [message,setMessage]=useState('');
 const detailRequestId=useRef(0);const requestId=useRef(0);const lock=useRef(false);
 const request=useCallback(async <T,>(url:string,body?:unknown):Promise<T>=>{
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json();
  if(!response.ok){if(response.status===401)onUnauthorized?.();throw new Error(response.status===409?'다른 검토 또는 신규 수집으로 자료가 변경되었습니다. 목록을 새로고침하고 다시 확인하세요.':response.status===401?'세션이 만료되었습니다. 다시 로그인하세요.':'건물 자료 요청에 실패했습니다. 연결과 자료 상태를 확인하세요.');}
  return result as T;
 },[onUnauthorized]);
 const load=useCallback(()=>{const id=++requestId.current;return request<List>(`${endpoint}?status=${status}&page=${page}`).then(result=>{if(id===requestId.current){setData(result);setError('');}}).catch(cause=>{if(id===requestId.current)setError(cause instanceof Error?cause.message:'조회 실패');}).finally(()=>{if(id===requestId.current)setLoading(false);});},[page,status,request]);
 useEffect(()=>{void load();return()=>{requestId.current+=1;detailRequestId.current+=1;};},[load]);
 async function openCandidate(item:HdbCandidate){const id=++detailRequestId.current;setSelected(null);setReason('');setError('');try{const result=await request<{item:HdbCandidate|null}>(`${endpoint}?id=${encodeURIComponent(item.id)}`);if(id===detailRequestId.current){setSelected(result.item);if(!result.item)setError('선택한 건물 자료가 없습니다.');}}catch(cause){if(id===detailRequestId.current)setError(cause instanceof Error?cause.message:'상세 조회 실패');}}
 async function collect(){if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');try{const result=await request<{status:string;recordCount?:number;matchedCount?:number}>(endpoint,{action:'collect'});setMessage(result.status==='failed'?'HDB 수집에 실패했습니다. 출처별 실패 상태를 확인하세요.':`수집 상태 ${result.status} · ${result.recordCount??0}건 확인 · 연결 ${result.matchedCount??0}건. 신규 건물 정보는 검토 대기 상태입니다.`);await load();}catch(cause){setError(cause instanceof Error?cause.message:'수집 실패');}finally{lock.current=false;setBusy(false);}}
 async function review(decision:'approved'|'rejected'){
  if(lock.current||!selected||reason.trim().length<3)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{await request(endpoint,{action:'review',id:selected.id,version:selected.version,status:decision,reason:reason.trim()});setSelected(null);setReason('');await load();setMessage(decision==='approved'?'선택한 건물 정보를 승인했습니다. 연결된 HDB 상세의 Facts에 반영됩니다.':'선택한 건물 정보를 제외했습니다. 검토 이력은 보존됩니다.');}
  catch(cause){setError(cause instanceof Error?cause.message:'검토 저장 실패');}finally{lock.current=false;setBusy(false);}
 }
 return <section className={styles.notice} aria-label="HDB 건물 정보 검토">
  <h3>HDB 건물 정보 · 개별 검토</h3><p>블록·도로명이 정확히 연결된 최신 자료를 확인하고 승인하세요. 새 수집 자료는 자동 공개하지 않으며, 새 버전 검토 중에는 기존 승인 정보를 유지합니다.</p>
  <div className={styles.actions}><label>검토 상태<select value={status} disabled={busy} onChange={event=>{setStatus(event.target.value);setPage(1);setLoading(true);detailRequestId.current+=1;setSelected(null);setReason('');}}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button type="button" disabled={busy||loading} onClick={()=>{setLoading(true);void load();}}>건물 목록 새로고침</button><button type="button" disabled={busy} onClick={()=>void collect()}>{busy?'처리 중…':'HDB 공식 자료 지금 수집'}</button></div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status" className={styles.success}>{message}</p>}
  {loading?<p role="status">건물 자료 조회 중…</p>:!data?<p>건물 자료를 불러오지 못했습니다.</p>:<>
   <p>총 {data.total}건 · {page}페이지</p><div className={styles.tableScroll}><table><thead><tr><th scope="col">건물</th><th scope="col">연결</th><th scope="col">수집·검토</th></tr></thead><tbody>{data.items.map(item=><tr key={item.id}><td><button type="button" disabled={busy} onClick={()=>void openCandidate(item)}>{item.block} {item.street}</button><small>{item.town}</small></td><td>{item.entityId?'건물 연결됨':'연결 필요'}{item.isCurrent===false&&<small>이전 수집 버전</small>}</td><td>{labels[item.status]??item.status} · v{item.version}<small>{item.fetchedAt.slice(0,10)}</small></td></tr>)}</tbody></table></div>
   {!data.items.length&&<p>이 상태의 건물 자료가 없습니다.</p>}<div className={styles.pagination}><button type="button" disabled={busy||page<=1} onClick={()=>{setPage(value=>value-1);setLoading(true);detailRequestId.current+=1;setSelected(null);}}>이전</button><button type="button" disabled={busy||page*25>=data.total} onClick={()=>{setPage(value=>value+1);setLoading(true);detailRequestId.current+=1;setSelected(null);}}>다음</button></div>
  </>}
  {selected&&<section aria-label="선택한 HDB 건물"><h4>{selected.block} {selected.street}</h4><p>{selected.entityId??'정확히 연결된 건물 없음'} · {selected.town}</p><dl><dt>준공연도</dt><dd>{selected.yearCompleted??'미확인'}</dd><dt>최고 층수</dt><dd>{selected.maxFloorLevel??'미확인'}</dd><dt>주거 세대수</dt><dd>{selected.dwellingUnits??'미확인'}</dd><dt>주거용</dt><dd>{selected.residential?'예':'아니요'}</dd></dl><p>수집 {selected.fetchedAt} · 버전 {selected.version}</p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">공식 원자료 확인</a><p>원자료 해시 {selected.contentHash}</p>
   {selected.status!=='rejected'?<><label>개별 검토 사유 · 3자 이상<textarea disabled={busy} value={reason} maxLength={240} onChange={event=>setReason(event.target.value)}/></label>{(!selected.entityId||selected.isCurrent===false)&&<p>정확한 건물 연결과 최신 수집 버전 확인 전에는 승인할 수 없습니다.</p>}<div className={styles.actions}>{selected.status==='pending'&&<button type="button" disabled={busy||reason.trim().length<3||!selected.entityId||selected.isCurrent===false} onClick={()=>void review('approved')}>개별 승인 · 건물 정보 반영</button>}<button type="button" disabled={busy||reason.trim().length<3} onClick={()=>void review('rejected')}>{selected.status==='approved'?'승인 철회 · 공개정보 제거':'개별 제외'}</button></div></>:<p>검토 결정이 저장된 자료입니다.</p>}
   {selected.audit && <details><summary>검토 이력 {selected.audit.length}건</summary>{selected.audit.map((entry,index)=><p key={`${entry.next_version}-${index}`}>v{entry.previous_version} → v{entry.next_version} · {labels[entry.previous_status]??entry.previous_status} → {labels[entry.next_status]??entry.next_status}<br/>{entry.reason} · {entry.actor} · {entry.reviewed_at}</p>)}</details>}
  </section>}
 </section>;
}
