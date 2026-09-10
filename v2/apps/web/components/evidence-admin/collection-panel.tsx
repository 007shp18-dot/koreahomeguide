'use client';
import { MediaPipelinePanel } from './media-pipeline-panel';
import type { MediaPipelineRow } from '../../lib/photos/media-pipeline.server';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DataQualityPanel } from './data-quality-panel';
import type { DataQuality } from '../../lib/data-operations/data-quality.server';
import type { MarketCollectionStatus } from '../../lib/data-operations/market-status.server';
import type { CollectionStatus } from '../../lib/data-operations/repository.server';
import {HdbBuildingPanel} from './hdb-building-panel';
import {OneMapLocationPanel} from './onemap-location-panel';
import styles from './workspace.module.css';

type Publication = {sourceAsOf:string;releasedAt:string;saleCount:number;rentCount:number;digest:string};
type Dashboard = {media?: MediaPipelineRow[];quality?: DataQuality[]; markets?: MarketCollectionStatus[]; sources: CollectionStatus[]; publication: string};
type Snapshot = {id: string; source_id: string; fetched_at: string; status: string; byte_count: number; content_hash: string; source_url: string; content?: string; previous_snapshot_id?: string | null; reviewed_at?: string | null; review_reason?: string | null};
const endpoint = '/api/internal/data-collection/';
const statuses: Record<string,string> = {pending:'검토 대기',reviewed:'원문 검토 완료',rejected:'제외',new:'신규 원문 저장',changed:'변경 원문 저장',unchanged:'변경 없음',failed:'수집 실패',not_due_or_busy:'다른 수집 진행 중 또는 실행 시점 전',blocked:'수집 보류'};
const formatTime = (value: string | null | undefined) => value ? `${value.replace('T',' ').slice(0,19)} UTC` : '기록 없음';

