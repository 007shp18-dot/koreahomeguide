'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { buildPassportModel, normalizePassportAmount, normalizePassportCurrency, passportHref, type PassportMarketEvidence, type PassportModel } from '../../lib/passport/model';
import { PassportBudgetFields } from './passport-budget-fields';
import styles from './passport.module.css';
import { sendToolEvent } from '../tools/tool-analytics';

const COPY = {
  en: { title: 'Your purchasing power across three cities', label: 'Budget in Korean won', action: 'Update comparison', local: 'Local budget', area: 'Indicative area', matches: 'Areas and projects within budget', evidence: 'Evidence', cost: 'Purchase price only', excluded: 'Taxes, fees, financing, buyer eligibility and live availability are excluded.', share: 'Copy result link', copied: 'Link copied', open: 'Explore market', none: 'None of the areas or projects covered has a median price within this budget. Individual transactions may still fall below it.', approx: 'at the observed unit-price midpoint', sample: 'reported transactions', fx: 'Reference FX', back: 'All tools' },
  ko: { title: '세 도시에서의 내 예산 구매력', label: '원화 예산', action: '비교 다시 계산', local: '현지 예산', area: '추정 가능 면적', matches: '예산에 맞는 지역·프로젝트', evidence: '비교에 쓴 거래 자료', cost: '매매가격만 반영', excluded: '세금·수수료·대출·구매 자격·실시간 매물 여부는 제외했습니다.', share: '결과 링크 복사', copied: '링크 복사됨', open: '시장 살펴보기', none: '현재 자료에서는 중위가격이 예산 이하인 지역·프로젝트가 없어요. 개별 거래 중에는 예산에 맞는 사례가 있을 수 있어요.', approx: '㎡당 거래가격 중간값 기준', sample: '신고 거래', fx: '기준 환율', back: '전체 도구' },
  'zh-CN': { title: '三座城市中的预算购买力', label: '韩元预算', action: '更新比较', local: '当地预算', area: '参考可购面积', matches: '预算内的地区与项目', evidence: '数据依据', cost: '仅含购房价格', excluded: '不含税费、融资、买方资格及实时房源可售性。', share: '复制结果链接', copied: '链接已复制', open: '探索市场', none: '现有资料中，没有成交中位价低于此预算的地区或项目，个别成交仍可能符合预算。', approx: '按已发布单位面积价格中位数', sample: '笔申报成交', fx: '参考汇率', back: '全部工具' },
} as const;

const DETAIL = {
  en: { unavailable: 'Comparable price data is not available yet.', copyFailed: 'The link could not be copied. Copy the address from your browser to share this result.', fx: 'Reference only; transfer rates differ.', yield: 'Median estimated gross yield for Ready areas', basis: { transactions: 'Median of available apartment transaction unit prices', projects: 'Median of published project unit-price medians', areas: 'Median of Ready apartment area unit-price medians' } },
  ko: { unavailable: '아직 비교 가능한 가격 자료가 없습니다.', copyFailed: '링크를 복사하지 못했어요. 브라우저 주소를 복사하면 이 결과를 공유할 수 있어요.', fx: '참고용 환율이며 실제 송금 환율과 다릅니다.', yield: 'Ready 지역별 추정 총수익률의 중간값', basis: { transactions: '확보한 아파트 거래의 ㎡당 가격 중간값', projects: '공개된 프로젝트별 ㎡당 중위가격의 중간값', areas: 'Ready 아파트 지역별 ㎡당 중위가격의 중간값' } },
  'zh-CN': { unavailable: '暂时没有可比较的价格数据。', copyFailed: '无法复制链接。请复制浏览器地址以分享此结果。', fx: '仅供参考，实际汇款汇率可能不同。', yield: 'Ready 地区估算毛收益率的中位数', basis: { transactions: '现有公寓成交单位面积价格的中位数', projects: '已发布项目单位面积价格中位数的中位数', areas: 'Ready 公寓地区单位面积价格中位数的中位数' } },
} as const;

const MONEY = { KRW: 'ko-KR', SGD: 'en-SG', AED: 'en-AE' } as const;
const subscribeToLocation = (notify: () => void) => {
  globalThis.addEventListener('popstate', notify);
  globalThis.addEventListener('passport:budget-updated', notify);
  return () => { globalThis.removeEventListener('popstate', notify); globalThis.removeEventListener('passport:budget-updated', notify); };
};
const locationSearch = () => globalThis.location.search;
const serverSearch = () => '';

