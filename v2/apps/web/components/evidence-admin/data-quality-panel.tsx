import type { DataQuality } from '../../lib/data-operations/data-quality.server';
import styles from './workspace.module.css';

const names: Record<string, string> = {'kr-seoul':'서울','sg-singapore':'싱가포르','ae-dubai':'두바이','jp-tokyo':'도쿄'};
const missing = (count: number, total: number) => total > 0
  ? `${count.toLocaleString()} / ${total.toLocaleString()} (${(count / total * 100).toFixed(1)}%)` : '집계 대상 없음';

export function DataQualityPanel({rows}: {rows: DataQuality[]}) {
  return <section aria-label="도시별 자료 품질">
    <h3>거래 자료 기간 · 건물 정보 누락</h3>
    <p>수집 성공 시각은 최신 거래 시점이 아닙니다. 아래 기간은 저장된 거래 자료의 범위이며, 월·분기 자료에서 정확한 계약일을 추정하지 않습니다.</p>
    <div className={styles.tableScroll}><table>
      <caption>활성 저장 자료 기준 · 사이트 공개 건수와 다를 수 있음</caption>
      <thead><tr><th scope="col">도시</th><th scope="col">자료 범위</th><th scope="col">건물 정보 누락</th><th scope="col">사진 확인 상태</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.market}>
        <th scope="row">{names[row.market] ?? row.market}</th>
        <td><strong>{row.records.toLocaleString()}건</strong><small>{row.periodStart && row.periodEnd ? `${row.periodStart} ~ ${row.periodEnd}` : '저장 거래 기간 없음'}</small>
          {row.wards !== null && <small>공개 지역 {row.wards} / 23개 구 · 구별 수록 분기는 다를 수 있음</small>}
          {row.market === 'ae-dubai' && <small>이 표는 거래 DB 기준입니다. 별도 배포된 두바이 지역 통계의 유무를 뜻하지 않습니다.</small>}
        </td>
        <td>{row.wards !== null ? '익명 지역 거래: 건물 주소·좌표 누락률 집계 대상 아님' : <>
          <small>주소 없음 {missing(row.missingAddress,row.entities)}</small>
          <small>좌표 없음 {missing(row.missingCoordinates,row.entities)}</small>
          <small>식별 미확정 {missing(row.unverifiedIdentity,row.entities)}</small>
        </>}</td>
        <td>{row.wards !== null ? '지역 자료: 건물 사진 대상 아님' : <>
          <small>최근 확인에서 사진 없음 {missing(row.photoUnavailable,row.entities)}</small>
          <small>확인 기록 없음 {missing(row.photoUnchecked,row.entities)}</small>
        </>}</td>
      </tr>)}</tbody>
    </table></div>
    <p>누락률의 분모는 저장된 건물·단지 식별자입니다. 사진 확인 기록은 현재 이미지 로딩 성공 여부나 전체 사진 보유율을 보장하지 않습니다.</p>
  </section>;
}
