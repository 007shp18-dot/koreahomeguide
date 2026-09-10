import type { MediaPipelineRow } from '../../lib/photos/media-pipeline.server';
import styles from './workspace.module.css';
const names: Record<string,string>={'kr-seoul':'서울','sg-singapore':'싱가포르','ae-dubai':'두바이'};
const stages: Record<string,[string,string]>={
 'published':['공개 자료 연결 완료','실제 화면의 로딩 성공률은 별도 확인'],
 'publication-pending':['승인 후 공개 연결 대기','정기 공개 반영 작업 확인'],
 'identity-unverified':['건물 식별 미확정','공식 식별자·주소 검증'],
 'building-unlinked':['기존 건물 자료 연결 없음','건물 원장과 정확한 ID 연결'],
 'address-missing':['검색에 필요한 주소 없음','공식 주소 확보'],
 'visual-review':['이용 권한 확인 · 사진 검수 대기','건물 외관 일치 여부 검수'],
 'rights-blocked':['이용 권한 미확인 후보','허가된 출처 확보 · 일괄 승인 금지'],
 'provider-error':['사진 공급원 오류','인증·요청 제한·응답 오류 확인'],
 'no-usable-result':['연결된 검색원에서 적합한 결과 없음','다른 허가 출처 확보'],
 'discovery-incomplete':['사용 가능한 출처 검색 미완료','정기 수집 대상 · 한도 내 처리'],
};
const percent=(n:number,d:number)=>d?`${(n/d*100).toFixed(1)}%`:'—';
export function MediaPipelinePanel({rows}:{rows:MediaPipelineRow[]}) {
 return <section aria-label="사진·좌표 전체 처리 현황"><h3>사진·좌표 전체 처리 현황</h3>
 <p>저장된 건물·단지·동을 각각 한 번만 셉니다. 사진 처리 상태는 중복 없이 분류하며, 수집 후보 수를 사진 확보율로 계산하지 않습니다.</p>
 {Object.entries(names).map(([market,name])=>{
  const group=rows.filter(r=>r.market===market);const total=group.reduce((s,r)=>s+r.count,0);
  if(!total)return <p key={market}>{name}: 이 건물 원장에 집계 대상 없음. 별도 지역 통계 서비스의 부재를 의미하지 않습니다.</p>;
  const published=group.filter(r=>r.stage==='published').reduce((s,r)=>s+r.count,0);
  const coordinates=group.reduce((s,r)=>s+r.coordinates,0);const publicCoordinates=group.reduce((s,r)=>s+r.publicCoordinates,0);
  return <div key={market}><h4>{name} · {total.toLocaleString()}개 대상</h4>
   <p>공개 사진 자료 연결 {published.toLocaleString()} ({percent(published,total)}) · 좌표 보유 {coordinates.toLocaleString()} ({percent(coordinates,total)}) · 검증된 공개 좌표 {publicCoordinates.toLocaleString()} ({percent(publicCoordinates,total)})</p>
   <div className={styles.tableScroll}><table><caption>{name} · 누락 원인과 다음 처리</caption>
    <thead><tr><th scope="col">대상</th><th scope="col">상태</th><th scope="col">건수</th><th scope="col">전체 대비</th><th scope="col">다음 처리</th></tr></thead>
    <tbody>{group.map(r=><tr key={`${r.kind}:${r.stage}`}><td>{{estate:'단지',project:'프로젝트',block:'동'}[r.kind]??r.kind}</td><td>{stages[r.stage]?.[0]??r.stage}</td><td>{r.count.toLocaleString()}</td><td>{percent(r.count,total)}</td><td>{stages[r.stage]?.[1]??'상태 확인'}</td></tr>)}</tbody>
   </table></div></div>;
 })}
 <p>도쿄는 익명 지역 거래이므로 건물 사진·정확한 건물 좌표 확보율의 분모에 넣지 않습니다. 공개 연결 완료는 자료 연결 상태이며, 외부 사진 URL의 현재 로딩 성공을 보장하지 않습니다.</p>
 </section>;
}
