'use client';
import { marketHref } from '../../lib/locale/market-localization';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { buildPassportModel, normalizePassportAmount, normalizePassportCurrency, passportHref, type PassportMarketEvidence, type PassportModel } from '../../lib/passport/model';
import { PassportCandidates } from './passport-candidates';
import { PassportBudgetFields } from './passport-budget-fields';
import styles from './passport.module.css';
import { passportCandidateHref } from '../../lib/passport/journey';
import { sendToolEvent } from '../tools/tool-analytics';
import { ToolResearchShare } from '../tools/tool-research-share';
import { createPassportResearchSnapshot } from '../../lib/tool-research/client';

const COPY = {
  en: { title: 'Your purchasing power across three cities', label: 'Budget in Korean won', action: 'Update comparison', local: 'Local budget', area: 'Indicative area', matches: 'Areas and projects within budget', evidence: 'Evidence', cost: 'Purchase price only', excluded: 'Taxes, fees, financing, buyer eligibility and live availability are excluded.', share: 'Copy result link', copied: 'Link copied', open: 'Explore market', none: 'None of the areas or projects covered has a median price within this budget. Individual transactions may still fall below it.', approx: 'at the observed unit-price midpoint', sample: 'reported transactions', fx: 'Reference FX', back: 'All tools' },
  ko: { title: '같은 예산, 세 도시의 집값', label: '원화 예산', action: '다시 비교하기', local: '현지 통화로 환산한 예산', area: '예산으로 환산한 면적', matches: '예산 안에서 살펴볼 지역·단지', evidence: '비교에 쓴 거래 자료', cost: '매매가격만 반영', excluded: '세금·수수료·대출·구매 자격·실시간 매물 여부는 제외했습니다.', share: '결과 링크 복사', copied: '링크 복사됨', open: '실거래가 보기', none: '현재 자료에는 중앙값이 예산 이하인 지역·단지가 없습니다. 개별 거래 중에는 예산에 맞는 사례가 있을 수 있습니다.', approx: '㎡당 거래가격 중간값 기준', sample: '신고 거래', fx: '기준 환율', back: '전체 도구' },
  'zh-CN': { title: '三座城市中的预算购买力', label: '韩元预算', action: '更新比较', local: '当地预算', area: '参考可购面积', matches: '预算内的地区与项目', evidence: '数据依据', cost: '仅含购房价格', excluded: '不含税费、融资、买方资格及实时房源可售性。', share: '复制结果链接', copied: '链接已复制', open: '探索市场', none: '现有资料中，没有成交中位价低于此预算的地区或项目，个别成交仍可能符合预算。', approx: '按已发布单位面积价格中位数', sample: '笔申报成交', fx: '参考汇率', back: '全部工具' },
} as const;

const DETAIL = {
  en: { comparison: 'Compare the local evidence: dates and aggregation differ by city. The area estimates are starting points, not equivalent homes.', unavailable: 'Comparable price data is not available yet.', copyFailed: 'The link could not be copied. Copy the address from your browser to share this result.', fx: 'Reference only; transfer rates differ.', yield: 'Median estimated gross yield for Ready areas', basis: { transactions: 'Median of available apartment transaction unit prices', projects: 'Median of published project unit-price medians', areas: 'Median of Ready apartment area unit-price medians' } },
  ko: { comparison: '도시마다 거래 기간과 집계 단위가 다릅니다. 환산 면적은 참고용이며, 같은 조건의 집을 비교한 결과는 아닙니다.', unavailable: '아직 비교 가능한 가격 자료가 없습니다.', copyFailed: '링크를 복사하지 못했어요. 브라우저 주소를 복사하면 이 결과를 공유할 수 있어요.', fx: '참고용 환율이며 실제 송금 환율과 다릅니다.', yield: '완공 주택 지역별 임대수익률 중간값 · 비용 차감 전', basis: { transactions: '확보한 아파트 거래의 ㎡당 가격 중간값', projects: '단지별 ㎡당 중앙값을 모아 구한 중간값', areas: '완공 아파트의 지역별 ㎡당 중앙값을 모아 구한 중간값' } },
  'zh-CN': { comparison: '各城市的数据期间与汇总单位不同。面积估算仅供初步筛选，不代表同等条件的住房。', unavailable: '暂时没有可比较的价格数据。', copyFailed: '无法复制链接。请复制浏览器地址以分享此结果。', fx: '仅供参考，实际汇款汇率可能不同。', yield: 'Ready 地区估算毛收益率的中位数', basis: { transactions: '现有公寓成交单位面积价格的中位数', projects: '已发布项目单位面积价格中位数的中位数', areas: 'Ready 公寓地区单位面积价格中位数的中位数' } },
} as const;

