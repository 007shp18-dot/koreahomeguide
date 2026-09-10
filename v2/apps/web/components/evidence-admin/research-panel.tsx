'use client';
import React, { useEffect, useState } from 'react';
import { RESEARCH_TOOL_IDS } from '@/lib/tool-research/contract';
import type { ResearchDashboard } from '@/lib/evidence-pool/research.server';
import styles from './workspace.module.css';
const marketLabels: Record<string, string> = { global: '세 도시 비교', 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이' };
const fields: Record<string, string> = { budget: '예산', area: '면적', askingPrice: '호가', purchasePrice: '매입가', monthlyRent: '월 임대료', annualRent: '연 임대료', acquisitionCosts: '취득비용', annualOperatingCosts: '연 운영비', yield: '수익률', verdict: '가격 판단', housingType: '주택 유형', deposit: '보증금', sample: '근거 건수', comparison: '비교 결과' };
const tools: Record<string, string> = { passport: '세 도시 예산 비교', 'property-scenario': '구매·보유비용', 'single-quote': '호가 점검', 'offer-compare': '매물 비교', 'rent-check': '서울 임대료 점검', 'singapore-check': '싱가포르 가격 점검', 'dubai-check': '두바이 가격 점검' };
const categories: Record<string, string> = { below: '비교 범위보다 낮음', typical: '비교 범위 내', above: '비교 범위보다 높음', sale: '매매', jeonse: '전세', monthly: '월세', apartment: '아파트', villa: '빌라', officetel: '오피스텔', detached: '단독주택', condo: '콘도', hdb: 'HDB', landed: '단독·연립주택', townhouse: '타운하우스', 'other-residential': '기타 주거', district: '구', neighborhood: '동네', building: '건물', ready: '준공', 'off-plan': '미준공', 'private-sale': '민간 매매', 'hdb-resale': 'HDB 재판매', 'hdb-rent': 'HDB 임대', 'market-position': '시장 가격 비교', 'recurring-cost': '정기 비용 비교', tradeoff: '조건별 차이', equal: '동일' };
Object.assign(fields, { seoulArea: '서울 면적', singaporeArea: '싱가포르 면적', dubaiArea: '두바이 면적', seoulSample: '서울 근거 건수', singaporeSample: '싱가포르 근거 건수', dubaiSample: '두바이 근거 건수', sampleA: '매물 A 근거 건수', sampleB: '매물 B 근거 건수', offerAUpfront: '매물 A 초기 비용', offerBUpfront: '매물 B 초기 비용', offerARecurring: '매물 A 정기 비용', offerBRecurring: '매물 B 정기 비용', transaction: '거래 유형', offerATransaction: '매물 A 거래 유형', offerBTransaction: '매물 B 거래 유형', scope: '비교 범위', stage: '준공 단계', dubaiStage: '두바이 준공 단계', segment: '시장 구분' });
export function ResearchPanel() {
  const [filters, setFilters] = useState({ market: '', tool: '' });
  const [data, setData] = useState<ResearchDashboard | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/internal/evidence-pool/?${new URLSearchParams({ view: 'research', ...filters })}`, { cache: 'no-store', signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(r.status === 401 ? '세션이 만료되었습니다. 다시 로그인하세요.' : '공유 현황을 불러오지 못했습니다.'); return r.json(); })
      .then(result => { if (!controller.signal.aborted) { setData(result); setError(''); } })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [filters, reload]);
  return <section aria-label="Tool 공유 데이터">
    <h2>Tool 공유 데이터</h2><p>동의해 공유한 계산 결과만 집계합니다. 전체 이용자 통계나 실제 거래 자료가 아닙니다. 공유 후 최대 90일 보관하며 삭제·만료된 자료는 집계에서 제외합니다.</p>
    <form className={styles.filters} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); setData(null); setError(''); setFilters({ market: String(f.get('market')), tool: String(f.get('tool')) }); }}>
      <label>시장<select name="market"><option value="">전체</option>{Object.entries(marketLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
      <label>도구<select name="tool"><option value="">전체</option>{RESEARCH_TOOL_IDS.map(t => <option key={t} value={t}>{tools[t]}</option>)}</select></label><button>조회</button><button type="button" onClick={() => { setData(null); setError(''); setReload(v => v + 1); }}>새로고침</button>
    </form>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">공유 현황을 불러오는 중…</p> : <>
      <h3>보관 중인 공유 {data.total}건</h3>
      <p>현재 조회: {data.countedAt.slice(0, 16).replace('T', ' ')} UTC · 일일 집계 확인: {data.lastAggregatedAt ? `${data.lastAggregatedAt.slice(0, 16).replace('T', ' ')} UTC` : '아직 실행 기록 없음'}</p>
      <h3>자료 수집 우선순위</h3>
      <p>직접 공유가 많은 시장, 근거 0–4건인 공유가 많은 시장, 보완·갱신이 필요한 자료가 많은 시장 순서입니다. 공유는 이용자 수가 아니며, 비교 도구의 공유는 별도로 표시합니다.</p>
      <div className={styles.tableScroll}><table><caption>현재 동의가 유지된 공유와 자료 검토 현황</caption><thead><tr><th>시장</th><th>직접 공유</th><th>도시 비교 공유</th><th>근거 0–4건 공유</th><th>승인·유효 근거</th><th>보완 필요</th><th>갱신 필요</th><th>중복 후보</th><th>검토 대기</th></tr></thead><tbody>{data.priorities.map(r => <tr key={r.market}><td>{marketLabels[r.market]}</td><td>{r.directShares}건</td><td>{r.comparisonShares}건</td><td>{r.lowEvidenceShares}건</td><td>{r.approvedEvidence}건</td><td>{r.incompleteEvidence}건</td><td>{r.outdatedEvidence}건</td><td>{r.duplicateEvidence}건</td><td>{r.pendingEvidence}건</td></tr>)}</tbody></table></div>
      <p>자료 건수는 검토 자료함 기준이며 전체 거래 DB 건수가 아닙니다. 검토 대기는 다른 분류와 겹칠 수 있습니다. 만료·삭제된 공유는 조회 즉시 제외하며 과거 집계 건수를 별도로 보관하지 않습니다.</p>
      {!data.total ? <p className={styles.empty}>조건에 맞는 공유 데이터가 아직 없습니다. 사용자가 도구에서 공유에 동의하면 이곳에 표시됩니다.</p> : <>
        <div className={styles.tableScroll}><table><caption>도구·시장별 공유 건수</caption><thead><tr><th>시장</th><th>도구</th><th>공유</th></tr></thead><tbody>{data.groups.map(r => <tr key={`${r.market}-${tools[r.tool] ?? r.tool}`}><td>{marketLabels[r.market]}</td><td>{tools[r.tool] ?? r.tool}</td><td>{r.count}건</td></tr>)}</tbody></table></div>
        <h3>가격·면적·계산 결과 분포</h3><p>항목별 건수입니다. 같은 공유가 여러 항목에 포함되므로 항목 간 합계를 이용자 수로 해석하지 마세요.</p>
        <div className={styles.tableScroll}><table><thead><tr><th>시장·도구</th><th>항목</th><th>구간·결과</th><th>공유</th></tr></thead><tbody>{data.distributions.map(r => <tr key={`${r.market}-${tools[r.tool] ?? r.tool}-${r.currency}-${r.kind}-${r.field}-${r.value}`}><td>{marketLabels[r.market]} · {tools[r.tool] ?? r.tool}</td><td>{fields[r.field] ?? r.field}</td><td>{categories[r.label] ?? r.label}</td><td>{r.count}건</td></tr>)}</tbody></table></div>
        <h3>최근 공유 · 최대 25건 · UTC</h3><ul className={styles.history}>{data.recent.map((r, i) => <li key={`${r.createdAt}-${i}`}><strong>{marketLabels[r.market]} · {tools[r.tool] ?? r.tool}</strong><span>{r.createdAt.slice(0, 16).replace('T', ' ')}</span><p>{Object.entries(r.bands).map(([field, label]) => `${fields[field] ?? field}: ${categories[label] ?? label}`).join(' · ')}</p><p>{Object.entries(r.categories).map(([field, label]) => `${fields[field] ?? field}: ${categories[label] ?? label}`).join(' · ')}</p><small>만료: {r.expiresAt.slice(0, 10)}</small></li>)}</ul>
      </>}
      <p className={styles.notice}>활용처: 관심 시장·가격대와 근거 건수가 적은 구간을 확인해 자료 수집 우선순위를 정합니다. 개인 식별값은 표시하지 않습니다.</p>
    </>}
  </section>;
}
