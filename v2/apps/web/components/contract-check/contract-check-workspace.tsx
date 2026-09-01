'use client';

import type { KoreaConversionCurveProjection } from '@signedprice/korea-rent';
import type { AppliedConversionRate } from '@signedprice/market-core';
import Link from 'next/link';
import { useEffect, useReducer, useRef, type ReactNode } from 'react';

import type { ContractCheckRouteModel } from '../../lib/contract-check/route-model.server';
import {
  contractCheckReducer,
  createContractCheckState,
  type ContractOfferDraft,
  type ContractOfferErrors,
} from '../../lib/contract-check/client-state';
import styles from './contract-check.module.css';

const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});

function SiteNavigation({ model }: Readonly<{ model: ContractCheckRouteModel }>) {
  return (
    <nav className={styles.navigation} aria-label="Primary">
      {model.navigation.map((item) => item.available && item.href !== null ? (
        <Link href={item.href} key={item.label}>{item.label}</Link>
      ) : (
        <span className={styles.planned} key={item.label}>
          {item.label}<span>Planned</span>
        </span>
      ))}
    </nav>
  );
}

function WorkspaceHeader({ model }: Readonly<{ model: ContractCheckRouteModel }>) {
  return (
    <header className={styles.siteHeader}>
      <Link className={styles.wordmark} href="/kr/" aria-label="SignedPrice home">
        signedprice
      </Link>
      <SiteNavigation model={model} />
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
}: Readonly<{
  id: 'a' | 'b';
  draft: ContractOfferDraft;
  errors: ContractOfferErrors | undefined;
  onEdit: (field: keyof ContractOfferDraft, value: string) => void;
}>) {
  const title = `Offer ${id.toUpperCase()}`;
  return (
    <fieldset className={styles.offerPanel}>
      <legend><span>{id === 'a' ? '01' : '02'}</span>{title}</legend>
      <label>
        <span>Label <small>Optional</small></span>
        <input
          autoComplete="off"
          maxLength={80}
          name={`${id}-label`}
          onChange={(event) => onEdit('label', event.currentTarget.value)}
          placeholder={id === 'a' ? 'Near the station' : 'More space'}
          value={draft.label}
        />
      </label>
      <label>
        <span>Deposit <small>KRW</small></span>
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
            {errors.depositWon}
          </small>
        )}
      </label>
      <label>
        <span>Monthly rent <small>KRW</small></span>
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
            {errors.monthlyRentWon}
          </small>
        )}
      </label>
      {errors?.offer === undefined ? null : (
        <p className={styles.error} id={`${id}-offer-error`}>{errors.offer}</p>
      )}
    </fieldset>
  );
}

function rangeLabel(rate: AppliedConversionRate): string {
  if (rate.rangeState === 'held-below') return 'Held at the lowest verified anchor';
  if (rate.rangeState === 'held-above') return 'Held at the highest verified anchor';
  return 'Within verified anchors';
}

