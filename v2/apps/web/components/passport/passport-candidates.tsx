'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PassportLocale, PassportMarketResult } from '../../lib/passport/model';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import styles from './passport.module.css';

const COPY = {
  en: { heading: 'Candidates by reported median', note: 'Medians at or below your purchase-price budget. These are research candidates; current listings and buyer eligibility have not been checked.', median: 'Reported sale median', sales: 'sales', details: 'View evidence', calculate: 'Calculate costs', previous: 'Previous', next: 'Next', page: 'Candidate pages', none: 'No published median within this budget. Individual sales may still fall below it.', missing: 'Comparable candidate data is not available yet.', kind: { building: 'Apartment building · all sizes', project: 'Project · mixed sizes and sale types', 'ready-area': 'Ready apartment area · all sizes' } },
  ko: { heading: '매매 중위가격 기준 후보', note: '매매 중위가격이 매입 예산 이하인 검토 후보입니다. 현재 매물과 구매 자격을 확인한 목록은 아닙니다.', median: '매매 중위가격', sales: '건', details: '상세 근거 보기', calculate: '비용 계산', previous: '이전', next: '다음', page: '후보 페이지', none: '공개된 중위가격이 예산 이하인 후보가 없습니다. 개별 거래 중에는 예산 이하인 사례가 있을 수 있습니다.', missing: '아직 비교 가능한 후보 자료가 없습니다.', kind: { building: '아파트 단지 · 전체 면적', project: '프로젝트 · 면적·거래 유형 혼합', 'ready-area': 'Ready 아파트 지역 · 전체 면적' } },
  'zh-CN': { heading: '按成交中位价筛选的候选', note: '成交中位价不高于购房预算的研究候选。尚未核实现有房源或买方资格。', median: '成交中位价', sales: '笔成交', details: '查看依据 · English', calculate: '计算成本 · English', previous: '上一页', next: '下一页', page: '候选分页', none: '没有已发布中位价低于此预算的候选，个别成交仍可能符合预算。', missing: '暂时没有可比较的候选数据。', kind: { building: '公寓楼 · 全部面积', project: '项目 · 面积与交易类型混合', 'ready-area': 'Ready 公寓地区 · 全部面积' } },
} as const;

const PAGE_SIZE = 3;

export function PassportCandidates({ market, locale, passportHref }: Readonly<{
  market: PassportMarketResult; locale: PassportLocale; passportHref: string;
}>) {
  const [page, setPage] = useState(1);
  const copy = COPY[locale];
  const pages = Math.max(1, Math.ceil(market.matches.length / PAGE_SIZE));
  const activePage = Math.min(page, pages);
  const money = new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : 'en', { style: 'currency', currency: market.currency, currencyDisplay: 'code', maximumFractionDigits: 0 });
  return <section className={styles.matchRow} aria-label={`${market.city} · ${copy.heading}`}>
    <span>{copy.heading}</span>
    <strong>{market.matches.length.toLocaleString(locale)}</strong>
    <p>{copy.note}</p>
    {market.matches.length === 0 ? <p>{market.scopes.length === 0 ? copy.missing : copy.none}</p> : <>
      <ul className={styles.candidateList}>{market.matches.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE).map(scope => {
        const href = locale === 'ko' && market.id === 'kr-seoul' ? `/ko${scope.href}` : scope.href;
        const scenario = createPropertyScenarioHref({locale:locale === 'ko' ? 'ko' : 'en',market:market.id,currency:market.currency,
          propertyName:scope.name,transaction:'sale',price:scope.medianPrice,returnTo:href,passportHref});
        return <li key={scope.href} data-passport-candidate={scope.kind ?? 'area'}>
          {scope.kind ? <small>{copy.kind[scope.kind]}</small> : null}
          <h3><Link href={href} prefetch={false}>{scope.name}</Link></h3>
          {scope.locationLabel ? <small>{scope.locationLabel}</small> : null}
          <div className={styles.candidatePrice}><span>{copy.median}</span><strong>{money.format(scope.medianPrice)}</strong></div>
          {scope.sample === undefined ? null : <small>{scope.sample.toLocaleString(locale)} {copy.sales} · {market.period}</small>}
          <div className={styles.candidateActions}><Link href={href} prefetch={false}>{copy.details}{locale === 'ko' && market.id !== 'kr-seoul' ? ' · English' : ''}</Link><Link href={scenario} prefetch={false}>{copy.calculate}</Link></div>
        </li>;
      })}</ul>
      {pages > 1 ? <nav className={styles.candidatePagination} aria-label={`${market.city} · ${copy.page}`}>
        <button type="button" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>{copy.previous}</button>
        <span aria-live="polite">{activePage} / {pages}</span>
        <button type="button" disabled={activePage === pages} onClick={() => setPage(activePage + 1)}>{copy.next}</button>
      </nav> : null}
    </>}
  </section>;
}