const MONEY = { KRW: 'ko-KR', SGD: 'en-SG', AED: 'en-AE' } as const;
const FX_COPY = {
  en: { reference: 'Daily reference rates.', stale: 'Latest rates could not be confirmed. Using the last available reference.', fallback: 'Latest rates unavailable. Using the saved reference.', checked: 'Provider checked' },
  ko: { reference: '일별 참고 환율입니다.', stale: '최신 환율을 확인하지 못해 마지막으로 확보한 참고 환율을 사용합니다.', fallback: '최신 환율을 불러오지 못해 저장된 참고 환율을 사용합니다.', checked: '공급자 확인' },
  'zh-CN': { reference: '每日参考汇率。', stale: '尚未确认最新汇率，使用最近一次可用的参考汇率。', fallback: '最新汇率暂不可用，使用已保存的参考汇率。', checked: '已核对来源' },
} as const;
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
    yieldPct: market.yieldPct, scopes: market.scopes, priceBasis: market.priceBasis, priceSample: market.priceSample, offPlan: market.offPlan,
  })), [initialModel.markets]);
  const search = useSyncExternalStore(subscribeToLocation, locationSearch, serverSearch);
  const query = new URLSearchParams(search);
  const currency = query.has('budget') ? normalizePassportCurrency(query.get('currency')) : initialModel.budgetCurrency;
  const budget = query.has('budget') ? normalizePassportAmount(query.get('budget') ?? undefined, currency, initialModel.fx) : initialModel.budgetAmount;
  const dubaiStage = query.get('dubaiStage') === 'off-plan' ? 'off-plan' : 'ready';
  const model = useMemo(() => buildPassportModel({ budgetWon: budget, budgetAmount: budget, budgetCurrency: currency, dubaiStage, locale: initialModel.locale, evidence, fx: initialModel.fx }), [budget, currency, dubaiStage, evidence, initialModel.locale, initialModel.fx]);
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = COPY[initialModel.locale];
  const detail = DETAIL[initialModel.locale];
  const fxCopy = FX_COPY[initialModel.locale];
  const action = passportHref(initialModel.locale, initialModel.budgetWon).split('?')[0]!;
  const researchSnapshot = createPassportResearchSnapshot({
    budgetAmount: model.budgetAmount,
    budgetCurrency: model.budgetCurrency,
    dubaiStage: model.dubaiStage,
    markets: model.markets.map(({ id, indicativeAreaSqm, sample }) => ({ id, indicativeAreaSqm, sample })),
  });

  return <main className={styles.workspace}>
    <header className={styles.resultHeader}>
      <p className={styles.eyebrow}>SignedPrice Passport</p>
      <h1>{copy.title}</h1>
      <form action={action} className={styles.resultForm} onSubmit={(event) => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        const budgetCurrency = normalizePassportCurrency(data.get('currency'));
        const budgetAmount = normalizePassportAmount(String(data.get('budget') ?? ''), budgetCurrency, initialModel.fx);
        const next = buildPassportModel({ budgetWon: budgetAmount, budgetAmount, budgetCurrency, dubaiStage, locale: initialModel.locale, evidence, fx: initialModel.fx });
        globalThis.history.replaceState(null, '', next.href); globalThis.dispatchEvent(new Event('passport:budget-updated')); setCopyState('idle');
        sendToolEvent('tool_complete', { tool: 'passport', market: 'global', surface: 'standalone-tool' });
      }}>
        <PassportBudgetFields key={`${budget}-${currency}`} amount={budget} currency={currency} locale={initialModel.locale} id="passport-result-budget" fx={initialModel.fx} />
        <button type="submit">{copy.action}</button>
      </form>
    </header>

    <label className={styles.stageSelect}>{initialModel.locale === 'ko' ? '두바이 거래 유형' : 'Dubai sale stage'}<select value={dubaiStage} onChange={event => {
      const stage = event.target.value === 'off-plan' ? 'off-plan' : 'ready';
      globalThis.history.replaceState(null, '', passportHref(initialModel.locale, budget, currency, stage));
      globalThis.dispatchEvent(new Event('passport:budget-updated'));
    }}><option value="ready">Ready{initialModel.locale === 'ko' ? ' · 완공' : ''}</option><option value="off-plan">Off-Plan{initialModel.locale === 'ko' ? ' · 분양·건설 중' : ''}</option></select></label>
    <p className={styles.comparisonNote}>{detail.comparison}</p>
    <section className={styles.cardGrid} aria-label={copy.title}>
      {model.markets.map((market) => {
        const money = new Intl.NumberFormat(MONEY[market.currency], { style: 'currency', currency: market.currency, currencyDisplay: 'code', maximumFractionDigits: 0 });
        const href = marketHref(initialModel.locale === 'ko' ? 'ko' : 'en', market.id === 'kr-seoul' ? '/kr/seoul/explore/?transaction=sale&propertyType=apartment' : market.id === 'sg-singapore' ? '/sg/singapore/explore/' : `/ae/dubai/explore/?housing=apartment&stage=${dubaiStage}&budgetMax=${Math.floor(market.localBudget)}`);
        return <article className={styles.marketCard} data-passport-market={market.id} key={market.id}>
          <div className={styles.cardTitle}><span>{market.currency}</span><h2>{market.city}</h2></div>
          <div className={styles.metricRow} data-passport-row="local-budget"><span>{copy.local}</span><strong>{money.format(market.localBudget)}</strong></div>
          <div className={styles.metricRow} data-passport-row="area"><span>{copy.area}</span><strong>{market.indicativeAreaSqm === null ? '—' : `${market.indicativeAreaSqm} m²`}</strong><small>{market.indicativeAreaSqm === null ? detail.unavailable : <>{(market.id === 'ae-dubai' && dubaiStage === 'off-plan' ? (initialModel.locale === 'ko' ? '분양·건설 중 아파트의 지역별 ㎡당 가격 중간값' : 'Median of Off-Plan apartment area unit-price medians') : detail.basis[market.priceBasis ?? 'transactions'])}{market.priceSample == null ? '' : ` · ${market.priceSample.toLocaleString(initialModel.locale)}`}</>}</small><small>{market.period === 'Unavailable' ? detail.unavailable : market.period}</small></div>
          <PassportCandidates key={`${market.id}-${model.href}`} market={market} locale={initialModel.locale} passportHref={model.href} />
          <div className={styles.evidenceRow}><span>{copy.evidence}</span><p>{new Intl.NumberFormat().format(market.sample)} {copy.sample}</p><small>{market.period === 'Unavailable' ? detail.unavailable : market.period}</small>{market.yieldPct == null ? null : <small>{detail.yield} · {market.yieldPct.toFixed(1)}%</small>}</div>
          <div className={styles.scopeRow}><strong>{copy.cost}</strong><small>{copy.excluded}</small></div>
          <Link className={styles.marketAction} href={passportCandidateHref(href, model.href)}>{copy.open}</Link>
        </article>;
      })}
    </section>

    <ToolResearchShare locale={initialModel.locale} resultRevision={JSON.stringify(model)} snapshot={researchSnapshot} />

    <footer className={styles.resultFooter}>
      <p data-fx-availability={model.fx.availability}>{copy.fx} · <time dateTime={model.fx.asOf}>{model.fx.asOf}</time> · {model.fx.source}. {detail.fx} {fxCopy[model.fx.availability]}</p>
      {model.fx.checkedAt === null ? null : <p data-fx-checked-at={model.fx.checkedAt}>{fxCopy.checked} · <time dateTime={model.fx.checkedAt}>{model.fx.checkedAt.slice(0, 16).replace('T', ' ')} UTC</time></p>}
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
