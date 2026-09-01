'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type {
  SeoulRentCheckErrorEnvelope,
  SeoulRentCheckResult,
} from '@signedprice/korea-rent/browser';

import type { RentCheckApiSuccess } from '../../lib/rent-check/client-state';
import styles from '../../app/kr/seoul/tools/rent-check/rent-check.module.css';
import { EvidenceStrength } from './evidence-strength';
import { RentRange } from './rent-range';
import { TrustLabel } from './trust-label';

type CompletedResultProps = {
  readonly response: RentCheckApiSuccess;
  readonly errorEnvelope?: never;
  readonly heading?: ReactNode;
  readonly onRetry?: never;
};

type ErrorResultProps = {
  readonly response?: never;
  readonly errorEnvelope: SeoulRentCheckErrorEnvelope;
  readonly heading?: never;
  readonly onRetry: () => void;
};

type RentCheckResultProps = CompletedResultProps | ErrorResultProps;

export type RetryCountdownScheduler<THandle> = {
  readonly set: (callback: () => void) => THandle;
  readonly clear: (handle: THandle) => void;
};

export function retryCountdownModel(envelope: SeoulRentCheckErrorEnvelope): {
  readonly key: string;
  readonly seconds: number;
} {
  const retryable = envelope.error.code !== 'rights_blocked' && envelope.error.retryable;
  const seconds = retryable ? envelope.error.retryAfterSeconds ?? 0 : 0;
  return {
    key: [
      envelope.error.code,
      envelope.error.message,
      retryable ? 'retry' : 'stop',
      String(seconds),
    ].join(':'),
    seconds,
  };
}

export function startRetryCountdown<THandle>(
  initialSeconds: number,
  onSeconds: (seconds: number) => void,
  scheduler: RetryCountdownScheduler<THandle>,
): () => void {
  if (initialSeconds <= 0) return () => undefined;

  let seconds = initialSeconds;
  let active = true;
  let registration: { readonly handle: THandle } | null = null;
  const stop = () => {
    if (!active) return;
    active = false;
    if (registration !== null) scheduler.clear(registration.handle);
  };
  const handle = scheduler.set(() => {
    if (!active) return;
    seconds = Math.max(0, seconds - 1);
    onSeconds(seconds);
    if (seconds === 0) stop();
  });
  registration = { handle };
  return stop;
}

function won(value: number): string {
  return `₩${value.toLocaleString('en-US')}`;
}

function verdictCopy(result: SeoulRentCheckResult): string {
  const range = result.comparisonBasis === 'deposit-adjusted-monthly-rent'
    ? 'the signedprice deposit-adjusted estimate range'
    : 'the typical reported jeonse deposit range';
  if (result.rating === 'below') return `Below — lower than ${range}`;
  if (result.rating === 'above') return `Above — higher than ${range}`;
  if (result.rating === 'insufficient') return 'Insufficient — no estimate available';
  return `Fair — within ${range}`;
}

function medianVerdictCopy(result: SeoulRentCheckResult): string {
  if (result.rating === 'below') return 'Below median';
  if (result.rating === 'above') return 'Above median';
  return 'Around median';
}

function differenceCopy(value: number): string {
  if (value === 0 || Object.is(value, -0)) return 'equal to median';
  return `${Math.abs(value).toLocaleString('en-US')}% ${value < 0 ? 'below' : 'above'}`;
}

function ResultVerdict({ result }: Readonly<{ result: SeoulRentCheckResult }>) {
  const label = result.comparableCount >= 5
    ? verdictCopy(result)
    : medianVerdictCopy(result);

  return (
    <div className={styles['result-verdict']} data-rent-result="verdict">
      <TrustLabel>Quote verdict</TrustLabel>
      <strong>{label}</strong>
      {result.differencePct === null ? null : (
        <p>{differenceCopy(result.differencePct)}</p>
      )}
    </div>
  );
}

function ProvenanceGrid({ result, includeEstimate }: {
  readonly result: SeoulRentCheckResult;
  readonly includeEstimate: boolean;
}) {
  const adjusted = result.comparisonBasis === 'deposit-adjusted-monthly-rent';

  return (
    <div className={styles['provenance-grid']}>
      <section>
        <TrustLabel>Asking quote</TrustLabel>
        <strong>{won(result.askingValueWon)}</strong>
        <p>{adjusted ? 'Monthly rent at the entered deposit' : 'Jeonse deposit'}</p>
      </section>
      <section>
        <TrustLabel>Official reported contracts</TrustLabel>
        <strong>{result.comparableCount.toLocaleString('en-US')}</strong>
        <p>Raw reported contract evidence in the selected completed-month tier</p>
      </section>
      {includeEstimate ? (
        <section>
          <TrustLabel>{adjusted
            ? 'signedprice deposit-adjusted estimate'
            : 'signedprice estimate'}</TrustLabel>
          <strong>{result.comparableCount >= 5
            ? verdictCopy(result)
            : medianVerdictCopy(result)}</strong>
          <p>{adjusted
            ? 'Deposit-adjusted monthly-rent estimate, not a raw reported contract value'
            : 'Direct comparison of official reported jeonse deposits; no deposit normalization'}</p>
        </section>
      ) : null}
    </div>
  );
}