function ResultPanel({
  state,
  resultRef,
}: Readonly<{
  state: ReturnType<typeof createContractCheckState>;
  resultRef: React.RefObject<HTMLElement | null>;
}>) {
  return (
    <section
      aria-live="polite"
      className={styles.resultPanel}
      data-result-focus-target="true"
      ref={resultRef}
      tabIndex={-1}
    >
      <header><span>03</span><h2>Result</h2></header>
      {state.result === null ? (
        <div className={styles.resultEmpty}>
          <p>Enter both offers.</p>
          <p>We normalize their deposit difference with the verified conversion curve.</p>
        </div>
      ) : (
        <div className={styles.resultBody}>
          <p className={styles.verdict}>
            {state.result.winner === 'equal'
              ? 'The offers are effectively equal.'
              : `Offer ${state.result.winner.toUpperCase()} has the lower normalized cost.`}
          </p>
          <p className={styles.difference}>
            {won.format(state.result.roundedMonthlyDifference)}<span> / month difference</span>
          </p>
          <dl>
            {state.result.offers.map((offer) => (
              <div key={offer.offer.id}>
                <dt>Offer {offer.offer.id.toUpperCase()}</dt>
                <dd>{won.format(offer.roundedNormalizedMonthlyCost)}</dd>
                <dd>{(offer.appliedRate.annualRate * 100).toFixed(2)}% / year</dd>
                <dd>{rangeLabel(offer.appliedRate)}</dd>
              </div>
            ))}
          </dl>
          {state.result.rankingFlipped ? (
            <p className={styles.flip}>The lower listed rent is not the lower normalized cost.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ReadyWorkspace({ model }: Readonly<{
  model: Extract<ContractCheckRouteModel, { status: 'ready' }>;
}>) {
  const [state, dispatch] = useReducer(contractCheckReducer, undefined, createContractCheckState);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (state.result !== null) resultRef.current?.focus();
  }, [state.result]);

  const selectedCurve = model.curves.find(
    (curve): curve is KoreaConversionCurveProjection => curve.housingType === state.housingType,
  );

  return (
    <>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>Seoul · Contract decision</p>
          <h1>Which rent offer<br />actually costs less?</h1>
          <p>Compare two deposit-and-rent offers on the same monthly basis.</p>
        </section>

        <form
          className={styles.form}
          data-contract-check-form="ready"
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedCurve !== undefined) {
              dispatch({ type: 'CALCULATE', curve: selectedCurve });
            }
          }}
        >
          <div className={styles.housingType}>
            <label htmlFor="contract-housing-type">Housing type</label>
            <select
              id="contract-housing-type"
              onChange={(event) => dispatch({
                type: 'SET_HOUSING_TYPE',
                housingType: event.currentTarget.value as 'apartment' | 'officetel',
              })}
              value={state.housingType}
            >
              <option value="apartment">Apartment</option>
              <option value="officetel">Officetel</option>
            </select>
          </div>

          <div className={styles.comparisonGrid}>
            {(['a', 'b'] as const).map((offerId) => (
              <OfferPanel
                draft={state.offers[offerId]}
                errors={state.errors[offerId]}
                id={offerId}
                key={offerId}
                onEdit={(field, value) => dispatch({
                  type: 'EDIT_OFFER_FIELD',
                  offerId,
                  field,
                  value,
                })}
              />
            ))}
            <ResultPanel resultRef={resultRef} state={state} />
          </div>

          {state.errors.form === undefined ? null : (
            <p className={styles.formError} role="alert">{state.errors.form}</p>
          )}
          <div className={styles.actions}>
            <button type="submit" disabled={selectedCurve === undefined}>Compare offers</button>
            <button type="button" onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
          </div>
        </form>

        <section className={styles.evidence} aria-labelledby="contract-evidence-heading">
          <header><span>04</span><h2 id="contract-evidence-heading">Evidence boundary</h2></header>
          <dl>
            <div><dt>Source</dt><dd>{model.disclosure.source}</dd></div>
            <div><dt>Basis</dt><dd>{model.disclosure.basis}</dd></div>
            <div><dt>Period</dt><dd>{model.disclosure.period}</dd></div>
            <div><dt>Method / boundary</dt><dd>{model.disclosure.boundary}</dd></div>
          </dl>
        </section>

        <nav className={styles.contextLinks} aria-label="More market evidence">
          <Link href={model.secondaryCheckHref}>
            Check one offer against its local distribution
          </Link>
          <Link href="/kr/seoul/explore">Explore Seoul market evidence</Link>
        </nav>
      </main>
      <footer className={styles.footer}>
        <p>Decision support from reported contracts. Not legal or financial advice.</p>
      </footer>
    </>
  );
}

export function ContractCheckWorkspace({ model, entry }: Readonly<{
  model: ContractCheckRouteModel;
  entry?: ReactNode;
}>) {
  return (
    <div className={styles.page}>
      <WorkspaceHeader model={model} />
      {entry}
      {model.status === 'ready' ? (
        <ReadyWorkspace model={model} />
      ) : (
        <main className={styles.unavailable} data-evidence-state="unavailable">
          <p>Seoul · Contract decision</p>
          <h1>Comparison paused.</h1>
          <p>{model.message}</p>
          <p>The calculator will return when its evidence contract is ready.</p>
        </main>
      )}
    </div>
  );
}
