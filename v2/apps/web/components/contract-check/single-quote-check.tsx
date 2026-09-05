'use client';

import type { CheckTransaction, SingleQuoteCheckResult } from '@signedprice/market-core';
import Link from 'next/link';
import { useState } from 'react';

import type { ProductLocale } from '../../lib/locale/product-copy';
import type { SingleQuoteCheckRouteModel } from '../../lib/single-quote-check/route-model.server';
import type { EntityCheckContext } from '../../lib/navigation/explorer-selection';
import { SiteHeader } from '../site-header';
import {
  CHECK_COPY,
  EvidencePositionCard,
  MoneyField,
  TransactionSelect,
  checkHeader,
  completedMonthWindowLabel,
  localizedCheckHref,
} from './contract-check-workspace';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
});

type QuoteDraft = Readonly<{
  transaction: CheckTransaction;
  salePriceWon: string;
  depositWon: string;
  monthlyRentWon: string;
}>;

function resultReason(
  result: Exclude<SingleQuoteCheckResult, { status: 'ready' }>,
  locale: ProductLocale,
): string {
  if (result.status === 'insufficient') {
    return `Only ${result.sample.count} compatible reported contracts within ${completedMonthWindowLabel(result.evidenceWindow, locale)}; five are required.`;
  }
  return result.message;
}

function SingleResult({ model, locale, entityContext }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale: ProductLocale;
  entityContext: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const result = model.result;
  return (
    <section aria-live="polite" className={styles.resultPanel} data-check-section="verdict" data-result-focus-target="true">
      <header><span>03</span><h2>{c.result}</h2></header>
      {!model.submitted || result === null ? (
        <div className={styles.resultEmpty} data-result-state="blank"><p>{locale === 'ko'
          ? '매물 하나의 조건과 제시가격을 입력해 조건이 맞는 신고 거래와 비교하세요.'
          : 'Enter one property’s conditions and asking price to compare with compatible reported contracts.'}</p></div>
      ) : result.status !== 'ready' ? (
        <div className={styles.resultEmpty} data-result-state={result.status}>
          <h3>{result.status === 'insufficient' ? 'Not enough compatible contracts' : c.unavailable}</h3>
          <p>{resultReason(result, locale)}</p>
        </div>
      ) : (
        <div className={styles.resultBody} data-single-result={result.verdict}>
          <EvidencePositionCard check={result} locale={locale} order="single-offer" title="Single offer" />
          <div className={styles.verdictPanel} data-result-order="verdict">
            <p className={styles.verdict}>{result.verdict === 'below'
              ? 'Below typical range'
              : result.verdict === 'above' ? 'Above typical range' : 'Typical range'}</p>
            <p>{model.buildingName === null ? result.filters.scope : `${model.buildingName} · ${result.filters.scope}`}</p>
          </div>
          <section className={styles.keyFigures} data-result-order="key-figures">
            <h3>{c.keyFigures}</h3>
            <div><dl>
              <div><dt>{c.median}</dt><dd>{won.format(result.distribution.medianWon)}</dd></div>
              <div><dt>{c.middle}</dt><dd>{won.format(result.distribution.p25Won)}–{won.format(result.distribution.p75Won)}</dd></div>
              <div><dt>{c.percentile}</dt><dd>{result.pricePercentile}</dd></div>
            </dl></div>
          </section>
          <section className={styles.marketEvidence} data-check-section="evidence" data-result-order="market-evidence">
            <h3>{c.evidence}</h3>
            <p>{result.sample.count} {c.sample} · ±{result.filters.areaTolerancePct}% area · {completedMonthWindowLabel(result.evidenceWindow, locale)}</p>
            <div className={styles.comparableRows}>
              {result.comparableRows.map((row, index) => (
                <p key={`${row.buildingId}-${row.filedMonth}-${index}`}>
                  {row.filedMonth} · {row.areaSqm}㎡ · {won.format(row.adjustedValueWon)}
                  {entityContext === null ? null : <Link href={`/kr/seoul/explore/${row.districtSlug}/${row.buildingId}/?transaction=${model.selection.transaction}&propertyType=${model.selection.housingType}&district=${row.districtSlug}&buildingId=${row.buildingId}`}>Open building evidence</Link>}
                </p>
              ))}
            </div>
          </section>
          <section className={styles.disclosure} data-check-section="disclosure" data-result-order="disclosure">
            <h3>{c.disclosure}</h3>
            <p>{result.fallbackDisclosure ?? 'The requested evidence scope met the five-record publication gate.'}</p>
            <p>{result.comparisonBasis === 'verified-deposit-adjusted-monthly-rent'
              ? 'Filed deposit and monthly rent remain visible; only the installed verified conversion curve normalizes the comparison.'
              : 'Official reported values are compared directly within the selected transaction market.'}</p>
            <p>{c.reference}</p>
          </section>
        </div>
      )}
    </section>
  );
}

