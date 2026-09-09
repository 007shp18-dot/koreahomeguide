import type { Evidence } from './contract';

export const qualityLabels = { qualified: '수집 기준 충족', incomplete: '정보 부족', outdated: '기간 경과', duplicate: '중복 후보' } as const;
export type Quality = keyof typeof qualityLabels;
export function assessEvidence(row: Evidence, today: string) {
  const reasons: string[] = [];
  const property = ['sale_price', 'rent', 'service_charge'].includes(row.metric);
  if (property && !(row.address?.trim() || (row.area.trim() && row.building.trim()))) reasons.push('주소 또는 지역·단지명 필요');
  if (['sale_price', 'rent'].includes(row.metric) && !row.sizeSqm) reasons.push('면적 필요');
  if (['sale_price', 'rent'].includes(row.metric) && !row.housingType?.trim()) reasons.push('주택 유형 필요');
  if (!row.conditions?.trim()) reasons.push('거래·부과·서비스 조건 필요');
  if (row.amount <= 0) reasons.push('양수 금액 필요');
  if (['rent', 'service_charge'].includes(row.metric) && !['monthly', 'annual'].includes(row.unit) && !['monthly', 'annual'].includes(row.billingPeriod ?? '')) reasons.push('월간·연간 부과 기간 필요');
  if (row.metric === 'sale_price' && !['total', 'sqm'].includes(row.unit)) reasons.push('매매 총액 또는 ㎡당 단위 필요');
  const days = row.metric === 'rent' ? 180 : 365;
  const age = (Date.parse(today) - Date.parse(row.observedOn)) / 86400000;
  const outdated = row.expiresOn < today || age > days || age < 0;
  if (outdated) reasons.push(`시점 재확인 필요 · ${days}일 기준`);
  if (row.duplicate) reasons.push('동일 대상·금액·시점 중복 후보');
  const quality: Quality = row.duplicate ? 'duplicate' : outdated ? 'outdated' : reasons.length ? 'incomplete' : 'qualified';
  const use = row.sourceKind === 'community' || row.basis === 'reported' ? '향후 분석 · 정성 참고' : ['sale_price', 'rent'].includes(row.metric) ? '가격 비교' : '구매·보유비용 참고';
  return { quality, reasons, use, approvalReady: quality === 'qualified' && row.sourceStatus === 'approved' };
}
