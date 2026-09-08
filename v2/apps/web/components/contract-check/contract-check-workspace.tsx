'use client';
import { ResultLinkCopy } from './result-link-copy';
import { BuildingSelection } from './building-selection';
import { AmountInput } from '../amount-input';

import type {
  CheckTransaction,
  CompletedMonthWindow,
  ContractOfferComparison,
  SingleQuoteCheckResult,
} from '@signedprice/market-core';
import Link from 'next/link';
import { useState } from 'react';

import type {
  ContractCheckOfferSelection,
  ContractCheckReadyRouteModel,
  ContractCheckRouteModel,
} from '../../lib/contract-check/route-model.server';
import type { ProductLocale } from '../../lib/locale/product-copy';
import type { EntityCheckContext } from '../../lib/navigation/explorer-selection';
import type { SiteHeaderModel } from '../../lib/site-copy';
import { SiteHeader } from '../site-header';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

export const CHECK_COPY = Object.freeze({
  en: Object.freeze({
    nav: 'Check', mode: 'Check mode', single: 'Compare an asking price', compare: 'Compare two offers',
    conditions: 'Property details', district: 'District', housing: 'Property type',
    area: 'Exclusive area', building: 'Building', buildingHint: 'Optional. Select a building from Explore.',
    offer: 'Offer', transaction: 'Transaction type', sale: 'Sale', jeonse: 'Jeonse', monthly: 'Rent',
    price: 'Asking sale price', deposit: 'Asking deposit', rent: 'Asking monthly rent', submitCompare: 'Compare offers',
    result: 'Result', blank: 'Enter both offers, then compare them with compatible reported evidence.',
    unavailable: 'This comparison is unavailable', tradeoff: 'Trade-off — no winner declared',
    lower: 'has the lower evidence-adjusted position.', equal: 'The offers are equal at public precision.',
    equivalent: 'has the lower verified monthly equivalent.', keyFigures: 'Key figures',
    upfront: 'Upfront cash', recurring: 'Recurring cash flow', marketPosition: 'Compared with similar transactions',
    notModeled: 'Not modeled', notApplicable: 'Not applicable',
    percentile: 'Price percentile', evidence: 'Market evidence', disclosure: 'Method and sources',
    sample: 'reported contracts', median: 'Reported median', middle: 'Middle 50%', period: 'Reporting period',
    window: 'Reporting period', salePeriod: 'Sale reporting period', rentPeriod: 'Rental reporting period', conversionPeriod: 'Conversion period',
    reference: 'Market reference only. No loan rate, tax, holding period, appreciation or future value is assumed.',
    explore: 'Find a building in Explore',
    guide: 'Read the contract guides',
  }),
  ko: Object.freeze({
    nav: '가격 비교', mode: '비교 방식', single: '매물 가격 비교', compare: '두 조건 비교',
    conditions: '매물 정보', district: '자치구', housing: '주택 유형', area: '전용면적',
    building: '단지', buildingHint: '선택 사항입니다. 실거래가 탐색에서 단지를 선택하세요.',
    offer: '조건', transaction: '거래 유형', sale: '매매', jeonse: '전세', monthly: '월세',
    price: '매매가격', deposit: '보증금', rent: '월세', submitCompare: '두 조건 비교',
    result: '결과', blank: '두 집의 조건을 입력해 비슷한 실거래가와 비교하세요.',
    unavailable: '이 비교를 제공할 수 없습니다', tradeoff: '조건이 달라 어느 쪽이 유리한지 단정하기 어렵습니다',
    lower: '의 가격이 비슷한 거래에서 더 낮은 편입니다.', equal: '표시되는 가격 수준에서는 두 조건이 같습니다.',
    equivalent: '의 월 환산 비용이 더 낮습니다.', keyFigures: '핵심 수치',
    upfront: '초기 현금', recurring: '매달 내는 금액', marketPosition: '비슷한 거래와 비교',
    notModeled: '계산에 미반영', notApplicable: '해당 없음',
    percentile: '가격 백분위', evidence: '비교에 사용한 거래', disclosure: '계산 방법·출처',
    sample: '건의 신고 계약', median: '거래가격 중앙값', middle: '중간 50%', period: '집계 기간',
    window: '집계 기간', salePeriod: '매매 집계 기간', rentPeriod: '임대차 집계 기간', conversionPeriod: '전환율 기간',
    reference: '시장 참고자료입니다. 대출금리·세금·보유기간·상승률·미래가치를 가정하지 않습니다.',
    explore: '실거래가에서 단지 찾기',
    guide: '계약 가이드 읽기',
  }),
} as const);

