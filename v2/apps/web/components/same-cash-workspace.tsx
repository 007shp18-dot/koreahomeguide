'use client';

import { useMemo, useState } from 'react';
import {
  compareAtSameDeposit,
  EOK,
  MAN,
  type AssetType,
} from '../lib/signed-conversion';
import { sameCashCopy } from '../lib/same-cash-copy';

const copy = sameCashCopy.tool;

/** Accepts "5,000만", "2억", "2억 3000만" or a bare number of won. */
function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/[,\s]/g, '');
  if (!cleaned) return Number.NaN;

  const parts = cleaned.match(/^(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만)?$/);
  if (parts && (parts[1] || parts[2])) {
    return Number(parts[1] ?? 0) * EOK + Number(parts[2] ?? 0) * MAN;
  }

  const bare = Number(cleaned);
  return Number.isFinite(bare) ? bare : Number.NaN;
}

function formatWon(value: number): string {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const magnitude = Math.abs(rounded);
  const eok = Math.floor(magnitude / EOK);
  const man = Math.round((magnitude % EOK) / MAN);

  let text: string;
  if (eok && man) text = `${eok}억 ${man.toLocaleString('ko-KR')}만`;
  else if (eok) text = `${eok}억`;
  else text = `${man.toLocaleString('ko-KR')}만`;

  return negative ? `−${text}` : text;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : '−'}${formatWon(Math.abs(value))}`;
}

type ConditionState = { deposit: string; rent: string };

const initialA: ConditionState = { deposit: '2억', rent: '60만' };
const initialB: ConditionState = { deposit: '5,000만', rent: '90만' };

export function SameCashWorkspace() {
  const [base, setBase] = useState('5,000만');
  const [assetType, setAssetType] = useState<AssetType>('apartment');
  const [a, setA] = useState<ConditionState>(initialA);
  const [b, setB] = useState<ConditionState>(initialB);

  const baseWon = parseAmount(base);

  const result = useMemo(() => {
    const aDeposit = parseAmount(a.deposit);
    const aRent = parseAmount(a.rent);
    const bDeposit = parseAmount(b.deposit);
    const bRent = parseAmount(b.rent);

    if (
      !Number.isFinite(baseWon) ||
      !Number.isFinite(aDeposit) ||
      !Number.isFinite(aRent) ||
      !Number.isFinite(bDeposit) ||
      !Number.isFinite(bRent)
    ) {
      return null;
    }

    return {
      comparison: compareAtSameDeposit(
        { depositWon: aDeposit, monthlyRentWon: aRent },
        { depositWon: bDeposit, monthlyRentWon: bRent },
        baseWon,
        assetType,
      ),
      aDeposit,
      aRent,
      bDeposit,
      bRent,
    };
  }, [a, b, baseWon, assetType]);

  const writtenGap = result ? Math.abs(result.aRent - result.bRent) : 0;
  const restatedGap = result
    ? Math.abs(result.comparison.aMonthlyWon - result.comparison.bMonthlyWon)
    : 0;

  function basisNote(depositWon: number): string {
    const difference = depositWon - baseWon;
    if (difference === 0) return copy.sameBasisNote;
    return difference > 0
      ? `보증금 ${formatWon(difference)} 더 많음 → 월세로 환산`
      : `보증금 ${formatWon(-difference)} 더 적음 → 월세로 환산`;
  }

  function renderCondition(
    side: 'a' | 'b',
    label: string,
    state: ConditionState,
    setState: (next: ConditionState) => void,
  ) {
    const cheaper = result?.comparison.cheaperRestated === side;
    const deposit = side === 'a' ? result?.aDeposit : result?.bDeposit;
    const rent = side === 'a' ? result?.aRent : result?.bRent;
    const restated =
      side === 'a' ? result?.comparison.aMonthlyWon : result?.comparison.bMonthlyWon;
    const rate = side === 'a' ? result?.comparison.aRate : result?.comparison.bRate;

    return (
      <article className={`same-cash-card${cheaper ? ' same-cash-card--cheaper' : ''}`}>
        <div className="same-cash-card__header">
          <h3>{label}</h3>
          {cheaper ? <span className="same-cash-card__badge">{copy.cheaperBadge}</span> : null}
        </div>

        <div className="same-cash-card__inputs">
          <label className="same-cash-field">
            <span>{copy.depositLabel}</span>
            <input
              inputMode="numeric"
              value={state.deposit}
              onChange={(event) => setState({ ...state, deposit: event.target.value })}
            />
          </label>
          <label className="same-cash-field">
            <span>{copy.rentLabel}</span>
            <input
              inputMode="numeric"
              value={state.rent}
              onChange={(event) => setState({ ...state, rent: event.target.value })}
            />
          </label>
        </div>

        <dl className="same-cash-card__breakdown">
          <div>
            <dt>{copy.writtenLabel}</dt>
            <dd>{rent === undefined ? '—' : formatWon(rent)}</dd>
          </div>
          <div className="same-cash-card__breakdown-step">
            <dt>{deposit === undefined ? '' : basisNote(deposit)}</dt>
            <dd>
              {restated === undefined || rent === undefined ? '' : formatSigned(restated - rent)}
            </dd>
          </div>
          <div className="same-cash-card__breakdown-total">
            <dt>{copy.restatedLabel}</dt>
            <dd>{restated === undefined ? '—' : formatWon(restated)}</dd>
          </div>
        </dl>

        {deposit !== undefined && rate !== undefined ? (
          <p className="same-cash-card__rate">
            계약 보증금 {formatWon(deposit)}에서 읽은 실측 전환율 연 {(rate * 100).toFixed(2)}%
          </p>
        ) : null}
      </article>
    );
  }

  const comparison = result?.comparison;
  const reversed = comparison?.orderReversed ?? false;

  let verdictLine = copy.incomplete;
  let verdictBody = '';

  if (comparison) {
    const written = comparison.cheaperAsWritten;
    const restated = comparison.cheaperRestated;

    if (reversed && written && restated) {
      verdictLine = `적힌 월세는 ${written.toUpperCase()}가 ${formatWon(writtenGap)} 적지만, 같은 보증금 기준으로는 ${restated.toUpperCase()}가 ${formatWon(restatedGap)} 적습니다.`;
      verdictBody = copy.reversedBody;
    } else if (restated) {
      verdictLine = `같은 보증금 기준으로 ${restated.toUpperCase()}가 월 ${formatWon(restatedGap)} 적습니다.`;
      verdictBody = written === restated ? copy.sameOrderBody : '';
    } else {
      verdictLine = copy.equalLine;
      verdictBody = copy.equalBody;
    }
  }

  return (
    <section className="same-cash" aria-label={copy.sectionLabel}>
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.heading}</h2>
        </div>
        <p className="same-cash__intro">{copy.description}</p>
      </div>

      <div className="same-cash__basis">
        <label className="same-cash-field same-cash-field--wide">
          <span>{copy.baseLabel}</span>
          <input inputMode="numeric" value={base} onChange={(event) => setBase(event.target.value)} />
        </label>
        <label className="same-cash-field">
          <span>{copy.assetTypeLabel}</span>
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as AssetType)}
          >
            {copy.assetTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{copy.assetTypeNote}</small>
        </label>
      </div>

      <div className="same-cash__pair">
        {renderCondition('a', copy.conditionALabel, a, setA)}
        {renderCondition('b', copy.conditionBLabel, b, setB)}
      </div>

      <div
        className={`same-cash-verdict${reversed ? ' same-cash-verdict--reversed' : ''}`}
        aria-live="polite"
      >
        <div className="same-cash-verdict__main">
          <p className="section-eyebrow">
            {reversed ? copy.reversedKicker : copy.settledKicker}
          </p>
          <h3>{verdictLine}</h3>
          {verdictBody ? <p>{verdictBody}</p> : null}
        </div>
        <dl className="same-cash-verdict__stats">
          <div>
            <dt>{copy.statWrittenLabel}</dt>
            <dd>
              {comparison?.cheaperAsWritten
                ? `${formatWon(writtenGap)} · ${comparison.cheaperAsWritten.toUpperCase()}`
                : copy.noDifference}
            </dd>
          </div>
          <div className="same-cash-verdict__stats-key">
            <dt>{copy.statRestatedLabel}</dt>
            <dd>
              {comparison?.cheaperRestated
                ? `${formatWon(restatedGap)} · ${comparison.cheaperRestated.toUpperCase()}`
                : copy.noDifference}
            </dd>
          </div>
        </dl>
      </div>

      {comparison?.clamped ? <p className="same-cash__clamp">{copy.clampNote}</p> : null}
    </section>
  );
}