export function SingleQuoteCheckWorkspace({ model, locale = 'en', entityContext = null }: Readonly<{
  model: SingleQuoteCheckRouteModel;
  locale?: ProductLocale;
  entityContext?: EntityCheckContext | null;
}>) {
  const c = CHECK_COPY[locale];
  const [draft, setDraft] = useState<QuoteDraft>(() => ({
    transaction: model.selection.transaction,
    salePriceWon: model.selection.salePriceWon?.toString() ?? '',
    depositWon: model.selection.depositWon?.toString() ?? '',
    monthlyRentWon: model.selection.monthlyRentWon?.toString() ?? '',
  }));
  const edit = (field: keyof QuoteDraft, value: string) => setDraft((current) => ({
    ...current, [field]: value,
  }));
  return (
    <div className={styles.page} data-primary-check="single-quote" lang={locale}>
      <SiteHeader copy={checkHeader(locale)} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>Seoul · Official transaction evidence</p>
          <h1>{locale === 'ko' ? '매물 하나의 가격을 확인하세요.' : 'Check one asking price.'}</h1>
          <p>{locale === 'ko'
            ? '매매·전세·월세 제시가격을 조건이 맞는 신고 거래와 비교합니다.'
            : 'Compare a sale, jeonse or monthly-rent quote with compatible reported contracts.'}</p>
        </section>
        <nav aria-label={c.mode} className={styles.modeSelector} data-check-mode-selector="true">
          <span aria-current="page" data-check-mode="single">{c.single}</span>
          <Link data-check-mode="compare" href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
        </nav>
        <form action={localizedCheckHref(locale, '/')} className={styles.form} method="get">
          <input name="check" type="hidden" value="1" />
          {entityContext === null ? null : <>
            <input name="market" type="hidden" value={entityContext.market} />
            <input name="entity" type="hidden" value={entityContext.entity} />
            <input name="returnTo" type="hidden" value={entityContext.returnTo} />
          </>}
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
              <label className={styles.field}><span>{c.building}</span><input aria-describedby="single-building-hint" defaultValue={model.selection.buildingId ?? ''} name="building" /><small id="single-building-hint">{c.buildingHint}</small></label>
            </div>
          </fieldset>
          <fieldset className={styles.singleOffer} data-offer="single">
            <legend><span>02</span>Single offer</legend>
            <TransactionSelect
              availability={model.availability}
              locale={locale}
              name="transaction"
              onChange={(transaction) => setDraft({
                transaction, salePriceWon: '', depositWon: '', monthlyRentWon: '',
              })}
              value={draft.transaction}
            />
            {draft.transaction === 'sale' ? <MoneyField name="price" label={c.price} value={draft.salePriceWon} onChange={(value) => edit('salePriceWon', value)} /> : null}
            {draft.transaction === 'jeonse' || draft.transaction === 'monthly' ? <MoneyField name="deposit" label={c.deposit} value={draft.depositWon} onChange={(value) => edit('depositWon', value)} /> : null}
            {draft.transaction === 'monthly' ? <MoneyField name="monthly-rent" label={c.rent} value={draft.monthlyRentWon} onChange={(value) => edit('monthlyRentWon', value)} /> : null}
          </fieldset>
          <div className={styles.actions}><button type="submit">Check this quote</button></div>
        </form>
        <SingleResult model={model} locale={locale} entityContext={entityContext} />
        <nav className={styles.contextLinks} aria-label={c.evidence}>
          {entityContext === null ? null : <Link href={entityContext.returnTo}>
            Return to {model.buildingName ?? 'selected building'}
          </Link>}
          <Link href={localizedCheckHref(locale, '/compare/')}>{c.compare}</Link>
          <Link href={`${locale === 'ko' ? '/ko' : ''}/kr/seoul/explore/`}>{c.explore}</Link>
          <Link href="/kr/seoul/guide/">{c.guide}</Link>
        </nav>
      </main>
      <footer className={styles.footer}><p>{c.reference}</p></footer>
    </div>
  );
}