type CheckCopy = typeof CHECK_COPY[ProductLocale];

export function completedMonthWindowLabel(
  window: CompletedMonthWindow,
  locale: ProductLocale = 'en',
): string {
  const count = locale === 'ko'
    ? `${window.completedMonthCount}개월 집계`
    : `${window.completedMonthCount} completed months`;
  return `${count} · ${window.startMonth}–${window.endMonth}`;
}

export function localizedCheckHref(locale: ProductLocale, suffix = ''): string {
  return `${locale === 'ko' ? '/ko' : ''}/kr/seoul/check${suffix}`;
}

export function checkHeader(locale: ProductLocale): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: locale === 'ko' ? 'signedprice 홈' : 'SignedPrice home',
    navigationLabel: locale === 'ko' ? '서울 서비스 메뉴' : 'Seoul product navigation',
    marketLabel: 'Seoul', languageLabel: locale === 'ko' ? 'KO' : 'EN',
    links: [{ label: CHECK_COPY[locale].nav, href: localizedCheckHref(locale, '/'), isCurrent: true }],
    languageSwitch: locale === 'ko'
      ? { label: 'EN', href: '/kr/seoul/check/', hrefLang: 'en' }
      : { label: 'KO', href: '/ko/kr/seoul/check/', hrefLang: 'ko' },
  };
}

export function TransactionSelect({
  name,
  value,
  availability,
  onChange,
  locale,
}: Readonly<{
  name: string;
  value: CheckTransaction;
  availability: Readonly<{ sale: boolean; jeonse: boolean; monthly: boolean }>;
  onChange: (transaction: CheckTransaction) => void;
  locale: ProductLocale;
}>) {
  const c = CHECK_COPY[locale];
  return (
    <label className={styles.field}>
      <span>{c.transaction}</span>
      <select
        name={name}
        onChange={(event) => onChange(event.currentTarget.value as CheckTransaction)}
        value={value}
      >
        <option disabled={!availability.sale} value="sale">{c.sale}</option>
        <option disabled={!availability.jeonse} value="jeonse">{c.jeonse}</option>
        <option disabled={!availability.monthly} value="monthly">{c.monthly}</option>
      </select>
    </label>
  );
}

export function MoneyField({
  name,
  label,
  value,
  onChange,
}: Readonly<{
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <label className={styles.field}>
      <span>{label} <small>KRW</small></span>
      <AmountInput
        autoComplete="off"
        name={name}
        onValueChange={onChange}
        min={0}
        step={1}
        value={value}
      />
    </label>
  );
}