export function PassportWorkspace({ initialModel }: Readonly<{ initialModel: PassportModel }>) {
  const evidence = useMemo(() => initialModel.markets.map((market): PassportMarketEvidence => ({
    id: market.id, city: market.city, currency: market.currency, localBudget: 0,
    medianPsm: market.medianPsm, sample: market.sample, period: market.period,
    yieldPct: market.yieldPct, scopes: market.scopes, priceBasis: market.priceBasis, priceSample: market.priceSample,
  })), [initialModel.markets]);
  const search = useSyncExternalStore(subscribeToLocation, locationSearch, serverSearch);
  const query = new URLSearchParams(search);
  const currency = query.has('budget') ? normalizePassportCurrency(query.get('currency')) : initialModel.budgetCurrency;
  const budget = query.has('budget') ? normalizePassportAmount(query.get('budget') ?? undefined, currency) : initialModel.budgetAmount;
  const model = useMemo(() => buildPassportModel({ budgetWon: budget, budgetAmount: budget, budgetCurrency: currency, locale: initialModel.locale, evidence }), [budget, currency, evidence, initialModel.locale]);
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = COPY[initialModel.locale];
  const detail = DETAIL[initialModel.locale];
  const action = passportHref(initialModel.locale, initialModel.budgetWon).split('?')[0]!;

  return <main className={styles.workspace}>
    <header className={styles.resultHeader}>
      <p className={styles.eyebrow}>SignedPrice Passport</p>
      <h1>{copy.title}</h1>
      <form action={action} className={styles.resultForm} onSubmit={(event) => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        const budgetCurrency = normalizePassportCurrency(data.get('currency'));
        const budgetAmount = normalizePassportAmount(String(data.get('budget') ?? ''), budgetCurrency);
        const next = buildPassportModel({ budgetWon: budgetAmount, budgetAmount, budgetCurrency, locale: initialModel.locale, evidence });
        globalThis.history.replaceState(null, '', next.href); globalThis.dispatchEvent(new Event('passport:budget-updated')); setCopyState('idle');
        sendToolEvent('tool_complete', { tool: 'passport', market: 'global', surface: 'standalone-tool' });
      }}>
        <PassportBudgetFields key={`${budget}-${currency}`} amount={budget} currency={currency} locale={initialModel.locale} id="passport-result-budget" />
        <button type="submit">{copy.action}</button>
      </form>
    </header>

    <section className={styles.cardGrid} aria-label={copy.title}>
      {model.markets.map((market) => {
        const money = new Intl.NumberFormat(MONEY[market.currency], { style: 'currency', currency: market.currency, currencyDisplay: 'code', maximumFractionDigits: 0 });
        const href = market.id === 'kr-seoul' ? '/kr/seoul/explore/' : market.id === 'sg-singapore' ? '/sg/singapore/explore/' : '/ae/dubai/explore/';
        return <article className={styles.marketCard} data-passport-market={market.id} key={market.id}>
          <div className={styles.cardTitle}><span>{market.currency}</span><h2>{market.city}</h2></div>
          <div className={styles.metricRow} data-passport-row="local-budget"><span>{copy.local}</span><strong>{money.format(market.localBudget)}</strong></div>
          <div className={styles.metricRow} data-passport-row="area"><span>{copy.area}</span><strong>{market.indicativeAreaSqm === null ? '—' : `${market.indicativeAreaSqm} m²`}</strong><small>{market.indicativeAreaSqm === null ? detail.unavailable : <>{detail.basis[market.priceBasis ?? 'transactions']}{market.priceSample == null ? '' : ` · ${market.priceSample.toLocaleString(initialModel.locale)}`}</>}</small></div>
          <div className={styles.matchRow}><span>{copy.matches}</span>{market.matches.length === 0 ? <p>{market.scopes.length === 0 ? detail.unavailable : copy.none}</p> : <><strong>{market.matches.length}</strong><ul>{market.matches.slice(0, 3).map((scope) => <li key={scope.href}><Link href={scope.href}>{scope.name}</Link><small>{money.format(scope.medianPrice)}</small></li>)}</ul></>}</div>
          <div className={styles.evidenceRow}><span>{copy.evidence}</span><p>{new Intl.NumberFormat().format(market.sample)} {copy.sample}</p><small>{market.period === 'Unavailable' ? detail.unavailable : market.period}</small>{market.yieldPct == null ? null : <small>{detail.yield} · {market.yieldPct.toFixed(1)}%</small>}</div>
          <div className={styles.scopeRow}><strong>{copy.cost}</strong><small>{copy.excluded}</small></div>
          <Link className={styles.marketAction} href={href}>{copy.open}</Link>
        </article>;
      })}
    </section>

    <footer className={styles.resultFooter}>
      <p>{copy.fx} · {model.fx.asOf} · {model.fx.source}. {detail.fx}</p>
      <button type="button" onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(model.href, globalThis.location.origin).href);
          setCopiedHref(model.href); setCopyState('copied');
          sendToolEvent('result_link_copy', { tool: 'passport', market: 'global', surface: 'standalone-tool' });
        } catch { setCopyState('failed'); }
      }}>{copyState === 'copied' && copiedHref === model.href ? copy.copied : copy.share}</button>
      {copyState === 'failed' ? <p role="status">{detail.copyFailed}</p> : null}
      <Link href={initialModel.locale === 'ko' ? '/ko/tools/' : initialModel.locale === 'zh-CN' ? '/zh-cn/tools/' : '/tools/'}>{copy.back}</Link>
    </footer>
  </main>;
}
