import type { ProductLocale } from './product-copy';

const korean: Readonly<Record<string, string>> = {
  'Breadcrumb': '현재 위치', 'Seoul': '서울', 'Overview': '개요', 'Transactions': '거래 내역', 'Source': '출처',
  'Property type': '주택 유형', 'Housing type': '주택 유형', 'Evidence': '거래 자료', 'Period': '집계 기간',
  'Building page sections': '단지 상세 항목', 'Building summary': '가격 요약', 'Price summary': '가격 요약',
  'Median refundable deposit': '반환 보증금 중앙값', 'Recent reported evidence': '최근 신고 거래',
  'Rent evidence': '임대차 거래', 'Building profile': '단지 정보', 'Verified facts already attached': '확인된 단지 정보',
  'Building': '단지', 'Area': '지역', 'Evidence period': '집계 기간', 'Building news and community': '단지 관련 소식',
  'Official identity': '공식 건물명', 'Observed contracts': '확인된 계약', 'Contract evidence': '거래 유형',
  'Observed period': '집계 기간', 'Observed evidence': '확인된 거래', 'Map identity': '지도 위치',
  'Verified coordinate available': '위치 확인됨', 'Coordinate verification pending': '위치 확인 중',
  'Evidence boundary': '자료 범위', 'Price evidence unavailable': '가격 자료 없음', 'All observed': '확인된 전체 거래',
  'Jeonse': '전세', 'Monthly rent': '월세', 'Sale': '매매', 'Map status': '위치 확인 상태',
  'Source and observation details': '출처·집계 기준', 'Source period': '원자료 기간',
  'Observed first': '최초 확인 월', 'Observed latest': '최근 확인 월', 'Return to Explore': '실거래가 탐색',
  'Read the evidence policy': '자료 기준 보기', 'Transaction': '거래 유형', 'Area cohort': '면적 구간',
  'Filed deposit median': '신고 보증금 중앙값', 'Not published': '자료 없음', 'Monthly rent metric': '월세 기준',
  'Filed monthly rent only': '신고된 월세만 집계', 'Area scope': '면적 범위', 'Contract group': '계약 구분',
  'No privacy-safe recent rows remain in this selected cohort.': '선택한 조건에 개인정보 보호 기준을 충족하는 최근 거래가 없습니다.',
  'Filed deposit': '신고 보증금', 'MOLIT reported contracts': '국토교통부 신고 거래', 'Generated': '자료 갱신일',
  'Publication minimum': '가격 표시 최소 거래 건수', '5 eligible contracts': '집계 조건을 충족한 계약 5건',
  'All home sizes': '전체 면적', 'Under 40㎡': '40㎡ 미만', '40–60㎡': '40~60㎡', '60–85㎡': '60~85㎡', '85㎡ and above': '85㎡ 이상',
  'apartment': '아파트', 'officetel': '오피스텔', 'villa_multifamily': '연립·다세대', 'detached': '단독·다가구',
  'Rent': '임대차', 'Buy': '매매', 'Invest': '투자', 'All': '전체', 'New': '신규', 'Renewal': '갱신',
  'all': '전체', 'new': '신규', 'renewal': '갱신', 'unknown': '미분류',
  'Building decision mode': '단지 정보 보기', 'Rent contract cohort': '임대차 계약 구분',
  'Recent change': '최근 변동', 'Contract type evidence': '계약 구분별 거래', 'New contracts': '신규 계약', 'Renewal contracts': '갱신 계약', 'Unclassified type': '미분류 계약',
  'Other floor-area bands are not available yet.': '다른 면적 구간의 자료는 없습니다.',
  'Published contract evidence is currently fixed to the 45–55㎡ floor-area band.': '현재 거래 자료는 전용면적 45~55㎡에 한정됩니다.',
  'Additional bands will open after the collection scope expands.': '수집 범위가 늘어나면 다른 면적 구간도 제공됩니다.',
  'No area-band distribution is published for this record.': '이 단지의 면적 구간별 가격 자료가 없습니다.',
  'No recent public contract rows are included in this artifact.': '현재 자료에 공개 가능한 최근 거래 내역이 없습니다.',
  'Filed month': '계약 월', 'Floor': '층', 'Contract': '계약 구분', 'Jeonse deposit': '전세 보증금',
  'Filters and publication rules': '집계 조건·가격 표시 기준', 'Supported deals': '거래 유형', 'Exclusions': '제외 항목',
  'Read SignedPrice Trust': '데이터 기준 보기 (영문)', 'Review Seoul corrections': '서울 자료 정정 내역',
  'Back to Seoul map': '서울 지도로 돌아가기', 'View district rankings': '자치구별 순위',
  'See records, adjustments, and methodology': '거래 내역·보정·집계 방법', '01 / Reported distribution': '01 / 신고 거래 분포',
  '02 / Floor evidence': '02 / 층별 거래', 'Floor adjustment evidence': '층별 가격 보정 근거',
  '03 / Area bands': '03 / 면적 구간', 'Evidence by filed area band': '신고 면적별 거래',
  '04 / Recent records': '04 / 최근 거래', 'Privacy-safe reported contracts': '개인정보 보호 기준을 적용한 신고 거래',
  '05 / Source and limits': '05 / 출처·한계', 'Use this evidence within its boundary': '출처·집계 범위',
  'Building evidence navigation': '단지 거래 자료 탐색', 'Building evidence period': '단지 거래 집계 기간',
  'Declared-period contract evidence': '집계 기간의 신고 거래', '3-month change not assessable': '3개월 가격 변동 산출 불가',
  'Prior/latest sample counts were not retained in this snapshot.': '비교 기간별 거래 건수가 없어 가격 변동을 산출하지 않습니다.',
  'Floor was not retained in this verified snapshot.': '현재 자료에 층 정보가 없습니다.', 'Unclassified': '미분류',
  'Building evidence readiness': '이용 가능한 단지 자료', 'Published': '자료 있음', 'Buy evidence': '매매 거래', 'Investment scenario': '투자 시나리오',
  'Official sale evidence is not ready': '공식 매매 자료 없음', 'No rights-cleared official sale artifact is installed for this building.': '이 단지에 이용 권한을 확인한 공식 매매 자료가 없습니다.',
  'Investment evidence is incomplete': '투자 분석 자료 부족', 'Official sale evidence and explicit financing assumptions are required.': '공식 매매 자료와 구체적인 자금 조달 조건이 필요합니다.',
  'Review the current evidence ledger': '자료 범위 확인', 'Return to district evidence': '자치구 거래 보기', 'View All contract evidence': '전체 계약 보기',
  'Contract evidence is not available': '계약 자료 없음', 'The selected cohort has no independently publishable summary.': '선택한 계약 구분의 가격을 표시할 수 있는 자료가 없습니다.',
  'Evidence ledger': '자료 기준', 'What supports this building page': '이 단지의 자료 범위', 'Building identity': '단지 정보',
  'Verified by the signed building artifact.': '검증된 단지 자료에서 확인했습니다.', 'Rent contracts': '임대차 계약', 'Official sale evidence': '공식 매매 자료',
  'Building visual': '단지 이미지', 'No rights-cleared source is connected.': '이용 권한을 확인한 이미지 출처가 없습니다.', 'Community': '이용자 정보',
  'Independent threshold state; never merged with official evidence.': '별도 거래 건수 기준을 적용하며 공식 자료와 합치지 않습니다.',
  'Declared-period reported building contracts, including any filing-in-progress months shown above; not a listing, appraisal, or legal review.': '표시된 집계 기간의 신고 계약이며 신고가 진행 중인 월도 포함됩니다. 매물 정보·감정평가·법률 검토가 아닙니다.',
  'Declared period': '집계 기간', 'Canceled records': '취소 거래', 'Private fields': '개인정보', 'jeonse': '전세',
  'Contract evidence insufficient': '층 보정 자료 부족',
  'Compared filed contracts in the same building and exact floor area where floor was the differing retained field. Coefficients stay blank when fewer than six eligible pairs remain.': '같은 단지·같은 전용면적에서 층만 다른 신고 계약을 비교합니다. 비교 가능한 거래가 6쌍 미만이면 보정 계수를 표시하지 않습니다.',
};

export function seoulDetailText(locale: ProductLocale, value: string): string {
  if (locale !== 'ko') return value;
  if (korean[value]) return korean[value];
  const sparse = value.match(/^(\d+) eligible records are below the (\d+)-record publication minimum\.$/);
  if (sparse) return `집계 조건을 충족한 거래가 ${sparse[1]}건으로 가격 표시 기준인 ${sparse[2]}건에 못 미칩니다.`;
  const cohort = value.match(/^(All|New|Renewal) contract evidence is not published$/);
  if (cohort) return `${korean[cohort[1]!]} 계약 자료 부족`;
  return value.replace(/(\d+) (?:observed|reported) contracts?/, '$1건');
}
