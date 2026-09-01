'use client';

import { useEffect, useRef, useState } from 'react';

import type { CommunitySignalModel } from '../../lib/community/community-signal-model';
import {
  COMMUNITY_DIRECTIONS,
  COMMUNITY_REASONS,
  type CommunityAggregateModel,
  type CommunityDirection,
  type CommunityEvidenceScope,
  type CommunityReason,
  type CommunitySelection,
} from '../../lib/community/community-types';
import styles from './community-signal.module.css';

type InteractiveModel = Exclude<CommunitySignalModel, { state: 'unavailable' }>;

type SafeEnvelope = Readonly<{
  state: 'collecting' | 'published';
  selection: CommunitySelection | null;
  aggregate: CommunityAggregateModel;
}>;

const REASON_LABELS: Readonly<Record<CommunityReason, string>> = {
  LINE: 'Specific line or block',
  ASPECT: 'Aspect or orientation',
  FLOOR: 'Floor',
  REMODEL: 'Remodeling or condition',
  VIEW: 'View',
  NOISE: 'Noise',
  OTHER: 'Other bounded factor',
};

const DIRECTION_LABELS: Readonly<Record<CommunityDirection, string>> = {
  HIGHER: 'Higher',
  SIMILAR: 'Similar',
  LOWER: 'Lower',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function safeSelection(value: unknown): CommunitySelection | null | undefined {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !exactKeys(value, ['direction', 'reason']) ||
    !COMMUNITY_DIRECTIONS.includes(value.direction as CommunityDirection) ||
    !(
      value.reason === null ||
      COMMUNITY_REASONS.includes(value.reason as CommunityReason)
    )
  ) {
    return undefined;
  }
  return Object.freeze({
    direction: value.direction as CommunityDirection,
    reason: value.reason as CommunityReason | null,
  });
}

function safeAggregate(value: unknown): CommunityAggregateModel | null {
  if (!isRecord(value) || typeof value.status !== 'string') return null;
  if (value.status === 'collecting') {
    return exactKeys(value, ['status']) ? Object.freeze({ status: 'collecting' }) : null;
  }
  if (
    value.status !== 'published' ||
    !exactKeys(value, ['status', 'total', 'directions', 'reasons', 'otherResponses']) ||
    !Number.isSafeInteger(value.total) ||
    (value.total as number) < 5 ||
    !Number.isSafeInteger(value.otherResponses) ||
    (value.otherResponses as number) < 0 ||
    !Array.isArray(value.directions) ||
    value.directions.length !== 3 ||
    !Array.isArray(value.reasons)
  ) {
    return null;
  }
  const directions = value.directions.map((item, index) => {
    if (
      !isRecord(item) ||
      !exactKeys(item, ['direction', 'count', 'percent']) ||
      item.direction !== COMMUNITY_DIRECTIONS[index] ||
      !Number.isSafeInteger(item.count) || (item.count as number) < 0 ||
      !Number.isSafeInteger(item.percent) || (item.percent as number) < 0
    ) {
      throw new TypeError('Invalid aggregate.');
    }
    return Object.freeze({
      direction: item.direction as CommunityDirection,
      count: item.count as number,
      percent: item.percent as number,
    });
  });
  const reasons = value.reasons.map((item) => {
    if (
      !isRecord(item) ||
      !exactKeys(item, ['reason', 'count']) ||
      !COMMUNITY_REASONS.includes(item.reason as CommunityReason) ||
      !Number.isSafeInteger(item.count) || (item.count as number) < 5
    ) {
      throw new TypeError('Invalid aggregate.');
    }
    return Object.freeze({
      reason: item.reason as CommunityReason,
      count: item.count as number,
    });
  });
  if (
    directions.reduce((sum, item) => sum + item.count, 0) !== value.total ||
    directions.reduce((sum, item) => sum + item.percent, 0) !== 100 ||
    reasons.reduce((sum, item) => sum + item.count, 0) +
      (value.otherResponses as number) !== value.total
  ) {
    return null;
  }
  return Object.freeze({
    status: 'published',
    total: value.total as number,
    directions: Object.freeze(directions),
    reasons: Object.freeze(reasons),
    otherResponses: value.otherResponses as number,
  });
}

export function normalizeCommunityClientEnvelope(value: unknown): SafeEnvelope | null {
  try {
    if (
      !isRecord(value) ||
      !exactKeys(value, ['state', 'selection', 'aggregate']) ||
      (value.state !== 'collecting' && value.state !== 'published')
    ) {
      return null;
    }
    const selection = safeSelection(value.selection);
    const aggregate = safeAggregate(value.aggregate);
    if (
      selection === undefined ||
      aggregate === null ||
      aggregate.status !== value.state
    ) {
      return null;
    }
    return Object.freeze({ state: value.state, selection, aggregate });
  } catch {
    return null;
  }
}

function endpoint(scope: CommunityEvidenceScope): string {
  return `/api/community/evidence-response?${new URLSearchParams(scope)}`;
}

function initialEnvelope(model: InteractiveModel): SafeEnvelope | null {
  if (model.state === 'available') return null;
  return Object.freeze({
    state: model.state,
    selection: model.selection,
    aggregate: model.aggregate,
  });
}

