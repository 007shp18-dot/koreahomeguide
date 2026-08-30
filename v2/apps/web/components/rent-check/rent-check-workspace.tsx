'use client';

import { useEffect, useReducer, useRef } from 'react';

import {
  abortOwnedRentCheckRequest,
  createInitialRentCheckState,
  DEFAULT_RENT_CHECK_INPUT,
  isQuoteMutatingRentCheckAction,
  RentCheckRequestError,
  rentCheckReducer,
  requestRentCheck,
  type RentCheckClientError,
  type RentCheckInput,
} from '../../lib/rent-check/client-state';
import type { ExplorerRentCheckContext } from '../../lib/rent-check/explorer-context';
import styles from '../../app/kr/seoul/tools/rent-check/rent-check.module.css';
import { ComparableContracts } from './comparable-contracts';
import { RentCheckForm } from './rent-check-form';
import { RentCheckResult } from './rent-check-result';
import { SourceDisclosure } from './source-disclosure';

type RentCheckWorkspaceProps = {
  readonly initialInput?: RentCheckInput;
  readonly explorerContext?: ExplorerRentCheckContext | null;
};

const FALLBACK_ERROR: RentCheckClientError = {
  code: 'source_unavailable',
  message: 'Official rental evidence is unavailable. Try again later.',
  retryable: true,
  retryAfterSeconds: null,
};

type ResultFocusTarget = Pick<HTMLHeadingElement, 'focus' | 'scrollIntoView'>;

export function revealRentCheckResult(
  target: ResultFocusTarget,
  reducedMotion: boolean,
): void {
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}

export function RentCheckWorkspace({
  initialInput = DEFAULT_RENT_CHECK_INPUT,
  explorerContext = null,
}: RentCheckWorkspaceProps) {
  const [state, dispatch] = useReducer(
    rentCheckReducer,
    initialInput,
    createInitialRentCheckState,
  );
  const nextRequestId = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === 'success' || state.status === 'insufficient') {
      const target = resultHeading.current;
      if (target !== null) {
        revealRentCheckResult(
          target,
          globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        );
      }
    }
  }, [state.status]);

  const submit = () => {
    const requestId = nextRequestId.current + 1;
    nextRequestId.current = requestId;
    const controller = new AbortController();
    const checkedInput = state.draftInput;
    abortOwnedRentCheckRequest(state);
    dispatch({ type: 'SUBMIT', requestId, controller });

    void requestRentCheck(checkedInput, { signal: controller.signal })
      .then((response) => dispatch({ type: 'RESOLVE', requestId, response }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: 'REJECT',
          requestId,
          error: error instanceof RentCheckRequestError ? {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
            retryAfterSeconds: error.retryAfterSeconds,
          } : FALLBACK_ERROR,
        });
      });
  };

  const editDispatch = (action: Parameters<typeof dispatch>[0]) => {
    if (isQuoteMutatingRentCheckAction(action)) abortOwnedRentCheckRequest(state);
    dispatch(action);
  };

  return (
    <section className={styles['workspace']} aria-label="Seoul Rent Check workspace">
      {explorerContext ? (
        <div className={styles['explorer-context']}>
          <span>Verified Explorer context</span>
          <p>
            {explorerContext.districtLabel} · {explorerContext.housingTypeLabel}
            {explorerContext.neighborhoodLabel ? ` · ${explorerContext.neighborhoodLabel}` : ''}
            {explorerContext.buildingLabel ? ` · ${explorerContext.buildingLabel}` : ''}
          </p>
          <p>Official comparison scope remains district-level.</p>
        </div>
      ) : null}

      <div className={styles['connected-frame']}>
        <section className={styles['quote-panel']} aria-labelledby="quote-heading">
          <header className={styles['panel-heading']}>
            <span>01</span><h2 id="quote-heading">Quote</h2>
          </header>
          <RentCheckForm state={state} dispatch={editDispatch} onSubmit={submit} />
        </section>

        <section className={styles['evidence-panel']} aria-labelledby="evidence-heading">
          <header className={styles['panel-heading']}>
            <span>02</span><h2 id="evidence-heading">Market evidence</h2>
          </header>
          <div
            className={styles['result-slot']}
            id="rent-check-result"
            data-result-state={state.status}
          >
            {state.status === 'idle' ? (
              <p>Enter a quote to compare it with compatible official reported contracts.</p>
            ) : null}
            {state.status === 'loading' ? (
              <p role="status" aria-live="polite">Checking official reported contracts…</p>
            ) : null}
            {state.status === 'error' && state.error !== null ? (
              <RentCheckResult
                errorEnvelope={{ status: 'error', error: state.error }}
                onRetry={submit}
              />
            ) : null}
            {(state.status === 'success' || state.status === 'insufficient') &&
              state.envelope !== null && state.cacheStatus !== null ? (
                <RentCheckResult
                  response={{ envelope: state.envelope, cacheStatus: state.cacheStatus }}
                  heading={(
                    <h2 ref={resultHeading} tabIndex={-1}>
                      {state.status === 'success'
                        ? 'Official evidence is ready.'
                        : 'Official evidence is insufficient.'}
                    </h2>
                  )}
                />
              ) : null}
          </div>
        </section>

        <section className={styles['comparables-panel']} aria-labelledby="comparables-heading">
          <header className={styles['panel-heading']}>
            <span>03</span><h2 id="comparables-heading">Comparable contracts</h2>
          </header>
          <div className={styles['comparables-slot']} data-comparables-slot="stable">
            {(state.status === 'success' || state.status === 'insufficient') &&
              state.envelope !== null ? (
                <ComparableContracts envelope={state.envelope} />
              ) : null}
          </div>
        </section>
      </div>

      <footer className={styles['method-band']}>
        {(state.status === 'success' || state.status === 'insufficient') &&
          state.envelope !== null ? (
            <SourceDisclosure envelope={state.envelope} />
          ) : (
            <>
              <p><strong>Source</strong> Official MOLIT reported rental contracts</p>
              <p><strong>Basis</strong> Contract date · recent completed months</p>
              <p><strong>Method</strong> 5.0%/year signedprice comparison assumption</p>
              <p><strong>Boundary</strong> Market reference, not an appraisal or legal advice</p>
            </>
          )}
      </footer>
    </section>
  );
}
