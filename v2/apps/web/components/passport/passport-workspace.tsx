'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { buildPassportModel, normalizePassportAmount, normalizePassportCurrency, passportHref, type PassportMarketEvidence, type PassportModel } from '../../lib/passport/model';
import { PassportBudgetFields } from './passport-budget-fields';
import styles from './passport.module.css';

const COPY = {
  en: { title: 'Your purchasing power across three cities', label: 'Budget in Korean won', action: 'Update comparison', local: 'Local budget', area: 'Indicative area', matches: 'Released markets within budget', evidence: 'Evidence', cost: 'Purchase price only', excluded: 'Taxes, fees, financing, buyer eligibility and live availability are excluded.', share: 'Copy result link', copied: 'Link copied', open: 'Explore market', none: 'No released comparison scope has a median price within this budget.', approx: 'at the observed unit-price midpoint', sample: 'reported transactions', fx: 'Reference FX', back: 'All tools' },
  ko: { title: '세 도시에서의 내 예산 구매력', label: '원화 예산', action: '비교 다시 계산', local: '현지 예산', area: '추정 가능 면적', matches: '예산 이내 공개 지역·프로젝트', evidence: '데이터 근거', cost: '매매가격만 반영', excluded: '세금·수수료·대출·구매 자격·실시간 매물 여부는 제외했습니다.', share: '결과 링크 복사', copied: '링크 복사됨', open: '시장 살펴보기', none: '이 예산 이내에 중위가격이 들어오는 공개 비교 범위가 없습니다.', approx: '공개 단위면적 가격 중간값 기준', sample: '신고 거래', fx: '기준 환율', back: '전체 도구' },
  'zh-CN': { title: '三座城市中的预算购买力', label: '韩元预算', action: '更新比较', local: '当地预算', area: '参考可购面积', matches: '预算内已发布市场', evidence: '数据依据', cost: '仅含购房价格', excluded: '不含税费、融资、买方资格及实时房源可售性。', share: '复制结果链接', copied: '链接已复制', open: '探索市场', none: '此预算内没有中位价匹配的已发布比较范围。', approx: '按已发布单位面积价格中位数', sample: '笔申报成交', fx: '参考汇率', back: '全部工具' },
} as const;

const MONEY = { KRW: 'ko-KR', SGD: 'en-SG', AED: 'en-AE' } as const;
const subscribeToLocation = (notify: () => void) => { globalThis.addEventListener('popstate', notify); return () => globalThis.removeEventListener('popstate', notify); };
const locationSearch = () => globalThis.location.search;
const serverSearch = () => '';

export function PassportWorkspace({ initialModel }: Readonly<{ initialModel: PassportModel }>) {
  const evidence = useMemo(() => initialModel.markets.map((market): PassportMarketEvidence => ({
    id: market.id, city: market.city, currency: market.currency, localBudget: 0,
    medianPsm: market.medianPsm, sample: market.sample, period: market.period,
    yieldPct: market.yieldPct, scopes: market.scopes,
  })), [initialModel.markets]);
  const search = useSyncExternalStore(subscribeToLocation, locationSearch, serverSearch);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const query = new URLSearchParams(submitted ?? search);
  const currency = query.has('budget') ? normalizePassportCurrency(query.get('currency')) : initialModel.budgetCurrency;
  const budget = query.has('budget') ? normalizePassportAmount(query.get('budget') ?? undefined, currency) : initialModel.budgetAmount;
  const model = useMemo(() => buildPassportModel({ budgetWon: budget, budgetAmount: budget, budgetCurrency: currency, locale: initialModel.locale, evidence }), [budget, currency, evidence, initialModel.locale]);
  const [copied, setCopied] = useState(false);
  const copy = COPY[initialModel.locale];
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
        globalThis.history.replaceState(null, '', next.href); setSubmitted(next.href.split('?')[1]!); setCopied(false);
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
          <div className={styles.metricRow} data-passport-row="area"><span>{copy.area}</span><strong>{market.indicativeAreaSqm === null ? '—' : `${market.indicativeAreaSqm} m²`}</strong><small>{copy.approx}</small></div>
          <div className={styles.matchRow}><span>{copy.matches}</span>{market.matches.length === 0 ? <p>{copy.none}</p> : <><strong>{market.matches.length}</strong><ul>{market.matches.slice(0, 3).map((scope) => <li key={scope.href}><Link href={scope.href}>{scope.name}</Link><small>{money.format(scope.medianPrice)}</small></li>)}</ul></>}</div>
          <div className={styles.evidenceRow}><span>{copy.evidence}</span><p>{new Intl.NumberFormat().format(market.sample)} {copy.sample}</p><small>{market.period}</small>{market.yieldPct == null ? null : <small>Ready gross yield median · {market.yieldPct.toFixed(1)}%</small>}</div>
          <div className={styles.scopeRow}><strong>{copy.cost}</strong><small>{copy.excluded}</small></div>
          <Link className={styles.marketAction} href={href}>{copy.open}</Link>
        </article>;
      })}
    </section>

    <footer className={styles.resultFooter}>
      <p>{copy.fx} · {model.fx.asOf} · {model.fx.source}. Reference only; transfer rates differ.</p>
      <button type="button" onClick={async () => {
        if (navigator.share !== undefined) await navigator.share({ title: 'SignedPrice Passport', url: globalThis.location.href });
        else await navigator.clipboard.writeText(globalThis.location.href);
        setCopied(true);
      }}>{copied ? copy.copied : copy.share}</button>
      <Link href={initialModel.locale === 'ko' ? '/ko/tools/' : initialModel.locale === 'zh-CN' ? '/zh-cn/tools/' : '/tools/'}>{copy.back}</Link>
    </footer>
  </main>;
}