function ErrorResult({ envelope, onRetry }: {
  readonly envelope: SeoulRentCheckErrorEnvelope;
  readonly onRetry: () => void;
}) {
  const initialSeconds = retryCountdownModel(envelope).seconds;
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    return startRetryCountdown(initialSeconds, setSeconds, {
      set: (callback) => globalThis.setInterval(callback, 1_000),
      clear: (handle) => globalThis.clearInterval(handle),
    });
  }, [initialSeconds]);

  const rightsBlocked = envelope.error.code === 'rights_blocked';
  const heading = rightsBlocked ? 'Official data rights boundary' : 'Official evidence unavailable';

  return (
    <section className={styles['error-boundary']} aria-labelledby="rent-check-error-heading">
      <h2 id="rent-check-error-heading">{heading}</h2>
      <p role="alert">{envelope.error.message}</p>
      {rightsBlocked ? (
        <p>This official dataset cannot be displayed under the active rights policy.</p>
      ) : envelope.error.retryable ? (
        <div className={styles['retry-actions']}>
          <p aria-live="polite">
            {seconds > 0 ? `Retry available in ${seconds} seconds.` : 'You can retry now.'}
          </p>
          <button type="button" onClick={onRetry} disabled={seconds > 0}>Retry</button>
        </div>
      ) : (
        <p>Contact signedprice support if this continues.</p>
      )}
    </section>
  );
}

export function RentCheckResult(props: RentCheckResultProps) {
  if (props.errorEnvelope !== undefined) {
    const model = retryCountdownModel(props.errorEnvelope);
    return (
      <ErrorResult
        key={model.key}
        envelope={props.errorEnvelope}
        onRetry={props.onRetry}
      />
    );
  }

  const { envelope } = props.response;
  const { result } = envelope;

  if (envelope.status === 'insufficient' || result.comparableCount < 3) {
    return (
      <section className={styles['result-summary']}>
        {props.response.cacheStatus === 'stale' ? (
          <p className={styles['stale-label']}>Stale verified result</p>
        ) : null}
        {props.heading ?? <h2 tabIndex={-1}>Official evidence is insufficient.</h2>}
        <EvidenceStrength result={result} />
        <ProvenanceGrid result={result} includeEstimate={false} />
        <p>
          Fewer than 3 compatible official reported contracts were found in the completed-month
          coverage. No market estimate is shown.
        </p>
      </section>
    );
  }

  const hasDistribution = result.comparableCount >= 5 && result.verdictBasis === 'typical-range';

  return (
    <section className={styles['result-summary']}>
      {props.response.cacheStatus === 'stale' ? (
        <p className={styles['stale-label']}>Stale verified result</p>
      ) : null}
      {props.heading ?? <h2 tabIndex={-1}>Official evidence is ready.</h2>}
      <ResultVerdict result={result} />
      <div className={styles['result-evidence']} data-rent-result="evidence">
        <EvidenceStrength result={result} />

        <ProvenanceGrid result={result} includeEstimate />

        <dl className={styles['result-metrics']}>
          {result.medianValueWon !== null ? (
            <div>
              <dt>{result.comparisonBasis === 'deposit-adjusted-monthly-rent'
                ? 'Median signedprice deposit-adjusted estimate'
                : 'Median reported jeonse deposit'}</dt>
              <dd>{won(result.medianValueWon)}</dd>
            </div>
          ) : null}
          {hasDistribution && result.differencePct !== null ? (
            <div>
              <dt>{result.comparisonBasis === 'deposit-adjusted-monthly-rent'
                ? 'Difference from signedprice deposit-adjusted median'
                : 'Difference from reported jeonse median'}</dt>
              <dd>{differenceCopy(result.differencePct)}</dd>
            </div>
          ) : null}
          {hasDistribution && result.confidence !== null ? (
            <div>
              <dt>Confidence</dt>
              <dd>{result.confidence}</dd>
            </div>
          ) : null}
        </dl>
        {hasDistribution ? <RentRange result={result} /> : null}
      </div>
    </section>
  );
}
