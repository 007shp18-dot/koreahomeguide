import type { CollectionStatus } from './repository.server';
import type { MarketCollectionStatus } from './market-status.server';

export const COLLECTION_CITIES = [
  {id:'seoul',name:'서울',prefix:'kr-seoul'},
  {id:'singapore',name:'싱가포르',prefix:'sg-'},
  {id:'dubai',name:'두바이',prefix:'ae-dubai'},
  {id:'tokyo',name:'도쿄',prefix:'jp-tokyo'},
] as const;
export type CollectionFilter = 'all'|'attention'|'failed'|'overdue'|'review'|'blocked'|'unrun';
export function sourceSignals(source:CollectionStatus,now:number|null){
  const due=source.nextDueAt?Date.parse(source.nextDueAt):source.lastSuccessAt?Date.parse(source.lastSuccessAt)+source.intervalDays*86400000:null;
  const blocked=source.mode==='blocked';
  const failed=source.consecutiveFailures>0||Boolean(source.lastError);
  const overdue=!blocked&&now!==null&&due!==null&&Number.isFinite(due)&&due<now;
  const pending=source.pendingCount+source.pendingCandidateCount;
  const unrun=!source.lastAttemptAt;
  return {failed,overdue,pending,blocked,unrun,attention:failed||overdue||pending>0||Boolean(source.anomaly)};
}
export function matchesSource(source:CollectionStatus,filter:CollectionFilter,now:number|null){
  const s=sourceSignals(source,now);
  return filter==='all'||(filter==='review'?s.pending>0:filter==='attention'?s.attention:s[filter]);
}
export function marketJobLabel(job:string){
  const city=COLLECTION_CITIES.find(city=>job.startsWith(city.prefix))?.name??'';
  const kind=job.endsWith('-sale')?'매매':job.endsWith('-rent')?'임대':job.includes('hdb')?'HDB 거래':job;
  return `${city} ${kind}`.trim();
}
export function matchesMarket(job:MarketCollectionStatus,filter:CollectionFilter){
  if(filter==='all')return true;
  if(filter==='attention')return job.state==='failed'||Boolean(job.anomaly)||job.unlinked>0;
  if(filter==='failed')return job.state==='failed'||job.consecutiveFailures>0;
  if(filter==='unrun')return !job.lastAttemptAt;
  if(filter==='blocked')return !job.enabled;
  return false; // Job counters are not publication reviews; no inferred schedule SLA.
}
export function mostRecent(values:(string|null)[]){
  return values.filter((value):value is string=>Boolean(value)&&Number.isFinite(Date.parse(value!))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]??null;
}