function Aggregate({ aggregate }: Readonly<{ aggregate: CommunityAggregateModel | null }>) {
  if (aggregate === null) return <p className={styles.status}>Checking response availability…</p>;
  if (aggregate.status === 'collecting') {
    return (
      <div className={styles.collecting} data-community-state="collecting">
        <h3>Responses are being collected</h3>
        <p>Counts and direction breakdowns appear only after the privacy threshold is reached.</p>
      </div>
    );
  }
  return (
    <div className={styles.published} data-community-state="published">
      <h3>{aggregate.total} community responses</h3>
      <dl className={styles.directionResults}>
        {aggregate.directions.map((item) => (
          <div key={item.direction}>
            <dt>{DIRECTION_LABELS[item.direction]}</dt>
            <dd><strong>{item.percent}%</strong><span>{item.count}</span></dd>
          </div>
        ))}
      </dl>
      <dl className={styles.reasonResults}>
        {aggregate.reasons.map((item) => (
          <div key={item.reason}>
            <dt>{REASON_LABELS[item.reason]}</dt><dd>{item.count}</dd>
          </div>
        ))}
        {aggregate.otherResponses === 0 ? null : (
          <div><dt>Other responses</dt><dd>{aggregate.otherResponses}</dd></div>
        )}
      </dl>
    </div>
  );
}

export function CommunitySignalClient({ model }: Readonly<{ model: InteractiveModel }>) {
  const initial = initialEnvelope(model);
  const [envelope, setEnvelope] = useState<SafeEnvelope | null>(initial);
  const [direction, setDirection] = useState<CommunityDirection | null>(
    initial?.selection?.direction ?? null,
  );
  const [reason, setReason] = useState<CommunityReason | null>(
    initial?.selection?.reason ?? null,
  );
  const [requestState, setRequestState] = useState<
    'idle' | 'loading' | 'submitting' | 'saved' | 'limited' | 'error'
  >(model.state === 'available' ? 'loading' : 'idle');
  const activeRequest = useRef<AbortController | null>(null);

  const accept = (value: unknown): boolean => {
    const next = normalizeCommunityClientEnvelope(value);
    if (next === null) return false;
    setEnvelope(next);
    setDirection(next.selection?.direction ?? null);
    setReason(next.selection?.reason ?? null);
    return true;
  };

  useEffect(() => {
    if (model.state !== 'available') return undefined;
    const controller = new AbortController();
    activeRequest.current = controller;
    void fetch(endpoint(model.scope), {
      method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok || !accept(await response.json())) setRequestState('error');
      else setRequestState('idle');
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setRequestState('error');
    });
    return () => controller.abort();
  }, [model]);

  const send = async (method: 'POST' | 'DELETE') => {
    if (method === 'POST' && direction === null) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setRequestState('submitting');
    try {
      const response = await fetch(endpoint(model.scope), {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? {
          body: JSON.stringify({
            schemaVersion: 1,
            ...model.scope,
            direction,
            reason,
          }),
        } : {}),
        signal: controller.signal,
      });
      const value: unknown = await response.json();
      if (response.status === 429) {
        setRequestState('limited');
      } else if (!response.ok || !accept(value)) {
        setRequestState('error');
      } else {
        setRequestState('saved');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setRequestState('error');
    }
  };

  const disabled = requestState === 'loading' || requestState === 'submitting';
  return (
    <div className={styles.interactive}>
      <Aggregate aggregate={envelope?.aggregate ?? null} />
      <form onSubmit={(event) => { event.preventDefault(); void send('POST'); }}>
        <fieldset disabled={disabled}>
          <legend>Your bounded response</legend>
          <div className={styles.directionButtons}>
            {COMMUNITY_DIRECTIONS.map((item) => (
              <button
                className={styles.directionButton}
                type="button"
                aria-pressed={direction === item}
                onClick={() => setDirection(item)}
                key={item}
              >
                {DIRECTION_LABELS[item]}
              </button>
            ))}
          </div>
          <label className={styles.reasonField}>
            <span>Optional reason</span>
            <select
              value={reason ?? ''}
              onChange={(event) => setReason(
                event.target.value === '' ? null : event.target.value as CommunityReason,
              )}
            >
              <option value="">No reason selected</option>
              {COMMUNITY_REASONS.map((item) => (
                <option value={item} key={item}>{REASON_LABELS[item]}</option>
              ))}
            </select>
          </label>
          <div className={styles.formActions}>
            <button className={styles.submitButton} type="submit" disabled={direction === null}>
              {envelope?.selection === null || envelope === null ? 'Submit response' : 'Replace response'}
            </button>
            {envelope?.selection === null || envelope === null ? null : (
              <button
                className={styles.deleteButton}
                type="button"
                onClick={() => { void send('DELETE'); }}
              >
                Delete my response
              </button>
            )}
          </div>
        </fieldset>
        <p className={styles.requestStatus} aria-live="polite">
          {requestState === 'saved' ? 'Response saved.' : null}
          {requestState === 'limited' ? 'Too many changes. Try again later.' : null}
          {requestState === 'error' ? 'Response was not saved. Try again later.' : null}
        </p>
      </form>
    </div>
  );
}
