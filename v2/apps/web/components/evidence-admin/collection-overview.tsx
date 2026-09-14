import type { CollectionStatus } from '../../lib/data-operations/repository.server';
import type { MarketCollectionStatus } from '../../lib/data-operations/market-status.server';
import { COLLECTION_CITIES, sourceSignals, mostRecent } from '../../lib/data-operations/collection-view';
import styles from './workspace.module.css';

export function CollectionOverview({sources,markets,now,city,onCity,publicationAt,publicationLoading,publicationError}:{
  sources:CollectionStatus[];markets?:MarketCollectionStatus[];now:number|null;city:string;onCity:(city:string)=>void;
  publicationAt:string|null;publicationLoading:boolean;publicationError:string;
}){
  const failed=sources.filter(s=>sourceSignals(s,now).failed).length+(markets??[]).filter(m=>m.state==='failed'||m.consecutiveFailures>0).length;
  const overdue=sources.filter(s=>sourceSignals(s,now).overdue).length;
  const pending=sources.reduce((sum,s)=>sum+sourceSignals(s,now).pending,0);
  return <section aria-label="도시별 수집과 공개 현황" className={styles.collectionOverview}>
    <p className={styles.collectionSummary} role="status">실패 작업·출처 <strong>{failed}</strong> · 예정 시각 경과 출처 <strong>{now===null?'—':overdue}</strong> · 검토 대기 원문·후보 <strong>{pending.toLocaleString()}</strong></p>
    <div className={styles.collectionCities}>{COLLECTION_CITIES.map(item=>{
      const jobs=markets?.filter(m=>m.job.startsWith(item.prefix));
      const citySources=sources.filter(s=>s.market===item.id);
      const latest=mostRecent((jobs??[]).map(job=>job.lastSuccessAt));
      const issues=citySources.filter(s=>sourceSignals(s,now).attention).length+(jobs??[]).filter(j=>j.state==='failed'||j.anomaly||j.unlinked>0).length;
      return <button type="button" key={item.id} onClick={()=>onCity(city===item.id?'all':item.id)} aria-pressed={city===item.id} className={styles.collectionCity}>
        <span className={styles.collectionCityTitle}>{item.name}<span>{issues?`조치 확인 ${issues}`:'항목 보기'}</span></span>
        <span>최근 거래 수집 결과</span><strong>{!jobs?.length?'실행 자료 없음':`${jobs.filter(j=>j.state==='succeeded').length} / ${jobs.length} 작업 성공`}</strong>
        <small>{latest?`가장 최근 성공 ${latest.replace('T',' ').slice(0,16)} UTC`:'거래 수집 성공 기록 없음'}</small>
        <small>예약 활성 {jobs?.filter(j=>j.enabled).length??'—'} · 활성화 여부는 수집 성공과 다릅니다.</small>
        <span className={styles.collectionPublication}>사이트 공개</span><small>{item.id==='singapore'?(publicationLoading?'공개 버전 조회 중…':publicationError?'공개 상태 조회 실패':publicationAt?`${publicationAt.replace('T',' ').slice(0,16)} UTC`:'공개 버전 기록 없음'):'거래 공개 버전 연결 안 됨 · 수집 성공으로 추정하지 않음'}</small>
      </button>;
    })}</div>
  </section>;
}
