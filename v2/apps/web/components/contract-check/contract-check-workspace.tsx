'use client';

import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import type { RentContractComparison } from '@signedprice/market-core';
import Link from 'next/link';
import { useReducer } from 'react';

import type { ContractCheckRouteModel } from '../../lib/contract-check/route-model.server';
import {
  CONTRACT_CHECK_COPY,
  contractNavigationLabel,
  localizedSeoulHref,
  localizeContractText,
  type ContractCheckCopy,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import {
  contractCheckReducer,
  createContractCheckState,
  type ContractOfferDraft,
  type ContractOfferErrors,
} from '../../lib/contract-check/client-state';
import { BrandWordmark } from '../brand-mark';
import { ConversionCurve } from './conversion-curve';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

function SiteNavigation({
  model,
  locale,
  copy,
}: Readonly<{
  model: ContractCheckRouteModel;
  locale: ProductLocale;
  copy: ContractCheckCopy;
}>) {
  return (
    <nav className={styles.navigation} aria-label={copy.primaryNavigation}>
      {model.navigation.map((item) => item.available && item.href !== null ? (
        <Link href={localizedSeoulHref(item.href, locale)} key={item.label}>
          {contractNavigationLabel(item.href, item.label, copy)}
        </Link>
      ) : (
        <span className={styles.planned} key={item.label}>
          {contractNavigationLabel(item.href, item.label, copy)}<span>{copy.planned}</span>
        </span>
      ))}
    </nav>
  );
}

function WorkspaceHeader({
  model,
  locale,
  copy,
}: Readonly<{
  model: ContractCheckRouteModel;
  locale: ProductLocale;
  copy: ContractCheckCopy;
}>) {
  return (
    <header className={styles.siteHeader}>
      <Link
        className={styles.wordmark}
        href={localizedSeoulHref('/kr/seoul/check/', locale)}
        aria-label={copy.wordmarkLabel}
      >
        <BrandWordmark compact />
      </Link>
      <SiteNavigation model={model} locale={locale} copy={copy} />
    </header>
  );
}

function errorDescriptionIds(
  offerId: 'a' | 'b',
  field: 'depositWon' | 'monthlyRentWon',
  errors: ContractOfferErrors | undefined,
): string | undefined {
  const ids = [errors?.[field] === undefined ? null : `${offerId}-${field}-error`];
  if (errors?.offer !== undefined) ids.push(`${offerId}-offer-error`);
  return ids.filter((id): id is string => id !== null).join(' ') || undefined;
}

function OfferPanel({
  id,
  draft,
  errors,
  onEdit,
  locale,
  copy,
}: Readonly<{
  id: 'a' | 'b';
  draft: ContractOfferDraft;
  errors: ContractOfferErrors | undefined;
  onEdit: (field: keyof ContractOfferDraft, value: string) => void;
  locale: ProductLocale;
  copy: ContractCheckCopy;
}>) {
  const title = `${copy.offer.title} ${id.toUpperCase()}`;
  return (
    <fieldset className={styles.offerPanel}>
      <legend><span>{id === 'a' ? '01' : '02'}</span>{title}</legend>
      <label>
        <span>{copy.offer.label} <small>{copy.offer.optional}</small></span>
        <input
          autoComplete="off"
          maxLength={80}
          name={`${id}-label`}
          onChange={(event) => onEdit('label', event.currentTarget.value)}
          placeholder={id === 'a' ? copy.offer.firstPlaceholder : copy.offer.secondPlaceholder}
          value={draft.label}
        />
      </label>
      <label>
        <span>{copy.offer.deposit} <small>KRW</small></span>
        <input
          aria-describedby={errorDescriptionIds(id, 'depositWon', errors)}
          aria-invalid={errors?.depositWon !== undefined || errors?.offer !== undefined}
          inputMode="numeric"
          name={`${id}-deposit`}
          onChange={(event) => onEdit('depositWon', event.currentTarget.value)}
          placeholder="100000000"
          value={draft.depositWon}
        />
        {errors?.depositWon === undefined ? null : (
          <small className={styles.error} id={`${id}-depositWon-error`}>
            {localizeContractText(errors.depositWon, locale)}
          </small>
        )}
      </label>
      <label>
        <span>{copy.offer.monthlyRent} <small>KRW</small></span>
        <input
          aria-describedby={errorDescriptionIds(id, 'monthlyRentWon', errors)}
          aria-invalid={errors?.monthlyRentWon !== undefined || errors?.offer !== undefined}
          inputMode="numeric"
          name={`${id}-monthly-rent`}
          onChange={(event) => onEdit('monthlyRentWon', event.currentTarget.value)}
          placeholder="1000000"
          value={draft.monthlyRentWon}
        />
        {errors?.monthlyRentWon === undefined ? null : (
          <small className={styles.error} id={`${id}-monthlyRentWon-error`}>
            {localizeContractText(errors.monthlyRentWon, locale)}
          </small>
        )}
      </label>
      {errors?.offer === undefined ? null : (
        <p className={styles.error} id={`${id}-offer-error`}>
          {localizeContractText(errors.offer, locale)}
        </p>
      )}
    </fieldset>
  );
}

function rangeLabel(
  rangeState: 'observed' | 'held-below' | 'held-above',
  copy: ContractCheckCopy,
): string {
  return rangeState === 'observed'
    ? copy.range.observed
    : copy.range.held;
}

function ResultEmpty({
  invalid,
  copy,
}: Readonly<{ invalid: boolean; copy: ContractCheckCopy }>) {
  return (
    <div className={styles.resultEmpty} data-result-state={invalid ? 'invalid' : 'blank'}>
      <h3 data-empty-title="true">
        {invalid ? copy.empty.invalidTitle : copy.empty.blankTitle}
      </h3>
      <p data-empty-reason="true">
        {invalid
          ? copy.empty.invalidReason
          : copy.empty.blankReason}
      </p>
      <p data-empty-action="true">
        {invalid
          ? copy.empty.invalidAction
          : copy.empty.blankAction}
      </p>
    </div>
  );
}

function auditValue(
  comparison: RentContractComparison,
  offerIndex: 0 | 1,
  row: 'rate' | 'difference' | 'conversion' | 'normalized',
  copy: ContractCheckCopy,
): string {
  const normalizedOffer = comparison.offers[offerIndex];
  if (row === 'rate') {
    return `${(normalizedOffer.appliedRate.annualRate * 100).toFixed(2)}% · ${rangeLabel(normalizedOffer.appliedRate.rangeState, copy)}`;
  }
  if (row === 'difference') {
    return won.format(normalizedOffer.offer.deposit - comparison.referenceDeposit);
  }
  if (row === 'conversion') {
    return won.format(Math.round(
      normalizedOffer.normalizedMonthlyCost - normalizedOffer.offer.monthlyRent,
    ));
  }
  return won.format(normalizedOffer.roundedNormalizedMonthlyCost);
}

export function ContractCheckResult({
  comparison,
  curve,
  locale = 'en',
}: Readonly<{
  comparison: RentContractComparison;
  curve: KoreaConversionCurveProjection;
  locale?: ProductLocale;
}>) {
  const copy = CONTRACT_CHECK_COPY[locale];
  const calculationRows = [
    ['rate', copy.result.rows[0]],
    ['difference', copy.result.rows[1]],
    ['conversion', copy.result.rows[2]],
    ['normalized', copy.result.rows[3]],
  ] as const;

  return (
    <div className={styles.resultBody}>
      <div className={styles.verdictPanel}>
        <p className={styles.verdict}>
          {comparison.winner === 'equal'
            ? copy.result.equal
            : `${copy.result.lowerPrefix} ${comparison.winner.toUpperCase()} ${copy.result.lowerSuffix}`}
        </p>
        <p className={styles.difference}>
          {won.format(comparison.roundedMonthlyDifference)}<span> {copy.result.differenceSuffix}</span>
        </p>
        <p className={styles.reference}>
          {copy.result.referenceDeposit} · {won.format(comparison.referenceDeposit)}
        </p>
        {comparison.rankingFlipped ? (
          <p className={styles.flip}>{copy.result.flipped}</p>
        ) : null}
      </div>

      <ConversionCurve comparison={comparison} curve={curve} locale={locale} />

      <div className={styles.auditTableWrap}>
        <table className={styles.auditTable}>
          <caption>{copy.result.traceCaption}</caption>
          <thead>
            <tr><th scope="col">{copy.result.calculation}</th><th scope="col">A</th><th scope="col">B</th></tr>
          </thead>
          <tbody>
            {calculationRows.map(([id, label]) => (
              <tr data-calculation-row={id} key={id}>
                <th scope="row">{label}</th>
                <td>{auditValue(comparison, 0, id, copy)}</td>
                <td>{auditValue(comparison, 1, id, copy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.principalBoundary}>
        {copy.result.principalBoundary}
      </p>
    </div>
  );
}

function ResultPanel({
  state,
  curve,
  locale,
  copy,
}: Readonly<{
  state: ReturnType<typeof createContractCheckState>;
  curve: KoreaConversionCurveProjection;
  locale: ProductLocale;
  copy: ContractCheckCopy;
}>) {
  const invalid = Object.keys(state.errors).length > 0;
  return (
    <section
      aria-live="polite"
      className={styles.resultPanel}
      data-check-section="verdict"
      data-result-focus-target="true"
    >
      <header><span>03</span><h2>{copy.result.heading}</h2></header>
      {state.result === null ? (
        <ResultEmpty invalid={invalid} copy={copy} />
      ) : (
        <ContractCheckResult comparison={state.result} curve={curve} locale={locale} />
      )}
    </section>
  );
}

function ReadyWorkspace({ model, locale, copy }: Readonly<{
  model: Extract<ContractCheckRouteModel, { status: 'ready' }>;
  locale: ProductLocale;
  copy: ContractCheckCopy;
}>) {
  const [state, dispatch] = useReducer(contractCheckReducer, undefined, createContractCheckState);
  const selectedCurve = model.curves.find(
    (curve): curve is KoreaConversionCurveProjection => curve.housingType === state.housingType,
  );

  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>{copy.hero.eyebrow}</p>
          <h1>{copy.hero.headingLead}<br />{copy.hero.headingTail}</h1>
          <p>{copy.hero.description}</p>
        </section>

        <form
          className={styles.form}
          data-contract-check-form="ready"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className={styles.inputsWorkspace} data-check-section="inputs">
            <div className={styles.housingType}>
              <label htmlFor="contract-housing-type">{copy.housingType}</label>
              <select
                id="contract-housing-type"
                onChange={(event) => {
                  const housingType = event.currentTarget.value as 'apartment' | 'officetel';
                  dispatch({
                    type: 'SET_HOUSING_TYPE',
                    housingType,
                    curve: model.curves.find((curve) => curve.housingType === housingType),
                  });
                }}
                value={state.housingType}
              >
                <option value="apartment">{copy.apartment}</option>
                <option value="officetel">{copy.officetel}</option>
              </select>
            </div>

            <div className={styles.comparisonGrid}>
              {(['a', 'b'] as const).map((offerId) => (
                <OfferPanel
                  draft={state.offers[offerId]}
                  errors={state.errors[offerId]}
                  id={offerId}
                  key={offerId}
                  locale={locale}
                  copy={copy}
                  onEdit={(field, value) => dispatch({
                    type: 'EDIT_OFFER_FIELD',
                    offerId,
                    field,
                    value,
                    curve: selectedCurve,
                  })}
                />
              ))}
            </div>

            {state.errors.form === undefined ? null : (
              <p className={styles.formError} role="alert">
                {localizeContractText(state.errors.form, locale)}
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" onClick={() => dispatch({ type: 'RESET' })}>{copy.reset}</button>
            </div>
          </div>

          {selectedCurve === undefined ? null : (
            <ResultPanel curve={selectedCurve} state={state} locale={locale} copy={copy} />
          )}
        </form>

        <section
          className={styles.evidence}
          aria-labelledby="contract-evidence-heading"
          data-check-section="evidence"
        >
          <header><span>04</span><h2 id="contract-evidence-heading">{copy.evidence.heading}</h2></header>
          <dl>
            <div><dt>{copy.evidence.source}</dt><dd>{localizeContractText(model.disclosure.source, locale)}</dd></div>
            <div><dt>{copy.evidence.basis}</dt><dd>{localizeContractText(model.disclosure.basis, locale)}</dd></div>
            <div><dt>{copy.evidence.period}</dt><dd>{model.disclosure.period}</dd></div>
            <div><dt>{copy.evidence.methodBoundary}</dt><dd>{localizeContractText(model.disclosure.boundary, locale)}</dd></div>
          </dl>
        </section>

        <nav className={styles.contextLinks} aria-label={copy.moreEvidence}>
          <Link href={model.secondaryCheckHref}>
            {copy.localDistribution}
          </Link>
          <Link href={localizedSeoulHref('/kr/seoul/explore/', locale)}>{copy.explore}</Link>
        </nav>
      </main>
      <footer className={styles.footer}>
        {copy.footer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </footer>
    </>
  );
}

export function ContractCheckWorkspace({ model, locale = 'en' }: Readonly<{
  model: ContractCheckRouteModel;
  locale?: ProductLocale;
}>) {
  const copy = CONTRACT_CHECK_COPY[locale];
  return (
    <div className={styles.page}>
      <WorkspaceHeader model={model} locale={locale} copy={copy} />
      {model.status === 'ready' ? (
        <ReadyWorkspace model={model} locale={locale} copy={copy} />
      ) : (
        <main className={styles.unavailable} data-evidence-state="unavailable">
          <p>{copy.unavailable.eyebrow}</p>
          <h1 data-empty-title="true">{copy.unavailable.title}</h1>
          <p data-empty-reason="true">{localizeContractText(model.message, locale)}</p>
          <p data-empty-action="true">
            {copy.unavailable.actionLead}{' '}
            <Link href={localizedSeoulHref('/kr/seoul/explore/', locale)}>
              {copy.unavailable.actionLink}
            </Link>
          </p>
        </main>
      )}
    </div>
  );
}