export function CollectionPanel({initialData, onUnauthorized}: {initialData?: Dashboard; onUnauthorized?: () => void}) {
 const [publication,setPublication] = useState<Publication | null>(null);const [publicationError,setPublicationError]=useState('');
 const [data,setData] = useState<Dashboard | null>(initialData ?? null);
 const [loading,setLoading] = useState(!initialData); const [busy,setBusy] = useState(false);
 const [error,setError] = useState(''); const [message,setMessage] = useState('');
 const [historyLoading,setHistoryLoading] = useState(false);
 const [sourceId,setSourceId] = useState(''); const [history,setHistory] = useState<Snapshot[]>([]);
 const [snapshot,setSnapshot] = useState<Snapshot | null>(null); const [reason,setReason] = useState('');
 const selection = useRef(0); const mutation = useRef(false);
 const request = useCallback(async <T,>(url: string, body?: unknown): Promise<T> => {
  const response = await fetch(url,{credentials:'same-origin',cache:'no-store',...(body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {})});
  const result = await response.json();
  if (!response.ok) {
   if (response.status===401) {onUnauthorized?.();throw new Error('세션이 만료되었습니다. 다시 로그인하세요.');}
   throw new Error(result.error==='invalid_origin' ? '요청 출처를 확인할 수 없습니다. 페이지를 다시 여세요.' : '수집 정보를 읽거나 저장하지 못했습니다. 잠시 후 다시 시도하세요.');
  }
  return result as T;
 },[onUnauthorized]);
 const load = useCallback(() => request<Dashboard>(endpoint).then(result=>{setData(result);setError('');}).catch(cause=>setError(cause instanceof Error ? cause.message : '조회 실패')).finally(()=>setLoading(false)),[request]);
 const loadPublication = useCallback(() => request<{publication:Publication|null}>('/api/internal/singapore-publication/').then(result=>{setPublication(result.publication);setPublicationError('');}).catch(()=>setPublicationError('싱가포르 공개 상태를 확인하지 못했습니다.')),[request]);
 async function importDrafts(snapshotId:string) {if(mutation.current)return;mutation.current=true;setBusy(true);setMessage('');try {const result=await request<{parsed:number;inserted:number;updated?:number;status:string}>(endpoint,{action:'import-amktc-drafts',snapshotId});setMessage(`요금 ${result.parsed}개 확인 · 신규 ${result.inserted}개 · 갱신 ${result.updated??0}개를 검토 대기로 등록했습니다. 출처·자료 승인은 별도입니다.`);}catch(cause){setError(cause instanceof Error ? cause.message : '초안 등록 실패');}finally{mutation.current=false;setBusy(false);}}
 async function probeKapt() {if(mutation.current)return;mutation.current=true;setBusy(true);setError('');try {const result=await request<{probe:{status:string}}>(endpoint,{action:'probe-kapt'});setMessage(`K-apt 호출 점검: ${result.probe.status}. 단위·가구당 비용 검증은 별도입니다.`);await load();}catch(cause){setError(cause instanceof Error ? cause.message : '호출 점검 실패');}finally{mutation.current=false;setBusy(false);}}
 async function publishSingapore() {if(mutation.current)return;mutation.current=true;setBusy(true);setMessage('');try {await request('/api/internal/singapore-publication/',{});await loadPublication();setMessage('싱가포르 수집 거래 자료를 검증하고 화면용 버전에 반영했습니다.');}catch{setPublicationError('검증 또는 공개에 실패했습니다. 기존 정상 공개 버전을 유지합니다.');}finally{mutation.current=false;setBusy(false);}}
 useEffect(()=>{void load();void loadPublication();return ()=>{selection.current+=1;};},[load,loadPublication]);
 async function openSource(id: string) {
  const revision=++selection.current;setSourceId(id);setHistoryLoading(true);setHistory([]);setSnapshot(null);setReason('');setError('');
  try {const result=await request<{snapshots:Snapshot[]}>(`${endpoint}?sourceId=${encodeURIComponent(id)}`);if(revision===selection.current){setHistory(result.snapshots);setHistoryLoading(false);}}
  catch(cause){if(revision===selection.current){setHistoryLoading(false);setError(cause instanceof Error ? cause.message : '이력 조회 실패');}}
 }
 async function openSnapshot(id: string) {
  const revision=++selection.current;setSnapshot(null);setReason('');setError('');
  try {const result=await request<{snapshot:Snapshot | null}>(`${endpoint}?snapshotId=${encodeURIComponent(id)}`);if(revision===selection.current){setSnapshot(result.snapshot);if(!result.snapshot)setError('원문을 찾을 수 없습니다.');}}
  catch(cause){if(revision===selection.current)setError(cause instanceof Error ? cause.message : '원문 조회 실패');}
 }
 async function act(body: {action:'collect';sourceId:string} | {action:'review';snapshotId:string;status:'reviewed'|'rejected';reason:string}) {
  if(mutation.current)return;mutation.current=true;setBusy(true);setError('');setMessage('');
  try {
   const result=await request<{changed?:boolean;results?:{status:string;error?:string}[]}>(endpoint,body);
   if(body.action==='review') {setMessage(result.changed ? '원문 검토 결정을 저장했습니다. 금액 자료 승인이나 계산 규칙 변경은 별도입니다.' : '이미 검토되었거나 다른 작업에서 변경되었습니다. 이력을 확인하세요.');setSnapshot(null);setReason('');}
   else {const first=result.results?.[0];setMessage(first ? `${statuses[first.status] ?? first.status}${first.error ? ` · ${first.error}` : ''}` : '수집 결과가 없습니다.');}
   await load();if(sourceId)await openSource(sourceId);
  }catch(cause){setError(cause instanceof Error ? cause.message : '저장 실패');}finally{mutation.current=false;setBusy(false);}
 }
 return <section aria-label="정기 수집 운영">
  <div className={styles.detailHeader}><h2>정기 수집 · 변경 검토</h2><button type="button" disabled={loading||busy} onClick={()=>{setLoading(true);void load();}}>{loading?'조회 중…':'수집 현황 새로고침'}</button></div>
  <section className={styles.notice} aria-label="싱가포르 화면 데이터 공개"><h3>싱가포르 거래 자료 · 화면 반영</h3>{publicationError?<p role="alert">{publicationError}</p>:publication?<p>수집 기준 {formatTime(publication.sourceAsOf)} · 마지막 공개 {formatTime(publication.releasedAt)} · 매매 {publication.saleCount.toLocaleString()}건 · 임대 {publication.rentCount.toLocaleString()}건</p>:<p>공개 버전 기록을 조회 중이거나 아직 공개한 버전이 없습니다.</p>}<button type="button" disabled={busy} onClick={()=>void publishSingapore()}>싱가포르 거래 검증 후 사이트 반영</button><p>수집 원문·세금·요금표의 검토 상태와 별도로, 검증을 통과한 싱가포르 거래 자료를 반영합니다.</p></section>
  <HdbBuildingPanel onUnauthorized={onUnauthorized}/>
  <OneMapLocationPanel onUnauthorized={onUnauthorized}/>
  <p>마지막 수집 성공과 사이트 공개는 별개입니다. 원문 검토 완료 후 조건·금액을 구조화하고 자료 승인을 거쳐야 계산에 사용할 수 있습니다.</p>
  {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.success}>{message}</p>}
  {!data ? <p role="status">{loading?'출처별 수집 현황을 불러오고 있습니다…':'수집 현황에 연결하지 못했습니다.'}</p> : <>
   {data.quality && <DataQualityPanel rows={data.quality}/>}
   {data.media && <MediaPipelinePanel rows={data.media}/>}
   {data.markets && <div className={styles.tableScroll}><table><caption>공식 매매·임대 수집 · 건수는 마지막 시도 기준 · 성공 시각과 구분</caption><thead><tr><th scope="col">작업</th><th scope="col">시각</th><th scope="col">마지막 시도 건수</th><th scope="col">오류·이상 징후</th></tr></thead><tbody>{data.markets.map(market=><tr key={market.job}><td><strong>{market.job}</strong><small>{market.enabled?'예약 수집 활성':'예약 수집 비활성'} · {market.state ?? '실행 기록 없음'}</small></td><td><small>시도 {formatTime(market.lastAttemptAt)}</small><small>성공 {formatTime(market.lastSuccessAt)}</small><small>성공 실행의 기준 시각 {formatTime(market.sourceAsOf)}</small></td><td><small>수신 {market.received} · 신규 {market.inserted} · 수정 {market.updated}</small><small>변경 없음 {market.unchanged} · 연결 필요 {market.unlinked}</small></td><td><small>연속 실패 {market.consecutiveFailures}회</small>{market.errorCode && <strong>{market.errorCode}</strong>}{market.anomaly && <p role="status">{market.anomaly}</p>}</td></tr>)}</tbody></table></div>}
   <div className={styles.tableScroll}><table><caption>출처별 수집 상태 · 시각은 UTC · 신규·변경은 마지막 성공 실행 기준</caption><thead><tr><th scope="col">출처</th><th scope="col">수집 시각</th><th scope="col">변경·검토</th><th scope="col">실패·이상 징후</th><th scope="col">마지막 공개</th><th scope="col">작업</th></tr></thead><tbody>{data.sources.map(source=><tr key={source.sourceId}>
    <td><strong>{source.name}</strong><small>{source.market} · {source.category} · {source.intervalDays}일 간격</small><small>{source.mode==='page-monitor'?'공식 페이지 변경 확인':source.mode==='address-api'?'공식 주소 API':source.mode}</small><small>{source.limitation}</small><a href={source.url} target="_blank" rel="noreferrer">공식 출처</a></td>
    <td><small>성공 {formatTime(source.lastSuccessAt)}</small><small>시도 {formatTime(source.lastAttemptAt)}</small><small>다음 확인 {formatTime(source.nextDueAt)}</small></td>
    <td><small>신규 {source.newCount} · 변경 {source.changedCount}</small><strong>검토 대기 {source.pendingCount}</strong>{source.sourceId==='sg-hdb-buildings'&&<small>건물 {source.recordCount}건 · 건물 검토 대기 {source.pendingCandidateCount}건</small>}{source.sourceId==='sg-onemap-building'&&<small>위치 후보 {source.recordCount}건 · 위치 검토 대기 {source.pendingCandidateCount}건</small>}</td>
    <td>{source.consecutiveFailures>0?<strong role="status">연속 실패 {source.consecutiveFailures}회</strong>:<span>연속 실패 없음</span>}{source.lastError && <small>{source.lastError}</small>}{source.anomaly && <strong role="status">이상 징후: {source.anomaly}</strong>}{source.probe && <details><summary>최근 API 점검</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(source.probe,null,2)}</pre></details>}</td>
    <td>{source.lastPublishedAt?formatTime(source.lastPublishedAt):'공개 연결 기록 없음'}</td>
    <td>{source.sourceId==='kr-kapt-cost' && <button type="button" disabled={busy} onClick={()=>void probeKapt()}>운영 K-apt API 호출 점검</button>}{source.mode!=='address-api'&&<button type="button" disabled={busy} onClick={()=>void openSource(source.sourceId)}>수집 이력</button>}{source.mode==='page-monitor' && <button type="button" disabled={busy} onClick={()=>void act({action:'collect',sourceId:source.sourceId})}>{busy?'처리 중…':'지금 변경 확인'}</button>}</td>
   </tr>)}</tbody></table></div>
   {sourceId && <section className={styles.notice}><h3>{data.sources.find(source=>source.sourceId===sourceId)?.name} · 최근 원문 이력</h3><p>최근 50개 변경 원문입니다. 변경이 없으면 새 원문을 만들지 않습니다.</p>{historyLoading?<p role="status">원문 이력 조회 중…</p>:history.length===0?<p>표시할 원문 이력이 없습니다.</p>:<ul>{history.map(item=><li key={item.id}><button type="button" disabled={busy} onClick={()=>void openSnapshot(item.id)}>{formatTime(item.fetched_at)} · {statuses[item.status] ?? item.status} · {item.byte_count.toLocaleString()} bytes</button></li>)}</ul>}</section>}
   {snapshot && <section className={styles.notice} aria-label="수집 원문 검토"><h3>수집 원문 · {statuses[snapshot.status] ?? snapshot.status}</h3><p>{formatTime(snapshot.fetched_at)} · SHA256 {snapshot.content_hash}</p><p>아래 원문은 실행하지 않고 텍스트로 표시합니다. 요금 적용일과 조건은 원문에서 따로 확인하세요.</p>
    <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:'24rem',overflow:'auto'}}>{snapshot.content ?? '원문 없음'}</pre>
    {snapshot.previous_snapshot_id && <button type="button" disabled={busy} onClick={()=>void openSnapshot(snapshot.previous_snapshot_id!)}>이전 원문 보기</button>}
    {snapshot.review_reason && <p>검토 사유: {snapshot.review_reason} · {formatTime(snapshot.reviewed_at)}</p>}
    {snapshot.status==='reviewed' && snapshot.source_id==='sg-amktc-cost' && <button type="button" disabled={busy} onClick={()=>void importDrafts(snapshot.id)}>검토한 요금표를 자료 초안으로 등록</button>}
    {snapshot.status==='pending' && <><label>원문 검토 사유<textarea value={reason} maxLength={240} onChange={event=>setReason(event.target.value)} disabled={busy}/></label><div className={styles.actions}><button type="button" disabled={busy||!reason.trim()} onClick={()=>void act({action:'review',snapshotId:snapshot.id,status:'reviewed',reason:reason.trim()})}>원문 검토 완료 · 금액 승인 아님</button><button type="button" disabled={busy||!reason.trim()} onClick={()=>void act({action:'review',snapshotId:snapshot.id,status:'rejected',reason:reason.trim()})}>원문 제외</button></div></>}
   </section>}
  </>}
 </section>;
}
