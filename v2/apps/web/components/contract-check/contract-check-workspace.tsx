'use client';

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
import type { SiteHeaderModel } from '../../lib/site-copy';
import { SiteHeader } from '../site-header';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

export const CHECK_COPY = Object.freeze({
  en: Object.freeze({
    nav: 'Check', mode: 'Check mode', single: 'Check one asking price', compare: 'Compare two offers',
    conditions: 'Conditions / building context', district: 'District', housing: 'Property type',
    area: 'Exclusive area', building: 'Observed building ID', buildingHint: 'Optional. Use a stable observed-building ID from Explore.',
    offer: 'Offer', transaction: 'Transaction type', sale: 'Sale', jeonse: 'Jeonse', monthly: 'Monthly rent',
    price: 'Sale price as filed', deposit: 'Deposit as filed', rent: 'Monthly rent as filed', submitCompare: 'Compare offers',
    result: 'Result', blank: 'Enter both offers, then compare them with compatible reported evidence.',
    unavailable: 'This comparison is unavailable', tradeoff: 'Trade-off — no winner declared',
    lower: 'has the lower evidence-adjusted position.', equal: 'The offers are equal at public precision.',
    equivalent: 'has the lower verified monthly equivalent.', keyFigures: 'Key figures',
    upfront: 'Upfront cash', recurring: 'Recurring cash flow', marketPosition: 'Own-market position',
    notModeled: 'Not modeled', notApplicable: 'Not applicable',
    percentile: 'Price percentile', evidence: 'Market evidence', disclosure: 'Calculation / source disclosure',
    sample: 'reported contracts', median: 'Reported median', middle: 'Middle 50%', period: 'Evidence period',
    window: 'Evidence window', salePeriod: 'Sale evidence window', rentPeriod: 'Rental evidence window', conversionPeriod: 'Conversion period',
    reference: 'Market reference only. No loan rate, tax, holding period, appreciation or future value is assumed.',
    explore: 'Find a stable building ID in Explore',
  }),
  ko: Object.freeze({
    nav: '가격 확인', mode: '확인 방식', single: '매물 하나의 가격 확인', compare: '두 조건 비교',
    conditions: '조건 / 건물 정보', district: '자치구', housing: '주택 유형', area: '전용면적',
    building: '관측 건물 ID', buildingHint: '선택. Explore의 안정적인 관측 건물 ID를 사용하세요.',
    offer: '조건', transaction: '거래 유형', sale: '매매', jeonse: '전세', monthly: '월세',
    price: '신고 매매가격', deposit: '신고 보증금', rent: '신고 월세', submitCompare: '두 조건 비교',
    result: '결과', blank: '두 조건을 입력한 뒤 조건이 맞는 신고 근거와 비교하세요.',
    unavailable: '이 비교를 제공할 수 없습니다', tradeoff: '절충 비교 — 우위를 정하지 않습니다',
    lower: '의 시장 대비 위치가 더 낮습니다.', equal: '공개 정밀도에서 두 조건이 같습니다.',
    equivalent: '의 검증된 월 환산비용이 더 낮습니다.', keyFigures: '핵심 수치',
    upfront: '초기 현금', recurring: '정기 현금흐름', marketPosition: '해당 시장 내 위치',
    notModeled: '모델링하지 않음', notApplicable: '해당 없음',
    percentile: '가격 백분위', evidence: '시장 근거', disclosure: '산출 / 출처 공개',
    sample: '건의 신고 계약', median: '신고 중앙값', middle: '중간 50%', period: '근거 기간',
    window: '근거 기간', salePeriod: '매매 근거 기간', rentPeriod: '임대차 근거 기간', conversionPeriod: '전환율 기간',
    reference: '시장 참고자료입니다. 대출금리·세금·보유기간·상승률·미래가치를 가정하지 않습니다.',
    explore: 'Explore에서 안정적인 건물 ID 찾기',
  }),
} as const);

type CheckCopy = typeof CHECK_COPY[ProductLocale];

export function completedMonthWindowLabel(
  window: CompletedMonthWindow,
  locale: ProductLocale = 'en',
): string {
  const count = locale === 'ko'
    ? `${window.completedMonthCount}개월 완료`
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
      <input
        autoComplete="off"
        inputMode="numeric"
        name={name}
        onChange={(event) => onChange(event.currentTarget.value)}
        pattern="[0-9]+"
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
      <p className={styles.marketVerdict}>{c.marketPosition}: {check.verdict}</p>
      <p>{check.difference.pct === 0 ? 'At median' : `${Math.abs(check.difference.pct)}% ${check.difference.pct < 0 ? 'below' : 'above'} median`}</p>
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
              : `Only ${check.sample.count} compatible contracts; five are required.`}</p>;
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

function ReadyWorkspace({ model, locale }: Readonly<{
  model: ContractCheckReadyRouteModel;
  locale: ProductLocale;
}>) {
  const c = CHECK_COPY[locale];
  const [offers, setOffers] = useState(() => ({
    a: draft(model.selection.offers.a),
    b: draft(model.selection.offers.b),
  }));
  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>Seoul · Official transaction evidence</p>
          <h1>{c.compare}</h1>
          <p>Compare sale, jeonse, or monthly-rent offers against their own compatible reported markets.</p>
        </section>
        <nav aria-label={c.mode} className={styles.modeSelector} data-check-mode-selector="true">
          <Link data-check-mode="single" href={localizedCheckHref(locale, '/')}>{c.single}</Link>
          <span aria-current="page" data-check-mode="compare">{c.compare}</span>
        </nav>
        <form action={localizedCheckHref(locale, '/compare/')} className={styles.form} data-contract-check-form="ready" method="get">
          <input name="compare" type="hidden" value="1" />
          <fieldset className={styles.conditions} data-check-section="conditions">
            <legend><span>01</span>{c.conditions}</legend>
            <div className={styles.conditionGrid}>
              <label className={styles.field}><span>{c.district}</span><select defaultValue={model.selection.districtSlug} name="district">
                {model.districts.map((district) => <option key={district.slug} value={district.slug}>{locale === 'ko' ? district.nameKo : district.nameEn}</option>)}
              </select></label>
              <label className={styles.field}><span>{c.housing}</span><select defaultValue={model.selection.housingType} name="housing">
                <option value="apartment">Apartment</option><option value="officetel">Officetel</option>
                <option value="villa_multifamily">Villa / multifamily</option><option value="detached">Detached</option>
              </select></label>
              <label className={styles.field}><span>{c.area} <small>㎡</small></span><input defaultValue={model.selection.areaSqm ?? ''} inputMode="decimal" name="area" /></label>
              <label className={styles.field}><span>{c.building}</span><input aria-describedby="compare-building-hint" defaultValue={model.selection.buildingId ?? ''} name="building" /><small id="compare-building-hint">{c.buildingHint}</small></label>
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
          <Link href={localizedCheckHref(locale, '/')}>{c.single}</Link>
          <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
        </nav>
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </>
  );
}

export function ContractCheckWorkspace({ model, locale = 'en' }: Readonly<{
  model: ContractCheckRouteModel;
  locale?: ProductLocale;
}>) {
  const c = CHECK_COPY[locale];
  return (
    <div className={styles.page} lang={locale}>
      <SiteHeader copy={checkHeader(locale)} />
      {model.status === 'ready' ? <ReadyWorkspace model={model} locale={locale} /> : (
        <main className={styles.unavailable} data-evidence-state="unavailable">
          <p>Seoul · Official transaction evidence</p><h1>{c.unavailable}</h1>
          <p>{model.message}</p><Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
        </main>
      )}
    </div>
  );
}