export function DistributionBar({ check }: Readonly<{
  check: Extract<SingleQuoteCheckResult, { status: 'ready' }>;
}>) {
  const ticks = [
    ['Min', check.distribution.minWon],
    ['P25', check.distribution.p25Won],
    ['Median', check.distribution.medianWon],
    ['P75', check.distribution.p75Won],
    ['Max', check.distribution.maxWon],
  ] as const;
  return (
    <figure className={styles.distribution} data-responsive-ticks="5-desktop-3-mobile">
      <div aria-hidden="true" className={styles.distributionTrack}>
        <span style={{ width: `${check.pricePercentile}%` }} />
      </div>
      <figcaption className={styles.distributionLabels}>
        {ticks.map(([label, value]) => (
          <span className={styles.distributionLabel} key={label}>
            <small>{label}</small>{won.format(value)}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function filedRows(check: Extract<SingleQuoteCheckResult, { status: 'ready' }>, c: CheckCopy) {
  if (check.input.transaction === 'sale') return [[c.price, check.quote.salePriceWon!]] as const;
  if (check.input.transaction === 'jeonse') return [[c.deposit, check.quote.depositWon!]] as const;
  return [[c.deposit, check.quote.depositWon!], [c.rent, check.quote.monthlyRentWon!]] as const;
}

export function EvidencePositionCard({
  check,
  title,
  locale,
  order,
}: Readonly<{
  check: Extract<SingleQuoteCheckResult, { status: 'ready' }>;
  title: string;
  locale: ProductLocale;
  order: 'offer-a' | 'offer-b' | 'single-offer';
}>) {
  const c = CHECK_COPY[locale];
  return (
    <article className={styles.positionCard} data-result-order={order}>
      <header><p>{title}</p><strong>{c[check.input.transaction]}</strong></header>
      <dl className={styles.filedValues}>
        {filedRows(check, c).map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{won.format(value)}</dd></div>
        ))}
      </dl>
      <p className={styles.marketVerdict}>{c.marketPosition}: {locale === 'ko' ? {below:'중간 50%보다 낮음',typical:'중간 50% 안',above:'중간 50%보다 높음'}[check.verdict] : check.verdict}</p>
      <p>{locale === 'ko' ? (check.difference.pct === 0 ? '중앙값과 같음' : `중앙값보다 ${Math.abs(check.difference.pct)}% ${check.difference.pct < 0 ? '낮음' : '높음'}`) : check.difference.pct === 0 ? 'At median' : `${Math.abs(check.difference.pct)}% ${check.difference.pct < 0 ? 'below' : 'above'} median`}</p>
      <p>{c.percentile}: {check.pricePercentile}</p>
      <DistributionBar check={check} />
      <p className={styles.fallback}>{check.fallbackDisclosure}</p>
    </article>
  );
}

type OfferDraft = Readonly<{
  transaction: CheckTransaction;
  salePriceWon: string;
  depositWon: string;
  monthlyRentWon: string;
}>;

function draft(selection: ContractCheckOfferSelection): OfferDraft {
  return {
    transaction: selection.transaction,
    salePriceWon: selection.salePriceWon?.toString() ?? '',
    depositWon: selection.depositWon?.toString() ?? '',
    monthlyRentWon: selection.monthlyRentWon?.toString() ?? '',
  };
}

function OfferPanel({
  id,
  value,
  availability,
  locale,
  onChange,
}: Readonly<{
  id: 'a' | 'b';
  value: OfferDraft;
  availability: ContractCheckReadyRouteModel['availability'];
  locale: ProductLocale;
  onChange: (value: OfferDraft) => void;
}>) {
  const c = CHECK_COPY[locale];
  const edit = (field: keyof OfferDraft, next: string) => onChange({ ...value, [field]: next });
  return (
    <fieldset className={styles.offerPanel} data-offer={id}>
      <legend><span>{id === 'a' ? '02' : '03'}</span>{c.offer} {id.toUpperCase()}</legend>
      <TransactionSelect
        availability={availability}
        locale={locale}
        name={`${id}-transaction`}
        onChange={(transaction) => onChange({
          transaction, salePriceWon: '', depositWon: '', monthlyRentWon: '',
        })}
        value={value.transaction}
      />
      {value.transaction === 'sale' ? (
        <MoneyField name={`${id}-price`} label={c.price} value={value.salePriceWon} onChange={(next) => edit('salePriceWon', next)} />
      ) : (
        <MoneyField name={`${id}-deposit`} label={c.deposit} value={value.depositWon} onChange={(next) => edit('depositWon', next)} />
      )}
      {value.transaction === 'monthly' ? (
        <MoneyField name={`${id}-monthly-rent`} label={c.rent} value={value.monthlyRentWon} onChange={(next) => edit('monthlyRentWon', next)} />
      ) : null}
    </fieldset>
  );
}

function comparisonVerdict(
  comparison: Extract<ContractOfferComparison, { status: 'ready' }>,
  c: CheckCopy,
): string {
  if (comparison.basis === 'tradeoff') return c.tradeoff;
  if (comparison.winner === 'equal') return c.equal;
  return `${c.offer} ${comparison.winner?.toUpperCase()} ${
    comparison.basis === 'equivalent-monthly-cost' ? c.equivalent : c.lower
  }`;
}

function recurringCashFlow(
  offer: Extract<ContractOfferComparison, { status: 'ready' }>['offers'][number],
  c: CheckCopy,
): string {
  if (offer.recurringCashFlowWon !== null) {
    return `${won.format(offer.recurringCashFlowWon)} / month`;
  }
  return offer.transaction === 'sale' ? c.notModeled : c.notApplicable;
}

function ResultPanel({ model, locale }: Readonly<{
  model: ContractCheckReadyRouteModel;
  locale: ProductLocale;
}>) {
  const c = CHECK_COPY[locale];
  const comparison = model.comparison;
  const checks = model.offerChecks;
  return (
    <section aria-live="polite" className={styles.resultPanel} data-check-section="verdict" data-result-focus-target="true">
      <header><span>04</span><h2>{c.result}</h2></header>
      {!model.submitted || comparison === null || checks === null ? (
        <div className={styles.resultEmpty} data-result-state="blank"><p>{c.blank}</p></div>
      ) : comparison.status === 'unavailable' ? (
        <div className={styles.resultEmpty} data-result-state="unavailable">
          <h3>{c.unavailable}</h3><p>{comparison.message}</p>
        </div>
      ) : (
        <div className={styles.resultBody} data-comparison-basis={comparison.basis}>
          <div className={styles.resultOffers}>
            {comparison.offers.map((offer) => (
              <EvidencePositionCard
                check={offer.check}
                key={offer.id}
                locale={locale}
                order={offer.id === 'a' ? 'offer-a' : 'offer-b'}
                title={`${c.offer} ${offer.id.toUpperCase()}`}
              />
            ))}
          </div>
          <ResultLinkCopy locale={locale} tool="offer-compare" />
          <div className={styles.verdictPanel} data-result-order="verdict">
            <p className={styles.verdict}>{comparisonVerdict(comparison, c)}</p>
            {comparison.differenceWon === null ? null : <p>{won.format(comparison.differenceWon)} / month</p>}
          </div>
          <section className={styles.keyFigures} data-result-order="key-figures">
            <h3>{c.keyFigures}</h3>
            <div>{comparison.offers.map((offer) => (
              <dl key={offer.id}>
                <div><dt>{c.upfront}</dt><dd>{won.format(offer.upfrontCashWon)}</dd></div>
                <div><dt>{c.recurring}</dt><dd>{recurringCashFlow(offer, c)}</dd></div>
                <div><dt>{c.marketPosition}</dt><dd>{offer.marketDifferencePct}%</dd></div>
              </dl>
            ))}</div>
          </section>
        </div>
      )}
      <section className={styles.marketEvidence} data-check-section="evidence" data-result-order="market-evidence">
        <h3>{c.evidence}</h3>
        {checks === null ? <p>{model.disclosure.basis}</p> : (
          <div>{(['a', 'b'] as const).map((id) => {
            const check = checks[id];
            return check.status === 'ready' ? (
              <dl key={id}>
                <div><dt>{c.offer} {id.toUpperCase()} · {c.median}</dt><dd>{won.format(check.distribution.medianWon)}</dd></div>
                <div><dt>{c.middle}</dt><dd>{won.format(check.distribution.p25Won)}–{won.format(check.distribution.p75Won)}</dd></div>
                <div><dt>{c.evidence}</dt><dd>{check.sample.count} {c.sample}</dd></div>
                <div><dt>{c.window}</dt><dd>{completedMonthWindowLabel(check.evidenceWindow, locale)}</dd></div>
              </dl>
            ) : <p key={id}>{c.offer} {id.toUpperCase()}: {check.status === 'unavailable'
              ? check.message
              : locale === 'ko' ? `비교 거래 ${check.sample.count}건 · 최소 5건 필요` : `Only ${check.sample.count} compatible contracts; five are required.`}</p>;
          })}</div>
        )}
      </section>
      <section className={styles.disclosure} data-check-section="disclosure" data-result-order="disclosure">
        <h3>{c.disclosure}</h3>
        <p>{model.disclosure.source}</p>
        {model.disclosure.periods.sale === null ? null : <p>{c.salePeriod} · {completedMonthWindowLabel(model.disclosure.periods.sale, locale)}</p>}
        {model.disclosure.periods.rent === null ? null : <p>{c.rentPeriod} · {completedMonthWindowLabel(model.disclosure.periods.rent, locale)}</p>}
        {model.disclosure.periods.conversion === null ? null : <p>{c.conversionPeriod} · {model.disclosure.periods.conversion}</p>}
        <p>{model.disclosure.boundary}</p>
        <p>{c.reference}</p>
      </section>
    </section>
  );
}

function ReadyWorkspace({ model, locale, entityContext }: Readonly<{
  model: ContractCheckReadyRouteModel;
  locale: ProductLocale;
  entityContext: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const [district, setDistrict] = useState(model.selection.districtSlug);
  const [housing, setHousing] = useState(model.selection.housingType);
  const [offers, setOffers] = useState(() => ({
    a: draft(model.selection.offers.a),
    b: draft(model.selection.offers.b),
  }));
  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>{locale === 'ko' ? '서울 · 실거래가 비교' : 'Seoul · Reported transactions'}</p>
          <h1>{c.compare}</h1>
          <p>{locale === 'ko' ? '매매·전세·월세 조건을 각각 비슷한 거래와 비교하세요.' : 'Compare sale, jeonse or monthly-rent offers with similar transactions.'}</p>
        </section>
        <nav aria-label={c.mode} className={styles.modeSelector} data-check-mode-selector="true">
          <Link data-check-mode="single" href={localizedCheckHref(locale, '/')}>{c.single}</Link>
          <span aria-current="page" data-check-mode="compare">{c.compare}</span>
        </nav>
        <form action={localizedCheckHref(locale, '/compare/')} className={styles.form} data-contract-check-form="ready" method="get">
          <input name="compare" type="hidden" value="1" />
          {entityContext === null ? null : <>
            <input name="market" type="hidden" value={entityContext.market} />
            <input name="entity" type="hidden" value={entityContext.entity} />
            <input name="returnTo" type="hidden" value={entityContext.returnTo} />
          </>}
          <fieldset className={styles.conditions} data-check-section="conditions">
            <legend><span>01</span>{c.conditions}</legend>
            <div className={styles.conditionGrid}>
              <label className={styles.field}><span>{c.district}</span><select value={district} onChange={event => setDistrict(event.target.value)} name="district">
                {model.districts.map((district) => <option key={district.slug} value={district.slug}>{locale === 'ko' ? district.nameKo : district.nameEn}</option>)}
              </select></label>
              <label className={styles.field}><span>{c.housing}</span><select value={housing} onChange={event => setHousing(event.target.value as typeof housing)} name="housing">
                <option value="apartment">{locale === 'ko' ? '아파트' : 'Apartment'}</option><option value="officetel">{locale === 'ko' ? '오피스텔' : 'Officetel'}</option>
                <option value="villa_multifamily">{locale === 'ko' ? '연립·다세대' : 'Villa / multifamily'}</option><option value="detached">{locale === 'ko' ? '단독·다가구' : 'Detached'}</option>
              </select></label>
              <label className={styles.field}><span>{c.area} <small>㎡</small></span><input defaultValue={model.selection.areaSqm ?? ''} inputMode="decimal" name="area" /></label>
              <BuildingSelection key={`${district}-${housing}`} id={district === model.selection.districtSlug && housing === model.selection.housingType ? model.selection.buildingId : null} name={model.buildingName} locale={locale} />
            </div>
          </fieldset>
          <div className={styles.comparisonGrid}>
            <OfferPanel id="a" value={offers.a} availability={model.availability} locale={locale} onChange={(value) => setOffers((current) => ({ ...current, a: value }))} />
            <OfferPanel id="b" value={offers.b} availability={model.availability} locale={locale} onChange={(value) => setOffers((current) => ({ ...current, b: value }))} />
          </div>
          <div className={styles.actions}><button type="submit">{c.submitCompare}</button></div>
        </form>
        <ResultPanel model={model} locale={locale} />
        <nav className={styles.contextLinks} aria-label={c.evidence}>
          {entityContext === null ? null : <Link href={entityContext.returnTo}>Return to selected building</Link>}
          <Link href={localizedCheckHref(locale, '/')}>{c.single}</Link>
          <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
        </nav>
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </>
  );
}

export function ContractCheckWorkspace({ model, locale = 'en', entityContext = null }: Readonly<{
  model: ContractCheckRouteModel;
  locale?: ProductLocale;
  entityContext?: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  return (
    <div className={styles.page} lang={locale}>
      <SiteHeader copy={checkHeader(locale)} />
      {model.status === 'ready' ? <ReadyWorkspace model={model} locale={locale} entityContext={entityContext} /> : (
        <main className={styles.unavailable} data-evidence-state="unavailable">
          <p>{locale === 'ko' ? '서울 · 실거래가 비교' : 'Seoul · Reported transactions'}</p><h1>{c.unavailable}</h1>
          <p>{model.message}</p><Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
        </main>
      )}
    </div>
  );
}
